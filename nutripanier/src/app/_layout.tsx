import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { Body, Button, Card, Screen, Title } from '@/components/ui';
import { t } from '@/i18n';
import { acceptDisclaimer, loadProfile } from '@/lib/db';
import { configurePurchases } from '@/lib/premium';

SplashScreen.preventAutoHideAsync();

type Gate = 'loading' | 'disclaimer' | 'ready' | 'error';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [gate, setGate] = useState<Gate>('loading');

  const fetchGate = () =>
    loadProfile()
      .then(({ accepted }) => setGate(accepted ? 'ready' : 'disclaimer'))
      .catch(() => setGate('error'))
      .finally(() => SplashScreen.hideAsync());

  const retry = () => {
    setGate('loading');
    fetchGate();
  };

  useEffect(() => {
    configurePurchases();
    fetchGate();
  }, []);

  let content;
  if (gate === 'loading') {
    content = null;
  } else if (gate === 'error') {
    content = (
      <Screen>
        <Body tone="danger">{t.loadError}</Body>
        <Button title={t.retry} onPress={retry} />
      </Screen>
    );
  } else if (gate === 'disclaimer') {
    content = (
      <Screen testID="disclaimer">
        <Title>{t.disclaimerTitle}</Title>
        <Card>
          <Body>{t.disclaimerBody}</Body>
        </Card>
        <Button
          testID="accept-disclaimer"
          title={t.disclaimerAccept}
          onPress={() => acceptDisclaimer().then(() => setGate('ready'), () => setGate('error'))}
        />
      </Screen>
    );
  } else {
    content = (
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal', title: t.scanTitle }} />
        <Stack.Screen name="premium" options={{ presentation: 'modal', title: t.premium }} />
      </Stack>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>{content}</ThemeProvider>
  );
}
