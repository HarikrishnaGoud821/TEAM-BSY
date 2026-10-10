import { useEffect, useState } from 'react';
import {
  Stack,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  View,
} from 'react-native';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';

import {
  getToken,
  getUser,
} from '@/src/services/session';

export default function RootLayout() {
  useFrameworkReady();

  const router = useRouter();
  const segments = useSegments();

  const [checkingSession, setCheckingSession] =
    useState(true);

  /*
   * Get the correct dashboard according
   * to the user's role.
   */
  const getDashboardRoute = (
    role: string
  ):
    | '/admin-dashboard'
    | '/mentor-dashboard'
    | '/member-dashboard'
    | '/viewer-dashboard'
    | '/login' => {
    switch (role) {
      case 'ADMIN':
        return '/admin-dashboard';

      case 'MENTOR':
        return '/mentor-dashboard';

      case 'MEMBER':
        return '/member-dashboard';

      case 'VIEWER':
        return '/viewer-dashboard';

      default:
        return '/login';
    }
  };

  /*
   * Check authentication whenever
   * the current route changes.
   */
  useEffect(() => {
    checkSession();
  }, [segments]);

  const checkSession = async () => {
    try {
      /*
       * Get current screen.
       */
      const currentScreen = segments[0] || '';

      /*
       * LOGIN SCREEN
       *
       * Login must be accessible without
       * authentication.
       *
       * Do not redirect from Login.
       */
      if (currentScreen === 'login') {
        return;
      }

      /*
       * OTP SCREEN
       *
       * OTP is also part of authentication.
       *
       * Do not redirect from OTP.
       */
      if (currentScreen === 'otp') {
        return;
      }

      /*
       * Get saved authentication data.
       */
      const token = await getToken();
      const user = await getUser();

      /*
       * USER IS NOT LOGGED IN
       *
       * Any protected screen goes back
       * to Login.
       */
      if (!token || !user) {
        router.replace('/login');
        return;
      }

      /*
       * Get dashboard based on role.
       */
      const dashboardRoute =
        getDashboardRoute(user.role);

      /*
       * Invalid role.
       */
      if (dashboardRoute === '/login') {
        console.error(
          'Invalid user role:',
          user.role
        );

        router.replace('/login');
        return;
      }

      /*
       * All role dashboard routes.
       */
      const authenticatedScreens = [
  'admin-dashboard',
  'admin-contributions',
  'admin-payments',
  'admin-members',
  'admin-finance',
  'admin-expenses',
  'admin-reports',
  'admin-audit',
  'admin-media',
  'admin-qr',
  'admin-settings',
  'admin-payment-qr',
  'admin-payment-online',
  'admin-payment-offline',

  'mentor-dashboard',
  'member-dashboard',
  'viewer-dashboard',
];

      /*
       * Check if the user is currently
       * inside a dashboard.
       */
      
     const inAuthenticatedScreen =
  authenticatedScreens.includes(currentScreen);

if (inAuthenticatedScreen) {
  return;
}

      /*
       * If the user is authenticated but
       * is on another old/non-role screen,
       * send them to their own dashboard.
       */
      router.replace(dashboardRoute);

    } catch (error) {
      /*
       * If session checking fails,
       * send user to Login.
       */
      console.error(
        'Session check error:',
        error
      );

      router.replace('/login');

    } finally {
      setCheckingSession(false);
    }
  };

  /*
   * Show loading screen while checking
   * the application state.
   */
  if (checkingSession) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFF9F4',
        }}
      >
        <ActivityIndicator
          size="large"
          color="#C96F32"
        />
      </View>
    );
  }

  /*
   * Application navigation.
   */
  return (
    <>
      <Stack
        initialRouteName="login"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Authentication */}

        <Stack.Screen
          name="login"
        />

        <Stack.Screen
          name="otp"
        />

        {/* Role Dashboards */}

        <Stack.Screen
          name="admin-dashboard"
        />
        <Stack.Screen name="admin-payments" />

        <Stack.Screen
          name="mentor-dashboard"
        />

        <Stack.Screen
          name="member-dashboard"
        />

        <Stack.Screen
          name="viewer-dashboard"
        />

        {/* Old Tabs */}

        <Stack.Screen
          name="(tabs)"
        />

        {/* Admin Modules */}

        <Stack.Screen
          name="admin-contributions"
        />

        <Stack.Screen
          name="admin-members"
        />

        <Stack.Screen
          name="admin-finance"
        />

        <Stack.Screen
          name="admin-expenses"
        />

        <Stack.Screen
          name="admin-reports"
        />

        <Stack.Screen
          name="admin-audit"
        />

        <Stack.Screen
          name="admin-media"
        />

        <Stack.Screen
          name="admin-qr"
        />

        <Stack.Screen
          name="admin-settings"
        />

        {/* Not Found */}

        <Stack.Screen
          name="+not-found"
        />
      </Stack>

      <StatusBar style="dark" />
    </>
  );
}