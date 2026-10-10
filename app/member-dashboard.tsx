import React from 'react';
import { Alert, Image, Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Camera,
  ChevronRight,
  CreditCard,
  FileText,
  History,
  Home,
  Image as ImageIcon,
  Instagram,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  User,
  WalletCards,
  CalendarDays,
} from 'lucide-react-native';

import { logout } from '../src/services/session';

const COLORS = {
  background: '#FFF9F4',
  white: '#FFFFFF',
  ink: '#33231A',
  orange: '#C96F32',
  orangeDark: '#9E4F20',
  orangeLight: '#F9D8BD',
  cream: '#FFF0E4',
  muted: '#8C7566',
  border: '#F0DED0',
  green: '#4F8A63',
  red: '#B84A4A',
};

type ModuleItem = {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
};

export default function MemberDashboard() {
  const showComingSoon = (title: string) => {
    Alert.alert(
      title,
      'This TEAM BSY feature will be connected soon.'
    );
  };

  const openInstagram = async () => {
    const url = 'https://www.instagram.com/basweshwara_youth_dmpr/';

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Instagram error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm(
          'Are you sure you want to logout from TEAM BSY?'
        );

        if (!confirmed) {
          return;
        }
      } else {
        Alert.alert(
          'Logout',
          'Are you sure you want to logout from TEAM BSY?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Logout',
              style: 'destructive',
              onPress: async () => {
                try {
                  await logout();
                  router.replace('/login');
                } catch (error) {
                  console.error('Logout error:', error);
                  Alert.alert(
                    'Logout Failed',
                    'Unable to logout. Please try again.'
                  );
                }
              },
            },
          ]
        );

        return;
      }

      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);

      if (Platform.OS === 'web') {
        window.alert(
          'Unable to logout. Please try again.'
        );
      } else {
        Alert.alert(
          'Logout Failed',
          'Unable to logout. Please try again.'
        );
      }
    }
  };

  const openContribution = () => {
    showComingSoon('Make Contribution');
  };

  const openPaymentHistory = () => {
    showComingSoon('Payment History');
  };

  const openPhotos = () => {
    showComingSoon('Photos & Videos');
  };

  const openEvents = () => {
    showComingSoon('Events');
  };

  const openProfile = () => {
    showComingSoon('My Profile');
  };

  const modules: ModuleItem[] = [
    {
      title: 'Make Contribution',
      description: 'Support TEAM BSY activities',
      icon: <CreditCard size={23} color={COLORS.orange} />,
      action: openContribution,
    },
    {
      title: 'Payment History',
      description: 'View your previous contributions',
      icon: <History size={23} color={COLORS.orange} />,
      action: openPaymentHistory,
    },
    {
      title: 'Photos & Videos',
      description: 'View TEAM BSY memories',
      icon: <ImageIcon size={23} color={COLORS.orange} />,
      action: openPhotos,
    },
    {
      title: 'Events',
      description: 'View upcoming TEAM BSY events',
      icon: <CalendarDays size={23} color={COLORS.orange} />,
      action: openEvents,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image
              source={require('../assets/images/bsy.jpg')}
              style={styles.logo}
            />

            <View>
              <Text style={styles.brandName}>TEAM BSY</Text>
              <Text style={styles.roleText}>MEMBER</Text>
            </View>
          </View>

          <Pressable
            style={styles.menuButton}
            onPress={handleLogout}
          >
            <LogOut
              size={24}
              color={COLORS.ink}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* HERO */}
          <View style={styles.hero}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroLabel}>
                MEMBER DASHBOARD
              </Text>

              <Text style={styles.heroTitle}>
                Your TEAM BSY account
              </Text>

              <Text style={styles.heroDescription}>
                View your contributions, make online payments
                and access TEAM BSY photos and videos.
              </Text>

              <View style={styles.heroButtons}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={openContribution}
                >
                  <WalletCards
                    size={18}
                    color={COLORS.white}
                  />

                  <Text style={styles.primaryButtonText}>
                    CONTRIBUTE
                  </Text>

                  <ChevronRight
                    size={18}
                    color={COLORS.white}
                  />
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={openPaymentHistory}
                >
                  <Text style={styles.secondaryButtonText}>
                    VIEW HISTORY
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.heroDecoration}>
              <View style={styles.heroCircleLarge}>
                <WalletCards
                  size={52}
                  color={COLORS.orange}
                  strokeWidth={1.5}
                />
              </View>

              <View style={styles.heroCircleSmall}>
                <ShieldCheck
                  size={27}
                  color={COLORS.orangeDark}
                />
              </View>
            </View>
          </View>

          {/* MEMBER OVERVIEW */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                MEMBER OVERVIEW
              </Text>

              <Text style={styles.sectionTitle}>
                Your activity
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <WalletCards
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statLabel}>
                My Contribution
              </Text>

              <Text style={styles.statValue}>
                ₹0
              </Text>

              <Text style={styles.statSubtext}>
                Total verified
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Receipt
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statLabel}>
                Payments
              </Text>

              <Text style={styles.statValue}>
                0
              </Text>

              <Text style={styles.statSubtext}>
                Transactions
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Camera
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statLabel}>
                Photos
              </Text>

              <Text style={styles.statValue}>
                0
              </Text>

              <Text style={styles.statSubtext}>
                Shared memories
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CalendarDays
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statLabel}>
                Events
              </Text>

              <Text style={styles.statValue}>
                0
              </Text>

              <Text style={styles.statSubtext}>
                Upcoming
              </Text>
            </View>

          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                QUICK ACTIONS
              </Text>

              <Text style={styles.sectionTitle}>
                Manage your account
              </Text>
            </View>
          </View>

          <View style={styles.moduleList}>

            {modules.map((module) => (
              <Pressable
                key={module.title}
                style={({ pressed }) => [
                  styles.moduleCard,
                  pressed && styles.pressed,
                ]}
                onPress={module.action}
              >
                <View style={styles.moduleIcon}>
                  {module.icon}
                </View>

                <View style={styles.moduleTextContainer}>
                  <Text style={styles.moduleTitle}>
                    {module.title}
                  </Text>

                  <Text style={styles.moduleDescription}>
                    {module.description}
                  </Text>
                </View>

                <ChevronRight
                  size={22}
                  color={COLORS.muted}
                />
              </Pressable>
            ))}

          </View>

          {/* PAYMENT INFORMATION */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentIconContainer}>
              <CreditCard
                size={28}
                color={COLORS.orange}
              />
            </View>

            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentTitle}>
                Support TEAM BSY
              </Text>

              <Text style={styles.paymentDescription}>
                Contributions can be made through online
                payment, QR payment or offline contribution.
              </Text>

              <Pressable
                style={styles.paymentButton}
                onPress={openContribution}
              >
                <Text style={styles.paymentButtonText}>
                  MAKE A CONTRIBUTION
                </Text>

                <ChevronRight
                  size={17}
                  color={COLORS.white}
                />
              </Pressable>
            </View>
          </View>

          {/* INSTAGRAM */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <Instagram
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <View style={styles.infoHeaderText}>
                <Text style={styles.infoTitle}>
                  Follow TEAM BSY
                </Text>

                <Text style={styles.infoSubtitle}>
                  Stay connected with our community
                </Text>
              </View>
            </View>

            <Text style={styles.instagramHandle}>
              @basweshwara_youth_dmpr
            </Text>

            <Pressable
              style={styles.instagramButton}
              onPress={openInstagram}
            >
              <Instagram
                size={18}
                color={COLORS.white}
              />

              <Text style={styles.instagramButtonText}>
                OPEN INSTAGRAM
              </Text>

              <ChevronRight
                size={18}
                color={COLORS.white}
              />
            </Pressable>
          </View>

          {/* OUR STORY */}
          <View style={styles.contentCard}>
            <View style={styles.contentTitleRow}>
              <View style={styles.contentIcon}>
                <Home
                  size={21}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.contentTitle}>
                Our Story
              </Text>
            </View>

            <Text style={styles.contentText}>
              The historic tradition of celebrating Ganesh
              Chaturthi in our village began with Kummari
              Thippapa, who proudly installed the very first
              idol.
            </Text>

            <Text style={styles.contentText}>
              Since then, this celebration has continued
              through generations, bringing our community
              together through devotion, unity, tradition
              and service.
            </Text>

            <Text style={styles.contentText}>
              TEAM BSY carries this spirit forward by
              connecting our people, contributions,
              celebrations, photos and memories in one place.
            </Text>
          </View>

          {/* ABOUT */}
          <View style={styles.contentCard}>
            <View style={styles.contentTitleRow}>
              <View style={styles.contentIcon}>
                <User
                  size={21}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.contentTitle}>
                About TEAM BSY
              </Text>
            </View>

            <Text style={styles.contentText}>
              TEAM BSY is a community platform created to
              bring members together during Ganesh
              Chaturthi celebrations and community
              activities.
            </Text>

            <Text style={styles.contentText}>
              Members can use the platform to contribute,
              view payment information, access memories and
              stay connected with TEAM BSY activities.
            </Text>
          </View>

          {/* POLICIES */}
          <View style={styles.contentCard}>
            <View style={styles.contentTitleRow}>
              <View style={styles.contentIcon}>
                <FileText
                  size={21}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.contentTitle}>
                Policies & Information
              </Text>
            </View>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Privacy Policy')
              }
            >
              <Text style={styles.policyText}>
                Privacy Policy
              </Text>

              <ChevronRight
                size={19}
                color={COLORS.muted}
              />
            </Pressable>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Payment Policy')
              }
            >
              <Text style={styles.policyText}>
                Payment Policy
              </Text>

              <ChevronRight
                size={19}
                color={COLORS.muted}
              />
            </Pressable>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Terms & Conditions')
              }
            >
              <Text style={styles.policyText}>
                Terms & Conditions
              </Text>

              <ChevronRight
                size={19}
                color={COLORS.muted}
              />
            </Pressable>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Community Guidelines')
              }
            >
              <Text style={styles.policyText}>
                Community Guidelines
              </Text>

              <ChevronRight
                size={19}
                color={COLORS.muted}
              />
            </Pressable>
          </View>

          {/* LOGOUT */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
            onPress={handleLogout}
          >
            <LogOut
              size={20}
              color={COLORS.red}
            />

            <Text style={styles.logoutText}>
              LOGOUT FROM TEAM BSY
            </Text>
          </Pressable>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Image
              source={require('../assets/images/bsy.jpg')}
              style={styles.footerLogo}
            />

            <Text style={styles.footerBrand}>
              TEAM BSY
            </Text>

            <Text style={styles.footerText}>
              Unity • Devotion • Tradition • Service
            </Text>

            <Text style={styles.copyright}>
              © {new Date().getFullYear()} TEAM BSY.
              All rights reserved.
            </Text>
          </View>

        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>

          <Pressable
            style={styles.navItem}
            onPress={() =>
              router.replace('/member-dashboard')
            }
          >
            <Home
              size={22}
              color={COLORS.orange}
              fill={COLORS.orange}
            />

            <Text style={styles.navTextActive}>
              Dashboard
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={openContribution}
          >
            <WalletCards
              size={22}
              color={COLORS.muted}
            />

            <Text style={styles.navText}>
              Contribute
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={openPhotos}
          >
            <ImageIcon
              size={22}
              color={COLORS.muted}
            />

            <Text style={styles.navText}>
              Photos
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={openProfile}
          >
            <User
              size={22}
              color={COLORS.muted}
            />

            <Text style={styles.navText}>
              Profile
            </Text>
          </Pressable>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 76,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: 14,
    marginRight: 12,
  },

  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: 0.5,
  },

  roleText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.orange,
    letterSpacing: 1.3,
  },

  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 145,
  },

  hero: {
    minHeight: 280,
    borderRadius: 28,
    backgroundColor: COLORS.orangeLight,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroTextContainer: {
    flex: 1,
    zIndex: 2,
  },

  heroLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.orangeDark,
    letterSpacing: 1.6,
    marginBottom: 10,
  },

  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 12,
  },

  heroDescription: {
    maxWidth: 540,
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.muted,
    fontWeight: '500',
  },

  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    flexWrap: 'wrap',
    gap: 10,
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 17,
    borderRadius: 15,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  secondaryButton: {
    minHeight: 48,
    paddingHorizontal: 17,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: COLORS.orangeDark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  heroDecoration: {
    width: 175,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  heroCircleLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCircleSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    bottom: 10,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.orange,
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.ink,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },

  statCard: {
    width: '48%',
    minHeight: 150,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
  },

  statValue: {
    marginTop: 4,
    fontSize: 25,
    color: COLORS.ink,
    fontWeight: '900',
  },

  statSubtext: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.muted,
  },

  moduleList: {
    gap: 11,
    marginBottom: 28,
  },

  moduleCard: {
    minHeight: 78,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pressed: {
    opacity: 0.75,
  },

  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  moduleTextContainer: {
    flex: 1,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 4,
  },

  moduleDescription: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
  },

  paymentCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    padding: 18,
    flexDirection: 'row',
    marginBottom: 25,
  },

  paymentIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  paymentTextContainer: {
    flex: 1,
  },

  paymentTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    marginBottom: 6,
  },

  paymentDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
  },

  paymentButton: {
    alignSelf: 'flex-start',
    marginTop: 13,
    paddingHorizontal: 14,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  paymentButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  infoCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    padding: 20,
    marginBottom: 20,
  },

  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoHeaderText: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },

  infoSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },

  instagramHandle: {
    marginTop: 17,
    fontSize: 14,
    color: COLORS.orangeDark,
    fontWeight: '800',
  },

  instagramButton: {
    marginTop: 14,
    minHeight: 45,
    borderRadius: 14,
    paddingHorizontal: 15,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  instagramButtonText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  contentCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    padding: 20,
    marginBottom: 20,
  },

  contentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  contentIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  contentTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },

  contentText: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.muted,
    marginBottom: 11,
  },

  policyRow: {
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  policyText: {
    fontSize: 13,
    color: COLORS.ink,
    fontWeight: '700',
  },

  logoutButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8CACA',
    backgroundColor: '#FFF6F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginBottom: 30,
  },

  logoutText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },

  footerLogo: {
    width: 55,
    height: 55,
    borderRadius: 16,
    marginBottom: 9,
  },

  footerBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },

  footerText: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.muted,
  },

  copyright: {
    marginTop: 12,
    fontSize: 10,
    color: COLORS.muted,
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 78,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  navText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.muted,
  },

  navTextActive: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.orange,
  },
});