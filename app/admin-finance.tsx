import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
ArrowDownLeft,
ArrowUpRight,
BarChart3,
ChevronLeft,
IndianRupee,
RefreshCw,
WalletCards,
} from 'lucide-react-native';
import {
ActivityIndicator,
Pressable,
ScrollView,
StyleSheet,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
getAdminContributions,
type Contribution,
} from '../src/services/api';

import {
getToken,
getUser,
} from '../src/services/session';

const COLORS = {
ink: '#132B2A',
teal: '#2F7467',
mint: '#B7E4D8',
pale: '#EAF6F1',
paper: '#F7FBF9',
white: '#FFFFFF',
muted: '#78908E',
line: '#DCEBE6',
amber: '#B66F22',
red: '#B84A4A',
green: '#367C5E',
};

export default function AdminFinanceScreen() {
const router = useRouter();

const [contributions, setContributions] =
useState<Contribution[]>([]);

const [loading, setLoading] =
useState(true);

const [refreshing, setRefreshing] =
useState(false);

const [error, setError] =
useState('');

const loadFinance = useCallback(
async (isRefresh = false) => {
try {
if (isRefresh) {
setRefreshing(true);
} else {
setLoading(true);
}


    setError('');

    const user = await getUser();
    const token = await getToken();

    if (!user || user.role !== 'ADMIN') {
      setError(
        'Admin access is required.'
      );
      return;
    }

    if (!token) {
      setError(
        'Your session has expired. Please login again.'
      );
      return;
    }

    const data =
      await getAdminContributions(token);

    setContributions(data);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Unable to load finance data.';

    setError(message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
},
[]


);

useEffect(() => {
loadFinance();
}, [loadFinance]);

const finance = useMemo(() => {
const verified = contributions.filter(
(item) =>
item.verificationStatus === 'VERIFIED' &&
item.paymentStatus === 'SUCCESS'
);


const pending = contributions.filter(
  (item) =>
    item.verificationStatus === 'PENDING'
);

const rejected = contributions.filter(
  (item) =>
    item.verificationStatus === 'REJECTED'
);

const successfulOnline =
  contributions.filter(
    (item) =>
      item.paymentStatus === 'SUCCESS' &&
      item.verificationStatus ===
        'NOT_REQUIRED'
  );

const verifiedCash =
  contributions.filter(
    (item) =>
      item.paymentMethod === 'CASH' &&
      item.verificationStatus === 'VERIFIED' &&
      item.paymentStatus === 'SUCCESS'
  );

const verifiedCollection =
  verified.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

const onlineCollection =
  successfulOnline.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

const cashCollection =
  verifiedCash.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

const pendingAmount =
  pending.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

const rejectedAmount =
  rejected.reduce(
    (total, item) =>
      total + Number(item.amount || 0),
    0
  );

const totalReceived =
  verifiedCollection +
  onlineCollection;

return {
  verifiedCount: verified.length,
  pendingCount: pending.length,
  rejectedCount: rejected.length,
  onlineCount: successfulOnline.length,
  cashCount: verifiedCash.length,
  verifiedCollection,
  onlineCollection,
  cashCollection,
  pendingAmount,
  rejectedAmount,
  totalReceived,
};


}, [contributions]);

const formatCurrency = (
amount: number
) => {
return `₹${amount.toLocaleString('en-IN')}`;
};

return (
<SafeAreaView
style={styles.safe}
edges={['top']}
> <ScrollView
     contentContainerStyle={styles.content}
     showsVerticalScrollIndicator={false}
   > <View style={styles.headerRow}>
<Pressable
style={styles.backButton}
onPress={() => router.back()}
> <ChevronLeft
           size={21}
           color={COLORS.ink}
         /> </Pressable>


      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>
          TEAM BSY ADMIN
        </Text>

        <Text style={styles.title}>
          Finance overview
        </Text>

        <Text style={styles.subtitle}>
          Track collection, payments and
          current contribution activity.
        </Text>
      </View>

      <Pressable
        style={styles.refreshButton}
        onPress={() =>
          loadFinance(true)
        }
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator
            size="small"
            color={COLORS.teal}
          />
        ) : (
          <RefreshCw
            size={18}
            color={COLORS.teal}
          />
        )}
      </Pressable>
    </View>

    {loading ? (
      <View style={styles.centerState}>
        <ActivityIndicator
          size="large"
          color={COLORS.teal}
        />

        <Text style={styles.stateText}>
          Loading finance data...
        </Text>
      </View>
    ) : error ? (
      <View style={styles.errorCard}>
        <Text style={styles.errorTitle}>
          Unable to load finance
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() =>
            loadFinance()
          }
        >
          <Text style={styles.retryButtonText}>
            Try again
          </Text>
        </Pressable>
      </View>
    ) : (
      <>
        <View style={styles.mainBalanceCard}>
          <View style={styles.balanceIcon}>
            <WalletCards
              size={23}
              color={COLORS.teal}
            />
          </View>

          <Text style={styles.balanceLabel}>
            TOTAL RECEIVED
          </Text>

          <Text style={styles.balanceAmount}>
            {formatCurrency(
              finance.totalReceived
            )}
          </Text>

          <Text style={styles.balanceDescription}>
            Successful online payments +
            verified cash contributions
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <ArrowDownLeft
                size={17}
                color={COLORS.green}
              />
            </View>

            <Text style={styles.statNumber}>
              {finance.verifiedCount +
                finance.onlineCount}
            </Text>

            <Text style={styles.statLabel}>
              Successful
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <BarChart3
                size={17}
                color={COLORS.teal}
              />
            </View>

            <Text style={styles.statNumber}>
              {finance.pendingCount}
            </Text>

            <Text style={styles.statLabel}>
              Pending
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <ArrowUpRight
                size={17}
                color={COLORS.red}
              />
            </View>

            <Text style={styles.statNumber}>
              {finance.rejectedCount}
            </Text>

            <Text style={styles.statLabel}>
              Rejected
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Collection breakdown
          </Text>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View
                  style={styles.breakdownIcon}
                >
                  <IndianRupee
                    size={17}
                    color={COLORS.teal}
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.breakdownTitle
                    }
                  >
                    Online collection
                  </Text>

                  <Text
                    style={
                      styles.breakdownDescription
                    }
                  >
                    Razorpay successful payments
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.breakdownAmount
                }
              >
                {formatCurrency(
                  finance.onlineCollection
                )}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View
                  style={styles.breakdownIcon}
                >
                  <IndianRupee
                    size={17}
                    color={COLORS.teal}
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.breakdownTitle
                    }
                  >
                    Verified cash
                  </Text>

                  <Text
                    style={
                      styles.breakdownDescription
                    }
                  >
                    Cash verified by admin
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.breakdownAmount
                }
              >
                {formatCurrency(
                  finance.cashCollection
                )}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total received
              </Text>

              <Text style={styles.totalAmount}>
                {formatCurrency(
                  finance.totalReceived
                )}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pending money
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <BarChart3
                size={19}
                color={COLORS.amber}
              />
            </View>

            <View style={styles.infoCopy}>
              <Text style={styles.infoTitle}>
                Pending cash contributions
              </Text>

              <Text style={styles.infoDescription}>
                {finance.pendingCount} contribution
                {finance.pendingCount === 1
                  ? ''
                  : 's'} waiting for admin
                verification.
              </Text>
            </View>

            <Text style={styles.pendingAmount}>
              {formatCurrency(
                finance.pendingAmount
              )}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Payment activity
          </Text>

          <View style={styles.activityCard}>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>
                Online payments
              </Text>

              <Text style={styles.activityValue}>
                {finance.onlineCount}
              </Text>
            </View>

            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>
                Verified cash payments
              </Text>

              <Text style={styles.activityValue}>
                {finance.cashCount}
              </Text>
            </View>

            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>
                Pending contributions
              </Text>

              <Text style={styles.activityValue}>
                {finance.pendingCount}
              </Text>
            </View>

            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>
                Rejected contributions
              </Text>

              <Text style={styles.activityValue}>
                {finance.rejectedCount}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Additional information
          </Text>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>
              Finance data source
            </Text>

            <Text style={styles.noteText}>
              This dashboard currently calculates
              finance totals from TEAM BSY
              contribution records.
            </Text>

            <Text style={styles.noteText}>
              Expenses are not included in the
              balance yet. The Expenses module
              will be connected separately.
            </Text>

            <Text style={styles.noteText}>
              Therefore, the amount shown as
              Total Received is collection before
              expenses.
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.contributionsButton}
          onPress={() =>
            router.push(
              '/admin-contributions'
            )
          }
        >
          <WalletCards
            size={18}
            color={COLORS.white}
          />

          <Text
            style={
              styles.contributionsButtonText
            }
          >
            View all contributions
          </Text>
        </Pressable>
      </>
    )}
  </ScrollView>
