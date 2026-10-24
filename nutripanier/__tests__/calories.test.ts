import { basalMetabolicRate, dailyTarget, isProfileInBounds, type Profile } from '../src/lib/calories';

const woman: Profile = {
  sex: 'female',
  ageYears: 30,
  heightCm: 165,
  weightKg: 60,
  activity: 'sedentary',
  goal: 'maintain',
};

describe('Mifflin-St Jeor', () => {
  it('femme 30 ans, 165 cm, 60 kg = 1320,25 kcal', () => {
    // 10×60 + 6,25×165 − 5×30 − 161 = 600 + 1031,25 − 150 − 161
    expect(basalMetabolicRate(woman)).toBeCloseTo(1320.25);
  });

  it('homme 30 ans, 180 cm, 80 kg = 1780 kcal', () => {
    // 10×80 + 6,25×180 − 5×30 + 5 = 800 + 1125 − 150 + 5
    expect(basalMetabolicRate({ ...woman, sex: 'male', heightCm: 180, weightKg: 80 })).toBe(1780);
  });
});

describe('dailyTarget', () => {
  it('applique activité et objectif', () => {
    const t = dailyTarget({ ...woman, activity: 'moderate', goal: 'lose' })!;
    // 1320,25 × 1,55 = 2046,39 ; × 0,85 = 1739,43
    expect(t.maintenance).toBe(2046);
    expect(t.daily).toBe(1739);
    expect(t.belowBmr).toBe(false);
  });

  it('signale un objectif sous le métabolisme de base', () => {
    const t = dailyTarget({ ...woman, activity: 'sedentary', goal: 'lose' })!;
    // 1320,25 × 1,2 × 0,85 = 1346,6 > 1320 : pas encore sous le métabolisme de base
    expect(t.belowBmr).toBe(false);
    expect(t.daily).toBe(1347);
  });

  it.each([
    { ageYears: 17 },
    { ageYears: 101 },
    { heightCm: 50 },
    { weightKg: 0 },
    { weightKg: Number.NaN },
    { sex: 'other' as Profile['sex'] },
    { activity: 'toString' as Profile['activity'] },
    { goal: '__proto__' as Profile['goal'] },
  ])('refuse un profil hors limites ou piégé : %p', (patch) => {
    const p = { ...woman, ...patch };
    expect(isProfileInBounds(p)).toBe(false);
    expect(dailyTarget(p)).toBeNull();
  });
});
