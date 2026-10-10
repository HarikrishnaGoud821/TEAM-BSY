import React, {
useCallback,
useEffect,
useMemo,
useState,
} from 'react';

import {
ActivityIndicator,
Alert,
Modal,
Platform,
Pressable,
ScrollView,
StyleSheet,
Text,
TextInput,
View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
ArrowLeft,
CheckCircle2,
Edit3,
RefreshCw,
X,
XCircle,
} from 'lucide-react-native';

import { useRouter } from 'expo-router';

import {
Contribution as ApiContribution,
editAdminContribution,
getAdminContributions,
verifyAdminContribution,
rejectAdminContribution,
} from '@/src/services/api';

import {
getToken,
getUser,
} from '@/src/services/session';

/* =========================================================
TYPES
========================================================= */

type ContributionStatus =
| 'PENDING'
| 'VERIFIED'
| 'FAILED';

type FilterStatus =
| 'ALL'
| ContributionStatus;

type EditPaymentStatus =
| 'PENDING'
| 'SUCCESS'
| 'FAILED'
| 'REJECTED';

/* =========================================================
COLORS
========================================================= */

const COLORS = {
background: '#FFF9F4',
white: '#FFFFFF',

ink: '#33231A',

orange: '#D9773F',
orangeDark: '#B85C28',
orangeLight: '#FFE4D1',

muted: '#8C7566',
border: '#F2C7A9',

green: '#2F8F5B',
greenLight: '#E4F5EB',

yellow: '#A66B00',
yellowLight: '#FFF3D6',

red: '#B84A4A',
redLight: '#FBE7E7',
};

/* =========================================================
HELPER FUNCTIONS
========================================================= */

function getUiStatus(
item: ApiContribution
): ContributionStatus {

const verification =
String(
item.verificationStatus || ''
).toUpperCase();

const payment =
String(
item.paymentStatus || ''
).toUpperCase();

if (
verification === 'VERIFIED' ||
payment === 'SUCCESS' ||
payment === 'COMPLETED'
) {
return 'VERIFIED';
}

if (
verification === 'REJECTED' ||
payment === 'REJECTED' ||
payment === 'FAILED'
) {
return 'FAILED';
}

return 'PENDING';
}

function formatAmount(
amount: number
): string {

return `₹${Number(
    amount || 0
  ).toLocaleString(
    'en-IN'
  )}`;
}

function formatDate(
value?: string
): string {

if (!value) {
return 'Date unavailable';
}

const date =
new Date(value);

if (
Number.isNaN(
date.getTime()
)
) {
return value;
}

return date.toLocaleDateString(
'en-IN',
{
day: '2-digit',
month: 'short',
year: 'numeric',
}
);
}

function getMethodLabel(
method?: string
): string {

const value =
String(
method || ''
).toUpperCase();

switch (value) {


case 'QR':
case 'UPI':
  return 'QR / UPI Payment';

case 'DIRECT':
case 'ONLINE':
  return 'Direct Online Payment';

case 'CASH':
case 'OFFLINE':
  return 'Offline / Cash';

case 'PHONEPE':
  return 'PhonePe';

case 'GOOGLE_PAY':
case 'GPAY':
  return 'Google Pay';

case 'RAZORPAY':
  return 'Razorpay';

case 'BANK':
case 'BANK_TRANSFER':
  return 'Bank Transfer';

default:
  return value || 'Unknown';


}
}

function isOfflineContribution(
item: ApiContribution
): boolean {

const method =
String(
item.paymentMethod || ''
).toUpperCase();

return (
method === 'CASH' ||
method === 'OFFLINE'
);
}

function getStatusStyles(
status: ContributionStatus
) {

switch (status) {


case 'VERIFIED':
  return {
    background:
      COLORS.greenLight,
    text:
      COLORS.green,
  };

case 'PENDING':
  return {
    background:
      COLORS.yellowLight,
    text:
      COLORS.yellow,
  };

case 'FAILED':
  return {
    background:
      COLORS.redLight,
    text:
      COLORS.red,
  };


}
}

/* =========================================================
SCREEN
========================================================= */