</SafeAreaView>


);
}

const styles = StyleSheet.create({
safe: {
flex: 1,
backgroundColor: COLORS.paper,
},

content: {
padding: 20,
paddingBottom: 45,
},

headerRow: {
flexDirection: 'row',
alignItems: 'flex-start',
},

backButton: {
width: 40,
height: 40,
borderRadius: 13,
backgroundColor: COLORS.white,
alignItems: 'center',
justifyContent: 'center',
marginTop: 10,
marginRight: 10,
},

headerCopy: {
flex: 1,
paddingRight: 8,
},

eyebrow: {
color: COLORS.teal,
fontSize: 10,
letterSpacing: 1.4,
fontWeight: '900',
marginTop: 12,
},

title: {
color: COLORS.ink,
fontSize: 28,
fontWeight: '900',
marginTop: 6,
},

subtitle: {
color: COLORS.muted,
fontSize: 12,
lineHeight: 18,
marginTop: 5,
},

refreshButton: {
width: 42,
height: 42,
borderRadius: 14,
backgroundColor: COLORS.white,
alignItems: 'center',
justifyContent: 'center',
marginTop: 10,
},

mainBalanceCard: {
backgroundColor: COLORS.mint,
borderRadius: 23,
padding: 19,
marginTop: 24,
},

balanceIcon: {
width: 44,
height: 44,
borderRadius: 14,
backgroundColor: COLORS.white,
alignItems: 'center',
justifyContent: 'center',
marginBottom: 13,
},

balanceLabel: {
color: COLORS.teal,
fontSize: 9,
letterSpacing: 1.2,
fontWeight: '900',
},

balanceAmount: {
color: COLORS.ink,
fontSize: 32,
fontWeight: '900',
marginTop: 5,
},

balanceDescription: {
color: '#37655D',
fontSize: 10,
lineHeight: 15,
marginTop: 4,
},

statsGrid: {
flexDirection: 'row',
gap: 9,
marginTop: 10,
},

statCard: {
flex: 1,
backgroundColor: COLORS.white,
borderRadius: 17,
padding: 13,
minHeight: 108,
},

statIcon: {
width: 34,
height: 34,
borderRadius: 11,
backgroundColor: COLORS.pale,
alignItems: 'center',
justifyContent: 'center',
},

statNumber: {
color: COLORS.ink,
fontSize: 22,
fontWeight: '900',
marginTop: 9,
},

statLabel: {
color: COLORS.muted,
fontSize: 10,
fontWeight: '700',
marginTop: 2,
},

section: {
marginTop: 27,
},

sectionTitle: {
color: COLORS.ink,
fontSize: 17,
fontWeight: '900',
marginBottom: 10,
},

breakdownCard: {
backgroundColor: COLORS.white,
borderRadius: 19,
padding: 15,
},

breakdownRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
minHeight: 55,
},

breakdownLeft: {
flexDirection: 'row',
alignItems: 'center',
flex: 1,
},

breakdownIcon: {
width: 38,
height: 38,
borderRadius: 12,
backgroundColor: COLORS.pale,
alignItems: 'center',
justifyContent: 'center',
marginRight: 10,
},

breakdownTitle: {
color: COLORS.ink,
fontSize: 12,
fontWeight: '900',
},

breakdownDescription: {
color: COLORS.muted,
fontSize: 9,
marginTop: 3,
},

breakdownAmount: {
color: COLORS.teal,
fontSize: 13,
fontWeight: '900',
},

divider: {
height: 1,
backgroundColor: COLORS.line,
marginVertical: 7,
},

totalRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingTop: 9,
},

