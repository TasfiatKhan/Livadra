import React, { useState, useEffect, useRef } from 'react';
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

type Props = NativeStackScreenProps<MainStackParamList, 'MomentDetail'>;
type RecordingState = 'idle' | 'recording' | 'processing';

const MODE_OPTIONS = [
  { value: 'texting' as const, label: 'Texting' },
  { value: 'live' as const, label: 'Live' },
];

const OPTION_LABELS: Record<AIOption['type'], string> = {
  safe: 'Safe',
  playful: 'Playful',
  bold: 'Bold',
};

const OPTION_COLORS: Record<AIOption['type'], string> = {
  safe: '#4a90d9',
  playful: '#e67e22',
  bold: '#c0392b',
};

const MOMENT_FEEDBACK_BUTTONS = [
  { type: 'natural', label: '👍 Natural' },
  { type: 'loved', label: '🔥 Loved It' },
  { type: 'cringe', label: '😬 Cringe' },
  { type: 'risky', label: '⚠️ Too Risky' },
] as const;

export default function MomentDetailScreen({ route, navigation }: Props) {
  const [localMomentId, setLocalMomentId] = useState<number | null>(route.params.momentId);
  const [moment, setMoment] = useState<MomentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Creation form state
  const [relContext, setRelContext] = useState('');
  const [relOther, setRelOther] = useState('');
  const [selectedMode, setSelectedMode] = useState<'texting' | 'live'>('texting');
  const [environment, setEnvironment] = useState('');
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
    formData.append('mode', selectedMode);
    if (environment.trim()) formData.append('environment', environment.trim());
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
            return {
              ...prev,
              is_archived: data.is_archived,
              messages: [
                ...prev.messages,
                { id: Date.now(), role: 'user', content: data.user_input, response_record_id: null, created_at: new Date().toISOString() },
                { id: Date.now() + 1, role: 'assistant', content: JSON.stringify({ options: data.options, delivery: data.delivery }), response_record_id: data.record_id ?? null, created_at: new Date().toISOString() },
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
                value={relOther}
                onChangeText={setRelOther}
                editable={!formBusy}
              />
            )}

            <Text style={styles.label}>Mode</Text>
            <View style={styles.chipGrid}>
              {MODE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, selectedMode === opt.value && styles.chipSelected]}
                  onPress={() => setSelectedMode(opt.value)}
                  disabled={formBusy}
                >
                  <Text style={[styles.chipText, selectedMode === opt.value && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>
              What's the vibe? <Text style={styles.optionalHint}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Late night, we've been texting for a week"
              value={environment}
              onChangeText={setEnvironment}
              editable={!formBusy}
            />

            <Text style={styles.label}>What's the situation?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. We matched on Hinge 3 days ago, been flirting. She just sent a voice note saying I seem interesting and asked what I do for fun."
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

            let parsed: AIResponse;
            try { parsed = JSON.parse(msg.content); } catch { return null; }
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Creation form
  formScroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48, gap: 8 },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backBtnText: { fontSize: 15, color: '#555' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  optionalHint: { fontWeight: '400', color: '#999', fontSize: 14 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f7f7f7',
  },
  chipSelected: { backgroundColor: '#000', borderColor: '#000' },
  chipText: { fontSize: 14, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 120,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#e53e3e', fontSize: 14, textAlign: 'center', marginTop: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { fontSize: 13, color: '#aaa' },
  recordSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { backgroundColor: '#e53e3e' },
  recordButtonDisabled: { opacity: 0.35 },
  recordDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
  recordLabel: { fontSize: 14, color: '#555', textAlign: 'center' },
  recordLabelMuted: { color: '#bbb' },

  // Thread
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  threadTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111' },
  exchangeCount: { fontSize: 12, color: '#aaa', flexShrink: 0 },
  archiveBtn: { paddingHorizontal: 10, paddingVertical: 4, marginLeft: 4 },
  archiveBtnText: { fontSize: 13, color: '#aaa' },
  threadScroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 },
  userBubbleRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: '#111',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
  },
  userBubbleText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  assistantCard: {
    backgroundColor: '#f7f7f7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 14,
    gap: 8,
  },
  optionPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  optionPillText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  optionText: { fontSize: 15, lineHeight: 22, color: '#111', fontWeight: '500' },
  optionNote: { fontSize: 13, color: '#888', fontStyle: 'italic' },
  cardNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  navArrow: { padding: 4 },
  navArrowText: { fontSize: 26, color: '#333', lineHeight: 30 },
  navArrowDisabled: { color: '#ccc' },
  navCounter: { fontSize: 13, color: '#666', minWidth: 40, textAlign: 'center' },
  copyButton: { alignSelf: 'flex-end', paddingVertical: 2, paddingHorizontal: 2 },
  copyButtonText: { fontSize: 13, color: '#aaa' },
  copyButtonTextCopied: { color: '#22a06b', fontWeight: '600' },
  deliveryToggle: { alignItems: 'center', paddingVertical: 6 },
  deliveryToggleText: { fontSize: 13, color: '#4a6cf7' },
  deliveryCard: {
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d6e0ff',
    padding: 12,
  },
  deliveryText: { fontSize: 13, lineHeight: 19, color: '#333' },
  feedbackRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  feedbackBtn: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#e8e8e8' },
  feedbackBtnActive: { backgroundColor: '#111' },
  feedbackBtnSaved: { backgroundColor: '#22a06b' },
  feedbackBtnText: { fontSize: 11, color: '#555' },
  feedbackBtnTextActive: { color: '#fff', fontWeight: '600' },
  archivedBanner: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
    gap: 6,
  },
  archivedText: { fontSize: 14, color: '#888', textAlign: 'center' },
  archivedLink: { fontSize: 14, color: '#4a6cf7', fontWeight: '600' },
  continueBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  continueRecordBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  continueRecordBtnActive: { backgroundColor: '#e53e3e' },
  continueRecordBtnDisabled: { opacity: 0.35 },
  continueRecordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  continueInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '600' },
});
