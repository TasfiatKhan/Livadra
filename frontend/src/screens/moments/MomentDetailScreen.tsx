import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Audio } from 'expo-av';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { createMoment, getMoment, continueMoment, toggleMomentArchive } from '../../services/momentsService';
import { submitFeedback, saveResponse, trackCopy } from '../../services/responsesService';
import { MomentDetail, MomentMessage } from '../../types/moments';
import { AIOption, AIResponse } from '../../types/humor';
import { RELATIONSHIP_CONTEXTS } from '../../constants/humor';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radii, shadow } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'MomentDetail'>;
type RecordingState = 'idle' | 'recording' | 'processing';

const OPTION_LABELS: Record<AIOption['type'], string> = {
  safe: 'Safe',
  playful: 'Playful',
  bold: 'Bold',
};

const MOMENT_FEEDBACK_BUTTONS = [
  { type: 'natural', label: '👍 Natural' },
  { type: 'loved', label: '🔥 Loved It' },
  { type: 'cringe', label: '😬 Cringe' },
  { type: 'risky', label: '⚠️ Too Risky' },
] as const;

export default function MomentDetailScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const OPTION_COLORS: Record<AIOption['type'], string> = { safe: colors.safe, playful: colors.playful, bold: colors.bold };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    centered: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
    formScroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
    backBtn: { paddingVertical: spacing.xs, paddingRight: 12 },
    backBtnText: { fontSize: typography.sizes.base, color: colors.textSecondary },
    title: { fontSize: typography.sizes.title, fontWeight: typography.weights.bold, marginBottom: spacing.sm, color: colors.textPrimary },
    label: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, marginTop: 12, marginBottom: 6, color: colors.textPrimary },
    optionalHint: { fontWeight: typography.weights.regular, color: colors.textTertiary, fontSize: typography.sizes.label },
    chipGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: spacing.sm, backgroundColor: colors.surfaceSecondary },
    chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: typography.sizes.label, color: colors.textSecondary },
    chipTextSelected: { color: colors.surface, fontWeight: typography.weights.semibold },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.sizes.base, color: colors.textPrimary, backgroundColor: colors.surface },
    textArea: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.sizes.base, minHeight: 120, color: colors.textPrimary, backgroundColor: colors.surface },
    button: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, alignItems: 'center' as const, marginTop: spacing.md },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: colors.surface, fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
    error: { color: colors.error, fontSize: typography.sizes.label, textAlign: 'center' as const, marginTop: spacing.sm },
    dividerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginTop: 20, gap: 10 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: typography.sizes.label, color: colors.textTertiary },
    recordSection: { alignItems: 'center' as const, marginTop: spacing.md, marginBottom: spacing.sm, gap: 12 },
    recordButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.textPrimary, alignItems: 'center' as const, justifyContent: 'center' as const },
    recordButtonActive: { backgroundColor: colors.error },
    recordButtonDisabled: { opacity: 0.35 },
    recordDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.surface },
    recordLabel: { fontSize: typography.sizes.label, color: colors.textSecondary, textAlign: 'center' as const },
    recordLabelMuted: { color: colors.textTertiary },
    threadHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
    threadTitle: { flex: 1, fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.textPrimary },
    exchangeCount: { fontSize: typography.sizes.small, color: colors.textTertiary, flexShrink: 0 },
    archiveBtn: { paddingHorizontal: 10, paddingVertical: spacing.xs, marginLeft: spacing.xs },
    archiveBtnText: { fontSize: typography.sizes.label, color: colors.textTertiary },
    threadScroll: { paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: spacing.md, gap: 12 },
    userBubbleRow: { alignItems: 'flex-end' as const },
    userBubble: { backgroundColor: colors.accent, borderRadius: radii.lg, borderBottomRightRadius: spacing.xs, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '85%' as const },
    userBubbleText: { color: colors.surface, fontSize: typography.sizes.base, lineHeight: 22 },
    assistantCard: { backgroundColor: colors.surfaceSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: spacing.sm, ...shadow.card },
    optionPill: { alignSelf: 'flex-start' as const, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 3 },
    optionPillText: { color: colors.surface, fontSize: 11, fontWeight: typography.weights.bold, letterSpacing: 0.4 },
    optionText: { fontSize: typography.sizes.base, lineHeight: 22, color: colors.textPrimary, fontWeight: typography.weights.medium },
    optionNote: { fontSize: typography.sizes.label, color: colors.textTertiary, fontStyle: 'italic' as const },
    cardNav: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: spacing.md, marginTop: spacing.xs },
    navArrow: { padding: spacing.xs },
    navArrowText: { fontSize: 26, color: colors.textSecondary, lineHeight: 30 },
    navArrowDisabled: { color: colors.textTertiary },
    navCounter: { fontSize: typography.sizes.label, color: colors.textTertiary, minWidth: 40, textAlign: 'center' as const },
    copyButton: { alignSelf: 'flex-end' as const, paddingVertical: 2, paddingHorizontal: 2 },
    copyButtonText: { fontSize: typography.sizes.label, color: colors.textTertiary },
    copyButtonTextCopied: { color: colors.success, fontWeight: typography.weights.semibold },
    deliveryToggle: { alignItems: 'center' as const, paddingVertical: 6 },
    deliveryToggleText: { fontSize: typography.sizes.label, color: colors.accent },
    deliveryCard: { backgroundColor: colors.accentSoft, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border, padding: 12 },
    deliveryText: { fontSize: typography.sizes.label, lineHeight: typography.lineHeights.label, color: colors.textSecondary },
    feedbackRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: spacing.xs },
    feedbackBtn: { borderRadius: radii.lg, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.surfaceSecondary },
    feedbackBtnActive: { backgroundColor: colors.textPrimary },
    feedbackBtnSaved: { backgroundColor: colors.success },
    feedbackBtnText: { fontSize: 11, color: colors.textSecondary },
    feedbackBtnTextActive: { color: colors.surface, fontWeight: typography.weights.semibold },
    coachingCard: { backgroundColor: colors.accentSoft, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center' as const },
    coachingText: { fontSize: typography.sizes.label, color: colors.accent, fontStyle: 'italic' as const, textAlign: 'center' as const },
    archivedBanner: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' as const, gap: 6 },
    archivedText: { fontSize: typography.sizes.label, color: colors.textTertiary, textAlign: 'center' as const },
    archivedLink: { fontSize: typography.sizes.label, color: colors.accent, fontWeight: typography.weights.semibold },
    continueBar: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
    continueRecordBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.textSecondary, alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0 },
    continueRecordBtnActive: { backgroundColor: colors.error },
    continueRecordBtnDisabled: { opacity: 0.35 },
    continueRecordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surface },
    continueInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: typography.sizes.base, maxHeight: 100, color: colors.textPrimary, backgroundColor: colors.surface },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center' as const, justifyContent: 'center' as const },
    sendBtnDisabled: { opacity: 0.35 },
    sendBtnText: { color: colors.surface, fontSize: 20, fontWeight: typography.weights.semibold },
  }), [colors]);
  const [localMomentId, setLocalMomentId] = useState<number | null>(route.params.momentId);
  const [moment, setMoment] = useState<MomentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Creation form state
  const [relContext, setRelContext] = useState('');
  const [relOther, setRelOther] = useState('');
  const [initialInput, setInitialInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Voice recording state (creation form only)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Thread state
  const [newInput, setNewInput] = useState('');
  const [isContinuing, setIsContinuing] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [cardIndices, setCardIndices] = useState<Record<number, number>>({});
  const [msgFeedback, setMsgFeedback] = useState<Record<number, string | null>>({});
  const [msgSaved, setMsgSaved] = useState<Record<number, Set<string>>>({});
  const [msgCopied, setMsgCopied] = useState<Record<number, boolean>>({});
  const [deliveryExpanded, setDeliveryExpanded] = useState<Record<number, boolean>>({});

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (localMomentId !== null) {
      setIsLoading(true);
      getMoment(localMomentId)
        .then(({ data }) => setMoment(data))
        .catch(() => setError('Failed to load moment.'))
        .finally(() => setIsLoading(false));
    }
  }, [localMomentId]);

  useEffect(() => {
    if (moment?.messages?.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [moment?.messages?.length]);

  const buildContextFormData = (): FormData => {
    const formData = new FormData();
    formData.append('relationship_context', relContext);
    if (relOther.trim()) formData.append('relationship_other', relOther.trim());
    return formData;
  };

  const submitMoment = async (formData: FormData) => {
    setError('');
    try {
      const { data } = await createMoment(formData);
      setLocalMomentId(data.moment_id);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to start moment. Please try again.');
    }
  };

  // Text submission
  const handleCreate = async () => {
    if (!relContext || !initialInput.trim() || isCreating || recordingState !== 'idle') return;
    setIsCreating(true);
    const formData = buildContextFormData();
    formData.append('initial_input', initialInput.trim());
    await submitMoment(formData);
    setIsCreating(false);
  };

  // Voice recording
  const startRecording = async () => {
    if (recordingState !== 'idle') return;
    if (localMomentId === null && !relContext) return; // creation form requires relationship selected
    setError('');
    try {
      if (recording) {
        await recording.stopAndUnloadAsync().catch(() => {});
        setRecording(null);
      }
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission is required.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setRecordingState('recording');

      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.22, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      pulseLoop.current.start();
    } catch (e: any) {
      console.error('Recording error:', e);
      setError('Could not start recording: ' + (e?.message ?? 'unknown error'));
    }
  };

  const stopRecording = async () => {
    if (!recording || recordingState !== 'recording') return;
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
    setRecordingState('processing');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('No audio URI');

      const filename = uri.split('/').pop() ?? 'recording.m4a';
      const type = filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/m4a';

      if (localMomentId === null) {
        // Creation path
        const formData = buildContextFormData();
        formData.append('audio', { uri, name: filename, type } as any);
        await submitMoment(formData);
      } else {
        // Continuation path
        const formData = new FormData();
        formData.append('audio', { uri, name: filename, type } as any);
        setIsContinuing(true);
        setError('');
        try {
          const { data } = await continueMoment(localMomentId, formData);
          setMoment(prev => {
            if (!prev) return prev;
            const assistantContent = JSON.stringify({ options: data.options, delivery: data.delivery, coaching: (data as any).coaching ?? false });
            return {
              ...prev,
              is_archived: data.is_archived,
              messages: [
                ...prev.messages,
                { id: Date.now(), role: 'user', content: data.user_input || '(no speech captured)', response_record_id: null, created_at: new Date().toISOString() },
                { id: Date.now() + 1, role: 'assistant', content: assistantContent, response_record_id: data.record_id ?? null, created_at: new Date().toISOString() },
              ],
            };
          });
        } catch (e: any) {
          setError(e?.response?.data?.detail ?? 'Failed to continue. Please try again.');
        } finally {
          setIsContinuing(false);
        }
      }
    } catch (e: any) {
      setError('Could not process recording: ' + (e?.message ?? 'unknown error'));
    } finally {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
      setRecordingState('idle');
    }
  };

  const handleContinue = async () => {
    const input = newInput.trim();
    if (!input || !localMomentId || isContinuing) return;
    setNewInput('');
    setIsContinuing(true);
    setError('');
    try {
      const { data } = await continueMoment(localMomentId, { new_input: input });
      setMoment(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          is_archived: data.is_archived,
          messages: [
            ...prev.messages,
            { id: Date.now(), role: 'user', content: input, response_record_id: null, created_at: new Date().toISOString() },
            { id: Date.now() + 1, role: 'assistant', content: JSON.stringify({ options: data.options, delivery: data.delivery }), response_record_id: data.record_id ?? null, created_at: new Date().toISOString() },
          ],
        };
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to continue. Please try again.');
      setNewInput(input);
    } finally {
      setIsContinuing(false);
    }
  };

  const setCardIndex = (msgIdx: number, idx: number) => {
    setCardIndices(prev => ({ ...prev, [msgIdx]: idx }));
  };

  const handleMsgFeedback = async (msgId: number, recordId: number, type: string) => {
    const current = msgFeedback[msgId] ?? null;
    setMsgFeedback(prev => ({ ...prev, [msgId]: current === type ? null : type }));
    try { await submitFeedback(recordId, type); } catch {}
  };

  const handleMsgSave = async (msgId: number, recordId: number, optionType: string, optionText: string) => {
    const saved = msgSaved[msgId] ?? new Set<string>();
    if (saved.has(optionType)) return;
    setMsgSaved(prev => ({ ...prev, [msgId]: new Set([...(prev[msgId] ?? []), optionType]) }));
    try { await saveResponse(recordId, optionType, optionText); } catch {}
  };

  const handleCopy = async (msgId: number, recordId: number | null, text: string, optionType: string) => {
    await Clipboard.setStringAsync(text);
    setMsgCopied(prev => ({ ...prev, [msgId]: true }));
    setTimeout(() => setMsgCopied(prev => ({ ...prev, [msgId]: false })), 1500);
    if (recordId != null) {
      try { await trackCopy(recordId, optionType); } catch {}
    }
  };

  const toggleDelivery = (msgId: number) => {
    setDeliveryExpanded(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleToggleArchive = () => {
    if (!localMomentId || isArchiving || !moment) return;
    const willArchive = !moment.is_archived;
    Alert.alert(
      willArchive ? 'Archive this moment?' : 'Unarchive this moment?',
      willArchive ? "You won't be able to continue it until you unarchive it." : 'This will move it back to your active moments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: willArchive ? 'Archive' : 'Unarchive',
          style: willArchive ? 'destructive' : 'default',
          onPress: async () => {
            setIsArchiving(true);
            try {
              const { data } = await toggleMomentArchive(localMomentId);
              setMoment(prev => prev ? { ...prev, is_archived: data.is_archived } : prev);
            } catch (e: any) {
              setError(e?.response?.data?.detail ?? `Failed to ${willArchive ? 'archive' : 'unarchive'}. Please try again.`);
            } finally {
              setIsArchiving(false);
            }
          },
        },
      ],
    );
  };

  const toggleRecording = () => {
    if (recordingState === 'idle') startRecording();
    else if (recordingState === 'recording') stopRecording();
  };

  const canRecord = relContext !== '';
  const formBusy = isCreating || recordingState !== 'idle';

  // --- Creation form ---
  if (localMomentId === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Moment</Text>

            <Text style={styles.label}>Who are you talking to?</Text>
            <View style={styles.chipGrid}>
              {RELATIONSHIP_CONTEXTS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, relContext === opt.value && styles.chipSelected]}
                  onPress={() => {
                    setRelContext(opt.value);
                    if (opt.value !== 'other') setRelOther('');
                  }}
                  disabled={formBusy}
                >
                  <Text style={[styles.chipText, relContext === opt.value && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {relContext === 'other' && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Describe the relationship…"
                placeholderTextColor={colors.textTertiary}
                value={relOther}
                onChangeText={setRelOther}
                editable={!formBusy}
              />
            )}

            <Text style={styles.label}>What's the situation and what do you need?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. We matched on Hinge 3 days ago, been flirting. She just sent a voice note saying I seem interesting and asked what I do for fun."
              placeholderTextColor={colors.textTertiary}
              value={initialInput}
              onChangeText={setInitialInput}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!formBusy}
            />

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, (!relContext || !initialInput.trim() || formBusy) && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={!relContext || !initialInput.trim() || formBusy}
            >
              {isCreating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.buttonText}>Start Moment</Text>
              }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or speak it</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.recordSection}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    recordingState === 'recording' && styles.recordButtonActive,
                    (!canRecord || recordingState === 'processing' || isCreating) && styles.recordButtonDisabled,
                  ]}
                  onPress={toggleRecording}
                  disabled={!canRecord || recordingState === 'processing' || isCreating}
                >
                  {recordingState === 'processing' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.recordDot} />
                  )}
                </TouchableOpacity>
              </Animated.View>
              <Text style={[styles.recordLabel, !canRecord && styles.recordLabelMuted]}>
                {recordingState === 'idle'
                  ? canRecord ? 'Tap to speak your situation' : "Select who you're talking to first"
                  : recordingState === 'recording' ? 'Recording…' : 'Processing…'}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- Loading state ---
  if (isLoading || !moment) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // --- Thread view ---
  const exchangeCount = Math.floor(moment.messages.length / 2);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.threadHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.threadTitle} numberOfLines={1}>{moment.title}</Text>
          <Text style={styles.exchangeCount}>{exchangeCount}/19</Text>
          <TouchableOpacity
            style={styles.archiveBtn}
            onPress={handleToggleArchive}
            disabled={isArchiving}
          >
            {isArchiving
              ? <ActivityIndicator size="small" color="#999" />
              : <Text style={styles.archiveBtnText}>{moment.is_archived ? 'Unarchive' : 'Archive'}</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.threadScroll}>
          {moment.messages.map((msg, idx) => {
            if (msg.role === 'user') {
              return (
                <View key={msg.id} style={styles.userBubbleRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{msg.content}</Text>
                  </View>
                </View>
              );
            }

            let parsed: AIResponse & { coaching?: boolean };
            try { parsed = JSON.parse(msg.content); } catch { return null; }

            if (parsed.coaching) {
              return (
                <View key={msg.id} style={styles.coachingCard}>
                  <Text style={styles.coachingText}>{parsed.options[0]?.text}</Text>
                </View>
              );
            }

            const cIdx = cardIndices[idx] ?? 0;
            const opt = parsed.options[cIdx];
            if (!opt) return null;

            const recordId = msg.response_record_id;
            const currentFeedback = msgFeedback[msg.id] ?? null;
            const savedForMsg = msgSaved[msg.id] ?? new Set<string>();

            return (
              <View key={msg.id} style={styles.assistantCard}>
                <View style={[styles.optionPill, { backgroundColor: OPTION_COLORS[opt.type] }]}>
                  <Text style={styles.optionPillText}>{OPTION_LABELS[opt.type]}</Text>
                </View>
                <Text style={styles.optionText}>{opt.text}</Text>
                <Text style={styles.optionNote}>{opt.note}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={() => handleCopy(msg.id, recordId, opt.text, opt.type)}>
                  <Text style={[styles.copyButtonText, msgCopied[msg.id] && styles.copyButtonTextCopied]}>
                    {msgCopied[msg.id] ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.cardNav}>
                  <TouchableOpacity
                    onPress={() => setCardIndex(idx, cIdx - 1)}
                    disabled={cIdx === 0}
                    style={styles.navArrow}
                  >
                    <Text style={[styles.navArrowText, cIdx === 0 && styles.navArrowDisabled]}>‹</Text>
                  </TouchableOpacity>
                  <Text style={styles.navCounter}>{cIdx + 1} of {parsed.options.length}</Text>
                  <TouchableOpacity
                    onPress={() => setCardIndex(idx, cIdx + 1)}
                    disabled={cIdx === parsed.options.length - 1}
                    style={styles.navArrow}
                  >
                    <Text style={[styles.navArrowText, cIdx === parsed.options.length - 1 && styles.navArrowDisabled]}>›</Text>
                  </TouchableOpacity>
                </View>
                {recordId != null && (
                  <View style={styles.feedbackRow}>
                    {MOMENT_FEEDBACK_BUTTONS.map(({ type, label }) => {
                      const active = currentFeedback === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.feedbackBtn, active && styles.feedbackBtnActive]}
                          onPress={() => handleMsgFeedback(msg.id, recordId, type)}
                        >
                          <Text style={[styles.feedbackBtnText, active && styles.feedbackBtnTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={[styles.feedbackBtn, savedForMsg.has(opt.type) && styles.feedbackBtnSaved]}
                      onPress={() => handleMsgSave(msg.id, recordId, opt.type, opt.text)}
                      disabled={savedForMsg.has(opt.type)}
                    >
                      <Text style={[styles.feedbackBtnText, savedForMsg.has(opt.type) && styles.feedbackBtnTextActive]}>
                        {savedForMsg.has(opt.type) ? '💾 Saved' : '💾 Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity style={styles.deliveryToggle} onPress={() => toggleDelivery(msg.id)}>
                  <Text style={styles.deliveryToggleText}>
                    {deliveryExpanded[msg.id] ? 'Hide delivery tip ▴' : 'Show delivery tip ▾'}
                  </Text>
                </TouchableOpacity>
                {deliveryExpanded[msg.id] && (
                  <View style={styles.deliveryCard}>
                    <Text style={styles.deliveryText}>{parsed.delivery}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {error !== '' && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        {moment.is_archived ? (
          <View style={styles.archivedBanner}>
            <Text style={styles.archivedText}>{exchangeCount}/19 exchanges used.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MomentDetail', { momentId: null })}>
              <Text style={styles.archivedLink}>Start a new one →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.continueBar}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.continueRecordBtn,
                  recordingState === 'recording' && styles.continueRecordBtnActive,
                  (isContinuing || recordingState === 'processing') && styles.continueRecordBtnDisabled,
                ]}
                onPress={toggleRecording}
                disabled={isContinuing || recordingState === 'processing'}
              >
                {recordingState === 'processing'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <View style={styles.continueRecordDot} />
                }
              </TouchableOpacity>
            </Animated.View>
            <TextInput
              style={styles.continueInput}
              placeholder="What happened next?"
              placeholderTextColor={colors.textTertiary}
              value={newInput}
              onChangeText={setNewInput}
              editable={!isContinuing && recordingState === 'idle'}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!newInput.trim() || isContinuing || recordingState !== 'idle') && styles.sendBtnDisabled]}
              onPress={handleContinue}
              disabled={!newInput.trim() || isContinuing || recordingState !== 'idle'}
            >
              {isContinuing && recordingState === 'idle'
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.sendBtnText}>→</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

