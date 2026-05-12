import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { listMoments } from '../../services/momentsService';
import { Moment } from '../../types/moments';
import { RELATIONSHIP_CONTEXTS } from '../../constants/humor';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radii, shadow } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'Moments'>;

const REL_LABELS: Record<string, string> = Object.fromEntries(
  RELATIONSHIP_CONTEXTS.map(r => [r.value, r.label]),
);

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MomentsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    backBtn: { padding: spacing.sm, alignSelf: 'flex-start' as const },
    backBtnText: { color: colors.textPrimary, fontSize: 28, fontWeight: typography.weights.bold },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: 12,
    },
    title: { fontSize: typography.sizes.title, fontWeight: typography.weights.bold, color: colors.textPrimary },
    newBtn: {
      backgroundColor: colors.accent,
      borderRadius: radii.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    newBtnText: { color: colors.surface, fontWeight: typography.weights.semibold, fontSize: typography.sizes.label },
    toggle: {
      flexDirection: 'row' as const,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      padding: 3,
    },
    toggleOption: { flex: 1, paddingVertical: 7, alignItems: 'center' as const, borderRadius: radii.sm },
    toggleOptionActive: { backgroundColor: colors.surface },
    toggleText: { fontSize: typography.sizes.label, fontWeight: typography.weights.medium, color: colors.textTertiary },
    toggleTextActive: { color: colors.textPrimary, fontWeight: typography.weights.semibold },
    centered: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing.sm },
    emptyText: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.textSecondary },
    emptySubtext: { fontSize: typography.sizes.label, color: colors.textTertiary },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: 12 },
    card: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      padding: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      gap: 10,
      ...shadow.card,
    },
    cardArchived: { opacity: 0.6 },
    cardTop: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, gap: spacing.sm },
    cardTitle: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.textPrimary, flex: 1 },
    cardTime: { fontSize: typography.sizes.small, color: colors.textTertiary, flexShrink: 0 },
    cardBottom: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 },
    relChip: { backgroundColor: colors.border, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: spacing.xs },
    relChipText: { fontSize: typography.sizes.small, color: colors.textSecondary },
    exchangeCount: { fontSize: typography.sizes.small, color: colors.textTertiary },
  }), [colors]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);
      listMoments(showArchived)
        .then(({ data }) => { if (active) setMoments(data); })
        .catch(() => {})
        .finally(() => { if (active) setIsLoading(false); });
      return () => { active = false; };
    }, [showArchived]),
  );

  const emptyText = showArchived ? 'No archived moments.' : 'No active moments yet.';
  const emptySubtext = showArchived ? '' : 'Start one to track an ongoing situation.';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Moments</Text>
        {!showArchived && (
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => navigation.navigate('MomentDetail', { momentId: null })}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleOption, !showArchived && styles.toggleOptionActive]}
          onPress={() => setShowArchived(false)}
        >
          <Text style={[styles.toggleText, !showArchived && styles.toggleTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, showArchived && styles.toggleOptionActive]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[styles.toggleText, showArchived && styles.toggleTextActive]}>Archived</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : moments.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          {emptySubtext !== '' && <Text style={styles.emptySubtext}>{emptySubtext}</Text>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {moments.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.card, m.is_archived && styles.cardArchived]}
              onPress={() => navigation.navigate('MomentDetail', { momentId: m.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{m.title}</Text>
                <Text style={styles.cardTime}>{timeAgo(m.last_active_at)}</Text>
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.relChip}>
                  <Text style={styles.relChipText}>
                    {REL_LABELS[m.relationship_context] ?? m.relationship_context}
                  </Text>
                </View>
                <Text style={styles.exchangeCount}>
                  {Math.floor(m.message_count / 2)}/19 exchanges
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
