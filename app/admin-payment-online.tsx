import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react-native';

const COLORS = {
  background: '#FFF9F4',
  white: '#FFFFFF',
  ink: '#33231A',
  orange: '#D9773F',
  orangeDark: '#B85C28',
  orangeLight: '#FFE4D1',
  muted: '#8C7566',
  border: '#F2C7A9',
};

export default function AdminPaymentOnline() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    fullName?: string;
    mobileNumber?: string;
    address?: string;
    amount?: string;
  }>();

  const [loading, setLoading] = useState(false);

  const fullName = params.fullName ?? '';
  const mobileNumber = params.mobileNumber ?? '';
  const address = params.address ?? '';
  const amount = params.amount ?? '';

  const startPayment = async () => {
    setLoading(true);

    try {
      /*
       * Razorpay integration will be connected here.
       *
       * Flow:
       * 1. Send contributor details + amount to backend.
       * 2. Backend creates Razorpay order.
       * 3. Open Razorpay checkout.
       * 4. Verify Razorpay payment on backend.
       * 5. Save successful contribution.
       */

      if (Platform.OS === 'web') {
        window.alert(
          'Razorpay online payment integration will be connected in the next step.'
        );
      } else {
        Alert.alert(
          'TEAM BSY',
          'Razorpay online payment integration will be connected in the next step.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={COLORS.ink} />
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>
              Online Payment
            </Text>

            <Text style={styles.headerSubtitle}>
              TEAM BSY secure payment
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <CreditCard size={30} color={COLORS.orangeDark} />
          </View>

          <Text style={styles.heroLabel}>
            DIRECT ONLINE PAYMENT
          </Text>

          <Text style={styles.heroTitle}>
            Pay securely online
          </Text>

          <Text style={styles.heroText}>
            The contributor can complete the payment using the
            TEAM BSY online payment gateway.
          </Text>
        </View>

        <View style={styles.contributorCard}>
          <Text style={styles.sectionTitle}>
            Payment Details
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Contributor
            </Text>

            <Text style={styles.detailValue}>
              {fullName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Mobile
            </Text>

            <Text style={styles.detailValue}>
              {mobileNumber}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Village / Address
            </Text>

            <Text style={styles.detailValue}>
              {address}
            </Text>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>
              Contribution Amount
            </Text>

            <Text style={styles.amount}>
              ₹{amount}
            </Text>
          </View>
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <ShieldCheck
              size={25}
              color={COLORS.orange}
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Secure Payment
            </Text>

            <Text style={styles.securityText}>
              Payment verification will be performed by the
              TEAM BSY backend before the contribution is marked
              successful.
            </Text>
          </View>
        </View>

        <Pressable
          style={[
            styles.payButton,
            loading && styles.payButtonDisabled,
          ]}
          onPress={startPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <CreditCard
              size={21}
              color={COLORS.white}
            />
          )}

          <Text style={styles.payButtonText}>
            {loading
              ? 'Preparing Payment...'
              : `Pay ₹${amount}`}
          </Text>
        </Pressable>

        <Pressable
          style={styles.backButtonBottom}
          onPress={() => router.back()}
        >
          <ArrowLeft
            size={19}
            color={COLORS.orangeDark}
          />

          <Text style={styles.backButtonText}>
            Back to Payment Methods
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: 20,
    paddingBottom: 50,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink,
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.muted,
  },

  hero: {
    backgroundColor: COLORS.orangeLight,
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },

  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.orangeDark,
  },

  heroTitle: {
    marginTop: 8,
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.ink,
  },

  heroText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },

  contributorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },

  detailRow: {
    marginTop: 15,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },

  detailValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
  },

  amountBox: {
    marginTop: 18,
    backgroundColor: COLORS.orangeLight,
    borderRadius: 15,
    padding: 16,
  },

  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.orangeDark,
  },

  amount: {
    marginTop: 3,
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
  },

  securityCard: {
    marginTop: 18,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
  },

  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  securityContent: {
    flex: 1,
    marginLeft: 12,
  },

  securityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
  },

  securityText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  payButton: {
    marginTop: 20,
    height: 55,
    borderRadius: 15,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  payButtonDisabled: {
    opacity: 0.7,
  },

  payButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  backButtonBottom: {
    marginTop: 14,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.orangeLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  backButtonText: {
    color: COLORS.orangeDark,
    fontSize: 14,
    fontWeight: '800',
  },
});