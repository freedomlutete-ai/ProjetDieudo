import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { t } from '@/i18n';

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.border },
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 14, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: t.tabToday }} />
      <Tabs.Screen name="add" options={{ title: t.tabAdd }} />
      <Tabs.Screen name="shopping" options={{ title: t.tabShopping }} />
      <Tabs.Screen name="profile" options={{ title: t.tabProfile }} />
    </Tabs>
  );
}
