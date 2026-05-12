import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
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
import { AIOption, AIResponse } from '../../types/humor';
import { RELATIONSHIP_CONTEXTS } from '../../constants/humor';
import { LIVE_VOICE_PATH } from '../../services/humorService';
import { submitFeedback, saveResponse, trackCopy } from '../../services/responsesService';
import api from '../../services/api';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'LiveMode'>;
type RecordingState = 'idle' | 'recording' | 'processing';

const DARK_BG = '#1A1A1A';
const DARK_SURFACE = '#242424';
const DARK_CHIP = '#2A2A2A';
const DARK_BORDER = '#333';

const OPTION_LABELS: Record<AIOption['type'], string> = {
  safe: 'Safe',
  playful: 'Playful',
  bold: 'Bold',
};

const OPTION_COLORS: Record<AIOption['type'], string> = {
  safe: colors.safe,
  playful: colors.playful,
  bold: colors.bold,
};

const FEEDBACK_BUTTONS = [
  { type: 'natural', label: '👍' },
  { type: 'loved', label: '🔥' },
  { type: 'cringe', label: '😬' },
  { type: 'risky', label: '⚠️' },
] as const;

export default function LiveModeScreen({ navigation }: Props) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [relationshipContext, setRelationshipContext] = useState('');
  const [relationshipOther, setRelationshipOther] = useState('');
  const [environment, setEnvironment] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [savedOptions, setSavedOptions] = useState<Set<string>>(new Set());
  const [contextExpanded, setContextExpanded] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const [deliveryVisible, setDeliveryVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setCopied(false);
    setNoteVisible(false);
    setDeliveryVisible(false);
  }, [currentIndex]);

  useEffect(() => {
    setFeedbackGiven(null);
    setSavedOptions(new Set());
    setNoteVisible(false);
    setDeliveryVisible(false);
  }, [response]);

  const startRecording = async () => {
    if (relationshipContext === '') return;
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
      setResponse(null);

      pulseLoop.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.28, duration: 500, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0.55, duration: 500, useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          ]),
        ]),
      );
      pulseLoop.current.start();
    } catch (e: any) {
      setError('Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording || recordingState !== 'recording') return;
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
    pulseOpacity.setValue(1);
    setRecordingState('processing');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('No audio URI');

      const filename = uri.split('/').pop() ?? 'recording.m4a';
      const type = filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/m4a';
      const formData = new FormData();
      formData.append('audio', { uri, name: filename, type } as any);
      formData.append('relationship_context', relationshipContext);
      if (relationshipContext === 'other' && relationshipOther) {
        formData.append('relationship_other', relationshipOther);
      }
      if (environment.trim()) {
        formData.append('environment', environment);
      }

      const { data } = await api.post<AIResponse>(LIVE_VOICE_PATH, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResponse(data);
      setCurrentIndex(0);
    } catch (e: any) {
      const errData = e?.response?.data;
      setError(errData?.detail ?? 'Something went wrong. Try again.');
    } finally {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
      setRecordingState('idle');
    }
  };

  const handleCopy = async () => {
    if (!response) return;
    const option = response.options[currentIndex];
    await Clipboard.setStringAsync(option.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (response.record_id != null) {
      try { await trackCopy(response.record_id, option.type); } catch {}
    }
  };

  const handleFeedback = async (type: string) => {
    if (!response?.record_id) return;
    setFeedbackGiven(feedbackGiven === type ? null : type);
    try { await submitFeedback(response.record_id, type); } catch {}
  };

  const handleSave = async () => {
    if (!response?.record_id) return;
    const option = response.options[currentIndex];
    if (savedOptions.has(option.type)) return;
    setSavedOptions(prev => new Set(prev).add(option.type));
    try { await saveResponse(response.record_id, option.type, option.text); } catch {}
  };

  const toggleRecording = () => {
    if (recordingState === 'idle') startRecording();
    else if (recordingState === 'recording') stopRecording();
  };

  const canRecord = relationshipContext !== '';
  const currentOption = response?.options[currentIndex];

  const recordStatus =
    recordingState === 'recording' ? 'Tap to stop' :
    recordingState === 'processing' ? 'Processing…' :
    canRecord ? 'Tap to speak' : "Select who you're with";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('PersonalitySetup')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Profile</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {RELATIONSHIP_CONTEXTS.map((opt) => {
              const selected = relationshipContext === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => {
                    setRelationshipContext(opt.value);
                    if (opt.value !== 'other') setRelationshipOther('');
                  }}
                  disabled={recordingState !== 'idle'}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {relationshipContext === 'other' && (
            <TextInput
              style={styles.otherInput}
              placeholder="Describe…"
              placeholderTextColor={colors.textTertiary}
              value={relationshipOther}
              onChangeText={setRelationshipOther}
              editable={recordingState === 'idle'}
            />
          )}

          <TouchableOpacity
            style={styles.contextToggle}
            onPress={() => setContextExpanded(e => !e)}
          >
            <Text style={styles.contextToggleText}>
              {contextExpanded ? 'Hide context ▴' : '+ Add context'}
            </Text>
          </TouchableOpacity>

          {contextExpanded && (
            <TextInput
              style={styles.contextInput}
              placeholder="vibe, setting, tone…"
              placeholderTextColor={colors.textTertiary}
              value={environment}
              onChangeText={setEnvironment}
              editable={recordingState === 'idle'}
            />
          )}

          <View style={styles.recordSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], opacity: pulseOpacity }}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  recordingState === 'recording' && styles.recordButtonActive,
                  (!canRecord || recordingState === 'processing') && styles.recordButtonDisabled,
                ]}
                onPress={toggleRecording}
                disabled={!canRecord || recordingState === 'processing'}
                activeOpacity={0.8}
              >
                {recordingState === 'processing' ? (
                  <ActivityIndicator color={colors.surface} size="small" />
                ) : (
                  <View style={[
                    styles.recordDot,
                    recordingState === 'recording' && styles.recordDotActive,
                  ]} />
                )}
              </TouchableOpacity>
            </Animated.View>
            <Text style={[styles.recordStatus, !canRecord && styles.recordStatusMuted]}>
              {recordStatus}
            </Text>
          </View>

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          {response && currentOption && (
            <View style={styles.responseSection}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                    <Text style={[styles.copyBtnText, copied && styles.copyBtnTextCopied]}>
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.optionText}>{currentOption.text}</Text>

                <View style={styles.cardFooter}>
                  <View style={[styles.typePill, { backgroundColor: OPTION_COLORS[currentOption.type] }]}>
                    <Text style={styles.typePillText}>{OPTION_LABELS[currentOption.type]}</Text>
                  </View>
                  <View style={styles.revealRow}>
                    <TouchableOpacity onPress={() => setNoteVisible(v => !v)}>
                      <Text style={styles.revealBtn}>{noteVisible ? 'Note ▴' : 'Note'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeliveryVisible(v => !v)}>
                      <Text style={styles.revealBtn}>{deliveryVisible ? 'Delivery ▴' : 'Delivery'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {noteVisible && (
                  <Text style={styles.subText}>{currentOption.note}</Text>
                )}
                {deliveryVisible && (
                  <Text style={styles.subText}>{response.delivery}</Text>
                )}

                {response.record_id != null && (
                  <View style={styles.feedbackRow}>
                    {FEEDBACK_BUTTONS.map(({ type, label }) => {
                      const active = feedbackGiven === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.feedbackBtn, active && styles.feedbackBtnActive]}
                          onPress={() => handleFeedback(type)}
                        >
                          <Text style={styles.feedbackLabel}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={[styles.feedbackBtn, savedOptions.has(currentOption.type) && styles.feedbackBtnSaved]}
                      onPress={handleSave}
                      disabled={savedOptions.has(currentOption.type)}
                    >
                      <Text style={styles.feedbackLabel}>💾</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={() => setCurrentIndex(i => i - 1)}
                  disabled={currentIndex === 0}
                  style={styles.navBtn}
                >
                  <Text style={[styles.navArrow, currentIndex === 0 && styles.navArrowDisabled]}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.navCounter}>{currentIndex + 1} / {response.options.length}</Text>
                <TouchableOpacity
                  onPress={() => setCurrentIndex(i => i + 1)}
                  disabled={currentIndex === response.options.length - 1}
                  style={styles.navBtn}
                >
                  <Text style={[styles.navArrow, currentIndex === response.options.length - 1 && styles.navArrowDisabled]}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK_BG },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  headerBtnText: { color: colors.textTertiary, fontSize: typography.sizes.label },

  chipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    backgroundColor: DARK_CHIP,
  },
  chipSelected: { backgroundColor: colors.accent },
  chipText: { fontSize: typography.sizes.label, color: colors.textTertiary },
  chipTextSelected: { color: colors.surface, fontWeight: typography.weights.semibold },

  otherInput: {
    backgroundColor: DARK_CHIP,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.surface,
  },

  contextToggle: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  contextToggleText: { fontSize: typography.sizes.label, color: colors.textTertiary },

  contextInput: {
    backgroundColor: DARK_CHIP,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.surface,
  },

  recordSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  recordButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: DARK_CHIP,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: DARK_BORDER,
  },
  recordButtonActive: { backgroundColor: colors.error, borderColor: colors.error },
  recordButtonDisabled: { opacity: 0.35 },
  recordDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface },
  recordDotActive: { width: 14, height: 14, borderRadius: 3 },
  recordStatus: { fontSize: typography.sizes.label, color: colors.textSecondary },
  recordStatusMuted: { color: colors.textTertiary },

  error: { color: colors.error, fontSize: typography.sizes.label, textAlign: 'center' },

  responseSection: { gap: spacing.sm },

  card: {
    backgroundColor: DARK_SURFACE,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-end' },
  copyBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
  copyBtnText: { fontSize: typography.sizes.label, color: colors.textTertiary },
  copyBtnTextCopied: { color: colors.success, fontWeight: typography.weights.semibold },

  optionText: {
    fontSize: typography.sizes.heading,
    lineHeight: typography.lineHeights.heading,
    color: colors.surface,
    fontWeight: typography.weights.medium,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  typePill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  typePillText: {
    fontSize: typography.sizes.small,
    color: colors.surface,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.4,
  },
  revealRow: { flexDirection: 'row', gap: spacing.md },
  revealBtn: { fontSize: typography.sizes.label, color: colors.textTertiary },

  subText: {
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  feedbackRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  feedbackBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: DARK_CHIP,
  },
  feedbackBtnActive: { backgroundColor: colors.accent },
  feedbackBtnSaved: { backgroundColor: colors.success },
  feedbackLabel: { fontSize: typography.sizes.label },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { fontSize: 28, color: colors.textSecondary, lineHeight: 32 },
  navArrowDisabled: { color: DARK_BORDER },
  navCounter: {
    fontSize: typography.sizes.label,
    color: colors.textTertiary,
    minWidth: 40,
    textAlign: 'center',
  },
});
