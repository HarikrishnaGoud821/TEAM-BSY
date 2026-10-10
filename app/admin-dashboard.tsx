import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'expo-router';
import {
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BarChart3,
  ChevronRight,
  FileText,
  GalleryHorizontal,
  Home,
  Image as ImageIcon,
  Menu,
  Plus,
  Receipt,
  RefreshCw,
  Settings,
  Trash2,
  UsersRound,
  WalletCards,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getAdminContributions,
  type Contribution,
} from '../src/services/api';
import {
  getToken,
  getUser,
  logout,
} from '../src/services/session';

const API_BASE_URL = 'http://192.168.1.121:8080/api';

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
  green: '#3E8B57',
};

type AdminModule = {
  title: string;
  description: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  route:
    | '/admin-members'
    | '/admin-contributions'
    | '/admin-payments'
    | '/admin-expenses'
    | '/admin-finance'
    | '/admin-reports'
    | '/admin-media';
};

type GalleryPhoto = {
  id: string;
  url: string;
};

type GalleryPhotoResponse = {
  id?: string | number;
  image_url?: string;
  imageUrl?: string;
  url?: string;
  photoUrl?: string;
  file_name?: string;
};

export default function AdminDashboardScreen() {
  const router = useRouter();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Slideshow state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  /*
   * NORMALIZE PHOTO URL
   */
  const normalizePhotoUrl = useCallback((value: string): string => {
    if (!value) {
      return '';
    }

    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('blob:') ||
      value.startsWith('data:')
    ) {
      return value;
    }

    const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
    const normalizedPath = value.startsWith('/')
      ? value
      : `/${value}`;

    return `${serverBase}${normalizedPath}`;
  }, []);

  /*
   * LOAD GALLERY PHOTOS
   */
  const loadGalleryPhotos = useCallback(async () => {
    try {
      setGalleryLoading(true);

      const token = await getToken();

      if (!token) {
        setGalleryPhotos([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/scrolling-photos`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            `Unable to load photos (${response.status}).`,
        );
      }

      if (!responseText.trim()) {
        setGalleryPhotos([]);
        return;
      }

      const data: unknown = JSON.parse(responseText);

      if (!Array.isArray(data)) {
        setGalleryPhotos([]);
        return;
      }

      const normalized: GalleryPhoto[] = data
        .map(
          (
            item: unknown,
            index: number,
          ): GalleryPhoto | null => {
            if (typeof item === 'string') {
              const url = normalizePhotoUrl(item);

              if (!url) {
                return null;
              }

              return {
                id: `${index}-${item}`,
                url,
              };
            }

            if (!item || typeof item !== 'object') {
              return null;
            }

            const photo = item as GalleryPhotoResponse;

            const rawUrl =
              photo.image_url ||
              photo.imageUrl ||
              photo.url ||
              photo.photoUrl ||
              '';

            if (!rawUrl) {
              return null;
            }

            return {
              id: String(photo.id ?? `${index}-${rawUrl}`),
              url: normalizePhotoUrl(rawUrl),
            };
          },
        )
        .filter(
          (item): item is GalleryPhoto =>
            item !== null && !!item.url,
        );

      setGalleryPhotos(normalized);
      setCurrentPhotoIndex(0);
    } catch (galleryError) {
      console.error('Gallery loading error:', galleryError);
      setGalleryPhotos([]);
    } finally {
      setGalleryLoading(false);
    }
  }, [normalizePhotoUrl]);

  /*
   * SLIDESHOW: 5 SECONDS TRANSITION
   */
  useEffect(() => {
    if (galleryPhotos.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % galleryPhotos.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [galleryPhotos.length, fadeAnim]);

  /*
   * LOGOUT
   */
  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
        router.replace('/login');
      } catch (logoutError) {
        console.error('Logout error:', logoutError);
        Alert.alert('Logout Failed', 'Unable to logout. Please try again.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout from TEAM BSY?')) {
        void doLogout();
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to logout from TEAM BSY?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => void doLogout() },
      ],
    );
  };

  /*
   * LOAD ADMIN DASHBOARD
   */
  const loadDashboard = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const user = await getUser();
        const token = await getToken();

        if (!user || !token) {
          setError('Your session has expired. Please login again.');
          return;
        }

        const role = String(user.role || '').trim().toUpperCase();
        setCurrentUserRole(role);

        if (role !== 'ADMIN') {
          setError('Admin access is required.');
          return;
        }

        const data = await getAdminContributions(token);
        setContributions(data);

        await loadGalleryPhotos();
      } catch (dashboardError) {
        const message =
          dashboardError instanceof Error
            ? dashboardError.message
            : 'Unable to load admin dashboard.';

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadGalleryPhotos],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = async () => {
    await loadDashboard(true);
  };

  /*
   * ADMIN PHOTO UPLOAD (Handles Native & Web)
   */
  const handleAddPhoto = async () => {
    try {
      const user = await getUser();
      const token = await getToken();

      if (!token || !user) {
        Alert.alert('Session expired', 'Please login again.');
        return;
      }

      const role = String(user.role || currentUserRole || '').trim().toUpperCase();
      if (role !== 'ADMIN') {
        Alert.alert('Access denied', 'Only administrators can add photos.');
        return;
      }

      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permission required',
            'Please allow photo library access to add a photo.',
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedPhoto = result.assets[0];
      if (!selectedPhoto.uri) {
        Alert.alert('Photo error', 'The selected photo could not be read.');
        return;
      }

      setUploadingPhoto(true);

      const fileName = selectedPhoto.fileName || `team-bsy-${Date.now()}.jpg`;
      const fileType = selectedPhoto.mimeType || 'image/jpeg';
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const fetchRes = await fetch(selectedPhoto.uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, fileName);
      } else {
        formData.append('file', {
          uri: selectedPhoto.uri,
          name: fileName,
          type: fileType,
        } as unknown as Blob);
      }

      const response = await fetch(`${API_BASE_URL}/scrolling-photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || `Photo upload failed (${response.status}).`,
        );
      }

      await loadGalleryPhotos();
      Alert.alert('Photo Added', 'The photo has been uploaded successfully.');
    } catch (uploadError) {
      console.error('Admin gallery upload error:', uploadError);
      Alert.alert(
        'Upload Failed',
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload photo.',
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  /*
   * ADMIN PHOTO DELETE (Handles Native & Web Confirmations)
   */
  const executeDeletePhoto = async (photo: GalleryPhoto) => {
    try {
      const token = await getToken();
      const user = await getUser();

      if (!token || !user) {
        Alert.alert('Session expired', 'Please login again.');
        return;
      }

      const role = String(user.role || currentUserRole || '').trim().toUpperCase();
      if (role !== 'ADMIN') {
        Alert.alert('Access denied', 'Only administrators can remove photos.');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/scrolling-photos/${encodeURIComponent(photo.id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || `Photo deletion failed (${response.status}).`,
        );
      }

      setGalleryPhotos((previous) => {
        const nextList = previous.filter((item) => item.id !== photo.id);
        setCurrentPhotoIndex(0);
        return nextList;
      });

      Alert.alert('Photo Removed', 'The photo has been removed successfully.');
    } catch (deleteError) {
      console.error('Photo deletion error:', deleteError);
      Alert.alert(
        'Delete Failed',
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to remove photo.',
      );
    }
  };

  const handleDeletePhoto = (photo: GalleryPhoto) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to permanently remove this photo?')) {
        void executeDeletePhoto(photo);
      }
      return;
    }

    Alert.alert(
      'Remove Photo',
      'Are you sure you want to permanently remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void executeDeletePhoto(photo),
        },
      ],
    );
  };

  /*
   * STATISTICS
   */
  const pendingCount = contributions.filter(
    (item) => item.verificationStatus === 'PENDING',
  ).length;

  const verifiedCount = contributions.filter(
    (item) => item.verificationStatus === 'VERIFIED',
  ).length;

  const totalContributions = contributions.length;

  const verifiedCollection = contributions
    .filter(
      (item) =>
        item.verificationStatus === 'VERIFIED' &&
        item.paymentStatus === 'SUCCESS',
    )
    .reduce(
      (total, item) => total + Number(item.amount || 0),
      0,
    );

  const adminModules: AdminModule[] = [
    {
      title: 'Payments',
      description: 'Collect online, QR and offline payments',
      icon: WalletCards,
      route: '/admin-payments',
    },
    {
      title: 'Members & Mentors',
      description: 'Manage members, mentors and roles',
      icon: UsersRound,
      route: '/admin-members',
    },
    {
      title: 'Contributions',
      description: 'Verify and manage all contributions',
      icon: WalletCards,
      route: '/admin-contributions',
    },
    {
      title: 'Expenses',
      description: 'Track expenses and money usage',
      icon: Receipt,
      route: '/admin-expenses',
    },
    {
      title: 'Finance & Reports',
      description: 'View collection and financial reports',
      icon: BarChart3,
      route: '/admin-finance',
    },
    {
      title: 'Photos & Videos',
      description: 'Manage TEAM BSY event media',
      icon: ImageIcon,
      route: '/admin-media',
    },
    {
      title: 'Reports & Archives',
      description: 'View organization records and reports',
      icon: FileText,
      route: '/admin-reports',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.teal}
          />
          <Text style={styles.loadingText}>
            Loading admin dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Unable to open Admin Dashboard
          </Text>

          <Text style={styles.errorMessage}>{error}</Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => void loadDashboard()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const activePhoto = galleryPhotos[currentPhotoIndex] || galleryPhotos[0];

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'bottom']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image
              source={require('../assets/images/bsy.jpg')}
              style={styles.headerLogo}
              resizeMode="contain"
            />

            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>TEAM BSY</Text>
              <Text style={styles.brandSubtitle}>ADMIN</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={styles.refreshButton}
              onPress={() => void handleRefresh()}
              disabled={refreshing}
              accessibilityRole="button"
              accessibilityLabel="Refresh dashboard"
            >
              {refreshing ? (
                <ActivityIndicator color={COLORS.ink} />
              ) : (
                <RefreshCw
                  size={21}
                  color={COLORS.ink}
                  strokeWidth={2.4}
                />
              )}
            </Pressable>

            <Pressable
              style={styles.menuButton}
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <Menu
                size={27}
                color={COLORS.ink}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>
        </View>

        {/* SHARED PHOTO GALLERY (SLIDESHOW) */}
        <View style={styles.gallerySection}>
          <View style={styles.galleryHeader}>
            <View style={styles.galleryTitleContainer}>
              <View style={styles.galleryIconCircle}>
                <GalleryHorizontal
                  size={21}
                  color={COLORS.tealDark}
                  strokeWidth={2.2}
                />
              </View>

              <View>
                <Text style={styles.galleryEyebrow}>
                  TEAM BSY MEMORIES
                </Text>
                <Text style={styles.galleryTitle}>
                  Our Moments
                </Text>
              </View>
            </View>

            {currentUserRole === 'ADMIN' && (
              <Pressable
                style={({ pressed }) => [
                  styles.addPhotoButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => void handleAddPhoto()}
                disabled={uploadingPhoto}
                accessibilityRole="button"
                accessibilityLabel="Add photo"
              >
                {uploadingPhoto ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />
                ) : (
                  <Plus
                    size={18}
                    color={COLORS.white}
                    strokeWidth={3}
                  />
                )}

                <Text style={styles.addPhotoText}>
                  {uploadingPhoto ? 'Uploading' : 'Add Photo'}
                </Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.galleryDescription}>
            Photos shared across the TEAM BSY community.
          </Text>

          {galleryLoading ? (
            <View style={styles.galleryLoading}>
              <ActivityIndicator
                size="small"
                color={COLORS.teal}
              />
              <Text style={styles.galleryLoadingText}>
                Loading photos...
              </Text>
            </View>
          ) : galleryPhotos.length > 0 && activePhoto ? (
            <View style={styles.slideshowContainer}>
              <View style={styles.slideshowCard}>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { opacity: fadeAnim },
                  ]}
                >
                  <Image
                    source={{ uri: activePhoto.url }}
                    style={styles.slideshowImage}
                    resizeMode="cover"
                  />
                </Animated.View>

                {currentUserRole === 'ADMIN' && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.deletePhotoButton,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleDeletePhoto(activePhoto)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                    hitSlop={12}
                  >
                    <Trash2
                      size={19}
                      color={COLORS.white}
                      strokeWidth={2.5}
                    />
                  </Pressable>
                )}

                <View style={styles.galleryOverlay}>
                  <Text style={styles.galleryOverlayText}>
                    TEAM BSY · {currentPhotoIndex + 1}/{galleryPhotos.length}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyGallery}>
              <View style={styles.emptyGalleryIcon}>
                <ImageIcon
                  size={27}
                  color={COLORS.teal}
                />
              </View>

              <Text style={styles.emptyGalleryTitle}>
                No photos yet
              </Text>

              <Text style={styles.emptyGalleryText}>
                {currentUserRole === 'ADMIN'
                  ? 'Add the first TEAM BSY memory.'
                  : 'Photos added by the admin will appear here.'}
              </Text>
            </View>
          )}
        </View>

        {/* ADMIN OVERVIEW */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>
            ADMIN OVERVIEW
          </Text>
        </View>

        {/* STAT CARDS */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <WalletCards
                size={21}
                color={COLORS.teal}
              />
            </View>
            <Text style={styles.statNumber}>
              {pendingCount}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <UsersRound
                size={21}
                color={COLORS.teal}
              />
            </View>
            <Text style={styles.statNumber}>—</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <WalletCards
                size={21}
                color={COLORS.teal}
              />
            </View>
            <Text
              style={styles.statNumber}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ₹{verifiedCollection.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel}>Collection</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <UsersRound
                size={21}
                color={COLORS.teal}
              />
            </View>
            <Text style={styles.statNumber}>—</Text>
            <Text style={styles.statLabel}>Mentors</Text>
          </View>
        </View>

        {/* CONTRIBUTION ACTIVITY */}
        <Pressable
          style={styles.collectionCard}
          onPress={() =>
            router.push('/admin-contributions')
          }
        >
          <View style={styles.collectionIcon}>
            <RefreshCw
              size={21}
              color={COLORS.teal}
            />
          </View>

          <View style={styles.collectionCopy}>
            <Text style={styles.collectionTitle}>
              Contribution activity
            </Text>
            <Text style={styles.collectionText}>
              {totalContributions} total · {verifiedCount}{' '}
              verified · {pendingCount} pending
            </Text>
          </View>

          <ChevronRight
            size={20}
            color={COLORS.muted}
          />
        </Pressable>

        {/* ADMIN MODULES */}
        <View style={styles.modulesHeader}>
          <Text style={styles.sectionEyebrow}>
            ADMIN MODULES
          </Text>
        </View>

        <View style={styles.modulesCard}>
          {adminModules.map((item, index) => {
            const Icon = item.icon;

            return (
              <Pressable
                key={item.title}
                style={[
                  styles.moduleRow,
                  index === adminModules.length - 1
                    ? styles.lastModuleRow
                    : null,
                ]}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.moduleIcon}>
                  <Icon
                    size={21}
                    color={COLORS.teal}
                    strokeWidth={2}
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
                  size={18}
                  color={COLORS.muted}
                />
              </Pressable>
            );
          })}
        </View>

        {/* INSTAGRAM */}
        <View style={styles.instagramSection}>
          <View style={styles.instagramIconCircle}>
            <ImageIcon
              size={25}
              color={COLORS.tealDark}
              strokeWidth={2}
            />
          </View>

          <Text style={styles.footerEyebrow}>
            STAY CONNECTED
          </Text>

          <Text style={styles.instagramTitle}>
            TEAM BSY ON INSTAGRAM
          </Text>

          <Text style={styles.instagramDescription}>
            Follow TEAM BSY for Ganesh Chaturthi
            {'\n'}
            updates, photos, videos and events.
          </Text>

          <Pressable
            style={styles.instagramButton}
            onPress={() =>
              void Linking.openURL(
                'https://www.instagram.com/basweshwara_youth_dmpr/',
              )
            }
          >
            <Text style={styles.instagramButtonText}>
              FOLLOW US ON INSTAGRAM
            </Text>
            <Text style={styles.instagramArrow}>↗</Text>
          </Pressable>

          <Text style={styles.instagramHandle}>
            @basweshwara_youth_dmpr
          </Text>
        </View>

        {/* OUR STORY */}
        <View style={styles.storySection}>
          <Text style={styles.footerEyebrow}>
            OUR STORY
          </Text>

          <Text style={styles.storyTitle}>
            A Tradition That Brings Us Together
          </Text>

          <Text style={styles.storyText}>
            The historic tradition of celebrating Ganesh Chaturthi
            in our village began with Kummari Thippapa, who proudly
            installed the very first idol.
          </Text>

          <Text style={styles.storyText}>
            Since then, this celebration has continued through
            generations, bringing our community together through
            devotion, unity, tradition and service.
          </Text>

          <Text style={styles.storyText}>
            TEAM BSY carries this spirit forward by connecting our
            people, contributions, celebrations, photos and memories
            in one place.
          </Text>
        </View>

        {/* ABOUT TEAM BSY */}
        <View style={styles.footerLinksSection}>
          <Text style={styles.footerSectionTitle}>
            ABOUT TEAM BSY
          </Text>

          {[
            'Our Story',
            'Our Tradition',
            'Our Team',
            'Contact Us',
            'Help & Support',
          ].map((label) => (
            <Pressable
              key={label}
              style={styles.footerLink}
              onPress={() => {}}
            >
              <Text style={styles.footerLinkText}>
                {label}
              </Text>
              <ChevronRight
                size={17}
                color={COLORS.muted}
              />
            </Pressable>
          ))}
        </View>

        {/* POLICIES */}
        <View style={styles.footerLinksSection}>
          <Text style={styles.footerSectionTitle}>
            POLICIES & INFORMATION
          </Text>

          {[
            'Privacy Policy',
            'Terms & Conditions',
            'Payment & Contribution Policy',
            'Refund Policy',
            'Community Guidelines',
            'Copyright',
          ].map((label) => (
            <Pressable
              key={label}
              style={styles.footerLink}
              onPress={() => {}}
            >
              <Text style={styles.footerLinkText}>
                {label}
              </Text>
              <ChevronRight
                size={17}
                color={COLORS.muted}
              />
            </Pressable>
          ))}
        </View>

        {/* COPYRIGHT */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © 2026 TEAM BSY
          </Text>
          <Text style={styles.copyrightSubtext}>
            Built with devotion, unity and tradition.
          </Text>
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.replace('/admin-dashboard')
          }
        >
          <Home
            size={22}
            color={COLORS.ink}
            strokeWidth={2.4}
          />
          <Text
            style={[styles.navText, styles.navTextActive]}
          >
            Dashboard
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() =>
            router.push('/admin-contributions')
          }
        >
          <WalletCards
            size={22}
            color={COLORS.muted}
          />
          <Text style={styles.navText}>
            Contributions
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/admin-payments')}
        >
          <WalletCards
            size={22}
            color={COLORS.muted}
          />
          <Text style={styles.navText}>Payments</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/admin-reports')}
        >
          <BarChart3
            size={22}
            color={COLORS.muted}
          />
          <Text style={styles.navText}>Reports</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/admin-settings')}
        >
          <Settings
            size={22}
            color={COLORS.muted}
          />
          <Text style={styles.navText}>Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 135,
  },

  header: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerLogo: {
    width: 58,
    height: 58,
    borderRadius: 12,
  },

  brandTextContainer: {
    marginLeft: 11,
  },

  brandTitle: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 1,
  },

  brandSubtitle: {
    color: COLORS.teal,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 3,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  refreshButton: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuButton: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gallerySection: {
    marginTop: 22,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingTop: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },

  galleryHeader: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  galleryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  galleryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  galleryEyebrow: {
    color: COLORS.teal,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  galleryTitle: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 3,
  },

  galleryDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
    paddingHorizontal: 18,
  },

  addPhotoButton: {
    minHeight: 43,
    backgroundColor: COLORS.tealDark,
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    cursor: 'pointer',
    zIndex: 10,
  },

  addPhotoText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 5,
  },

  slideshowContainer: {
    marginTop: 16,
    paddingHorizontal: 18,
    width: '100%',
  },

  slideshowCard: {
    width: '100%',
    height: 230,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.mintLight,
    position: 'relative',
  },

  slideshowImage: {
    width: '100%',
    height: '100%',
  },

  deletePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 10,
    cursor: 'pointer',
  },

  galleryOverlay: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(51,35,26,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    zIndex: 10,
  },

  galleryOverlayText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  galleryLoading: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  galleryLoadingText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 9,
  },

  emptyGallery: {
    marginHorizontal: 18,
    marginTop: 16,
    minHeight: 185,
    borderRadius: 23,
    backgroundColor: COLORS.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  emptyGalleryIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyGalleryTitle: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 11,
  },

  emptyGalleryText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
  },

  sectionHeader: {
    marginTop: 38,
    marginBottom: 14,
  },

  modulesHeader: {
    marginTop: 35,
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  statCard: {
    width: '48.5%',
    minHeight: 145,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statNumber: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 9,
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800',
  },

  collectionCard: {
    marginTop: 12,
    backgroundColor: COLORS.mintLight,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  collectionIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  collectionCopy: {
    flex: 1,
  },

  collectionTitle: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '900',
  },

  collectionText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  modulesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    overflow: 'hidden',
  },

  moduleRow: {
    minHeight: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  lastModuleRow: {
    borderBottomWidth: 0,
  },

  moduleIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    lineHeight: 15,
    marginTop: 3,
  },

  instagramSection: {
    marginTop: 34,
    backgroundColor: COLORS.mint,
    borderRadius: 32,
    paddingHorizontal: 25,
    paddingVertical: 32,
    alignItems: 'center',
  },

  instagramIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },

  footerEyebrow: {
    color: COLORS.tealDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    textAlign: 'center',
  },

  instagramTitle: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
    textAlign: 'center',
  },

  instagramDescription: {
    color: '#6F4B37',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },

  instagramButton: {
    minHeight: 52,
    backgroundColor: COLORS.tealDark,
    borderRadius: 17,
    paddingHorizontal: 20,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  instagramButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  instagramArrow: {
    color: COLORS.white,
    fontSize: 20,
    marginLeft: 9,
  },

  instagramHandle: {
    color: COLORS.tealDark,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 14,
    textAlign: 'center',
  },

  storySection: {
    marginTop: 30,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 23,
  },

  storyTitle: {
    color: COLORS.ink,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    marginTop: 10,
  },

  storyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
  },

  footerLinksSection: {
    marginTop: 30,
    backgroundColor: COLORS.white,
    borderRadius: 25,
    overflow: 'hidden',
  },

  footerSectionTitle: {
    color: COLORS.tealDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    paddingHorizontal: 18,
    paddingTop: 19,
    paddingBottom: 10,
  },

  footerLink: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerLinkText: {
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '700',
  },

  copyrightSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },

  copyrightText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '900',
  },

  copyrightSubtext: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 88,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
    paddingBottom: 7,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },

  navText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },

  navTextActive: {
    color: COLORS.ink,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 12,
  },

  errorContainer: {
    flex: 1,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorTitle: {
    color: COLORS.red,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  errorMessage: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },

  retryButton: {
    backgroundColor: COLORS.tealDark,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
    marginTop: 18,
  },

  retryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
});