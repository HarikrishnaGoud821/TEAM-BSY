import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
  changeAdminUserPassword,
  changeAdminUserRole,
  changeAdminUserStatus,
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
  type User,
} from '../src/services/api';

import { getUser } from '../src/services/session';

type Role = 'ADMIN' | 'MENTOR' | 'MEMBER' | 'VIEWER';

const ROLES: Role[] = ['ADMIN', 'MENTOR', 'MEMBER', 'VIEWER'];

const COLORS = {
  background: '#FFF9F4',
  white: '#FFFFFF',
  ink: '#33231A',
  orange: '#C96F32',
  orangeDark: '#9E4F20',
  lightOrange: '#FFF0E4',
  border: '#F0DED0',
  muted: '#8C7566',
  green: '#3C8C61',
  greenLight: '#EAF7EF',
  red: '#B84A4A',
  redLight: '#FCECEC',
};

export default function AdminMembersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [saving, setSaving] = useState(false);

  // Add user form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('MEMBER');

  // Edit form
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');

  // Password form
  const [newPassword, setNewPassword] = useState('');

  async function loadUsers(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const loggedInUser = await getUser();
      setCurrentUser(loggedInUser);

      if (!loggedInUser || loggedInUser.role !== 'ADMIN') {
        Alert.alert(
          'Access denied',
          'Only ADMIN users can access Members & Mentors.'
        );
        return;
      }

      const token = await getTokenSafely();

      if (!token) {
        Alert.alert(
          'Session expired',
          'Please login again.'
        );
        return;
      }

      const data = await getAdminUsers(token);
      setUsers(data);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Unable to load users',
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function getTokenSafely(): Promise<string> {
    const session = await import('../src/services/session');
    const token = await session.getToken();

    if (!token) {
      throw new Error('Authentication token not found.');
    }

    return token;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'ALL' ||
        user.role === roleFilter;

      if (!query) {
        return matchesRole;
      }

      const matchesSearch =
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.mobileNumber?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      mentors: users.filter((u) => u.role === 'MENTOR').length,
      members: users.filter((u) => u.role === 'MEMBER').length,
      viewers: users.filter((u) => u.role === 'VIEWER').length,
    };
  }, [users]);

  function resetAddForm() {
    setFullName('');
    setEmail('');
    setMobileNumber('');
    setPassword('');
    setSelectedRole('MEMBER');
  }

  function openAddModal() {
    resetAddForm();
    setShowAddModal(true);
  }

  function openDetails(user: User) {
    setSelectedUser(user);
    setShowDetailsModal(true);
  }

  function openEdit(user: User) {
    setSelectedUser(user);
    setEditFullName(user.fullName || '');
    setEditEmail(user.email || '');
    setEditMobile(user.mobileNumber || '');
    setShowEditModal(true);
  }

  function openPasswordChange(user: User) {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  }

  function openRoleChange(user: User) {
    setSelectedUser(user);
    setSelectedRole(
      isValidRole(user.role) ? user.role : 'MEMBER'
    );
    setShowRoleModal(true);
  }

  async function handleAddUser() {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Enter the full name.');
      return;
    }

    if (!mobileNumber.trim()) {
      Alert.alert('Required', 'Enter the mobile number.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Required', 'Enter the password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Invalid password',
        'Password must contain at least 6 characters.'
      );
      return;
    }

    try {
      setSaving(true);

      const token = await getTokenSafely();

      await createAdminUser(
  token,
  {
    fullName: fullName.trim(),
    email: email.trim(),
    mobileNumber: mobileNumber.trim(),
    password,
    role: selectedRole,
  }
);

      setShowAddModal(false);

      Alert.alert(
        'User created',
        `${fullName.trim()} has been added successfully.`
      );

      resetAddForm();
      await loadUsers(false);
    } catch (error) {
      Alert.alert(
        'Could not create user',
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleEditUser() {
    if (!selectedUser) {
      return;
    }

    if (!editFullName.trim()) {
      Alert.alert('Required', 'Enter the full name.');
      return;
    }

    if (!editMobile.trim()) {
      Alert.alert('Required', 'Enter the mobile number.');
      return;
    }

    try {
      setSaving(true);

      const token = await getTokenSafely();

      await updateAdminUser(
  token,
  selectedUser.id,
  {
    fullName: editFullName.trim(),
    email: editEmail.trim() || undefined,
    mobileNumber: editMobile.trim(),
  }
);

      setShowEditModal(false);

      Alert.alert(
        'Updated',
        'User details updated successfully.'
      );

      await loadUsers(false);
    } catch (error) {
      Alert.alert(
        'Update failed',
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange() {
    if (!selectedUser) {
      return;
    }

    try {
      setSaving(true);

      const token = await getTokenSafely();

      await changeAdminUserRole(
  token,
  selectedUser.id,
  selectedRole
);

      setShowRoleModal(false);

      Alert.alert(
        'Role updated',
        `${selectedUser.fullName} is now ${selectedRole}.`
      );

      await loadUsers(false);
    } catch (error) {
      Alert.alert(
        'Role change failed',
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (!selectedUser) {
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert(
        'Required',
        'Enter the new password.'
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        'Invalid password',
        'Password must contain at least 6 characters.'
      );
      return;
    }

    try {
      setSaving(true);

      const token = await getTokenSafely();

      await changeAdminUserPassword(
  token,
  selectedUser.id,
  newPassword
);

      setShowPasswordModal(false);
      setNewPassword('');

      Alert.alert(
        'Password changed',
        'The password was changed successfully.'
      );
    } catch (error) {
      Alert.alert(
        'Password change failed',
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(user: User) {
    const nextStatus = !user.enabled;

    Alert.alert(
      nextStatus ? 'Enable user?' : 'Disable user?',
      `${user.fullName} will be ${
        nextStatus ? 'enabled' : 'disabled'
      }.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: nextStatus ? 'Enable' : 'Disable',
          style: nextStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              const token = await getTokenSafely();

              await changeAdminUserStatus(
  token,
  user.id,
  nextStatus
);

              await loadUsers(false);

              Alert.alert(
                'Status updated',
                `${user.fullName} is now ${
                  nextStatus ? 'enabled' : 'disabled'
                }.`
              );
            } catch (error) {
              Alert.alert(
                'Status change failed',
                getErrorMessage(error)
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  async function handleDelete(user: User) {
    Alert.alert(
      'Delete user?',
      `This will permanently delete ${user.fullName}.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              const token = await getTokenSafely();

              await deleteAdminUser(
  token,
  user.id
);

              setShowDetailsModal(false);
              setSelectedUser(null);

              await loadUsers(false);

              Alert.alert(
                'Deleted',
                `${user.fullName} has been deleted.`
              );
            } catch (error) {
              Alert.alert(
                'Delete failed',
                getErrorMessage(error)
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  function renderUser({ item }: { item: User }) {
    return (
      <Pressable
        style={styles.userCard}
        onPress={() => openDetails(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.fullName || '?')
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.userMain}>
          <Text style={styles.userName}>
            {item.fullName || 'Unnamed User'}
          </Text>

          <Text style={styles.userMobile}>
            {item.mobileNumber}
          </Text>

          <Text style={styles.userEmail}>
            {item.email || 'No email'}
          </Text>
        </View>

        <View style={styles.userRight}>
          <View
            style={[
              styles.roleBadge,
              getRoleStyle(item.role),
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                getRoleTextStyle(item.role),
              ]}
            >
              {item.role}
            </Text>
          </View>

          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: item.enabled
                  ? COLORS.green
                  : COLORS.red,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: item.enabled
                  ? COLORS.green
                  : COLORS.red,
              },
            ]}
          >
            {item.enabled ? 'Active' : 'Disabled'}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.orange}
          />

          <Text style={styles.loadingText}>
            Loading users...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedTitle}>
            Access Denied
          </Text>

          <Text style={styles.accessDeniedText}>
            Only ADMIN users can manage members and mentors.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Members & Mentors
            </Text>

            <Text style={styles.subtitle}>
              Manage TEAM BSY users and roles
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={openAddModal}
          >
            <Text style={styles.addButtonText}>
              + Add
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="All"
            value={counts.all}
            active={roleFilter === 'ALL'}
            onPress={() => setRoleFilter('ALL')}
          />

          <StatCard
            label="Admins"
            value={counts.admins}
            active={roleFilter === 'ADMIN'}
            onPress={() => setRoleFilter('ADMIN')}
          />

          <StatCard
            label="Mentors"
            value={counts.mentors}
            active={roleFilter === 'MENTOR'}
            onPress={() => setRoleFilter('MENTOR')}
          />

          <StatCard
            label="Members"
            value={counts.members}
            active={roleFilter === 'MEMBER'}
            onPress={() => setRoleFilter('MEMBER')}
          />
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>
            🔍
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, mobile, email or role..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterButton
            label="All Users"
            active={roleFilter === 'ALL'}
            onPress={() => setRoleFilter('ALL')}
          />

          {ROLES.map((role) => (
            <FilterButton
              key={role}
              label={role}
              active={roleFilter === role}
              onPress={() => setRoleFilter(role)}
            />
          ))}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Users
          </Text>

          <Text style={styles.resultCount}>
            {filteredUsers.length} result
            {filteredUsers.length === 1 ? '' : 's'}
          </Text>
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderUser}
          contentContainerStyle={
            filteredUsers.length === 0
              ? styles.emptyList
              : styles.listContent
          }
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadUsers(false);
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                👥
              </Text>

              <Text style={styles.emptyTitle}>
                No users found
              </Text>

              <Text style={styles.emptyText}>
                Try another search or role filter.
              </Text>
            </View>
          }
        />
      </View>

      {/* ADD USER MODAL */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowAddModal(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalCard}>
            <ModalHeader
              title="Add User"
              subtitle="Create a new TEAM BSY account"
              onClose={() =>
                setShowAddModal(false)
              }
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.modalContent
              }
            >
              <Field
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
              />

              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Field
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
              />

              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                secureTextEntry
              />

              <Text style={styles.fieldLabel}>
                Role
              </Text>

              <RoleSelector
                selectedRole={selectedRole}
                onSelect={setSelectedRole}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  saving && styles.disabledButton,
                ]}
                disabled={saving}
                onPress={handleAddUser}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={styles.primaryButtonText}
                  >
                    Create User
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowEditModal(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalCard}>
            <ModalHeader
              title="Edit User"
              subtitle="Update account details"
              onClose={() =>
                setShowEditModal(false)
              }
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.modalContent
              }
            >
              <Field
                label="Full Name"
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Full name"
              />

              <Field
                label="Email"
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Field
                label="Mobile Number"
                value={editMobile}
                onChangeText={setEditMobile}
                placeholder="Mobile number"
                keyboardType="phone-pad"
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  saving && styles.disabledButton,
                ]}
                disabled={saving}
                onPress={handleEditUser}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={styles.primaryButtonText}
                  >
                    Save Changes
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* USER DETAILS MODAL */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowDetailsModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsCard}>
            <ModalHeader
              title="User Details"
              subtitle="Manage account"
              onClose={() =>
                setShowDetailsModal(false)
              }
            />

            {selectedUser && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={
                  styles.modalContent
                }
              >
                <View style={styles.profileHeader}>
                  <View style={styles.largeAvatar}>
                    <Text
                      style={styles.largeAvatarText}
                    >
                      {(selectedUser.fullName || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.profileName}>
                    {selectedUser.fullName}
                  </Text>

                  <View
                    style={[
                      styles.roleBadge,
                      getRoleStyle(
                        selectedUser.role
                      ),
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        getRoleTextStyle(
                          selectedUser.role
                        ),
                      ]}
                    >
                      {selectedUser.role}
                    </Text>
                  </View>
                </View>

                <DetailRow
                  label="User ID"
                  value={String(
                    selectedUser.id
                  )}
                />

                <DetailRow
                  label="Mobile"
                  value={
                    selectedUser.mobileNumber
                  }
                />

                <DetailRow
                  label="Email"
                  value={
                    selectedUser.email ||
                    'Not provided'
                  }
                />

                <DetailRow
                  label="Status"
                  value={
                    selectedUser.enabled
                      ? 'Active'
                      : 'Disabled'
                  }
                />

                <View style={styles.actionGrid}>
                  <ActionButton
                    label="Edit Details"
                    onPress={() => {
                      setShowDetailsModal(false);
                      openEdit(selectedUser);
                    }}
                  />

                  <ActionButton
                    label="Change Role"
                    onPress={() => {
                      setShowDetailsModal(false);
                      openRoleChange(
                        selectedUser
                      );
                    }}
                  />

                  <ActionButton
                    label="Password"
                    onPress={() => {
                      setShowDetailsModal(false);
                      openPasswordChange(
                        selectedUser
                      );
                    }}
                  />

                  <ActionButton
                    label={
                      selectedUser.enabled
                        ? 'Disable'
                        : 'Enable'
                    }
                    danger={
                      selectedUser.enabled
                    }
                    onPress={() =>
                      handleStatusChange(
                        selectedUser
                      )
                    }
                  />

                  <ActionButton
                    label="Delete User"
                    danger
                    onPress={() =>
                      handleDelete(
                        selectedUser
                      )
                    }
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowPasswordModal(false)
        }
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalCard}>
            <ModalHeader
              title="Change Password"
              subtitle={
                selectedUser
                  ? selectedUser.fullName
                  : ''
              }
              onClose={() =>
                setShowPasswordModal(false)
              }
            />

            <View style={styles.modalContent}>
              <Field
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  saving && styles.disabledButton,
                ]}
                disabled={saving}
                onPress={handlePasswordChange}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={styles.primaryButtonText}
                  >
                    Change Password
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CHANGE ROLE MODAL */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowRoleModal(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ModalHeader
              title="Change Role"
              subtitle={
                selectedUser
                  ? selectedUser.fullName
                  : ''
              }
              onClose={() =>
                setShowRoleModal(false)
              }
            />

            <View style={styles.modalContent}>
              <RoleSelector
                selectedRole={selectedRole}
                onSelect={setSelectedRole}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  saving && styles.disabledButton,
                ]}
                disabled={saving}
                onPress={handleRoleChange}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={styles.primaryButtonText}
                  >
                    Save Role
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.statCard,
        active && styles.statCardActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.statValue,
          active && styles.statValueActive,
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.statLabel,
          active && styles.statLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.filterButton,
        active && styles.filterButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          active && styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        style={styles.input}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={
          autoCapitalize || 'sentences'
        }
      />
    </View>
  );
}