export default function AdminContributionsScreen() {

const router =
useRouter();

const [
contributions,
setContributions,
] =
useState<ApiContribution[]>(
[]
);

const [
filter,
setFilter,
] =
useState<FilterStatus>(
'ALL'
);

const [
loading,
setLoading,
] =
useState(true);

const [
refreshing,
setRefreshing,
] =
useState(false);

const [
processingId,
setProcessingId,
] =
useState<number | null>(
null
);

const [
error,
setError,
] =
useState<string | null>(
null
);

/* =======================================================
EDIT STATE
======================================================= */

const [
editModalVisible,
setEditModalVisible,
] =
useState(false);

const [
editingContribution,
setEditingContribution,
] =
useState<ApiContribution | null>(
null
);

const [
editName,
setEditName,
] =
useState('');

const [
editMobile,
setEditMobile,
] =
useState('');

const [
editAmount,
setEditAmount,
] =
useState('');

const [
editTransactionId,
setEditTransactionId,
] =
useState('');

const [
editNotes,
setEditNotes,
] =
useState('');

const [
editPaymentStatus,
setEditPaymentStatus,
] =
useState<EditPaymentStatus>(
'PENDING'
);

const [
editSaving,
setEditSaving,
] =
useState(false);

/* =======================================================
MESSAGE
======================================================= */

const showMessage =
useCallback(
(
title: string,
message: string
) => {


    if (
      Platform.OS === 'web'
    ) {

      window.alert(
        `${title}\n\n${message}`
      );

    } else {

      Alert.alert(
        title,
        message
      );
    }
  },
  []
);


/* =======================================================
LOAD CONTRIBUTIONS
======================================================= */

const loadContributions =
useCallback(
async (
showRefreshLoader = false
) => {


    try {

      if (
        showRefreshLoader
      ) {

        setRefreshing(
          true
        );

      } else {

        setLoading(
          true
        );
      }

      setError(
        null
      );

      const token =
        await getToken();

      if (!token) {

        router.replace(
          '/login'
        );

        return;
      }

      const user =
        await getUser();

      if (
        user &&
        String(
          user.role
        ).toUpperCase() !==
          'ADMIN'
      ) {

        showMessage(
          'Access denied',
          'Only an ADMIN can access contributions.'
        );

        router.replace(
          '/login'
        );

        return;
      }

      const data =
        await getAdminContributions(
          token
        );

      setContributions(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        'ADMIN CONTRIBUTIONS LOAD ERROR:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load contributions.';

      setError(
        message
      );

    } finally {

      setLoading(
        false
      );

      setRefreshing(
        false
      );
    }

  },
  [
    router,
    showMessage,
  ]
);


/* =======================================================
INITIAL LOAD
======================================================= */

useEffect(
() => {
void loadContributions();
},
[
loadContributions,
]
);

/* =======================================================
FILTERED CONTRIBUTIONS
======================================================= */
const filteredContributions =
useMemo(
  () => {

    if (
      filter === 'ALL'
    ) {
      return contributions;
    }

    return contributions.filter(
      (item) =>
        getUiStatus(item) ===
        filter
    );

  },
  [
    contributions,
    filter,
  ]
);

/* =======================================================
SUMMARY
======================================================= */

const totalAmount =
useMemo(
() =>
contributions
.filter(
(item) =>
getUiStatus(item) ===
'VERIFIED'
)
.reduce(
(
sum,
item
) =>
sum +
Number(
item.amount || 0
),
0
),
[
contributions,
]
);

const pendingAmount =
useMemo(
() =>
contributions
.filter(
(item) =>
getUiStatus(item) ===
'PENDING'
)
.reduce(
(
sum,
item
) =>
sum +
Number(
item.amount || 0
),
0
),
[
contributions,
]
);

const verifiedCount =
useMemo(
() =>
contributions.filter(
(item) =>
getUiStatus(item) ===
'VERIFIED'
).length,
[
contributions,
]
);

const pendingCount =
useMemo(
() =>
contributions.filter(
(item) =>
getUiStatus(item) ===
'PENDING'
).length,
[
contributions,
]
);

const failedCount =
useMemo(
() =>
contributions.filter(
(item) =>
getUiStatus(item) ===
'FAILED'
).length,
[
contributions,
]
);

/* =======================================================
OPEN EDIT MODAL
======================================================= */

const openEditModal =
useCallback(
(
item: ApiContribution
) => {


    if (
      !isOfflineContribution(
        item
      )
    ) {

      showMessage(
        'Editing not allowed',
        'Only Offline / Cash contributions can be edited manually.'
      );

      return;
    }

    setEditingContribution(
      item
    );

    setEditName(
      item.contributorName ||
      ''
    );

    setEditMobile(
      item.mobileNumber ||
      ''
    );

    setEditAmount(
      String(
        item.amount ?? ''
      )
    );

    setEditTransactionId(
      item.transactionId ||
      ''
    );

    setEditNotes(
      item.notes ||
      ''
    );

    const paymentStatus =
      String(
        item.paymentStatus ||
        'PENDING'
      ).toUpperCase();

    if (
      paymentStatus ===
        'SUCCESS' ||
      paymentStatus ===
        'FAILED' ||
      paymentStatus ===
        'REJECTED' ||
      paymentStatus ===
        'PENDING'
    ) {

      setEditPaymentStatus(
        paymentStatus as EditPaymentStatus
      );

    } else {

      setEditPaymentStatus(
        'PENDING'
      );
    }

    setEditModalVisible(
      true
    );
  },
  [
    showMessage,
  ]
);


/* =======================================================
CLOSE EDIT MODAL
======================================================= */

const closeEditModal =
useCallback(
() => {


    if (
      editSaving
    ) {
      return;
    }

    setEditModalVisible(
      false
    );

    setEditingContribution(
      null
    );

  },
  [
    editSaving,
  ]
);


/* =======================================================
SAVE EDIT
======================================================= */

const saveEditedContribution =
useCallback(
async () => {

    if (
      !editingContribution
    ) {
      return;
    }

    if (
      !editName.trim()
    ) {

      showMessage(
        'Invalid details',
        'Full Name is required.'
      );

      return;
    }

    if (
      !editAmount.trim()
    ) {

      showMessage(
        'Invalid amount',
        'Contribution amount is required.'
      );

      return;
    }

    const numericAmount =
      Number(
        editAmount
      );

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {

      showMessage(
        'Invalid amount',
        'Please enter a valid amount greater than ₹0.'
      );

      return;
    }

    try {

      setEditSaving(
        true
      );

      const token =
        await getToken();

      const user =
        await getUser();

      if (
        !token ||
        !user
      ) {

        router.replace(
          '/login'
        );

        return;
      }

      if (
        String(
          user.role
        ).toUpperCase() !==
          'ADMIN'
      ) {

        showMessage(
          'Access denied',
          'Only an ADMIN can edit contributions.'
        );

        return;
      }

      const updated =
        await editAdminContribution(
          token,
          editingContribution.id,
          user.id,
          {
            contributorName:
              editName.trim(),

            mobileNumber:
              editMobile.trim() ||
              undefined,

            amount:
              numericAmount,

            transactionId:
              editTransactionId.trim() ||
              null,

            notes:
              editNotes.trim(),

            paymentStatus:
              editPaymentStatus,
          }
        );

      setContributions(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              editingContribution.id
                ? updated
                : item
          )
      );

      setEditModalVisible(
        false
      );

      setEditingContribution(
        null
      );

      showMessage(
        'Payment updated',
        'The offline contribution details were updated successfully.'
      );

    } catch (err) {

      console.error(
        'EDIT CONTRIBUTION ERROR:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to update contribution.';

      showMessage(
        'Update failed',
        message
      );

    } finally {

      setEditSaving(
        false
      );
    }

  },
  [
    editingContribution,
    editName,
    editMobile,
    editAmount,
    editTransactionId,
    editNotes,
    editPaymentStatus,
    router,
    showMessage,
  ]
);


/* =======================================================
VERIFY
======================================================= */

const performVerify =
useCallback(
async (
id: number
) => {


    try {

      setProcessingId(
        id
      );

      const token =
        await getToken();

      const user =
        await getUser();

      if (
        !token ||
        !user
      ) {

        router.replace(
          '/login'
        );

        return;
      }

      if (
        String(
          user.role
        ).toUpperCase() !==
          'ADMIN'
      ) {

        showMessage(
          'Access denied',
          'Only an ADMIN can verify contributions.'
        );

        return;
      }

      const updated =
        await verifyAdminContribution(
          token,
          id,
          user.id
        );

      setContributions(
        (current) =>
          current.map(
            (item) =>
              item.id === id
                ? updated
                : item
          )
      );

      showMessage(
        'Contribution verified',
        'The contribution has been successfully verified.'
      );

    } catch (err) {

      console.error(
        'VERIFY CONTRIBUTION ERROR:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to verify contribution.';

      showMessage(
        'Verification failed',
        message
      );

    } finally {

      setProcessingId(
        null
      );
    }

  },
  [
    router,
    showMessage,
  ]
);


/* =======================================================
VERIFY CONFIRMATION
======================================================= */

const verifyContribution =
useCallback(
(
id: number
) => {


    if (
      processingId !== null
    ) {
      return;
    }

    if (
      Platform.OS === 'web'
    ) {

      const confirmed =
        window.confirm(
          'Are you sure you want to verify this contribution?'
        );

      if (
        confirmed
      ) {

        void performVerify(
          id
        );
      }

      return;
    }

    Alert.alert(
      'Verify Contribution',
      'Are you sure you want to verify this contribution?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Verify',
          onPress: () =>
            void performVerify(
              id
            ),
        },
      ]
    );
  },
  [
    performVerify,
    processingId,
  ]
);


/* =======================================================
REJECT
======================================================= */

const performReject =
useCallback(
async (
id: number
) => {


    try {

      setProcessingId(
        id
      );

      const token =
        await getToken();

      const user =
        await getUser();

      if (
        !token ||
        !user
      ) {

        router.replace(
          '/login'
        );

        return;
      }

      if (
        String(
          user.role
        ).toUpperCase() !==
          'ADMIN'
      ) {

        showMessage(
          'Access denied',
          'Only an ADMIN can reject contributions.'
        );

        return;
      }

      const updated =
        await rejectAdminContribution(
          token,
          id,
          user.id
        );

      setContributions(
        (current) =>
          current.map(
            (item) =>
              item.id === id
                ? updated
                : item
          )
      );

      showMessage(
        'Contribution rejected',
        'The contribution has been rejected successfully.'
      );

    } catch (err) {

      console.error(
        'REJECT CONTRIBUTION ERROR:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to reject contribution.';

      showMessage(
        'Rejection failed',
        message
      );

    } finally {

      setProcessingId(
        null
      );
    }

  },
  [
    router,
    showMessage,
  ]
);


/* =======================================================
REJECT CONFIRMATION
======================================================= */

const rejectContribution =
useCallback(
(
id: number
) => {


    if (
      processingId !== null
    ) {
      return;
    }

    if (
      Platform.OS === 'web'
    ) {

      const confirmed =
        window.confirm(
          'Are you sure you want to reject this contribution?'
        );

      if (
        confirmed
      ) {

        void performReject(
          id
        );
      }

      return;
    }

    Alert.alert(
      'Reject Contribution',
      'Are you sure you want to reject this contribution?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () =>
            void performReject(
              id
            ),
        },
      ]
    );
  },
  [
    performReject,
    processingId,
  ]
);


