/**
 * Estimation du besoin calorique.
 * Métabolisme de base : équation de Mifflin-St Jeor (Mifflin et al., 1990).
 * Les résultats sont des estimations, pas un avis médical : l'interface le dit.
 */

export type Sex = 'female' | 'male';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface Profile {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: Goal;
}

export const PROFILE_BOUNDS = {
  // L'application est réservée aux adultes : les besoins des mineurs relèvent d'un suivi médical.
  ageYears: { min: 18, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 300 },
} as const;

// Multiplicateurs d'activité couramment associés à cette équation.
export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Ajustement de l'objectif : écart modéré, en pourcentage de la dépense estimée.
export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -0.15,
  maintain: 0,
  gain: 0.1,
};

const hasOwn = (obj: object, key: unknown) =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);

export function isProfileInBounds(p: Profile): boolean {
  const inRange = (v: number, b: { min: number; max: number }) =>
    Number.isFinite(v) && v >= b.min && v <= b.max;
  return (
    (p.sex === 'female' || p.sex === 'male') &&
    // Propriété propre et non `in` : `in` accepte aussi « toString » ou « __proto__ ».
    hasOwn(ACTIVITY_FACTORS, p.activity) &&
    hasOwn(GOAL_ADJUSTMENT, p.goal) &&
    inRange(p.ageYears, PROFILE_BOUNDS.ageYears) &&
    inRange(p.heightCm, PROFILE_BOUNDS.heightCm) &&
    inRange(p.weightKg, PROFILE_BOUNDS.weightKg)
  );
}

export function basalMetabolicRate(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears;
  return base + (p.sex === 'male' ? 5 : -161);
}

export interface Target {
  bmr: number;
  maintenance: number;
  daily: number;
  /** Vrai si l'objectif passe sous le métabolisme de base : l'app affiche un avertissement. */
  belowBmr: boolean;
}

export function dailyTarget(p: Profile): Target | null {
  if (!isProfileInBounds(p)) return null;
  const bmr = basalMetabolicRate(p);
  const maintenance = bmr * ACTIVITY_FACTORS[p.activity];
  const daily = maintenance * (1 + GOAL_ADJUSTMENT[p.goal]);
  return {
    bmr: Math.round(bmr),
    maintenance: Math.round(maintenance),
    daily: Math.round(daily),
    belowBmr: daily < bmr,
  };
}
