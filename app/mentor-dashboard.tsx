import React from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { logout } from '../src/services/session';

const COLORS = {
  background: '#FFF9F4',
  white: '#FFFFFF',
  ink: '#33231A',
  teal: '#C96F32',
  tealDark: '#9E4F20',
  mint: '#F9D8BD',
  mintLight: '#FFF0E4',
  muted: '#8C7566',
  border: '#F0DED0',
  red: '#B84A4A',
};

export default function MentorDashboard() {
  const openInstagram = () => {
    Linking.openURL(
      'https://www.instagram.com/basweshwara_youth_dmpr/'
    );
  };

  const showComingSoon = (name: string) => {
    Alert.alert(
      name,
      `${name} module will be available soon.`
    );
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

        await logout();
        router.replace('/login');
        return;
      }

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../assets/images/bsy.jpg')}
              style={styles.logo}
            />

            <View>
              <Text style={styles.brandName}>
                TEAM BSY
              </Text>

              <Text style={styles.brandRole}>
                MENTOR
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.menuButton}
            onPress={handleLogout}
          >
            <LogOut
              size={22}
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

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                MENTOR AREA
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              MENTOR CONTROL CENTER
            </Text>

            <Text style={styles.heroDescription}>
              Support your team, manage members and keep
              TEAM BSY activities organized.
            </Text>

            <View style={styles.heroButtons}>

              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  showComingSoon('Members')
                }
              >
                <Text style={styles.primaryButtonText}>
                  MEMBERS
                </Text>

                <Text style={styles.primaryButtonArrow}>
                  →
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  showComingSoon('View Data')
                }
              >
                <Text style={styles.secondaryButtonText}>
                  VIEW DATA
                </Text>
              </Pressable>

            </View>
          </View>

          {/* MENTOR OVERVIEW */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>
                MENTOR OVERVIEW
              </Text>

              <Text style={styles.sectionTitle}>
                Your TEAM BSY activity
              </Text>
            </View>
          </View>

          {/* STATS */}
          <View style={styles.statsGrid}>

            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Text style={styles.statLabel}>
                  MEMBERS
                </Text>

                <View style={styles.statIcon}>
                  <Text>👥</Text>
                </View>
              </View>

              <Text style={styles.statValue}>
                24
              </Text>

              <Text style={styles.statSubtext}>
                Team members
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Text style={styles.statLabel}>
                  CONTRIBUTIONS
                </Text>

                <View style={styles.statIcon}>
                  <Text>₹</Text>
                </View>
              </View>

              <Text style={styles.statValue}>
                ₹18,500
              </Text>

              <Text style={styles.statSubtext}>
                Collected
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Text style={styles.statLabel}>
                  PENDING
                </Text>

                <View style={styles.statIcon}>
                  <Text>⏳</Text>
                </View>
              </View>

              <Text style={styles.statValue}>
                5
              </Text>

              <Text style={styles.statSubtext}>
                Follow-ups
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Text style={styles.statLabel}>
                  EVENTS
                </Text>

                <View style={styles.statIcon}>
                  <Text>🎉</Text>
                </View>
              </View>

              <Text style={styles.statValue}>
                3
              </Text>

              <Text style={styles.statSubtext}>
                Upcoming events
              </Text>
            </View>

          </View>

          {/* RECENT ACTIVITY */}
          <View style={styles.activityCard}>

            <View style={styles.activityHeader}>
              <View>
                <Text style={styles.activitySmallTitle}>
                  RECENT ACTIVITY
                </Text>

                <Text style={styles.activityTitle}>
                  Team updates
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  showComingSoon('All Activity')
                }
              >
                <Text style={styles.viewAllText}>
                  View all →
                </Text>
              </Pressable>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityDot} />

              <View style={styles.activityContent}>
                <Text style={styles.activityItemTitle}>
                  New contribution recorded
                </Text>

                <Text style={styles.activityItemText}>
                  A member contribution was added to
                  the TEAM BSY records.
                </Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityDot} />

              <View style={styles.activityContent}>
                <Text style={styles.activityItemTitle}>
                  Member follow-up pending
                </Text>

                <Text style={styles.activityItemText}>
                  Review pending contribution information.
                </Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={styles.activityDot} />

              <View style={styles.activityContent}>
                <Text style={styles.activityItemTitle}>
                  Upcoming TEAM BSY event
                </Text>

                <Text style={styles.activityItemText}>
                  Keep your team updated about upcoming
                  Ganesh Chaturthi activities.
                </Text>
              </View>
            </View>

          </View>

          {/* MENTOR MODULES */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>
                MENTOR MODULES
              </Text>

              <Text style={styles.sectionTitle}>
                Manage your team
              </Text>
            </View>
          </View>

          <View style={styles.modulesContainer}>

            {/* MEMBERS */}
            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Members')
              }
            >
              <View style={styles.moduleIconBox}>
                <Text style={styles.moduleIcon}>
                  👥
                </Text>
              </View>

              <View style={styles.moduleTextContainer}>
                <Text style={styles.moduleTitle}>
                  Members
                </Text>

                <Text style={styles.moduleDescription}>
                  View and manage your assigned members.
                </Text>
              </View>

              <Text style={styles.moduleArrow}>
                →
              </Text>
            </Pressable>

            {/* CONTRIBUTIONS */}
            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Contributions')
              }
            >
              <View style={styles.moduleIconBox}>
                <Text style={styles.moduleIcon}>
                  ₹
                </Text>
              </View>

              <View style={styles.moduleTextContainer}>
                <Text style={styles.moduleTitle}>
                  Contributions
                </Text>

                <Text style={styles.moduleDescription}>
                  Track member contribution activity.
                </Text>
              </View>

              <Text style={styles.moduleArrow}>
                →
              </Text>
            </Pressable>

            {/* PHOTOS */}
            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Photos & Videos')
              }
            >
              <View style={styles.moduleIconBox}>
                <Text style={styles.moduleIcon}>
                  📷
                </Text>
              </View>

              <View style={styles.moduleTextContainer}>
                <Text style={styles.moduleTitle}>
                  Photos & Videos
                </Text>

                <Text style={styles.moduleDescription}>
                  View and manage TEAM BSY memories.
                </Text>
              </View>

              <Text style={styles.moduleArrow}>
                →
              </Text>
            </Pressable>

            {/* EVENTS */}
            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Events')
              }
            >
              <View style={styles.moduleIconBox}>
                <Text style={styles.moduleIcon}>
                  🎉
                </Text>
              </View>

              <View style={styles.moduleTextContainer}>
                <Text style={styles.moduleTitle}>
                  Events
                </Text>

                <Text style={styles.moduleDescription}>
                  Track celebrations and upcoming events.
                </Text>
              </View>

              <Text style={styles.moduleArrow}>
                →
              </Text>
            </Pressable>

            {/* REPORTS */}
            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Reports')
              }
            >
              <View style={styles.moduleIconBox}>
                <Text style={styles.moduleIcon}>
                  📊
                </Text>
              </View>

              <View style={styles.moduleTextContainer}>
                <Text style={styles.moduleTitle}>
                  Reports
                </Text>

                <Text style={styles.moduleDescription}>
                  Review team activity and contribution
                  reports.
                </Text>
              </View>

              <Text style={styles.moduleArrow}>
                →
              </Text>
            </Pressable>

          </View>

          {/* INSTAGRAM */}
          <View style={styles.infoSection}>

            <Text style={styles.sectionLabel}>
              STAY CONNECTED
            </Text>

            <Text style={styles.infoTitle}>
              TEAM BSY ON INSTAGRAM
            </Text>

            <Text style={styles.infoText}>
              Follow TEAM BSY for Ganesh Chaturthi
              updates, photos, videos and events.
            </Text>

            <Pressable
              style={styles.instagramButton}
              onPress={openInstagram}
            >
              <Text style={styles.instagramButtonText}>
                FOLLOW US ON INSTAGRAM
              </Text>

              <Text style={styles.instagramArrow}>
                ↗
              </Text>
            </Pressable>

            <Text style={styles.instagramHandle}>
              @basweshwara_youth_dmpr
            </Text>

          </View>

          {/* OUR STORY */}
          <View style={styles.storySection}>

            <Text style={styles.sectionLabel}>
              OUR STORY
            </Text>

            <Text style={styles.storyTitle}>
              A tradition carried forward
            </Text>

            <Text style={styles.storyText}>
              The historic tradition of celebrating
              Ganesh Chaturthi in our village began with
              Kummari Thippapa, who proudly installed the
              very first idol.
            </Text>

            <Text style={styles.storyText}>
              Since then, this celebration has continued
              through generations, bringing our community
              together through devotion, unity, tradition
              and service.
            </Text>

            <Text style={styles.storyText}>
              TEAM BSY carries this spirit forward by
              connecting our people, contributions,
              celebrations, photos and memories in one
              place.
            </Text>

          </View>

          {/* ABOUT */}
          <View style={styles.aboutSection}>

            <Text style={styles.sectionLabel}>
              ABOUT TEAM BSY
            </Text>

            <Text style={styles.aboutTitle}>
              Community • Unity • Service
            </Text>

            <Text style={styles.aboutText}>
              TEAM BSY is a community platform created
              to bring people together during Ganesh
              Chaturthi celebrations and community
              activities.
            </Text>

            <Text style={styles.aboutText}>
              The platform helps organize members,
              contributions, events, photos, videos and
              community memories in one place.
            </Text>

          </View>

          {/* POLICIES */}
          <View style={styles.policySection}>

            <Text style={styles.sectionLabel}>
              POLICIES & INFORMATION
            </Text>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Privacy Policy')
              }
            >
              <Text style={styles.policyText}>
                Privacy Policy
              </Text>

              <Text style={styles.policyArrow}>
                →
              </Text>
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

              <Text style={styles.policyArrow}>
                →
              </Text>
            </Pressable>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Contribution Policy')
              }
            >
              <Text style={styles.policyText}>
                Contribution Policy
              </Text>

              <Text style={styles.policyArrow}>
                →
              </Text>
            </Pressable>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Refund Policy')
              }
            >
              <Text style={styles.policyText}>
                Refund Policy
              </Text>

              <Text style={styles.policyArrow}>
                →
              </Text>
            </Pressable>

            <Pressable
              style={styles.policyRow}
              onPress={() =>
                showComingSoon('Contact & Support')
              }
            >
              <Text style={styles.policyText}>
                Contact & Support
              </Text>

              <Text style={styles.policyArrow}>
                →
              </Text>
            </Pressable>

          </View>

          {/* LOGOUT */}
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut
              size={20}
              color={COLORS.red}
              strokeWidth={2.5}
            />

            <Text style={styles.logoutText}>
              LOGOUT FROM TEAM BSY
            </Text>
          </Pressable>

          {/* COPYRIGHT */}
          <View style={styles.copyrightSection}>

            <Text style={styles.copyrightBrand}>
              TEAM BSY
            </Text>

            <Text style={styles.copyrightText}>
              Community • Unity • Service
            </Text>

            <Text style={styles.copyrightText}>
              © 2026 TEAM BSY. All rights reserved.
            </Text>

          </View>

        </ScrollView>

        {/* BOTTOM NAVIGATION */}
        <View style={styles.bottomNav}>

          <Pressable
            style={styles.bottomNavItem}
            onPress={() =>
              router.replace('/mentor-dashboard')
            }
          >
            <Text style={styles.bottomNavIcon}>
              ⌂
            </Text>

            <Text style={styles.bottomNavTextActive}>
              Dashboard
            </Text>
          </Pressable>

          <Pressable
            style={styles.bottomNavItem}
            onPress={() =>
              showComingSoon('Members')
            }
          >
            <Text style={styles.bottomNavIcon}>
              👥
            </Text>

            <Text style={styles.bottomNavText}>
              Members
            </Text>
          </Pressable>

          <Pressable
            style={styles.bottomNavItem}
            onPress={() =>
              showComingSoon('Events')
            }
          >
            <Text style={styles.bottomNavIcon}>
              🎉
            </Text>

            <Text style={styles.bottomNavText}>
              Events
            </Text>
          </Pressable>

          <Pressable
            style={styles.bottomNavItem}
            onPress={() =>
              showComingSoon('Profile')
            }
          >
            <Text style={styles.bottomNavIcon}>
              ●
            </Text>

            <Text style={styles.bottomNavText}>
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
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    marginRight: 12,
  },

  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 1,
  },

  brandRole: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.teal,
    letterSpacing: 1.5,
  },

  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 150,
  },

  hero: {
    marginTop: 14,
    padding: 28,
    minHeight: 410,
    borderRadius: 30,
    backgroundColor: COLORS.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    marginBottom: 18,
  },

  heroBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.tealDark,
    letterSpacing: 1.5,
  },

  heroTitle: {
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: -0.7,
  },

  heroDescription: {
    maxWidth: 330,
    marginTop: 16,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.muted,
    fontWeight: '500',
  },

  heroButtons: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 10,
  },

  primaryButton: {
    minWidth: 145,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  primaryButtonArrow: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  secondaryButton: {
    minWidth: 115,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  sectionHeader: {
    marginTop: 34,
    marginBottom: 16,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.teal,
    letterSpacing: 1.7,
  },

  sectionTitle: {
    marginTop: 5,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  statCard: {
    width: '48.2%',
    minHeight: 145,
    padding: 17,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
    letterSpacing: 1.1,
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink,
  },

  statSubtext: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '500',
  },

  activityCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  activitySmallTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.teal,
    letterSpacing: 1.4,
  },

  activityTitle: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },

  viewAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.teal,
  },

  activityItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.teal,
    marginTop: 5,
    marginRight: 12,
  },

  activityContent: {
    flex: 1,
  },

  activityItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },

  activityItemText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  modulesContainer: {
    gap: 12,
  },

  moduleCard: {
    minHeight: 92,
    padding: 15,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  moduleIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  moduleIcon: {
    fontSize: 22,
  },

  moduleTextContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },

  moduleTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
  },

  moduleDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
  },

  moduleArrow: {
    fontSize: 22,
    color: COLORS.teal,
    fontWeight: '700',
  },

  infoSection: {
    marginTop: 34,
    padding: 24,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoTitle: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: COLORS.ink,
  },

  infoText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.muted,
  },

  instagramButton: {
    marginTop: 20,
    height: 54,
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: COLORS.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  instagramButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  instagramArrow: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },

  instagramHandle: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '700',
  },

  storySection: {
    marginTop: 24,
    padding: 24,
    borderRadius: 26,
    backgroundColor: COLORS.mint,
  },

  storyTitle: {
    marginTop: 8,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    color: COLORS.ink,
  },

  storyText: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.muted,
  },

  aboutSection: {
    marginTop: 24,
    padding: 24,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  aboutTitle: {
    marginTop: 8,
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.ink,
  },

  aboutText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.muted,
  },

  policySection: {
    marginTop: 24,
    padding: 22,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  policyRow: {
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  policyText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },

  policyArrow: {
    fontSize: 18,
    color: COLORS.teal,
    fontWeight: '700',
  },

  logoutButton: {
    minHeight: 54,
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8CACA',
    backgroundColor: '#FFF6F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },

  logoutText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  copyrightSection: {
    marginTop: 30,
    paddingTop: 10,
    alignItems: 'center',
  },

  copyrightBrand: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 1.5,
  },

  copyrightText: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
  },

  bottomNav: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    height: 74,
    paddingHorizontal: 8,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  },

  bottomNavItem: {
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomNavIcon: {
    fontSize: 19,
    color: COLORS.muted,
  },

  bottomNavText: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.muted,
  },

  bottomNavTextActive: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.teal,
  },
});