import { useState } from 'react';
import {
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
import { ArrowLeft, CheckCircle, Copy, QrCode } from 'lucide-react-native';

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

export default function AdminPaymentQR() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    fullName?: string;
    mobileNumber?: string;
    address?: string;
    amount?: string;
  }>();

  const [copied, setCopied] = useState(false);

  const fullName = params.fullName ?? '';
  const mobileNumber = params.mobileNumber ?? '';
  const address = params.address ?? '';
  const amount = params.amount ?? '';

  const upiId = 'YOUR_TEAM_BSY_UPI_ID';

  const copyUpiId = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(upiId);
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        window.alert(`UPI ID: ${upiId}`);
      }

      return;
    }

    Alert.alert('TEAM BSY', `UPI ID: ${upiId}`);
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
            <Text style={styles.headerTitle}>Scan QR</Text>
            <Text style={styles.headerSubtitle}>
              TEAM BSY UPI payment
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>QR PAYMENT</Text>

          <Text style={styles.heroTitle}>
            Scan and pay
          </Text>

          <Text style={styles.heroText}>
            Ask the contributor to scan the TEAM BSY QR using
            Google Pay, PhonePe, Paytm or another UPI app.
          </Text>
        </View>

        <View style={styles.contributorCard}>
          <Text style={styles.sectionTitle}>
            Contributor
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{fullName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile</Text>
            <Text style={styles.detailValue}>{mobileNumber}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Village / Address</Text>
            <Text style={styles.detailValue}>{address}</Text>
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

        <View style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                TEAM BSY QR
              </Text>

              <Text style={styles.qrSubtitle}>
                Scan with any supported UPI app
              </Text>
            </View>

            <QrCode size={30} color={COLORS.orange} />
          </View>

          <View style={styles.qrPlaceholder}>
            <QrCode
              size={180}
              color={COLORS.ink}
              strokeWidth={1.5}
            />

            <Text style={styles.placeholderText}>
              TEAM BSY QR
            </Text>

            <Text style={styles.placeholderSmall}>
              Replace this area with your real UPI QR image.
            </Text>
          </View>

          <View style={styles.upiBox}>
            <View style={styles.upiTextContainer}>
              <Text style={styles.upiLabel}>
                UPI ID
              </Text>

              <Text style={styles.upiId}>
                {upiId}
              </Text>
            </View>

            <Pressable
              style={styles.copyButton}
              onPress={copyUpiId}
            >
              {copied ? (
                <CheckCircle
                  size={20}
                  color={COLORS.white}
                />
              ) : (
                <Copy
                  size={20}
                  color={COLORS.white}
                />
              )}

              <Text style={styles.copyText}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>
            Payment confirmation
          </Text>

          <Text style={styles.warningText}>
            QR scanning itself does not automatically confirm
            the payment in this app. After the contributor pays,
            verify the transaction before marking it successful.
          </Text>
        </View>

        <Pressable
          style={styles.backPaymentButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={COLORS.white} />

          <Text style={styles.backPaymentText}>
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

  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
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
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.ink,
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
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.ink,
  },

  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  qrSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  qrPlaceholder: {
    marginTop: 20,
    minHeight: 280,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FFFCF9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
  },

  placeholderSmall: {
    marginTop: 6,
    paddingHorizontal: 30,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },

  upiBox: {
    marginTop: 16,
    borderRadius: 15,
    backgroundColor: COLORS.orangeLight,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  upiTextContainer: {
    flex: 1,
  },

  upiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.orangeDark,
  },

  upiId: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },

  copyButton: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 11,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  copyText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  warningCard: {
    marginTop: 18,
    backgroundColor: '#FFF4E8',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.orangeDark,
  },

  warningText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },

  backPaymentButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 15,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  backPaymentText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});