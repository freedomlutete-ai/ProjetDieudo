import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, Share } from 'react-native';

import { LegalLinks } from '@/components/legal-links';
import { Body, Button, Card, Choice, Field, Screen, Title } from '@/components/ui';
import { useTarget } from '@/hooks/use-target';
import { format, t } from '@/i18n';
import {
  PROFILE_BOUNDS,
  dailyTarget,
  type Activity,
  type Goal,
  type Profile,
  type Sex,
} from '@/lib/calories';
import { toCsv } from '@/lib/csv';
import { allEntries, dailyTotals, saveProfile, wipeAllData } from '@/lib/db';
import { FREE_HISTORY_DAYS, refreshPremium } from '@/lib/premium';
import { parseBoundedNumber, toDayKey } from '@/lib/validation';

const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
const GOALS: Goal[] = ['lose', 'maintain', 'gain'];

function confirmAction(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(message));
  }
  return new Promise((resolve) =>
    Alert.alert(t.wipe, message, [
      { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: t.confirm, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function ProfileScreen() {
  const { profile, reload } = useTarget();
  // Le formulaire est recréé quand le profil chargé change (dont après un effacement).
  const formKey = profile ? JSON.stringify(profile) : 'none';
  return <ProfileContent key={formKey} initial={profile} onWiped={reload} />;
}

function ProfileContent({ initial, onWiped }: { initial: Profile | null; onWiped: () => void }) {
  const [sex, setSex] = useState<Sex>(initial?.sex ?? 'female');
  const [age, setAge] = useState(initial ? String(initial.ageYears) : '');
  const [height, setHeight] = useState(initial ? String(initial.heightCm) : '');
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : '');
  const [activity, setActivity] = useState<Activity>(initial?.activity ?? 'light');
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? 'maintain');
  const [message, setMessage] = useState<{ text: string; tone: 'normal' | 'danger' } | null>(null);
  const [premium, setPremium] = useState(false);
  const [history, setHistory] = useState<{ day: string; total: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      refreshPremium().then((isPremium) => {
        setPremium(isPremium);
        const since = new Date();
        // Gratuit : 7 jours ; premium : tout l'historique.
        since.setDate(since.getDate() - (isPremium ? 36500 : FREE_HISTORY_DAYS - 1));
        dailyTotals(toDayKey(since)).then(setHistory, () => setHistory([]));
      });
    }, []),
  );

  const draft: Profile | null = (() => {
    const a = parseBoundedNumber(age, PROFILE_BOUNDS.ageYears.min, PROFILE_BOUNDS.ageYears.max);
    const h = parseBoundedNumber(height, PROFILE_BOUNDS.heightCm.min, PROFILE_BOUNDS.heightCm.max);
    const w = parseBoundedNumber(weight, PROFILE_BOUNDS.weightKg.min, PROFILE_BOUNDS.weightKg.max);
    if (a === null || h === null || w === null) return null;
    return { sex, ageYears: a, heightCm: h, weightKg: w, activity, goal };
  })();
  const estimate = draft ? dailyTarget(draft) : null;

  const save = async () => {
    if (!draft || !(await saveProfile(draft))) {
      setMessage({ text: t.profileInvalid, tone: 'danger' });
      return;
    }
    setMessage({ text: t.saved, tone: 'normal' });
  };

  const exportCsv = async () => {
    if (!premium) {
      router.push('/premium');
      return;
    }
    const rows = (await allEntries()).map((e) => [e.day, e.name, e.grams, e.kcal_per_100g, e.kcal]);
    const csv = toCsv(['date', 'aliment', 'grammes', 'kcal_100g', 'kcal'], rows);
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nutripanier.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      await Share.share({ message: csv, title: 'nutripanier.csv' });
    }
  };

  const wipe = async () => {
    if (!(await confirmAction(t.wipeConfirm))) return;
    await wipeAllData();
    setHistory([]);
    setMessage({ text: t.wiped, tone: 'normal' });
    onWiped();
  };

  return (
    <Screen testID="profile">
      <Title>{t.profileTitle}</Title>
      <Card>
        <Choice
          label={t.sex}
          value={sex}
          onChange={setSex}
          options={[
            { value: 'female', label: t.female },
            { value: 'male', label: t.male },
          ]}
        />
        <Field testID="age" label={t.age} value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} />
        <Field testID="height" label={t.height} value={height} onChangeText={setHeight} keyboardType="decimal-pad" maxLength={6} />
        <Field testID="weight" label={t.weight} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" maxLength={6} />
        <Choice label={t.activity} value={activity} onChange={setActivity} options={ACTIVITIES.map((v) => ({ value: v, label: t[v] }))} />
        <Choice label={t.goal} value={goal} onChange={setGoal} options={GOALS.map((v) => ({ value: v, label: t[v] }))} />
        {estimate && <Body testID="estimate">{format(t.estimate, { daily: estimate.daily, maintenance: estimate.maintenance, bmr: estimate.bmr })}</Body>}
        {estimate?.belowBmr && <Body tone="warning">{t.belowBmrWarning}</Body>}
        {message && (
          <Body testID="profile-message" tone={message.tone}>
            {message.text}
          </Body>
        )}
        <Button testID="save-profile" title={t.save} onPress={save} />
      </Card>

      <Title>{t.history}</Title>
      <Card>
        {history.map((h) => (
          <Body key={h.day}>
            {h.day} : {h.total} kcal
          </Body>
        ))}
        {!premium && <Body tone="muted">{format(t.historyLocked, { days: FREE_HISTORY_DAYS })}</Body>}
      </Card>
      <Button testID="export" title={t.export} variant="secondary" onPress={exportCsv} />
      <Button title={premium ? t.premiumActive : t.premium} variant="secondary" onPress={() => router.push('/premium')} />
      <LegalLinks />
      <Button testID="wipe" title={t.wipe} variant="danger" onPress={wipe} />
    </Screen>
  );
}
