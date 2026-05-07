import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { useProfile } from '../hooks/useProfile';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile && !profile.is_onboarding_complete) {
      navigation.replace('PersonalitySetup');
    }
  }, [profile, isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appName}>Witly</Text>
          <Text style={styles.tagline}>Your social confidence coach</Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TextingMode')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>Texting Mode</Text>
            <Text style={styles.cardSubtitle}>Help me text better</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('LiveMode')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>Live Mode</Text>
            <Text style={styles.cardSubtitle}>Help me in a live situation</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.editLink}
          onPress={() => navigation.navigate('PersonalitySetup')}
        >
          <Text style={styles.editLinkText}>My Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 6,
  },
  cards: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#fafafa',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  editLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  editLinkText: {
    color: '#999',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
