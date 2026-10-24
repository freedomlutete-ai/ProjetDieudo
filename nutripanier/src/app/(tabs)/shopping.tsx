import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Field, Screen, Title } from '@/components/ui';
import { MinTouch, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';
import {
  addShopping,
  clearCheckedShopping,
  listShopping,
  toggleShopping,
  type ShoppingItem,
} from '@/lib/db';
import { LIMITS, parseBoundedNumber } from '@/lib/validation';

export default function ShoppingScreen() {
  const c = useTheme();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listShopping().then(setItems, () => setMessage(t.loadError));
  }, []);
  useFocusEffect(refresh);

  const add = async () => {
    const q = parseBoundedNumber(quantity, 1, LIMITS.quantityMax);
    const result = await addShopping(name, q !== null && Number.isInteger(q) ? q : Number.NaN);
    if (result !== 'ok') {
      setMessage(result === 'limit' ? t.limitReached : t.invalidInput);
      return;
    }
    setMessage(null);
    setName('');
    setQuantity('1');
    refresh();
  };

  return (
    <Screen testID="shopping">
      <Title>{t.shoppingTitle}</Title>
      <Card>
        <Field testID="item-name" label={t.item} value={name} onChangeText={setName} maxLength={LIMITS.nameMaxLength} />
        <Field
          testID="item-qty"
          label={t.quantity}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          maxLength={3}
        />
        {message && <Body tone="danger">{message}</Body>}
        <Button testID="add-item" title={t.add} onPress={add} />
      </Card>
      {items.length === 0 ? (
        <Body tone="muted">{t.emptyShopping}</Body>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.checked === 1 }}
            accessibilityLabel={`${item.name}, ${item.quantity}`}
            onPress={() => toggleShopping(item.id).then(refresh)}
            style={[styles.item, { borderColor: c.border }]}>
            <View style={[styles.box, { borderColor: c.primary, backgroundColor: item.checked ? c.primary : 'transparent' }]} />
            <Text
              style={[
                styles.itemText,
                { color: item.checked ? c.textSecondary : c.text },
                item.checked === 1 && styles.done,
              ]}>
              {item.name} × {item.quantity}
            </Text>
          </Pressable>
        ))
      )}
      {items.some((i) => i.checked === 1) && (
        <Button title={t.clearChecked} variant="secondary" onPress={() => clearCheckedShopping().then(refresh)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: {
    minHeight: MinTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
  },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2 },
  itemText: { fontSize: 16, flex: 1 },
  done: { textDecorationLine: 'line-through' },
});
