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
import { colors, typography, spacing, radii } from '../theme';

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

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Moments')}
            activeOpacity={0.85}
          >
            <Text style={styles.cardTitle}>Moments</Text>
            <Text style={styles.cardSubtitle}>Track an ongoing situation</Text>
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
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: 36,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.sizes.base,
    color: colors.textTertiary,
    marginTop: 6,
  },
  cards: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.textTertiary,
  },
  editLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  editLinkText: {
    color: colors.textTertiary,
    fontSize: typography.sizes.label,
    textDecorationLine: 'underline',
  },
});
