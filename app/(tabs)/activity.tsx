import {
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  FileText,
  Filter,
  Search,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getUserContributions,
  type Contribution,
} from '../../src/services/api';
import {
  getToken,
  getUser,
} from '../../src/services/session';

const COLORS = {
  ink: '#132B2A',
  teal: '#2F7467',
  mint: '#B7E4D8',
  pale: '#EAF6F1',
  paper: '#F7FBF9',
  line: '#DCEBE6',
  white: '#FFFFFF',
  muted: '#78908E',
  amber: '#B66F22',
  red: '#C65A4D',
};

export default function ActivityScreen() {
  const [records, setRecords] = useState<Contribution[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContributions();
  }, []);

  const loadContributions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        setError('Please log in again.');
        return;
      }

      const data = await getUserContributions(
        token,
        user.id
      );

      setRecords(data);
    } catch (err) {
      console.error(
        'Failed to load contributions:',
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          'Unable to load contribution history.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return records;
    }

    return records.filter((record) => {
      return (
        record.contributorName
          .toLowerCase()
          .includes(search) ||
        record.paymentMethod
          .toLowerCase()
          .includes(search) ||
        record.paymentStatus
          .toLowerCase()
          .includes(search) ||
        String(record.amount).includes(search)
      );
    });
  }, [records, searchText]);

  const totalContributed = useMemo(() => {
    return records
      .filter(
        (record) =>
          record.paymentStatus === 'SUCCESS' ||
          record.verificationStatus === 'VERIFIED'
      )
      .reduce(
        (total, record) =>
          total + Number(record.amount || 0),
        0
      );
  }, [records]);

  const formatAmount = (amount: number) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'Date unavailable';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMethodLabel = (
    method: Contribution['paymentMethod']
  ) => {
    switch (method) {
      case 'GOOGLE_PAY':
        return 'Google Pay';

      case 'PHONEPE':
        return 'PhonePe';

      case 'UPI':
        return 'UPI';

      case 'CASH':
        return 'Cash';

      case 'ONLINE':
        return 'Online';

      default:
        return method;
    }
  };

  const getStatusContent = (
    record: Contribution
  ) => {
    if (
      record.verificationStatus === 'VERIFIED' ||
      record.paymentStatus === 'SUCCESS'
    ) {
      return {
        label: 'Payment successful',
        type: 'success' as const,
      };
    }

    if (
      record.verificationStatus === 'REJECTED' ||
      record.paymentStatus === 'REJECTED' ||
      record.paymentStatus === 'FAILED'
    ) {
      return {
        label: 'Payment rejected',
        type: 'error' as const,
      };
    }

    return {
      label: 'Payment pending',
      type: 'pending' as const,
    };
  };

  const getStatusIcon = (
    type: 'success' | 'error' | 'pending'
  ) => {
    if (type === 'success') {
      return (
        <CircleCheck
          size={12}
          color={COLORS.teal}
        />
      );
    }

    if (type === 'error') {
      return (
        <CircleX
          size={12}
          color={COLORS.red}
        />
      );
    }

    return (
      <Clock3
        size={12}
        color={COLORS.amber}
      />
    );
  };

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          YOUR RECORDS
        </Text>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>
              Activity
            </Text>

            <Text style={styles.subtitle}>
              Your contributions and receipts
            </Text>
          </View>

          <Pressable style={styles.filter}>
            <Filter
              size={17}
              color={COLORS.ink}
            />
          </Pressable>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>
              TOTAL CONTRIBUTED
            </Text>

            <Text style={styles.summaryValue}>
              {formatAmount(totalContributed)}
            </Text>
          </View>

          <View style={styles.summarySide}>
            <Text style={styles.summaryLabel}>
              RECORDS
            </Text>

            <Text style={styles.summaryPositive}>
              {records.length}
            </Text>
          </View>
        </View>

        <View style={styles.search}>
          <Search
            size={17}
            color={COLORS.muted}
          />

          <TextInput
            placeholder="Search contributions"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="small"
              color={COLORS.teal}
            />

            <Text style={styles.stateText}>
              Loading your contributions...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              Unable to load activity
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <Pressable
              style={styles.retryButton}
              onPress={loadContributions}
            >
              <Text style={styles.retryText}>
                TRY AGAIN
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>
              2026 · {filteredRecords.length}{' '}
              {filteredRecords.length === 1
                ? 'contribution'
                : 'contributions'}
            </Text>

            {filteredRecords.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <FileText
                    size={21}
                    color={COLORS.teal}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No contributions yet
                </Text>

                <Text style={styles.emptyText}>
                  Your contribution history will
                  appear here after you make a
                  contribution.
                </Text>
              </View>
            ) : (
              filteredRecords.map((record) => {
                const status =
                  getStatusContent(record);

                return (
                  <View
                    style={styles.record}
                    key={record.id}
                  >
                    <View style={styles.recordIcon}>
                      <FileText
                        size={18}
                        color={COLORS.teal}
                      />
                    </View>

                    <View style={styles.recordInfo}>
                      <Text
                        style={styles.recordTitle}
                        numberOfLines={1}
                      >
                        {record.contributorName}
                      </Text>

                      <Text style={styles.recordMeta}>
                        {formatDate(record.createdAt)}
                        {' · '}
                        {getMethodLabel(
                          record.paymentMethod
                        )}
                      </Text>

                      <View style={styles.paid}>
                        {getStatusIcon(
                          status.type
                        )}

                        <Text
                          style={[
                            styles.paidText,
                            status.type ===
                              'error' &&
                              styles.errorStatusText,
                            status.type ===
                              'pending' &&
                              styles.pendingStatusText,
                          ]}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.recordRight}>
                      <Text style={styles.recordAmount}>
                        {formatAmount(
                          Number(record.amount)
                        )}
                      </Text>

                      <ChevronRight
                        size={17}
                        color={COLORS.muted}
                      />
                    </View>
                  </View>
                );
              })
            )}
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
    paddingBottom: 35,
  },

  eyebrow: {
    color: COLORS.teal,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '900',
    marginTop: 12,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 21,
  },

  title: {
    color: COLORS.ink,
    fontSize: 31,
    fontWeight: '900',
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },

  filter: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.white,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  summary: {
    backgroundColor: COLORS.ink,
    borderRadius: 22,
    padding: 19,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    color: '#99B3AE',
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: '900',
  },

  summaryValue: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 7,
  },

  summarySide: {
    borderLeftWidth: 1,
    borderLeftColor: '#385552',
    paddingLeft: 23,
  },

  summaryPositive: {
    color: COLORS.mint,
    fontWeight: '900',
    fontSize: 19,
    marginTop: 7,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 13,
    height: 48,
    marginTop: 17,
  },

  searchInput: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 12,
  },

  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 25,
    marginBottom: 10,
  },

  record: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  recordIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.pale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  recordInfo: {
    flex: 1,
  },

  recordTitle: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  recordMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  paid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
  },

  paidText: {
    color: COLORS.teal,
    fontSize: 9,
    fontWeight: '800',
  },

  pendingStatusText: {
    color: COLORS.amber,
  },

  errorStatusText: {
    color: COLORS.red,
  },

  recordRight: {
    alignItems: 'flex-end',
    gap: 7,
    marginLeft: 8,
  },

  recordAmount: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '900',
  },

  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  stateText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 10,
  },

  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    marginTop: 25,
    alignItems: 'center',
  },

  errorTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: '900',
  },

  errorText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 17,
  },

  retryButton: {
    backgroundColor: COLORS.ink,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 15,
  },

  retryText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 12,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 6,
  },
});

