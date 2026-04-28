import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Hop as Home, MessageCircle, MapPin, Activity, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { shadows } from '@/constants/theme';

const TAB_ITEMS = [
  { name: 'index', title: 'Home', icon: Home },
  { name: 'chat', title: 'Chat', icon: MessageCircle },
  { name: 'map', title: 'Nearby', icon: MapPin },
  { name: 'monitor', title: 'Monitor', icon: Activity },
  { name: 'profile', title: 'Profile', icon: User },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          ...shadows.lg,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TAB_ITEMS.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({

  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconWrap: {
    width: 42,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapActive: {
    backgroundColor: '#F0FDFA',
  },
});


