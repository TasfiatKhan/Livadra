import React, { useState, useCallback } from 'react';
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
  const [moments, setMoments] = useState<Moment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

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

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>← Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700' },
  newBtn: {
    backgroundColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 3,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleOptionActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#999' },
  toggleTextActive: { color: '#111', fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#999' },
  list: { paddingHorizontal: 24, paddingBottom: 48, gap: 12 },
  card: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fafafa',
    gap: 10,
  },
  cardArchived: { opacity: 0.6 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1 },
  cardTime: { fontSize: 12, color: '#aaa', flexShrink: 0 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  relChip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  relChipText: { fontSize: 12, color: '#555' },
  exchangeCount: { fontSize: 12, color: '#aaa' },
  backLink: { alignItems: 'center', paddingVertical: 16 },
  backLinkText: { color: '#666', fontSize: 14, textDecorationLine: 'underline' },
});
