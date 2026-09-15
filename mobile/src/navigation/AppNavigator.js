import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import { colors } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import LearningTabScreen from '../screens/LearningTabScreen';
import LiveClassesScreen from '../screens/LiveClassesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LessonScreen from '../screens/LessonScreen';
import RecordingsScreen from '../screens/RecordingsScreen';
import PricingScreen from '../screens/PricingScreen';
import CartScreen from '../screens/CartScreen';
import WishlistScreen from '../screens/WishlistScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.bgCard,
    text: colors.text,
    border: colors.border,
  },
};

function TabIcon({ label, focused }) {
  const icons = {
    Home: '🏠',
    Courses: '📚',
    Learning: '🎓',
    Profile: '👤',
  };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label]}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border, height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Udemy' }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ title: 'Courses' }} />
      <Tab.Screen
        name="Learning"
        component={LearningTabScreen}
        options={{ title: 'My Learning' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Course' }} />
        <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: 'Lesson' }} />
        <Stack.Screen name="LiveClasses" component={LiveClassesScreen} options={{ title: 'Live Classes' }} />
        <Stack.Screen name="Recordings" component={RecordingsScreen} options={{ title: 'Recordings' }} />
        <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: 'Plans' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
