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
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Banknote,
  ChevronRight,
  QrCode,
  Smartphone,
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

export default function AdminPayments() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [showMethods, setShowMethods] = useState(false);

  const showError = (message: string) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('TEAM BSY', message);
    }
  };

  const continueToPayment = () => {
    if (!fullName.trim()) {
      showError('Please enter the contributor name.');
      return;
    }

    if (!/^[0-9]{10}$/.test(mobileNumber.trim())) {
      showError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!address.trim()) {
      showError('Please enter the village / address.');
      return;
    }

    const numericAmount = Number(amount);

    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      showError('Please enter a valid contribution amount.');
      return;
    }

    setShowMethods(true);
  };

  const selectPaymentMethod = (method: string) => {
    if (method === 'QR') {
      router.push({
        pathname: '/admin-payment-qr',
        params: {
          fullName,
          mobileNumber,
          address,
          amount,
        },
      });
      return;
    }

    if (method === 'ONLINE') {
      router.push({
        pathname: '/admin-payment-online',
        params: {
          fullName,
          mobileNumber,
          address,
          amount,
        },
      });
      return;
    }

    router.push({
      pathname: '/admin-payment-offline',
      params: {
        fullName,
        mobileNumber,
        address,
        amount,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={COLORS.ink} />
          </Pressable>

          <View>
            <Text style={styles.headerTitle}>Payments</Text>
            <Text style={styles.headerSubtitle}>
              TEAM BSY contribution collection
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>NEW PAYMENT</Text>
          <Text style={styles.heroTitle}>
            Enter contributor details
          </Text>
          <Text style={styles.heroText}>
            Enter the contributor information first. Then choose how
            the contribution will be paid.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Contributor Information
          </Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            value={mobileNumber}
            onChangeText={(value) =>
              setMobileNumber(value.replace(/[^0-9]/g, ''))
            }
            placeholder="10-digit mobile number"
            placeholderTextColor={COLORS.muted}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

          <Text style={styles.label}>Village / Address *</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Enter village / address"
            placeholderTextColor={COLORS.muted}
            multiline
            style={[styles.input, styles.addressInput]}
          />

          <Text style={styles.label}>Contribution Amount *</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={(value) =>
                setAmount(value.replace(/[^0-9.]/g, ''))
              }
              placeholder="0"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />
          </View>

          <Pressable
            style={styles.continueButton}
            onPress={continueToPayment}
          >
            <Text style={styles.continueText}>
              Continue to Payment
            </Text>
            <ChevronRight size={20} color={COLORS.white} />
          </Pressable>
        </View>

        {showMethods && (
          <View style={styles.methodsCard}>
            <Text style={styles.sectionTitle}>
              Choose Payment Method
            </Text>

            <Text style={styles.methodInfo}>
              {fullName} · ₹{amount}
            </Text>

            <Pressable
              style={styles.method}
              onPress={() => selectPaymentMethod('QR')}
            >
              <View style={styles.methodIcon}>
                <QrCode size={25} color={COLORS.orange} />
              </View>

              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>
                  Scan QR
                </Text>
                <Text style={styles.methodDescription}>
                  Show the TEAM BSY UPI QR for scanning with
                  Google Pay, PhonePe, Paytm or another UPI app.
                </Text>
              </View>

              <ChevronRight size={20} color={COLORS.muted} />
            </Pressable>

            <Pressable
              style={styles.method}
              onPress={() => selectPaymentMethod('ONLINE')}
            >
              <View style={styles.methodIcon}>
                <Smartphone size={25} color={COLORS.orange} />
              </View>

              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>
                  Direct Online Payment
                </Text>
                <Text style={styles.methodDescription}>
                  Pay online using the TEAM BSY payment gateway.
                </Text>
              </View>

              <ChevronRight size={20} color={COLORS.muted} />
            </Pressable>

            <Pressable
              style={styles.method}
              onPress={() => selectPaymentMethod('OFFLINE')}
            >
              <View style={styles.methodIcon}>
                <Banknote size={25} color={COLORS.orange} />
              </View>

              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>
                  Offline Payment
                </Text>
                <Text style={styles.methodDescription}>
                  Record cash or another offline contribution
                  and verify it later.
                </Text>
              </View>

              <ChevronRight size={20} color={COLORS.muted} />
            </Pressable>
          </View>
        )}
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
    fontSize: 26,
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
  },

  methodsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    paddingHorizontal: 15,
    color: COLORS.ink,
    backgroundColor: '#FFFCF9',
    fontSize: 15,
  },

  addressInput: {
    height: 85,
    paddingTop: 13,
    textAlignVertical: 'top',
  },

  amountContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    backgroundColor: '#FFFCF9',
  },

  rupee: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.orangeDark,
    marginLeft: 15,
  },

  amountInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    color: COLORS.ink,
    fontSize: 20,
    fontWeight: '700',
  },

  continueButton: {
    marginTop: 24,
    height: 54,
    borderRadius: 15,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  continueText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  methodInfo: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: -8,
    marginBottom: 14,
  },

  method: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  methodContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  methodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },

  methodDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },
});