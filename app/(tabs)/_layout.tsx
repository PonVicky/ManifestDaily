import { Tabs } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import TabBar from '../../components/shared/TabBar';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="affirmations" options={{ title: 'Affirm' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
      <Tabs.Screen name="vault" options={{ title: 'Vault' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}
