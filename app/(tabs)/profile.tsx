import {
  ChevronRight,
  FileText,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearSession, getUser } from '../../src/services/session';
import type { User } from '../../src/services/api';

const COLORS = {
  ink: '#132B2A',
  teal: '#2F7467',
  mint: '#B7E4D8',
  pale: '#EAF6F1',
  paper: '#F7FBF9',
  line: '#DCEBE6',
  white: '#FFFFFF',
  muted: '#78908E',
};

const menu = [
  {
    label: 'Personal details',
    icon: UserRound,
  },
  {
    label: 'Notifications',
    icon: ShieldCheck,
  },
  {
    label: 'Settings',
    icon: Settings,
  },
  {
    label: 'Help & support',
    icon: HelpCircle,
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const savedUser = await getUser();
    setUser(savedUser);
  };

  const handleSignOut = async () => {
    try {
      await clearSession();
      router.replace('/login');
    } catch (error) {
      console.error(
        'Sign out error:',
        error
      );
    }
  };

  const displayName =
    user?.fullName || 'TEAM BSY Member';

  const displayMobile =
    user?.mobileNumber
      ? `+91 ${user.mobileNumber}`
      : 'Mobile number not available';

  const displayRole =
    user?.role || 'MEMBER';

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Text style={styles.eyebrow}>
          ACCOUNT
        </Text>

        <Text style={styles.title}>
          Your profile
        </Text>

        <View style={styles.profileCard}>
          <Image
            source={require('../../assets/images/bsy.jpg')}
            style={styles.avatar}
          />

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {displayName}
            </Text>

            <Text style={styles.mobile}>
              {displayMobile}
            </Text>

            <View style={styles.memberPill}>
              <Text style={styles.memberText}>
                {displayRole}
              </Text>
            </View>
          </View>

          <Pressable>
            <Text style={styles.edit}>
              Edit
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>
          PREFERENCES
        </Text>

        <View style={styles.menuCard}>
          {menu.map(
            ({ label, icon: Icon }) => (
              <Pressable
                key={label}
                style={styles.menuRow}
              >
                <View style={styles.menuIcon}>
                  <Icon
                    size={17}
                    color={COLORS.teal}
                  />
                </View>

                <Text style={styles.menuText}>
                  {label}
                </Text>

                <ChevronRight
                  size={17}
                  color={COLORS.muted}
                />
              </Pressable>
            )
          )}
        </View>

        <Text style={styles.sectionLabel}>
          DOCUMENTS
        </Text>

        <View style={styles.document}>
          <View style={styles.documentIcon}>
            <FileText
              size={18}
              color={COLORS.teal}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.documentTitle}>
              Membership confirmation
            </Text>

            <Text style={styles.documentMeta}>
              PDF · 184 KB
            </Text>
          </View>

          <ChevronRight
            size={17}
            color={COLORS.muted}
          />
        </View>

        <Pressable
          style={styles.logout}
          onPress={handleSignOut}
        >
          <LogOut
            size={17}
            color="#C65A4D"
          />

          <Text style={styles.logoutText}>
            Sign out
          </Text>
        </Pressable>

        <Text style={styles.version}>
          TEAM BSY · BASWESHWARA YOUTH · DAMGANPUR
        </Text>
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

  title: {
    color: COLORS.ink,
    fontSize: 31,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 21,
  },

  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 23,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  name: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '900',
  },

  mobile: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  memberPill: {
    backgroundColor: COLORS.pale,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
  },

  memberText: {
    color: COLORS.teal,
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: '900',
  },

  edit: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '900',
  },

  sectionLabel: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '900',
    marginTop: 26,
    marginBottom: 10,
  },

  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 15,
  },

  menuRow: {
    minHeight: 57,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.pale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuText: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '700',
  },

  document: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  documentIcon: {
    width: 37,
    height: 37,
    backgroundColor: COLORS.pale,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  documentTitle: {
    color: COLORS.ink,
    fontWeight: '800',
    fontSize: 12,
  },

  documentMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  logout: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 25,
    padding: 13,
  },

  logoutText: {
    color: '#C65A4D',
    fontSize: 12,
    fontWeight: '900',
  },

  version: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 17,
  },
});

