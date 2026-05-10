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

type Props = NativeStackScreenProps<MainStackParamList, 'SavedResponses'>;

const OPTION_LABELS: Record<SavedResponseItem['option_type'], string> = {
  safe: 'Safe',
  playful: 'Playful',
  bold: 'Bold',
};

const OPTION_COLORS: Record<SavedResponseItem['option_type'], string> = {
  safe: '#4a90d9',
  playful: '#e67e22',
  bold: '#c0392b',
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
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 4,
  },
  backBtn: { paddingBottom: 4 },
  backBtnText: { fontSize: 15, color: '#555' },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  error: { color: '#e53e3e', fontSize: 14, textAlign: 'center' },
  empty: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 48, gap: 12 },
  card: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  meta: { fontSize: 12, color: '#888', flex: 1 },
  timestamp: { fontSize: 11, color: '#bbb' },
  situation: { fontSize: 13, color: '#999', fontStyle: 'italic', lineHeight: 18 },
  optionText: { fontSize: 15, lineHeight: 22, color: '#111', fontWeight: '500' },
});
