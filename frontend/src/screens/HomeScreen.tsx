import React, { useEffect, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { typography, spacing, radii } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { profile, isLoading } = useProfile();
  const { colors, isDark, toggleTheme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: 36,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.xxl,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 4,
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
    themeToggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.border,
      padding: 3,
      justifyContent: 'center',
    },
    themeToggleOn: {
      backgroundColor: colors.accent,
    },
    themeThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignSelf: 'flex-start',
    },
    themeThumbOn: {
      alignSelf: 'flex-end',
    },
    avatarBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.bold,
      color: colors.textSecondary,
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
  }), [colors]);

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
          <View>
            <Text style={styles.appName}>Witly</Text>
            <Text style={styles.tagline}>Your social confidence coach</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.themeToggle, isDark && styles.themeToggleOn]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <View style={[styles.themeThumb, isDark && styles.themeThumbOn]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('PersonalitySetup')}
              activeOpacity={0.75}
            >
              <Text style={styles.avatarText}>
                {(profile?.username?.[0] ?? profile?.email?.[0] ?? '?').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
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
      </View>
    </SafeAreaView>
  );
}
