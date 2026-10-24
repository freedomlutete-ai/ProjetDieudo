import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AddFoodForm } from '@/components/add-food-form';
import { Body, Button, Card, Screen, Title } from '@/components/ui';
import { MinTouch } from '@/constants/theme';
import { t } from '@/i18n';
import { deleteFood, listFoods, type Food } from '@/lib/db';

export default function AddScreen() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);

  const refresh = useCallback(() => {
    listFoods().then(setFoods, () => setFoods([]));
  }, []);
  useFocusEffect(refresh);

  return (
    <Screen testID="add">
      <Title>{t.addTitle}</Title>
      <Button testID="open-scan" title={t.scan} variant="secondary" onPress={() => router.push('/scan')} />
      <Card>
        <AddFoodForm
          key={selected?.id ?? 'new'}
          initialName={selected?.name ?? ''}
          initialKcal={selected ? String(selected.kcal_per_100g) : ''}
          barcode={selected?.barcode ?? null}
          onDone={refresh}
        />
      </Card>
      <Title>{t.myFoods}</Title>
      {foods.length === 0 ? (
        <Body tone="muted">{t.noFoods}</Body>
      ) : (
        foods.map((f) => (
          <Card key={f.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${f.name}, ${f.kcal_per_100g} kcal / 100 g`}
              onPress={() => setSelected(f)}
              style={styles.food}>
              <Body>{f.name}</Body>
              <Body tone="muted">{f.kcal_per_100g} kcal / 100 g</Body>
            </Pressable>
            <Button
              title={t.delete}
              variant="danger"
              onPress={() => deleteFood(f.id).then(refresh)}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  food: { minHeight: MinTouch, justifyContent: 'center' },
});
