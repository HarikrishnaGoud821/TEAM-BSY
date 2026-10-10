import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { User } from './api';

const TOKEN_KEY = 'team_bsy_token';
const USER_KEY = 'team_bsy_user';

/*
 * Save a value
 */
async function saveValue(
  key: string,
  value: string
): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(
    key,
    value
  );
}

/*
 * Get a value
 */
async function getValue(
  key: string
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

/*
 * Delete a value
 */
async function deleteValue(
  key: string
): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

/*
 * Save login session
 */
export async function saveSession(
  token: string,
  user: User
): Promise<void> {
  await saveValue(
    TOKEN_KEY,
    token
  );

  await saveValue(
    USER_KEY,
    JSON.stringify(user)
  );
}

/*
 * Get JWT token
 */
export async function getToken(): Promise<string | null> {
  return getValue(TOKEN_KEY);
}

/*
 * Get logged-in user
 */
export async function getUser(): Promise<User | null> {
  const value = await getValue(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}

/*
 * Clear complete login session
 *
 * This logs the user out by removing:
 *
 * 1. JWT token
 * 2. Saved user information
 */
export async function clearSession(): Promise<void> {
  await deleteValue(TOKEN_KEY);
  await deleteValue(USER_KEY);
}

/*
 * Logout
 *
 * Clears everything related to the
 * current authenticated session.
 */
export async function logout(): Promise<void> {
  await clearSession();
}