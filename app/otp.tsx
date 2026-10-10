import { useEffect, useRef, useState } from 'react';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  verifyOtp,
  sendOtp,
} from '../src/services/api';

import {
  saveSession,
} from '../src/services/session';

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

export default function OtpScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    identifier?: string;
  }>();

  const identifier = String(
    params.identifier || ''
  );

  const [otp, setOtp] = useState([
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputs =
    useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSeconds((current) => current - 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [seconds]);

  const updateOtp = (
    value: string,
    index: number
  ) => {
    const digit = value
      .replace(/[^0-9]/g, '')
      .slice(-1);

    const nextOtp = [...otp];

    nextOtp[index] = digit;

    setOtp(nextOtp);
    setError('');

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    event: any,
    index: number
  ) => {
    if (
      event.nativeEvent.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');

    if (code.length !== 6) {
      setError(
        'Please enter the complete 6-digit OTP.'
      );
      return;
    }

    if (!identifier) {
      setError(
        'Mobile number is missing. Please go back and try again.'
      );
      return;
    }

    try {
      setError('');
      setLoading(true);

      const response = await verifyOtp(
        identifier,
        code
      );

      await saveSession(
        response.token,
        response.user
      );

      console.log('Login successful');
      console.log('User:', response.user);
      console.log('Role:', response.user.role);

      switch (response.user.role) {
        case 'ADMIN':
          router.replace('/admin-dashboard');
          break;

        case 'MENTOR':
          router.replace('/mentor-dashboard');
          break;

        case 'MEMBER':
          router.replace('/member-dashboard');
          break;

        case 'VIEWER':
          router.replace('/viewer-dashboard');
          break;

        default:
          console.error(
            'Unknown user role:',
            response.user.role
          );

          router.replace('/login');
      }
    } catch (error) {
      console.error(
        'OTP verification error:',
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'OTP verification failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (
      seconds > 0 ||
      !identifier ||
      loading
    ) {
      return;
    }

    try {
      setError('');
      setLoading(true);

      await sendOtp(identifier);

      setSeconds(30);

      setOtp([
        '',
        '',
        '',
        '',
        '',
        '',
      ]);

      inputs.current[0]?.focus();
    } catch (error) {
      console.error(
        'Resend OTP error:',
        error
      );

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'Unable to resend OTP.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const maskedIdentifier =
    identifier.includes('@')
      ? identifier.replace(
          /^(.{2}).*(@.*)$/,
          '$1****$2'
        )
      : identifier.length >= 4
        ? '******' +
          identifier.slice(-4)
        : identifier;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Back */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        {/* Verification icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>
            ✓
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Verify OTP
        </Text>

        <Text style={styles.description}>
          We've sent a 6-digit verification code to
        </Text>

        <Text style={styles.identifier}>
          {maskedIdentifier}
        </Text>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit
                  ? styles.otpFilled
                  : null,
              ]}
              value={digit}
              onChangeText={(value) =>
                updateOtp(
                  value,
                  index
                )
              }
              onKeyPress={(event) =>
                handleKeyPress(
                  event,
                  index
                )
              }
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </View>

        {/* Error */}
        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        {/* Verify button */}
        <Pressable
          style={[
            styles.verifyButton,
            loading &&
              styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <Text style={styles.verifyText}>
              VERIFY OTP
            </Text>
          )}
        </Pressable>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>
            Didn't receive the code?{' '}
          </Text>

          <Pressable
            disabled={
              seconds > 0 ||
              loading
            }
            onPress={handleResend}
          >
            <Text
              style={[
                styles.resendButton,
                seconds > 0 ||
                loading
                  ? styles.resendDisabled
                  : null,
              ]}
            >
              {seconds > 0
                ? `Resend in ${seconds}s`
                : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>

        {/* Development note */}
        <View style={styles.devCard}>
          <Text style={styles.devTitle}>
            Development Mode
          </Text>

          <Text style={styles.devNote}>
            Use OTP
          </Text>

          <Text style={styles.devOtp}>
            123456
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
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

  backButton: {
    position: 'absolute',
    top: 18,
    left: 25,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  backText: {
    color: COLORS.tealDark,
    fontSize: 13,
    fontWeight: '800',
  },

  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.mint,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  icon: {
    color: COLORS.tealDark,
    fontSize: 42,
    fontWeight: '900',
  },

  title: {
    color: COLORS.ink,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  description: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

  identifier: {
    color: COLORS.tealDark,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 30,
  },

  otpInput: {
    width: 45,
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    color: COLORS.ink,
    fontSize: 20,
    fontWeight: '900',
  },

  otpFilled: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.mintLight,
  },

  error: {
    color: COLORS.red,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },

  verifyButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,

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

  verifyText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 23,
  },

  resendLabel: {
    color: COLORS.muted,
    fontSize: 11,
  },

  resendButton: {
    color: COLORS.tealDark,
    fontSize: 11,
    fontWeight: '900',
  },

  resendDisabled: {
    color: COLORS.muted,
  },

  devCard: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: COLORS.mintLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  devTitle: {
    color: COLORS.tealDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  devNote: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },

  devOtp: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 3,
  },

  footer: {
    color: COLORS.muted,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 22,
    letterSpacing: 0.8,
  },
});