function RoleSelector({
  selectedRole,
  onSelect,
}: {
  selectedRole: Role;
  onSelect: (role: Role) => void;
}) {
  return (
    <View style={styles.roleSelector}>
      {ROLES.map((role) => {
        const active = selectedRole === role;

        return (
          <Pressable
            key={role}
            style={[
              styles.roleOption,
              active &&
                styles.roleOptionActive,
            ]}
            onPress={() => onSelect(role)}
          >
            <Text
              style={[
                styles.roleOptionText,
                active &&
                  styles.roleOptionTextActive,
              ]}
            >
              {role}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.modalHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.modalTitle}>
          {title}
        </Text>

        <Text style={styles.modalSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Pressable
        style={styles.closeButton}
        onPress={onClose}
      >
        <Text style={styles.closeButtonText}>
          ×
        </Text>
      </Pressable>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.actionButton,
        danger && styles.actionButtonDanger,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.actionButtonText,
          danger &&
            styles.actionButtonDangerText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------------- HELPERS ---------------- */

function isValidRole(
  role: string
): role is Role {
  return (
    role === 'ADMIN' ||
    role === 'MENTOR' ||
    role === 'MEMBER' ||
    role === 'VIEWER'
  );
}

function getRoleStyle(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        backgroundColor: '#FCE5D5',
      };

    case 'MENTOR':
      return {
        backgroundColor: '#E8F1FF',
      };

    case 'VIEWER':
      return {
        backgroundColor: '#F0EAF8',
      };

    default:
      return {
        backgroundColor: '#EAF7EF',
      };
  }
}

function getRoleTextStyle(role: string) {
  switch (role) {
    case 'ADMIN':
      return {
        color: '#9E4F20',
      };

    case 'MENTOR':
      return {
        color: '#3567A8',
      };

    case 'VIEWER':
      return {
        color: '#7652A3',
      };

    default:
      return {
        color: '#3C8C61',
      };
  }
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 18,
  },

  title: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: '900',
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  addButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 13,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },

  statCardActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },

  statValue: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: '900',
  },

  statValueActive: {
    color: '#FFFFFF',
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
    fontWeight: '700',
  },

  statLabelActive: {
    color: '#FFFFFF',
  },

  searchBox: {
    height: 48,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 13,
  },

  filterRow: {
    gap: 8,
    paddingVertical: 12,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterButtonActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '800',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  listTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '900',
  },

  resultCount: {
    color: COLORS.muted,
    fontSize: 11,
  },

  listContent: {
    paddingBottom: 30,
  },

  userCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  avatarText: {
    color: COLORS.orangeDark,
    fontSize: 18,
    fontWeight: '900',
  },

  userMain: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '900',
  },

  userMobile: {
    color: COLORS.orangeDark,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '700',
  },

  userEmail: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },

  userRight: {
    alignItems: 'flex-end',
    marginLeft: 7,
  },

  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  roleBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginBottom: 2,
  },

  statusText: {
    fontSize: 8,
    fontWeight: '700',
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    padding: 30,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontWeight: '900',
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: COLORS.muted,
    marginTop: 10,
    fontSize: 13,
  },

  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  accessDeniedTitle: {
    color: COLORS.red,
    fontSize: 25,
    fontWeight: '900',
  },

  accessDeniedText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 20, 15, 0.45)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '92%',
    paddingTop: 8,
  },

  detailsCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
    paddingTop: 8,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },

  modalTitle: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  closeButtonText: {
    color: COLORS.ink,
    fontSize: 25,
    lineHeight: 27,
  },

  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  fieldContainer: {
    marginTop: 12,
  },

  fieldLabel: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },

  input: {
    height: 48,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    color: COLORS.ink,
    fontSize: 13,
  },

  roleSelector: {
    gap: 8,
    marginBottom: 18,
  },

  roleOption: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  roleOptionActive: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orange,
  },

  roleOptionText: {
    color: COLORS.ink,
    fontSize: 12,
    fontWeight: '800',
  },

  roleOptionTextActive: {
    color: '#FFFFFF',
  },

  primaryButton: {
    height: 49,
    backgroundColor: COLORS.orange,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.6,
  },

  profileHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },

  largeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  largeAvatarText: {
    color: COLORS.orangeDark,
    fontSize: 28,
    fontWeight: '900',
  },

  profileName: {
    color: COLORS.ink,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 7,
  },

  detailRow: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 13,
    marginBottom: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  detailLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  detailValue: {
    color: COLORS.ink,
    fontSize: 11,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },

  actionGrid: {
    marginTop: 10,
    gap: 8,
  },

  actionButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },

  actionButtonDanger: {
    borderColor: '#F0CACA',
    backgroundColor: COLORS.redLight,
  },

  actionButtonText: {
    color: COLORS.orangeDark,
    fontSize: 12,
    fontWeight: '900',
  },

  actionButtonDangerText: {
    color: COLORS.red,
  },
});