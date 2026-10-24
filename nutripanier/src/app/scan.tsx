import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { AddFoodForm } from '@/components/add-food-form';
import { Body, Button, Card, Field, Screen } from '@/components/ui';
import { t } from '@/i18n';
import { findFoodByBarcode } from '@/lib/db';
import { fetchProduct, type OffProduct, type OffResult } from '@/lib/off';
import { normalizeBarcode } from '@/lib/validation';

const USER_AGENT = `NutriPanier/${Constants.expoConfig?.version ?? '1.0.0'} (${
  process.env.EXPO_PUBLIC_CONTACT_EMAIL ?? 'contact-non-configure'
})`;

const ERROR_TEXT: Record<Exclude<OffResult['kind'], 'found'>, string> = {
  not_found: t.notFound,
  no_calories: t.noCalories,
  invalid_barcode: t.invalidBarcode,
  rate_limited: t.rateLimited,
  network_error: t.networkError,
};

/** Cherche d'abord dans les aliments enregistrés, puis dans Open Food Facts. */
async function resolveBarcode(barcode: string): Promise<OffResult> {
  const saved = await findFoodByBarcode(barcode).catch(() => null);
  if (saved) {
    return {
      kind: 'found',
      product: { barcode, name: saved.name, brand: null, kcalPer100g: saved.kcal_per_100g },
    };
  }
  return fetchProduct(barcode, { userAgent: USER_AGENT });
}

export default function ScanScreen() {
  // Le paramètre peut venir d'un lien profond (nutripanier://scan?barcode=…) : non fiable.
  const params = useLocalSearchParams<{ barcode?: string | string[] }>();
  const rawParam = Array.isArray(params.barcode) ? params.barcode[0] : params.barcode;
  const paramBarcode = normalizeBarcode(rawParam);

  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(paramBarcode !== null);
  const [product, setProduct] = useState<OffProduct | null>(null);
  const [error, setError] = useState<string | null>(
    rawParam !== undefined && paramBarcode === null ? t.invalidBarcode : null,
  );
  const lastScanned = useRef<string | null>(null);

  const applyResult = useCallback((result: OffResult) => {
    if (result.kind === 'found') setProduct(result.product);
    else setError(ERROR_TEXT[result.kind]);
    setBusy(false);
  }, []);

  const lookup = (raw: unknown) => {
    const barcode = normalizeBarcode(raw);
    setProduct(null);
    if (!barcode) {
      setError(t.invalidBarcode);
      return;
    }
    setError(null);
    setBusy(true);
    resolveBarcode(barcode).then(applyResult);
  };

  useEffect(() => {
    if (paramBarcode) resolveBarcode(paramBarcode).then(applyResult);
  }, [paramBarcode, applyResult]);

  const onScanned = (result: BarcodeScanningResult) => {
    // La caméra signale le même code plusieurs fois par seconde : on ne le traite qu'une fois.
    if (busy || product || result.data === lastScanned.current) return;
    lastScanned.current = result.data;
    lookup(result.data);
  };

  const cameraSupported = Platform.OS !== 'web';

  return (
    <Screen testID="scan">
      {cameraSupported && permission?.granted && !product && (
        <View style={styles.camera}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={busy ? undefined : onScanned}
          />
        </View>
      )}
      {cameraSupported && permission && !permission.granted && (
        <Card>
          <Body>{t.cameraDenied}</Body>
          {permission.canAskAgain ? (
            <Button title={t.allowCamera} onPress={requestPermission} />
          ) : (
            <Button title={t.allowCamera} variant="secondary" onPress={() => Linking.openSettings()} />
          )}
        </Card>
      )}
      <Field
        testID="manual-barcode"
        label={t.manualBarcode}
        value={manual}
        onChangeText={(v) => setManual(v.replace(/\D/g, '').slice(0, 14))}
        keyboardType="number-pad"
        maxLength={14}
      />
      <Button testID="lookup" title={busy ? t.searching : t.search} loading={busy} onPress={() => lookup(manual)} />
      {error && (
        <Body testID="scan-error" tone="danger">
          {error}
        </Body>
      )}
      {product && (
        <Card>
          <Body testID="product-name">
            {product.name}
            {product.brand ? ` — ${product.brand}` : ''}
          </Body>
          <Body tone="muted">{t.offNotice}</Body>
          <AddFoodForm
            key={product.barcode}
            initialName={product.name}
            initialKcal={String(product.kcalPer100g)}
            barcode={product.barcode}
            // Ouvert par lien profond, l'écran n'a pas d'historique : on va vers « Ajouter ».
            onDone={() => (router.canGoBack() ? router.back() : router.replace('/add'))}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: { height: 280, borderRadius: 12, overflow: 'hidden' },
});
