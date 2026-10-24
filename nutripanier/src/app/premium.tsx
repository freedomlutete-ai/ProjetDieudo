import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';

import { LegalLinks } from '@/components/legal-links';
import { Body, Button, Card, Screen, Title } from '@/components/ui';
import { t } from '@/i18n';
import { buy, currentOffering, purchasesAvailable, refreshPremium, restore } from '@/lib/premium';

// Durée lisible d'un abonnement (ISO 8601 renvoyé par le store, ex. P1M).
function periodLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = /^P(\d+)([DWMY])$/.exec(iso);
  if (!match) return iso;
  const units = { D: t.periodDay, W: t.periodWeek, M: t.periodMonth, Y: t.periodYear } as const;
  return `${match[1]} ${units[match[2] as keyof typeof units]}`;
}

const closeScreen = () => (router.canGoBack() ? router.back() : router.replace('/'));

export default function PremiumScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const available = purchasesAvailable();

  useEffect(() => {
    if (!available) return;
    refreshPremium().then(setIsPremium);
    currentOffering().then((o) => setPackages(o?.availablePackages ?? []));
  }, [available]);

  const purchase = async (pkg: PurchasesPackage) => {
    setBusy(true);
    const outcome = await buy(pkg);
    setBusy(false);
    if (outcome === 'success') closeScreen();
    else if (outcome === 'error') setMessage(t.purchaseError);
  };

  return (
    <Screen testID="premium">
      <Title>{t.paywallTitle}</Title>
      <Card>
        <Body>{t.paywallBenefits}</Body>
      </Card>
      {!available && <Body tone="muted">{t.purchasesUnavailable}</Body>}
      {isPremium && <Body>{t.premiumActive}</Body>}
      {/* Prix, durée et essai éventuel affichés tels que renvoyés par le store. */}
      {packages.map((pkg) => (
        <Button
          key={pkg.identifier}
          title={[pkg.product.title, pkg.product.priceString, periodLabel(pkg.product.subscriptionPeriod)]
            .filter(Boolean)
            .join(' — ')}
          loading={busy}
          onPress={() => purchase(pkg)}
        />
      ))}
      {message && <Body tone="danger">{message}</Body>}
      <Body tone="muted">{t.paywallRenewal}</Body>
      <Button
        title={t.restore}
        variant="secondary"
        disabled={!available}
        onPress={() => restore().then(setIsPremium)}
      />
      <LegalLinks />
      <Button title={t.close} variant="secondary" onPress={closeScreen} />
    </Screen>
  );
}
