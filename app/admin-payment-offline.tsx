import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  CheckCircle,
} from 'lucide-react-native';

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

export default function AdminPaymentOffline() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    fullName?: string;
    mobileNumber?: string;
    address?: string;
    amount?: string;
  }>();

  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const fullName = params.fullName ?? '';
  const mobileNumber = params.mobileNumber ?? '';
  const address = params.address ?? '';
  const amount = params.amount ?? '';

  const saveOfflinePayment = () => {
    /*
     * Backend integration will be connected here.
     *
     * The final flow will:
     * 1. Send contributor details to backend.
     * 2. Save the contribution as OFFLINE/CASH.
     * 3. Set payment status to PENDING.
     * 4. Set verification status to PENDING.
     * 5. Admin can later verify or reject it.
     */

    setSaved(true);

    if (Platform.OS === 'web') {
      window.alert(
        'Offline payment recorded locally for now. Backend saving will be connected next.'
      );
    } else {
      Alert.alert(
        'TEAM BSY',
        'Offline payment recorded locally for now. Backend saving will be connected next.'
      );
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
              Offline Payment
            </Text>

            <Text style={styles.headerSubtitle}>
              Record cash contribution
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Banknote size={30} color={COLORS.orangeDark} />
          </View>

          <Text style={styles.heroLabel}>
            OFFLINE PAYMENT
          </Text>

          <Text style={styles.heroTitle}>
            Record contribution
          </Text>

          <Text style={styles.heroText}>
            Use this option when the contributor gives cash or
            another offline payment directly to TEAM BSY.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Contributor Details
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Full Name
            </Text>

            <Text style={styles.detailValue}>
              {fullName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Mobile Number
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Payment Notes
          </Text>

          <Text style={styles.label}>
            Optional Notes
          </Text>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Example: Cash received by mentor..."
            placeholderTextColor={COLORS.muted}
            multiline
            style={styles.notesInput}
          />

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <CheckCircle
                size={22}
                color={COLORS.orange}
              />
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                Verification Required
              </Text>

              <Text style={styles.statusText}>
                This offline payment will remain pending until
                an authorized admin verifies it.
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.saveButton,
              saved && styles.saveButtonSaved,
            ]}
            onPress={saveOfflinePayment}
          >
            <Banknote size={20} color={COLORS.white} />

            <Text style={styles.saveButtonText}>
              {saved
                ? 'Payment Recorded'
                : 'Record Offline Payment'}
            </Text>
          </Pressable>
        </View>

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

  card: {
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
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
  },

  label: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },

  notesInput: {
    minHeight: 95,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    color: COLORS.ink,
    backgroundColor: '#FFFCF9',
    fontSize: 14,
    textAlignVertical: 'top',
  },

  statusCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.orangeLight,
    flexDirection: 'row',
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusContent: {
    flex: 1,
    marginLeft: 11,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },

  statusText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  saveButton: {
    marginTop: 20,
    height: 54,
    borderRadius: 15,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  saveButtonSaved: {
    backgroundColor: COLORS.orangeDark,
  },

  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },

  backButtonBottom: {
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