/* =======================================================
LOADING SCREEN
======================================================= */

if (
loading
) {


return (
  <SafeAreaView
    style={styles.safe}
  >

    <View
      style={
        styles.loadingContainer
      }
    >

      <ActivityIndicator
        size="large"
        color={
          COLORS.orange
        }
      />

      <Text
        style={
          styles.loadingTitle
        }
      >
        Loading contributions...
      </Text>

      <Text
        style={
          styles.loadingText
        }
      >
        Connecting to TEAM BSY server
      </Text>

    </View>

  </SafeAreaView>
);


}

/* =======================================================
MAIN SCREEN
======================================================= */

return ( <SafeAreaView
   style={styles.safe}
 >


  <ScrollView
    contentContainerStyle={
      styles.scrollContent
    }
    showsVerticalScrollIndicator={
      false
    }
  >

    {/* =================================================
        HEADER
    ================================================= */}

    <View
      style={styles.header}
    >

      <Pressable
        style={
          styles.backButton
        }
        onPress={() =>
          router.back()
        }
      >

        <ArrowLeft
          size={20}
          color={COLORS.ink}
        />

      </Pressable>

      <View
        style={styles.headerText}
      >

        <Text
          style={styles.eyebrow}
        >
          ADMIN MODULE
        </Text>

        <Text
          style={styles.title}
        >
          Contributions
        </Text>

        <Text
          style={styles.subtitle}
        >
          Review, verify and manage
          TEAM BSY contributions.
        </Text>

      </View>

      <Pressable
        style={
          styles.refreshButton
        }
        onPress={() =>
          void loadContributions(
            true
          )
        }
        disabled={
          refreshing
        }
      >

        {refreshing ? (

          <ActivityIndicator
            size="small"
            color={
              COLORS.orange
            }
          />

        ) : (

          <RefreshCw
            size={19}
            color={
              COLORS.orange
            }
          />

        )}

      </Pressable>

    </View>


    {/* =================================================
        ERROR
    ================================================= */}

    {error && (

      <View
        style={
          styles.errorCard
        }
      >

        <Text
          style={
            styles.errorTitle
          }
        >
          Unable to load contributions
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

        <Pressable
          style={
            styles.retryButton
          }
          onPress={() =>
            void loadContributions()
          }
        >

          <Text
            style={
              styles.retryText
            }
          >
            Try Again
          </Text>

        </Pressable>

      </View>

    )}


    {/* =================================================
        SUMMARY
    ================================================= */}

    <View
      style={styles.summaryGrid}
    >

      <View
        style={styles.summaryCard}
      >

        <Text
          style={
            styles.summaryLabel
          }
        >
          VERIFIED COLLECTION
        </Text>

        <Text
          style={
            styles.summaryAmount
          }
        >
          {formatAmount(
            totalAmount
          )}
        </Text>

        <Text
          style={
            styles.summarySmall
          }
        >
          {verifiedCount} verified
        </Text>

      </View>


      <View
        style={styles.summaryCard}
      >

        <Text
          style={
            styles.summaryLabel
          }
        >
          PENDING
        </Text>

        <Text
          style={[
            styles.summaryAmount,
            {
              color:
                COLORS.yellow,
            },
          ]}
        >
          {formatAmount(
            pendingAmount
          )}
        </Text>

        <Text
          style={
            styles.summarySmall
          }
        >
          {pendingCount} waiting
        </Text>

      </View>


      <View
        style={styles.summaryCard}
      >

        <Text
          style={
            styles.summaryLabel
          }
        >
          TOTAL RECORDS
        </Text>

        <Text
          style={
            styles.summaryAmount
          }
        >
          {contributions.length}
        </Text>

        <Text
          style={
            styles.summarySmall
          }
        >
          All contribution entries
        </Text>

      </View>


      <View
        style={styles.summaryCard}
      >

        <Text
          style={
            styles.summaryLabel
          }
        >
          FAILED / REJECTED
        </Text>

        <Text
          style={[
            styles.summaryAmount,
            {
              color:
                COLORS.red,
            },
          ]}
        >
          {failedCount}
        </Text>

        <Text
          style={
            styles.summarySmall
          }
        >
          Rejected / failed
        </Text>

      </View>

    </View>


    {/* =================================================
        ACTIVITY
    ================================================= */}

    <View
      style={styles.sectionHeader}
    >

      <View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Contribution Activity
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          Real contribution records from
          the TEAM BSY database.
        </Text>

      </View>

    </View>


    {/* =================================================
        FILTERS
    ================================================= */}

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={
        false
      }
      contentContainerStyle={
        styles.filters
      }
    >

      {[
        ['ALL', 'All'],
        ['PENDING', 'Pending'],
        ['VERIFIED', 'Verified'],
        ['FAILED', 'Failed'],
      ].map(
        (
          [value, label]
        ) => {

          const active =
            filter === value;

          return (

            <Pressable
              key={value}
              style={[
                styles.filterButton,
                active &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setFilter(
                  value as FilterStatus
                )
              }
            >

              <Text
                style={[
                  styles.filterText,
                  active &&
                    styles.filterTextActive,
                ]}
              >
                {label}
              </Text>

            </Pressable>

          );
        }
      )}

    </ScrollView>


    {/* =================================================
        CONTRIBUTION LIST
    ================================================= */}

    <View
      style={styles.list}
    >

      {filteredContributions.map(
        (
          item
        ) => {

          const status =
            getUiStatus(
              item
            );

          const statusStyle =
            getStatusStyles(
              status
            );

          const isProcessing =
            processingId ===
            item.id;

          const canEdit =
            isOfflineContribution(
              item
            );

          return (

            <View
              key={item.id}
              style={
                styles.contributionCard
              }
            >

              {/* PERSON */}

              <View
                style={styles.cardTop}
              >

                <View
                  style={styles.person}
                >

                  <View
                    style={
                      styles.avatar
                    }
                  >

                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {(
                        item.contributorName ||
                        '?'
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </Text>

                  </View>


                  <View
                    style={
                      styles.personInfo
                    }
                  >

                    <Text
                      style={
                        styles.personName
                      }
                    >
                      {item.contributorName ||
                        'Unknown contributor'}
                    </Text>

                    <Text
                      style={
                        styles.mobile
                      }
                    >
                      {item.mobileNumber ||
                        'Mobile number unavailable'}
                    </Text>

                  </View>

                </View>


                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        statusStyle.background,
                    },
                  ]}
                >

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          statusStyle.text,
                      },
                    ]}
                  >
                    {status}
                  </Text>

                </View>

              </View>


              {/* AMOUNT */}

              <View
                style={
                  styles.amountRow
                }
              >

                <Text
                  style={
                    styles.amount
                  }
                >
                  {formatAmount(
                    Number(
                      item.amount ||
                        0
                    )
                  )}
                </Text>

                <Text
                  style={styles.date}
                >
                  {formatDate(
                    item.createdAt
                  )}
                </Text>

              </View>


              {/* DETAILS */}

              <View
                style={styles.details}
              >

                <View
                  style={
                    styles.detailItem
                  }
                >

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    PAYMENT
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {getMethodLabel(
                      item.paymentMethod
                    )}
                  </Text>

                </View>


                <View
                  style={
                    styles.detailItem
                  }
                >

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    PAYMENT STATUS
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {item.paymentStatus ||
                      'UNKNOWN'}
                  </Text>

                </View>

              </View>


              {/* TRANSACTION ID */}

              {item.transactionId && (

                <View
                  style={
                    styles.transactionBox
                  }
                >

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    TRANSACTION ID
                  </Text>

                  <Text
                    style={
                      styles.transactionText
                    }
                  >
                    {item.transactionId}
                  </Text>

                </View>

              )}


              {/* NOTES */}

              {item.notes && (

                <View
                  style={
                    styles.notesBox
                  }
                >

                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    NOTES
                  </Text>

                  <Text
                    style={
                      styles.notesText
                    }
                  >
                    {item.notes}
                  </Text>

                </View>

              )}


              {/* =================================================
                  OFFLINE EDIT BUTTON
              ================================================= */}

              {canEdit && (

                <Pressable
                  style={[
                    styles.editButton,
                    isProcessing &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    openEditModal(
                      item
                    )
                  }
                  disabled={
                    isProcessing ||
                    editSaving
                  }
                >

                  <Edit3
                    size={16}
                    color={
                      COLORS.orangeDark
                    }
                  />

                  <Text
                    style={
                      styles.editButtonText
                    }
                  >
                    Edit Offline Payment
                  </Text>

                </Pressable>

              )}


              {/* =================================================
                  ACTIONS
              ================================================= */}

              {status ===
                'PENDING' && (

                <View
                  style={
                    styles.actions
                  }
                >

                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.verifyButton,
                      isProcessing &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      verifyContribution(
                        item.id
                      )
                    }
                    disabled={
                      isProcessing
                    }
                  >

                    {isProcessing ? (

                      <ActivityIndicator
                        size="small"
                        color={
                          COLORS.white
                        }
                      />

                    ) : (

                      <CheckCircle2
                        size={17}
                        color={
                          COLORS.white
                        }
                      />

                    )}

                    <Text
                      style={
                        styles.verifyButtonText
                      }
                    >
                      {isProcessing
                        ? 'Processing...'
                        : 'Verify'}
                    </Text>

                  </Pressable>


                  <Pressable
                    style={[
                      styles.actionButton,
                      styles.rejectButton,
                      isProcessing &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      rejectContribution(
                        item.id
                      )
                    }
                    disabled={
                      isProcessing
                    }
                  >

                    <XCircle
                      size={17}
                      color={
                        COLORS.red
                      }
                    />

                    <Text
                      style={
                        styles.rejectButtonText
                      }
                    >
                      Reject
                    </Text>

                  </Pressable>

                </View>

              )}


              {/* VERIFIED */}

              {status ===
                'VERIFIED' && (

                <View
                  style={
                    styles.verifiedRow
                  }
                >

                  <CheckCircle2
                    size={17}
                    color={
                      COLORS.green
                    }
                  />

                  <Text
                    style={
                      styles.verifiedText
                    }
                  >
                    Contribution verified
                  </Text>

                </View>

              )}


              {/* FAILED */}

              {status ===
                'FAILED' && (

                <View
                  style={
                    styles.failedRow
                  }
                >

                  <XCircle
                    size={17}
                    color={
                      COLORS.red
                    }
                  />

                  <Text
                    style={
                      styles.failedText
                    }
                  >
                    Contribution rejected
                  </Text>

                </View>

              )}

            </View>

          );
        }
      )}


      {/* EMPTY */}

      {filteredContributions.length ===
        0 && (

        <View
          style={styles.empty}
        >

          <Text
            style={
              styles.emptyTitle
            }
          >
            No contributions found
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {contributions.length ===
            0
              ? 'There are no contribution records in the database yet.'
              : 'There are no records in this category.'}
          </Text>

        </View>

      )}

    </View>


    {/* =================================================
        DATABASE NOTICE
    ================================================= */}

    <View
      style={styles.notice}
    >

      <Text
        style={
          styles.noticeTitle
        }
      >
        Live database
      </Text>

      <Text
        style={styles.noticeText}
      >
        This screen is connected to the
        TEAM BSY Spring Boot API.
        Contribution records are loaded
        from the backend database.
        Offline / Cash records can be
        manually edited by ADMIN.
        Online and QR payments cannot
        have their payment status manually
        changed here.
      </Text>

    </View>


    {/* =================================================
        FOOTER
    ================================================= */}

    <Text
      style={styles.footer}
    >
      © 2026 TEAM BSY · Admin Contributions
    </Text>

  </ScrollView>


  {/* =====================================================
      EDIT PAYMENT MODAL
  ===================================================== */}

  <Modal
    visible={
      editModalVisible
    }
    transparent
    animationType="slide"
    onRequestClose={
      closeEditModal
    }
  >

    <View
      style={
        styles.modalOverlay
      }
    >

      <View
        style={
          styles.modalCard
        }
      >

        {/* MODAL HEADER */}

        <View
          style={
            styles.modalHeader
          }
        >

          <View
            style={
              styles.modalHeaderText
            }
          >

            <Text
              style={
                styles.modalEyebrow
              }
            >
              OFFLINE PAYMENT
            </Text>

            <Text
              style={
                styles.modalTitle
              }
            >
              Edit Contribution
            </Text>

            <Text
              style={
                styles.modalSubtitle
              }
            >
              ADMIN can manually correct
              offline / cash payment details.
            </Text>

          </View>


          <Pressable
            style={
              styles.closeButton
            }
            onPress={
              closeEditModal
            }
            disabled={
              editSaving
            }
          >

            <X
              size={20}
              color={
                COLORS.ink
              }
            />

          </Pressable>

        </View>


        <ScrollView
          style={
            styles.modalScroll
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >

          {/* NAME */}

          <Text
            style={
              styles.inputLabel
            }
          >
            FULL NAME
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              editName
            }
            onChangeText={
              setEditName
            }
            placeholder="Enter contributor name"
            placeholderTextColor={
              '#A89588'
            }
            editable={
              !editSaving
            }
          />


          {/* MOBILE */}

          <Text
            style={
              styles.inputLabel
            }
          >
            MOBILE NUMBER
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              editMobile
            }
            onChangeText={
              setEditMobile
            }
            placeholder="Enter mobile number"
            placeholderTextColor={
              '#A89588'
            }
            keyboardType="phone-pad"
            editable={
              !editSaving
            }
          />


          {/* AMOUNT */}

          <Text
            style={
              styles.inputLabel
            }
          >
            AMOUNT
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              editAmount
            }
            onChangeText={
              setEditAmount
            }
            placeholder="Enter amount"
            placeholderTextColor={
              '#A89588'
            }
            keyboardType="decimal-pad"
            editable={
              !editSaving
            }
          />


          {/* TRANSACTION ID */}

          <Text
            style={
              styles.inputLabel
            }
          >
            TRANSACTION ID
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              editTransactionId
            }
            onChangeText={
              setEditTransactionId
            }
            placeholder="Enter transaction ID"
            placeholderTextColor={
              '#A89588'
            }
            editable={
              !editSaving
            }
            autoCapitalize="characters"
          />


          {/* NOTES */}

          <Text
            style={
              styles.inputLabel
            }
          >
            NOTES
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.notesInput,
            ]}
            value={
              editNotes
            }
            onChangeText={
              setEditNotes
            }
            placeholder="Enter notes"
            placeholderTextColor={
              '#A89588'
            }
            editable={
              !editSaving
            }
            multiline
            textAlignVertical="top"
          />


          {/* PAYMENT STATUS */}

          <Text
            style={
              styles.inputLabel
            }
          >
            PAYMENT STATUS
          </Text>

          <View
            style={
              styles.statusOptions
            }
          >

            {[
              'PENDING',
              'SUCCESS',
              'FAILED',
              'REJECTED',
            ].map(
              (
                status
              ) => {

                const selected =
                  editPaymentStatus ===
                  status;

                return (

                  <Pressable
                    key={
                      status
                    }
                    style={[
                      styles.statusOption,
                      selected &&
                        styles.statusOptionSelected,
                    ]}
                    onPress={() =>
                      setEditPaymentStatus(
                        status as EditPaymentStatus
                      )
                    }
                    disabled={
                      editSaving
                    }
                  >

                    <Text
                      style={[
                        styles.statusOptionText,
                        selected &&
                          styles.statusOptionTextSelected,
                      ]}
                    >
                      {status}
                    </Text>

                  </Pressable>

                );
              }
            )}

          </View>


          {/* WARNING */}

          <View
            style={
              styles.editWarning
            }
          >

            <Text
              style={
                styles.editWarningTitle
              }
            >
              Offline payment only
            </Text>

            <Text
              style={
                styles.editWarningText
              }
            >
              These manual editing controls are
              intended only for cash / offline
              contributions. QR, UPI and online
              payment records are not editable
              from this screen.
            </Text>

          </View>

        </ScrollView>


        {/* MODAL ACTIONS */}

        <View
          style={
            styles.modalActions
          }
        >

          <Pressable
            style={
              styles.cancelButton
            }
            onPress={
              closeEditModal
            }
            disabled={
              editSaving
            }
          >

            <Text
              style={
                styles.cancelButtonText
              }
            >
              Cancel
            </Text>

          </Pressable>


          <Pressable
            style={[
              styles.saveButton,
              editSaving &&
                styles.disabledButton,
            ]}
            onPress={() =>
              void saveEditedContribution()
            }
            disabled={
              editSaving
            }
          >

            {editSaving ? (

              <ActivityIndicator
                size="small"
                color={
                  COLORS.white
                }
              />

            ) : (

              <Edit3
                size={17}
                color={
                  COLORS.white
                }
              />

            )}

            <Text
              style={
                styles.saveButtonText
              }
            >
              {editSaving
                ? 'Saving...'
                : 'Save Changes'}
            </Text>

          </Pressable>

        </View>

      </View>

    </View>

  </Modal>

