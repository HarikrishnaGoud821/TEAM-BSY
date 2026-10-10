import { Tabs } from 'expo-router';
import { Grid2X2, Home, ReceiptText, UserRound, WalletCards } from 'lucide-react-native';

const COLORS = {
  ink: '#132B2A',
  muted: '#78908E',
  mint: '#B7E4D8',
  surface: '#F7FBF9',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.ink,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          height: 78,
          paddingTop: 10,
          paddingBottom: 14,
          borderTopWidth: 0,
          backgroundColor: COLORS.surface,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="contribute" options={{ title: 'Contribute', tabBarIcon: ({ color, size }) => <WalletCards color={color} size={size} /> }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} /> }} />
      <Tabs.Screen name="modules" options={{ title: 'Modules', tabBarIcon: ({ color, size }) => <Grid2X2 color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} />
    </Tabs>
  );
}
