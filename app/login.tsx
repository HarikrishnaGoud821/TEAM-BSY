import { useState } from 'react';

import { useRouter } from 'expo-router';

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { sendOtp } from '../src/services/api';

const COLORS = {
  background: '#FFF1E6',
  white: '#FFFFFF',
  ink: '#33231A',
  teal: '#D9773F',
  tealDark: '#B85C28',
  mint: '#F8D2B5',
  mintLight: '#FFE4D1',
  muted: '#8C7566',
  border: '#F2C7A9',
  red: '#B84A4A',
};

export default function LoginScreen() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const value = identifier.trim();

    if (!value) {
      setError('Please enter your mobile number or email.');
      return;
    }

    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    const isPhone = /^[0-9]{10}$/.test(value);

    if (!isEmail && !isPhone) {
      setError(
        'Enter a valid 10-digit mobile number or email.'
      );
      return;
    }

    // Current backend OTP supports mobile number only.
    if (isEmail) {
      setError(
        'For now, please use your 10-digit mobile number.'
      );
      return;
    }

    try {
      setError('');
      setLoading(true);

      await sendOtp(value);

      router.push({
        pathname: '/otp',
        params: {
          identifier: value,
        },
      });
    } catch (error) {
      console.error('Send OTP error:', error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'Unable to send OTP. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Logo */}
        <View style={styles.logo}>
          <Image
            source={require('../assets/images/bsy.jpg')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>

        {/* Brand */}
        <Text style={styles.brand}>
          TEAM BSY
        </Text>

        <Text style={styles.subtitle}>
          BASWESHWARA YOUTH
        </Text>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>
            Welcome back
          </Text>

          <Text style={styles.description}>
            Login securely using your mobile number
            or email.
          </Text>
        </View>

        {/* Input label */}
        <Text style={styles.label}>
          MOBILE NUMBER OR EMAIL
        </Text>

        {/* Input */}
        <TextInput
          style={styles.input}
          placeholder="9876543210 or email@example.com"
          placeholderTextColor={COLORS.muted}
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
          maxLength={50}
        />

        {/* Error */}
        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        {/* Send OTP */}
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSendOtp}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <Text style={styles.buttonText}>
              SEND OTP
            </Text>
          )}
        </TouchableOpacity>

        {/* Security information */}
        <View style={styles.security}>
          <View style={styles.securityBadge}>
            <Text style={styles.securityIcon}>
              ✓
            </Text>
          </View>

          <Text style={styles.secureTitle}>
            Secure OTP Login
          </Text>

          <Text style={styles.secureText}>
            No password required. We will send a
            one-time verification code.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          New to TEAM BSY? Your account will be
          created after verification.
        </Text>

        {/* Bottom brand */}
        <Text style={styles.bottomBrand}>
          TEAM BSY • BASWESHWARA YOUTH
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  logo: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.white,
  },

  logoImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },

  brand: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 2,
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
    letterSpacing: 1.5,
    marginTop: 3,
  },

  heading: {
    marginTop: 43,
    marginBottom: 27,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
  },

  description: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 7,
  },

  label: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.tealDark,
    letterSpacing: 1,
    marginBottom: 8,
  },

  input: {
    height: 58,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.ink,
  },

  error: {
    color: COLORS.red,
    fontSize: 11,
    marginTop: 8,
  },

  button: {
    height: 57,
    backgroundColor: COLORS.teal,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,

    shadowColor: COLORS.tealDark,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  security: {
    alignItems: 'center',
    marginTop: 30,
    padding: 18,
    backgroundColor: COLORS.mintLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  securityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  securityIcon: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
  },

  secureTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '900',
  },

  secureText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },

  footer: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
  },

  bottomBrand: {
    color: COLORS.tealDark,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 18,
  },
});