</SafeAreaView>


);
}

/* =========================================================
STYLES
========================================================= */

const styles =
StyleSheet.create({


safe: {
  flex: 1,
  backgroundColor:
    COLORS.background,
},

scrollContent: {
  padding: 20,
  paddingBottom: 40,
},


/* HEADER */

header: {
  flexDirection:
    'row',
  alignItems:
    'flex-start',
  marginBottom: 24,
},

backButton: {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor:
    COLORS.white,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  alignItems:
    'center',
  justifyContent:
    'center',
  marginRight: 12,
},

headerText: {
  flex: 1,
},

eyebrow: {
  color:
    COLORS.orange,
  fontSize: 11,
  fontWeight: '900',
  letterSpacing: 1.2,
  marginBottom: 4,
},

title: {
  color:
    COLORS.ink,
  fontSize: 30,
  fontWeight: '900',
},

subtitle: {
  color:
    COLORS.muted,
  fontSize: 13,
  lineHeight: 19,
  marginTop: 5,
},

refreshButton: {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor:
    COLORS.white,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  alignItems:
    'center',
  justifyContent:
    'center',
  marginLeft: 8,
},


/* LOADING */

loadingContainer: {
  flex: 1,
  alignItems:
    'center',
  justifyContent:
    'center',
  padding: 30,
},

loadingTitle: {
  color:
    COLORS.ink,
  fontSize: 18,
  fontWeight: '900',
  marginTop: 16,
},

loadingText: {
  color:
    COLORS.muted,
  fontSize: 12,
  marginTop: 6,
},


/* ERROR */

errorCard: {
  backgroundColor:
    COLORS.redLight,
  borderWidth: 1,
  borderColor:
    '#F2CACA',
  borderRadius: 18,
  padding: 17,
  marginBottom: 18,
},

errorTitle: {
  color:
    COLORS.red,
  fontSize: 14,
  fontWeight: '900',
},

errorText: {
  color:
    COLORS.red,
  fontSize: 11,
  lineHeight: 17,
  marginTop: 6,
},

retryButton: {
  alignSelf:
    'flex-start',
  marginTop: 12,
  paddingHorizontal: 16,
  paddingVertical: 9,
  borderRadius: 10,
  backgroundColor:
    COLORS.red,
},

retryText: {
  color:
    COLORS.white,
  fontSize: 11,
  fontWeight: '900',
},


/* SUMMARY */

summaryGrid: {
  flexDirection:
    'row',
  flexWrap:
    'wrap',
  gap: 12,
  marginBottom: 30,
},

summaryCard: {
  width: '48%',
  minHeight: 118,
  backgroundColor:
    COLORS.white,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  borderRadius: 18,
  padding: 16,
  justifyContent:
    'space-between',
},

summaryLabel: {
  color:
    COLORS.muted,
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
},

summaryAmount: {
  color:
    COLORS.ink,
  fontSize: 25,
  fontWeight: '900',
  marginTop: 8,
},

summarySmall: {
  color:
    COLORS.muted,
  fontSize: 11,
  marginTop: 4,
},


/* SECTION */

sectionHeader: {
  marginBottom: 14,
},

sectionTitle: {
  color:
    COLORS.ink,
  fontSize: 21,
  fontWeight: '900',
},

sectionSubtitle: {
  color:
    COLORS.muted,
  fontSize: 12,
  marginTop: 4,
},


/* FILTERS */

filters: {
  gap: 8,
  paddingBottom: 16,
},

filterButton: {
  paddingHorizontal: 18,
  paddingVertical: 10,
  borderRadius: 20,
  backgroundColor:
    COLORS.white,
  borderWidth: 1,
  borderColor:
    COLORS.border,
},

filterButtonActive: {
  backgroundColor:
    COLORS.orange,
  borderColor:
    COLORS.orange,
},

filterText: {
  color:
    COLORS.muted,
  fontSize: 12,
  fontWeight: '800',
},

filterTextActive: {
  color:
    COLORS.white,
},


/* LIST */

list: {
  gap: 14,
},

contributionCard: {
  backgroundColor:
    COLORS.white,
  borderRadius: 20,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  padding: 17,
},


/* PERSON */

cardTop: {
  flexDirection:
    'row',
  alignItems:
    'center',
  justifyContent:
    'space-between',
},

person: {
  flexDirection:
    'row',
  alignItems:
    'center',
  flex: 1,
},

avatar: {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor:
    COLORS.orangeLight,
  alignItems:
    'center',
  justifyContent:
    'center',
  marginRight: 11,
},

avatarText: {
  color:
    COLORS.orangeDark,
  fontSize: 17,
  fontWeight: '900',
},

personInfo: {
  flex: 1,
},

personName: {
  color:
    COLORS.ink,
  fontSize: 15,
  fontWeight: '900',
},

mobile: {
  color:
    COLORS.muted,
  fontSize: 11,
  marginTop: 3,
},


/* STATUS */

statusBadge: {
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 6,
},

statusText: {
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.6,
},


/* AMOUNT */

amountRow: {
  flexDirection:
    'row',
  alignItems:
    'center',
  justifyContent:
    'space-between',
  marginTop: 17,
  paddingTop: 14,
  borderTopWidth: 1,
  borderTopColor:
    '#F7E9DF',
},

amount: {
  color:
    COLORS.orangeDark,
  fontSize: 23,
  fontWeight: '900',
},

date: {
  color:
    COLORS.muted,
  fontSize: 11,
},


/* DETAILS */

details: {
  flexDirection:
    'row',
  marginTop: 14,
  gap: 30,
},

detailItem: {
  flex: 1,
},

detailLabel: {
  color:
    COLORS.muted,
  fontSize: 8,
  fontWeight: '900',
  letterSpacing: 0.8,
},

detailValue: {
  color:
    COLORS.ink,
  fontSize: 12,
  fontWeight: '700',
  marginTop: 4,
},


/* TRANSACTION */

transactionBox: {
  marginTop: 14,
  paddingTop: 13,
  borderTopWidth: 1,
  borderTopColor:
    '#F7E9DF',
},

transactionText: {
  color:
    COLORS.ink,
  fontSize: 11,
  fontWeight: '700',
  marginTop: 5,
},


/* NOTES */

notesBox: {
  marginTop: 12,
  padding: 11,
  borderRadius: 11,
  backgroundColor:
    COLORS.background,
},

notesText: {
  color:
    COLORS.muted,
  fontSize: 11,
  lineHeight: 17,
  marginTop: 5,
},


/* EDIT BUTTON */

editButton: {
  minHeight: 42,
  marginTop: 15,
  borderRadius: 12,
  backgroundColor:
    COLORS.orangeLight,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  alignItems:
    'center',
  justifyContent:
    'center',
  flexDirection:
    'row',
  gap: 7,
},

editButtonText: {
  color:
    COLORS.orangeDark,
  fontSize: 12,
  fontWeight: '900',
},


/* ACTIONS */

actions: {
  flexDirection:
    'row',
  gap: 9,
  marginTop: 10,
},

actionButton: {
  flex: 1,
  minHeight: 42,
  borderRadius: 12,
  alignItems:
    'center',
  justifyContent:
    'center',
  flexDirection:
    'row',
  gap: 7,
},

verifyButton: {
  backgroundColor:
    COLORS.orange,
},

verifyButtonText: {
  color:
    COLORS.white,
  fontSize: 12,
  fontWeight: '900',
},

rejectButton: {
  backgroundColor:
    COLORS.redLight,
  borderWidth: 1,
  borderColor:
    '#F2CACA',
},

rejectButtonText: {
  color:
    COLORS.red,
  fontSize: 12,
  fontWeight: '900',
},

disabledButton: {
  opacity: 0.65,
},


/* VERIFIED */

verifiedRow: {
  flexDirection:
    'row',
  alignItems:
    'center',
  gap: 7,
  marginTop: 16,
  paddingTop: 13,
  borderTopWidth: 1,
  borderTopColor:
    '#EDF5EF',
},

verifiedText: {
  color:
    COLORS.green,
  fontSize: 12,
  fontWeight: '800',
},


/* FAILED */

failedRow: {
  flexDirection:
    'row',
  alignItems:
    'center',
  gap: 7,
  marginTop: 16,
  paddingTop: 13,
  borderTopWidth: 1,
  borderTopColor:
    '#F5E7E7',
},

failedText: {
  color:
    COLORS.red,
  fontSize: 12,
  fontWeight: '800',
},


/* EMPTY */

empty: {
  backgroundColor:
    COLORS.white,
  borderRadius: 20,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  padding: 30,
  alignItems:
    'center',
},

emptyTitle: {
  color:
    COLORS.ink,
  fontSize: 17,
  fontWeight: '900',
},

emptyText: {
  color:
    COLORS.muted,
  fontSize: 12,
  marginTop: 6,
  textAlign:
    'center',
},


/* NOTICE */

notice: {
  marginTop: 24,
  padding: 16,
  borderRadius: 16,
  backgroundColor:
    COLORS.orangeLight,
  borderWidth: 1,
  borderColor:
    COLORS.border,
},

noticeTitle: {
  color:
    COLORS.orangeDark,
  fontSize: 12,
  fontWeight: '900',
},

noticeText: {
  color:
    COLORS.muted,
  fontSize: 11,
  lineHeight: 17,
  marginTop: 5,
},


/* FOOTER */

footer: {
  color:
    COLORS.muted,
  fontSize: 10,
  textAlign:
    'center',
  marginTop: 28,
},


/* =====================================================
   EDIT MODAL
===================================================== */

modalOverlay: {
  flex: 1,
  backgroundColor:
    'rgba(51,35,26,0.48)',
  justifyContent:
    'flex-end',
},

modalCard: {
  width: '100%',
  maxHeight: '94%',
  backgroundColor:
    COLORS.background,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingTop: 20,
  paddingHorizontal: 20,
  paddingBottom: 18,
},

modalHeader: {
  flexDirection:
    'row',
  alignItems:
    'flex-start',
  marginBottom: 14,
},

modalHeaderText: {
  flex: 1,
  paddingRight: 12,
},

modalEyebrow: {
  color:
    COLORS.orange,
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 1,
},

modalTitle: {
  color:
    COLORS.ink,
  fontSize: 23,
  fontWeight: '900',
  marginTop: 3,
},

modalSubtitle: {
  color:
    COLORS.muted,
  fontSize: 11,
  lineHeight: 16,
  marginTop: 5,
},

closeButton: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor:
    COLORS.white,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  alignItems:
    'center',
  justifyContent:
    'center',
},

modalScroll: {
  flexGrow: 0,
},

inputLabel: {
  color:
    COLORS.muted,
  fontSize: 9,
  fontWeight: '900',
  letterSpacing: 0.8,
  marginTop: 13,
  marginBottom: 6,
},

input: {
  minHeight: 46,
  borderRadius: 12,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  backgroundColor:
    COLORS.white,
  color:
    COLORS.ink,
  paddingHorizontal: 13,
  fontSize: 13,
  fontWeight: '600',
},

notesInput: {
  minHeight: 88,
  paddingTop: 12,
},

statusOptions: {
  flexDirection:
    'row',
  flexWrap:
    'wrap',
  gap: 8,
},

statusOption: {
  paddingHorizontal: 13,
  paddingVertical: 10,
  borderRadius: 12,
  backgroundColor:
    COLORS.white,
  borderWidth: 1,
  borderColor:
    COLORS.border,
},

statusOptionSelected: {
  backgroundColor:
    COLORS.orange,
  borderColor:
    COLORS.orange,
},

statusOptionText: {
  color:
    COLORS.muted,
  fontSize: 10,
  fontWeight: '900',
},

statusOptionTextSelected: {
  color:
    COLORS.white,
},

editWarning: {
  marginTop: 16,
  padding: 13,
  borderRadius: 13,
  backgroundColor:
    COLORS.orangeLight,
  borderWidth: 1,
  borderColor:
    COLORS.border,
},

editWarningTitle: {
  color:
    COLORS.orangeDark,
  fontSize: 11,
  fontWeight: '900',
},

editWarningText: {
  color:
    COLORS.muted,
  fontSize: 10,
  lineHeight: 15,
  marginTop: 4,
},

modalActions: {
  flexDirection:
    'row',
  gap: 10,
  marginTop: 16,
},

cancelButton: {
  flex: 1,
  minHeight: 46,
  borderRadius: 13,
  backgroundColor:
    COLORS.white,
  borderWidth: 1,
  borderColor:
    COLORS.border,
  alignItems:
    'center',
  justifyContent:
    'center',
},

cancelButtonText: {
  color:
    COLORS.ink,
  fontSize: 12,
  fontWeight: '900',
},

saveButton: {
  flex: 1.5,
  minHeight: 46,
  borderRadius: 13,
  backgroundColor:
    COLORS.orange,
  alignItems:
    'center',
  justifyContent:
    'center',
  flexDirection:
    'row',
  gap: 7,
},
saveButtonText: {
  color:
    COLORS.white,
  fontSize: 12,
  fontWeight: '900',
},
});