import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { getSavedResponses, SavedResponseItem } from '../services/responsesService';
import { colors, typography, spacing, radii, shadow } from '../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'SavedResponses'>;

const OPTION_LABELS: Record<SavedResponseItem['option_type'], string> = {
  safe: 'Safe',
  playful: 'Playful',
  bold: 'Bold',
};

const OPTION_COLORS: Record<SavedResponseItem['option_type'], string> = {
  safe: colors.safe,
  playful: colors.playful,
  bold: colors.bold,
};

const MODE_LABELS: Record<string, string> = {
  texting: 'Texting',
  live: 'Live',
  live_voice: 'Live Voice',
  moments: 'Moments',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SavedCard({ item }: { item: SavedResponseItem }) {
  const color = OPTION_COLORS[item.option_type];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.pill, { backgroundColor: color }]}>
          <Text style={styles.pillText}>{OPTION_LABELS[item.option_type]}</Text>
        </View>
        <Text style={styles.meta}>
          {MODE_LABELS[item.mode] ?? item.mode}
          {item.relationship_context ? ` · ${item.relationship_context}` : ''}
        </Text>
        <Text style={styles.timestamp}>{timeAgo(item.created_at)}</Text>
      </View>
      {item.situation_summary !== '' && (
        <Text style={styles.situation} numberOfLines={2}>{item.situation_summary}</Text>
      )}
      <Text style={styles.optionText}>{item.option_text}</Text>
    </View>
  );
}

export default function SavedResponsesScreen({ navigation }: Props) {
  const [items, setItems] = useState<SavedResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setIsLoading(true);
        setError('');
        try {
          const data = await getSavedResponses();
          setItems(data);
        } catch {
          setError('Failed to load saved responses.');
        } finally {
          setIsLoading(false);
        }
      }
      fetchData();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Saved Responses</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : error !== '' ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>No saved responses yet.</Text>
          <Text style={styles.emptySub}>Tap 💾 Save on any suggestion to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <SavedCard item={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  backBtn: { paddingBottom: spacing.xs },
  backBtnText: { fontSize: typography.sizes.base, color: colors.textSecondary },
  title: { fontSize: typography.sizes.title, fontWeight: typography.weights.bold, color: colors.textPrimary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  error: { color: colors.error, fontSize: typography.sizes.label, textAlign: 'center' },
  empty: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.textSecondary, textAlign: 'center' },
  emptySub: { fontSize: typography.sizes.label, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm },
  list: { paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: spacing.xxl, gap: 12 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: spacing.sm,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: { color: colors.surface, fontSize: 11, fontWeight: typography.weights.bold, letterSpacing: 0.4 },
  meta: { fontSize: typography.sizes.small, color: colors.textTertiary, flex: 1 },
  timestamp: { fontSize: 11, color: colors.textTertiary },
  situation: { fontSize: typography.sizes.label, color: colors.textTertiary, fontStyle: 'italic', lineHeight: 18 },
  optionText: { fontSize: typography.sizes.base, lineHeight: 22, color: colors.textPrimary, fontWeight: typography.weights.medium },
});
