import { Linking } from 'react-native';

import { Button } from '@/components/ui';
import { t } from '@/i18n';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL;
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;

/** N'accepte que des liens https configurés au build : jamais une URL issue d'une donnée. */
export function safeHttpsUrl(url: string | undefined): string | null {
  return url && /^https:\/\/[^\s]+$/.test(url) ? url : null;
}

/** Liens obligatoires (paywall, réglages). Désactivés tant que les URL ne sont pas configurées. */
export function LegalLinks() {
  const privacy = safeHttpsUrl(PRIVACY_URL);
  const terms = safeHttpsUrl(TERMS_URL);
  return (
    <>
      <Button
        title={t.privacy}
        variant="secondary"
        disabled={!privacy}
        onPress={() => privacy && Linking.openURL(privacy)}
      />
      <Button
        title={t.terms}
        variant="secondary"
        disabled={!terms}
        onPress={() => terms && Linking.openURL(terms)}
      />
    </>
  );
}
