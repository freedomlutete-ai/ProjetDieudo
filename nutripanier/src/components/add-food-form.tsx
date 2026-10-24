import { useState } from 'react';

import { Body, Button, Field } from '@/components/ui';
import { t } from '@/i18n';
import { addEntry, saveFood } from '@/lib/db';
import { LIMITS, parseBoundedNumber, toDayKey } from '@/lib/validation';

/** Formulaire partagé : saisie manuelle, aliment enregistré ou produit scanné. */
export function AddFoodForm({
  initialName = '',
  initialKcal = '',
  barcode = null,
  onDone,
}: {
  initialName?: string;
  initialKcal?: string;
  barcode?: string | null;
  onDone?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [kcal, setKcal] = useState(initialKcal);
  const [grams, setGrams] = useState('100');
  const [message, setMessage] = useState<{ text: string; tone: 'normal' | 'danger' } | null>(null);

  const parsedKcal = parseBoundedNumber(kcal, 0, LIMITS.kcalPer100gMax);
  const parsedGrams = parseBoundedNumber(grams, LIMITS.gramsMin, LIMITS.gramsMax);

  const submit = async (alsoSave: boolean) => {
    if (parsedKcal === null || parsedGrams === null) {
      setMessage({ text: t.invalidInput, tone: 'danger' });
      return;
    }
    const result = await addEntry(toDayKey(new Date()), name, parsedKcal, parsedGrams);
    if (result !== 'ok') {
      setMessage({ text: result === 'limit' ? t.limitReached : t.invalidInput, tone: 'danger' });
      return;
    }
    if (alsoSave) await saveFood(name, parsedKcal, barcode);
    setMessage({ text: t.added, tone: 'normal' });
    setGrams('100');
    onDone?.();
  };

  return (
    <>
      <Field
        testID="food-name"
        label={t.name}
        value={name}
        onChangeText={setName}
        maxLength={LIMITS.nameMaxLength}
        autoCorrect={false}
      />
      <Field
        testID="food-kcal"
        label={t.kcalPer100g}
        value={kcal}
        onChangeText={setKcal}
        keyboardType="decimal-pad"
        maxLength={7}
      />
      <Field
        testID="food-grams"
        label={t.grams}
        value={grams}
        onChangeText={setGrams}
        keyboardType="decimal-pad"
        maxLength={7}
      />
      {message && (
        <Body testID="form-message" tone={message.tone}>
          {message.text}
        </Body>
      )}
      <Button testID="add-today" title={t.addToToday} onPress={() => submit(false)} />
      <Button testID="add-and-save" title={t.saveFood} variant="secondary" onPress={() => submit(true)} />
    </>
  );
}
