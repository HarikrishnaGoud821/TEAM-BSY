import { useRouter } from 'expo-router';
import {
  Archive,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileText,
  GalleryHorizontal,
  Landmark,
  LayoutDashboard,
  MessageSquareText,
  Receipt,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
};

type ModuleIcon = ComponentType<{
  size?: number;
  color?: string;
}>;

type ModuleItem = {
  title: string;
  description: string;
  icon: ModuleIcon;
  route?:
    | '/contribute'
    | '/activity'
    | '/admin-contributions'
    | '/admin-dashboard';
};

const memberModules: ModuleItem[] = [
  {
    title: 'Contributions & payments',
    description: 'QR pay, direct payment, history and receipts',
    icon: WalletCards,
    route: '/contribute',
  },
  {
    title: 'Events & attendance',
    description: 'Upcoming gatherings and participation',
    icon: CalendarDays,
  },
  {
    title: 'Announcements',
    description: 'Important updates from TEAM BSY',
    icon: Bell,
  },
  {
    title: 'Gallery',
    description: 'Community moments and event photos',
    icon: GalleryHorizontal,
  },
];

const supportModules: ModuleItem[] = [
  {
    title: 'Feedback & complaints',
    description: 'Share feedback and track resolutions',
    icon: MessageSquareText,
  },
  {
    title: 'Documents',
    description: 'Receipts, reports and important files',
    icon: FileText,
  },
  {
    title: 'Emergency contacts',
    description: 'Reach organizers and mentors quickly',
    icon: ShieldCheck,
  },
  {
    title: 'Notifications',
    description: 'Payment, event and organization alerts',
    icon: Bell,
  },
];

const managementModules: ModuleItem[] = [
  {
    title: 'Finance overview',
    description: 'Income, expenses and current balance',
    icon: Landmark,
  },
  {
    title: 'Expenses & money usage',
    description: 'Mentor expenses, items and proof',
    icon: Receipt,
  },
  {
    title: 'Volunteers & tasks',
    description: 'Assignments, attendance and activity',
    icon: UsersRound,
  },
  {
    title: 'Reports & archives',
    description: 'Year-wise summaries and exports',
    icon: Archive,
  },
  {
    title: 'Audit log',
    description: 'A clear record of organization activity',
    icon: FileCheck2,
  },
  {
    title: 'Admin dashboard',
    description: 'Manage the whole TEAM BSY workspace',
    icon: LayoutDashboard,
    route: '/admin-dashboard',
  },
];

export default function ModulesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          TEAM BSY WORKSPACE
        </Text>

        <Text style={styles.title}>
          All modules
        </Text>

        <Text style={styles.subtitle}>
          Everything your community needs, in one place.
        </Text>

        <View style={styles.featured}>
          <View style={styles.featuredIcon}>
            <CircleDollarSign
              size={23}
              color={COLORS.teal}
            />
          </View>

          <View style={styles.featuredCopy}>
            <Text style={styles.featuredLabel}>
              PAYMENT CENTER
            </Text>

            <Text style={styles.featuredTitle}>
              Contribute securely
            </Text>

            <Text style={styles.featuredBody}>
              Choose QR or direct Razorpay checkout and
              receive your receipt after payment confirmation.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push('/contribute')}
            style={styles.featuredButton}
          >
            <Text style={styles.featuredButtonText}>
              Open
            </Text>

            <ChevronRight
              size={16}
              color={COLORS.ink}
            />
          </Pressable>
        </View>

        <ModuleSection
          title="For members"
          items={memberModules}
          onOpen={(item) => {
            if (item.route) {
              router.push(item.route as any);
            }
          }}
        />

        <ModuleSection
          title="Stay connected"
          items={supportModules}
          onOpen={() => undefined}
        />

        <ModuleSection
          title="Organization management"
          items={managementModules}
          onOpen={(item) => {
            if (item.route) {
              router.push(item.route as any);
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ModuleSection({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: ModuleItem[];
  onOpen: (item: ModuleItem) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Pressable
            key={item.title}
            style={styles.moduleRow}
            onPress={() => onOpen(item)}
          >
            <View style={styles.moduleIcon}>
              <Icon
                size={18}
                color={COLORS.teal}
              />
            </View>

            <View style={styles.moduleCopy}>
              <Text style={styles.moduleTitle}>
                {item.title}
              </Text>

              <Text style={styles.moduleDescription}>
                {item.description}
              </Text>
            </View>

            <ChevronRight
              size={17}
              color={COLORS.muted}
            />
          </Pressable>
        );
      })}
    </View>
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
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 21,
  },

  featured: {
    backgroundColor: COLORS.mint,
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  featuredIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featuredCopy: {
    flex: 1,
  },

  featuredLabel: {
    color: COLORS.teal,
    fontSize: 9,
    letterSpacing: 1.1,
    fontWeight: '900',
  },

  featuredTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },

  featuredBody: {
    color: '#37655D',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  featuredButton: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  featuredButtonText: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: '900',
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

  moduleRow: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 13,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.pale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  moduleCopy: {
    flex: 1,
  },

  moduleTitle: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  moduleDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
});