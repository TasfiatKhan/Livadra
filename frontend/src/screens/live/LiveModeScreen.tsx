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
import { colors, typography, spacing, radii, shadow } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'LiveMode'>;
type RecordingState = 'idle' | 'recording' | 'processing';

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
  { type: 'natural', label: '👍 Natural' },
  { type: 'loved', label: '🔥 Loved It' },
  { type: 'cringe', label: '😬 Cringe' },
  { type: 'risky', label: '⚠️ Too Risky' },
] as const;

export default function LiveModeScreen({ navigation }: Props) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deliveryExpanded, setDeliveryExpanded] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [relationshipContext, setRelationshipContext] = useState('');
  const [relationshipOther, setRelationshipOther] = useState('');
  const [environment, setEnvironment] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [savedOptions, setSavedOptions] = useState<Set<string>>(new Set());

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setCopied(false);
  }, [currentIndex]);

  useEffect(() => {
    setFeedbackGiven(null);
    setSavedOptions(new Set());
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
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
      console.error('Recording error:', e);
      setError('Could not start recording: ' + (e?.message ?? 'unknown error'));
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
      setDeliveryExpanded(false);
    } catch (e: any) {
      const errData = e?.response?.data;
      setError(errData?.detail ?? 'Something went wrong. Please try again.');
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Live Mode</Text>

          <Text style={styles.label}>Who are you talking to?</Text>
          <View style={styles.chipGrid}>
            {RELATIONSHIP_CONTEXTS.map((option) => {
              const selected = relationshipContext === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => {
                    setRelationshipContext(option.value);
                    if (option.value !== 'other') setRelationshipOther('');
                  }}
                  disabled={recordingState !== 'idle'}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {relationshipContext === 'other' && (
            <TextInput
              style={[styles.input, styles.otherInput]}
              placeholder="Describe the relationship…"
              value={relationshipOther}
              onChangeText={setRelationshipOther}
              editable={recordingState === 'idle'}
            />
          )}

          <Text style={[styles.label, styles.optionalLabel]}>
            What's the vibe?{' '}
            <Text style={styles.optionalHint}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Party, just introduced / Post-meeting, still tense / Networking event, want to make a real impression"
            value={environment}
            onChangeText={setEnvironment}
            editable={recordingState === 'idle'}
          />

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
                ? canRecord
                  ? 'Tap to speak'
                  : "Select who you're talking to first"
                : recordingState === 'recording'
                ? 'Recording…'
                : 'Processing…'}
            </Text>
          </View>

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          {response && currentOption && (
            <View style={styles.resultsContainer}>
              <View style={styles.optionCard}>
                <View style={[styles.optionPill, { backgroundColor: OPTION_COLORS[currentOption.type] }]}>
                  <Text style={styles.optionPillText}>{OPTION_LABELS[currentOption.type]}</Text>
                </View>
                <Text style={styles.optionText}>{currentOption.text}</Text>
                <Text style={styles.optionNote}>{currentOption.note}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                  <Text style={[styles.copyButtonText, copied && styles.copyButtonTextCopied]}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Text>
                </TouchableOpacity>

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
                          <Text style={[styles.feedbackBtnText, active && styles.feedbackBtnTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={[
                        styles.feedbackBtn,
                        savedOptions.has(currentOption.type) && styles.feedbackBtnSaved,
                      ]}
                      onPress={handleSave}
                      disabled={savedOptions.has(currentOption.type)}
                    >
                      <Text style={[
                        styles.feedbackBtnText,
                        savedOptions.has(currentOption.type) && styles.feedbackBtnTextActive,
                      ]}>
                        {savedOptions.has(currentOption.type) ? '💾 Saved' : '💾 Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.navArrow}
                  onPress={() => setCurrentIndex(i => i - 1)}
                  disabled={currentIndex === 0}
                >
                  <Text style={[styles.navArrowText, currentIndex === 0 && styles.navArrowDisabled]}>
                    ‹
                  </Text>
                </TouchableOpacity>
                <Text style={styles.navCounter}>
                  {currentIndex + 1} of {response.options.length}
                </Text>
                <TouchableOpacity
                  style={styles.navArrow}
                  onPress={() => setCurrentIndex(i => i + 1)}
                  disabled={currentIndex === response.options.length - 1}
                >
                  <Text style={[styles.navArrowText, currentIndex === response.options.length - 1 && styles.navArrowDisabled]}>
                    ›
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.deliveryToggle}
                onPress={() => setDeliveryExpanded(e => !e)}
              >
                <Text style={styles.deliveryToggleText}>
                  {deliveryExpanded ? 'Hide delivery tip ▴' : 'Show delivery tip ▾'}
                </Text>
              </TouchableOpacity>
              {deliveryExpanded && (
                <View style={styles.deliveryCard}>
                  <Text style={styles.deliveryText}>{response.delivery}</Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.editLink}
            onPress={() => navigation.navigate('PersonalitySetup')}
          >
            <Text style={styles.editLinkText}>My Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    marginTop: 12,
    marginBottom: 6,
  },
  optionalLabel: {
    flexDirection: 'row',
  },
  optionalHint: {
    fontWeight: typography.weights.regular,
    color: colors.textTertiary,
    fontSize: typography.sizes.label,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.sizes.base,
  },
  otherInput: {
    marginTop: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: typography.weights.semibold,
  },
  recordSection: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: spacing.sm,
    gap: 14,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: colors.error,
  },
  recordButtonDisabled: {
    opacity: 0.35,
  },
  recordDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },
  recordLabel: {
    fontSize: typography.sizes.label,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  recordLabelMuted: {
    color: colors.textTertiary,
  },
  resultsContainer: {
    marginTop: spacing.lg,
    gap: 12,
  },
  optionCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadow.card,
  },
  optionPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: spacing.xs,
  },
  optionPillText: {
    color: colors.surface,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  optionText: {
    fontSize: typography.sizes.base,
    lineHeight: 25,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  optionNote: {
    fontSize: typography.sizes.label,
    lineHeight: typography.lineHeights.label,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  copyButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
  },
  copyButtonText: {
    fontSize: typography.sizes.label,
    color: colors.textTertiary,
  },
  copyButtonTextCopied: {
    color: colors.success,
    fontWeight: typography.weights.semibold,
  },
  feedbackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  feedbackBtn: {
    borderRadius: radii.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.surfaceSecondary,
  },
  feedbackBtnActive: {
    backgroundColor: colors.textPrimary,
  },
  feedbackBtnSaved: {
    backgroundColor: colors.success,
  },
  feedbackBtnText: {
    fontSize: typography.sizes.small,
    color: colors.textSecondary,
  },
  feedbackBtnTextActive: {
    color: colors.surface,
    fontWeight: typography.weights.semibold,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  navArrow: {
    padding: spacing.sm,
  },
  navArrowText: {
    fontSize: 32,
    color: colors.textSecondary,
    lineHeight: 36,
  },
  navArrowDisabled: {
    color: colors.textTertiary,
  },
  navCounter: {
    fontSize: typography.sizes.label,
    color: colors.textTertiary,
    minWidth: 48,
    textAlign: 'center',
  },
  deliveryToggle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deliveryToggleText: {
    fontSize: typography.sizes.label,
    color: colors.accent,
  },
  deliveryCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryText: {
    fontSize: typography.sizes.label,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  error: {
    color: colors.error,
    fontSize: typography.sizes.label,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  editLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  editLinkText: {
    color: colors.textTertiary,
    fontSize: typography.sizes.label,
    textDecorationLine: 'underline',
  },
});
