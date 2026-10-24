import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Button, Card, Screen, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTarget } from '@/hooks/use-target';
import { t } from '@/i18n';
import { deleteEntry, listEntries, type Entry } from '@/lib/db';
import { toDayKey } from '@/lib/validation';

export default function TodayScreen() {
  const { target } = useTarget();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState(false);
  const day = toDayKey(new Date());

  const refresh = useCallback(() => {
    listEntries(day).then(
      (rows) => {
        setEntries(rows);
        setError(false);
      },
      () => setError(true),
    );
  }, [day]);

  useFocusEffect(refresh);

  const consumed = entries.reduce((sum, e) => sum + e.kcal, 0);
  const remaining = target ? target.daily - consumed : null;

  return (
    <Screen testID="today">
      <Title>{t.todayTitle}</Title>
      <Card>
        <Body testID="consumed">
          {t.consumed} : {consumed} kcal
        </Body>
        {target && remaining !== null ? (
          <>
            <Body>
              {t.target} : {target.daily} kcal
            </Body>
            <Body testID="remaining" tone={remaining < 0 ? 'warning' : 'normal'}>
              {remaining >= 0 ? `${t.remaining} : ${remaining}` : `${t.over} : ${-remaining}`} kcal
            </Body>
          </>
        ) : (
          <Body tone="muted">{t.noTarget}</Body>
        )}
      </Card>
      {error && <Body tone="danger">{t.loadError}</Body>}
      {entries.length === 0 && !error ? (
        <Body tone="muted">{t.emptyDay}</Body>
      ) : (
        entries.map((e) => (
          <Card key={e.id}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Body>{e.name}</Body>
                <Body tone="muted">
                  {e.grams} g · {e.kcal} kcal
                </Body>
              </View>
              <Button
                title={t.delete}
                variant="danger"
                onPress={() => deleteEntry(e.id).then(refresh)}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
