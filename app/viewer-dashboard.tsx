import React from 'react';
import { Alert, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Home,
  Image as ImageIcon,
  Instagram,
  LogOut,
  PlayCircle,
  ShieldCheck,
  User,
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
  red: '#B84A4A',
};

export default function ViewerDashboard() {
  const showComingSoon = (title: string) => {
    Alert.alert(
      title,
      'This TEAM BSY feature will be connected soon.'
    );
  };

  const openInstagram = async () => {
    try {
      await Linking.openURL(
        'https://www.instagram.com/basweshwara_youth_dmpr/'
      );
    } catch (error) {
      console.error('Instagram error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);

      if (typeof window !== 'undefined') {
        window.alert('Unable to logout. Please try again.');
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
          <View style={styles.brandContainer}>
            <Image
              source={require('../assets/images/bsy.jpg')}
              style={styles.logo}
            />

            <View>
              <Text style={styles.brandName}>
                TEAM BSY
              </Text>

              <Text style={styles.roleText}>
                VIEWER
              </Text>
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

            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>
                VIEWER DASHBOARD
              </Text>

              <Text style={styles.heroTitle}>
                Stay connected with TEAM BSY
              </Text>

              <Text style={styles.heroDescription}>
                Explore TEAM BSY events, photos, videos,
                celebrations and community memories.
              </Text>

              <View style={styles.heroButtons}>

                <Pressable
                  style={styles.primaryButton}
                  onPress={() =>
                    showComingSoon('Photos & Videos')
                  }
                >
                  <ImageIcon
                    size={18}
                    color={COLORS.white}
                  />

                  <Text style={styles.primaryButtonText}>
                    VIEW PHOTOS
                  </Text>

                  <ChevronRight
                    size={18}
                    color={COLORS.white}
                  />
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() =>
                    showComingSoon('Events')
                  }
                >
                  <Text style={styles.secondaryButtonText}>
                    VIEW EVENTS
                  </Text>
                </Pressable>

              </View>
            </View>

            <View style={styles.heroDecoration}>
              <View style={styles.heroCircle}>
                <ImageIcon
                  size={54}
                  color={COLORS.orange}
                  strokeWidth={1.5}
                />
              </View>

              <View style={styles.heroSmallCircle}>
                <PlayCircle
                  size={28}
                  color={COLORS.orangeDark}
                />
              </View>
            </View>

          </View>

          {/* OVERVIEW */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              COMMUNITY OVERVIEW
            </Text>

            <Text style={styles.sectionTitle}>
              Explore TEAM BSY
            </Text>
          </View>

          <View style={styles.statsGrid}>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <ImageIcon
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statValue}>
                0
              </Text>

              <Text style={styles.statLabel}>
                Photos
              </Text>

              <Text style={styles.statSubtext}>
                Community memories
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <PlayCircle
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statValue}>
                0
              </Text>

              <Text style={styles.statLabel}>
                Videos
              </Text>

              <Text style={styles.statSubtext}>
                Celebration videos
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CalendarDays
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statValue}>
                0
              </Text>

              <Text style={styles.statLabel}>
                Events
              </Text>

              <Text style={styles.statSubtext}>
                TEAM BSY activities
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <ShieldCheck
                  size={22}
                  color={COLORS.orange}
                />
              </View>

              <Text style={styles.statValue}>
                LIVE
              </Text>

              <Text style={styles.statLabel}>
                Community
              </Text>

              <Text style={styles.statSubtext}>
                TEAM BSY platform
              </Text>
            </View>

          </View>

          {/* VIEWER MODULES */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              VIEWER MODULES
            </Text>

            <Text style={styles.sectionTitle}>
              Discover TEAM BSY
            </Text>
          </View>

          <View style={styles.moduleList}>

            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Photos & Videos')
              }
            >
              <View style={styles.moduleIcon}>
                <ImageIcon
                  size={24}
                  color={COLORS.orange}
                />
              </View>

              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>
                  Photos & Videos
                </Text>

                <Text style={styles.moduleDescription}>
                  View Ganesh Chaturthi photos and
                  community videos.
                </Text>
              </View>

              <ChevronRight
                size={21}
                color={COLORS.muted}
              />
            </Pressable>

            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Events')
              }
            >
              <View style={styles.moduleIcon}>
                <CalendarDays
                  size={24}
                  color={COLORS.orange}
                />
              </View>

              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>
                  Events
                </Text>

                <Text style={styles.moduleDescription}>
                  Discover upcoming celebrations and
                  TEAM BSY activities.
                </Text>
              </View>

              <ChevronRight
                size={21}
                color={COLORS.muted}
              />
            </Pressable>

            <Pressable
              style={styles.moduleCard}
              onPress={() =>
                showComingSoon('Community Updates')
              }
            >
              <View style={styles.moduleIcon}>
                <PlayCircle
                  size={24}
                  color={COLORS.orange}
                />
              </View>

              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>
                  Community Updates
                </Text>

                <Text style={styles.moduleDescription}>
                  Stay updated with TEAM BSY activities.
                </Text>
              </View>

              <ChevronRight
                size={21}
                color={COLORS.muted}
              />
            </Pressable>

          </View>

          {/* INSTAGRAM */}
          <View style={styles.infoCard}>

            <View style={styles.infoHeader}>

              <View style={styles.infoIcon}>
                <Instagram
                  size={23}
                  color={COLORS.orange}
                />
              </View>

              <View>
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

              <Text style={styles.instagramText}>
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
              bring people together during Ganesh Chaturthi
              celebrations and community activities.
            </Text>

            <Text style={styles.contentText}>
              Viewers can explore celebrations, memories,
              photos, videos and community updates in one
              place.
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
            style={styles.logoutButton}
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

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>

          <Pressable
            style={styles.navItem}
            onPress={() =>
              router.replace('/viewer-dashboard')
            }
          >
            <Home
              size={22}
              color={COLORS.orange}
              fill={COLORS.orange}
            />

            <Text style={styles.navActive}>
              Dashboard
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() =>
              showComingSoon('Photos')
            }
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
            onPress={() =>
              showComingSoon('Events')
            }
          >
            <CalendarDays
              size={22}
              color={COLORS.muted}
            />

            <Text style={styles.navText}>
              Events
            </Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() =>
              showComingSoon('Profile')
            }
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
    minHeight: 285,
    borderRadius: 28,
    backgroundColor: COLORS.orangeLight,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },

  heroText: {
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
  },

  heroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
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
  },

  secondaryButton: {
    minHeight: 48,
    paddingHorizontal: 17,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: COLORS.orangeDark,
    fontSize: 12,
    fontWeight: '900',
  },

  heroDecoration: {
    width: 175,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  heroCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroSmallCircle: {
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
    marginBottom: 12,
  },

  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink,
  },

  statLabel: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },

  statSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.muted,
  },

  moduleList: {
    gap: 11,
    marginBottom: 28,
  },

  moduleCard: {
    minHeight: 82,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  moduleIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  moduleContent: {
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
    lineHeight: 17,
    color: COLORS.muted,
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
    fontWeight: '800',
    color: COLORS.orangeDark,
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

  instagramText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
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

  navActive: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.orange,
  },
});