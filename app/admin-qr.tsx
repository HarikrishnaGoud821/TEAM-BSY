import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminQrScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>QR Collection</Text>
        <Text style={styles.subtitle}>
          QR contribution collection will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FBF9',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#102F2D',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: '#78908E',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