totalLabel: {
color: COLORS.ink,
fontSize: 13,
fontWeight: '900',
},

totalAmount: {
color: COLORS.ink,
fontSize: 16,
fontWeight: '900',
},

infoCard: {
backgroundColor: COLORS.white,
borderRadius: 18,
padding: 14,
flexDirection: 'row',
alignItems: 'center',
},

infoIcon: {
width: 40,
height: 40,
borderRadius: 13,
backgroundColor: '#FFF4E5',
alignItems: 'center',
justifyContent: 'center',
marginRight: 10,
},

infoCopy: {
flex: 1,
paddingRight: 8,
},

infoTitle: {
color: COLORS.ink,
fontSize: 12,
fontWeight: '900',
},

infoDescription: {
color: COLORS.muted,
fontSize: 9,
lineHeight: 14,
marginTop: 4,
},

pendingAmount: {
color: COLORS.amber,
fontSize: 12,
fontWeight: '900',
},

activityCard: {
backgroundColor: COLORS.white,
borderRadius: 18,
paddingHorizontal: 15,
paddingVertical: 7,
},

activityRow: {
minHeight: 48,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
borderBottomWidth: 1,
borderBottomColor: COLORS.line,
},

activityLabel: {
color: COLORS.muted,
fontSize: 11,
fontWeight: '700',
},

activityValue: {
color: COLORS.ink,
fontSize: 13,
fontWeight: '900',
},

noteCard: {
backgroundColor: COLORS.white,
borderRadius: 18,
padding: 16,
},

noteTitle: {
color: COLORS.ink,
fontSize: 13,
fontWeight: '900',
},

noteText: {
color: COLORS.muted,
fontSize: 10,
lineHeight: 16,
marginTop: 8,
},

contributionsButton: {
height: 54,
borderRadius: 16,
backgroundColor: COLORS.ink,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
marginTop: 28,
gap: 9,
},

contributionsButtonText: {
color: COLORS.white,
fontSize: 12,
fontWeight: '900',
},

centerState: {
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 90,
},

stateText: {
color: COLORS.muted,
fontSize: 12,
marginTop: 12,
},

errorCard: {
backgroundColor: COLORS.white,
borderRadius: 18,
padding: 18,
marginTop: 25,
},

errorTitle: {
color: COLORS.red,
fontSize: 15,
fontWeight: '900',
},

errorText: {
color: COLORS.muted,
fontSize: 11,
lineHeight: 17,
marginTop: 6,
},

retryButton: {
backgroundColor: COLORS.teal,
borderRadius: 13,
alignSelf: 'flex-start',
paddingHorizontal: 16,
paddingVertical: 10,
marginTop: 13,
},

retryButtonText: {
color: COLORS.white,
fontSize: 11,
fontWeight: '900',
},
});