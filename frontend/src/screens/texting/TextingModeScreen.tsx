import React, { useMemo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAIResponse } from '../../hooks/useAIResponse';
import { TEXTING_PATH } from '../../services/humorService';
import { submitFeedback, saveResponse, trackCopy } from '../../services/responsesService';
import { AIOption } from '../../types/humor';
import { RELATIONSHIP_CONTEXTS } from '../../constants/humor';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radii, shadow } from '../../theme';

type Props = NativeStackScreenProps<MainStackParamList, 'TextingMode'>;

const OPTION_LABELS: Record<AIOption['type'], string> = {
  safe: 'Safe',
  playful: 'Playful',
  bold: 'Bold',
};

const FEEDBACK_BUTTONS = [
  { type: 'natural', label: '👍 Natural' },
  { type: 'loved', label: '🔥 Loved It' },
  { type: 'cringe', label: '😬 Cringe' },
  { type: 'risky', label: '⚠️ Too Risky' },
] as const;

type OptionCardProps = {
  option: AIOption;
  recordId: number | null;
  feedbackGiven: string | null;
  isSaved: boolean;
  onFeedback: (type: string) => void;
  onSave: () => void;
};

function OptionCard({ option, recordId, feedbackGiven, isSaved, onFeedback, onSave }: OptionCardProps) {
  const { colors } = useTheme();
  const OPTION_COLORS = { safe: colors.safe, playful: colors.playful, bold: colors.bold };
  const [copied, setCopied] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    optionCard: { padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, gap: 10, ...shadow.card },
    optionPill: { alignSelf: 'flex-start' as const, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: spacing.xs },
    optionPillText: { color: colors.surface, fontSize: typography.sizes.small, fontWeight: typography.weights.bold, letterSpacing: 0.5 },
    optionText: { fontSize: typography.sizes.base, lineHeight: typography.lineHeights.base, color: colors.textPrimary, fontWeight: typography.weights.medium },
    optionNote: { fontSize: typography.sizes.label, lineHeight: typography.lineHeights.label, color: colors.textTertiary, fontStyle: 'italic' as const },
    copyButton: { alignSelf: 'flex-end' as const, paddingVertical: spacing.xs, paddingHorizontal: 2 },
    copyButtonText: { fontSize: typography.sizes.label, color: colors.textTertiary },
    copyButtonTextCopied: { color: colors.success, fontWeight: typography.weights.semibold },
    feedbackRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6, marginTop: spacing.xs },
    feedbackBtn: { borderRadius: radii.lg, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.surfaceSecondary },
    feedbackBtnActive: { backgroundColor: colors.textPrimary },
    feedbackBtnSaved: { backgroundColor: colors.success },
    feedbackBtnText: { fontSize: typography.sizes.small, color: colors.textSecondary },
    feedbackBtnTextActive: { color: colors.surface, fontWeight: typography.weights.semibold },
  }), [colors]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(option.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    if (recordId != null) {
      try { await trackCopy(recordId, option.type); } catch {}
    }
  };

  return (
    <View style={styles.optionCard}>
      <View style={[styles.optionPill, { backgroundColor: OPTION_COLORS[option.type] }]}>
        <Text style={styles.optionPillText}>{OPTION_LABELS[option.type]}</Text>
      </View>
      <Text style={styles.optionText}>{option.text}</Text>
      <Text style={styles.optionNote}>{option.note}</Text>
      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
        <Text style={[styles.copyButtonText, copied && styles.copyButtonTextCopied]}>
          {copied ? 'Copied!' : 'Copy'}
        </Text>
      </TouchableOpacity>

      {recordId != null && (
        <View style={styles.feedbackRow}>
          {FEEDBACK_BUTTONS.map(({ type, label }) => {
            const active = feedbackGiven === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.feedbackBtn, active && styles.feedbackBtnActive]}
                onPress={() => onFeedback(type)}
              >
                <Text style={[styles.feedbackBtnText, active && styles.feedbackBtnTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.feedbackBtn, isSaved && styles.feedbackBtnSaved]}
            onPress={onSave}
            disabled={isSaved}
          >
            <Text style={[styles.feedbackBtnText, isSaved && styles.feedbackBtnTextActive]}>
              {isSaved ? '💾 Saved' : '💾 Save'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function TextingModeScreen({ navigation }: Props) {
  const { response, isLoading, error, submit, reset } = useAIResponse();
  const { colors } = useTheme();
  const [context, setContext] = useState('');
  const [userRequest, setUserRequest] = useState('');
  const [relationshipContext, setRelationshipContext] = useState('');
  const [relationshipOther, setRelationshipOther] = useState('');
  const [environment, setEnvironment] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [savedOptions, setSavedOptions] = useState<Set<string>>(new Set());

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
    backBtn: { padding: spacing.sm, alignSelf: 'flex-start' as const },
    backBtnText: { color: colors.textPrimary, fontSize: 28, fontWeight: typography.weights.bold },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.sm },
    title: { fontSize: typography.sizes.title, fontWeight: typography.weights.bold, marginBottom: spacing.md, color: colors.textPrimary },
    label: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, marginTop: 12, marginBottom: 6, color: colors.textPrimary },
    optionalLabel: { flexDirection: 'row' as const },
    optionalHint: { fontWeight: typography.weights.regular, color: colors.textTertiary, fontSize: typography.sizes.label },
    textArea: {
      borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.sizes.base,
      minHeight: 120, color: colors.textPrimary, backgroundColor: colors.surface,
    },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm,
      paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.sizes.base,
      color: colors.textPrimary, backgroundColor: colors.surface,
    },
    otherInput: { marginTop: spacing.sm },
    chipGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: spacing.sm, backgroundColor: colors.surfaceSecondary },
    chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: typography.sizes.label, color: colors.textSecondary },
    chipTextSelected: { color: colors.surface, fontWeight: typography.weights.semibold },
    button: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, alignItems: 'center' as const, marginTop: spacing.md },
    buttonDisabled: { opacity: 0.4 },
    buttonText: { color: colors.surface, fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
    resultsContainer: { marginTop: spacing.lg, gap: 12 },
    deliveryCard: { padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.border, gap: 6 },
    deliveryLabel: { fontSize: typography.sizes.small, fontWeight: typography.weights.bold, color: colors.accent, letterSpacing: 0.8, textTransform: 'uppercase' as const },
    deliveryText: { fontSize: typography.sizes.label, lineHeight: 21, color: colors.textSecondary },
    error: { color: colors.error, fontSize: typography.sizes.label, marginTop: 12 },
  }), [colors]);

  useEffect(() => {
    setFeedbackGiven(null);
    setSavedOptions(new Set());
  }, [response]);

  const handleSubmit = () => {
    reset();
    submit(TEXTING_PATH, {
      context,
      user_request: userRequest,
      relationship_context: relationshipContext,
      relationship_other: relationshipOther,
      environment,
    });
  };

  const handleFeedback = async (type: string) => {
    if (!response?.record_id) return;
    setFeedbackGiven(feedbackGiven === type ? null : type);
    try { await submitFeedback(response.record_id, type); } catch {}
  };

  const handleSave = async (optionType: string, optionText: string) => {
    if (!response?.record_id || savedOptions.has(optionType)) return;
    setSavedOptions(prev => new Set(prev).add(optionType));
    try { await saveResponse(response.record_id, optionType, optionText); } catch {}
  };

  const canSubmit = relationshipContext !== '' && context.trim() !== '' && userRequest.trim() !== '' && !isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Texting Mode</Text>

          <Text style={styles.label}>What's the context?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. We matched last week and she just said 'you seem different' / My manager publicly shut down my idea in a meeting / Friend group's been distant since the trip"
            placeholderTextColor={colors.textTertiary}
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!isLoading}
          />

          <Text style={styles.label}>What do you need?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. I want to be playful without seeming eager / I need to push back without seeming defensive / I want to break the tension without making it weird"
            placeholderTextColor={colors.textTertiary}
            value={userRequest}
            onChangeText={setUserRequest}
            editable={!isLoading}
          />

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
                  disabled={isLoading}
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
              placeholderTextColor={colors.textTertiary}
              value={relationshipOther}
              onChangeText={setRelationshipOther}
              editable={!isLoading}
            />
          )}

          <Text style={[styles.label, styles.optionalLabel]}>
            What's the vibe?{' '}
            <Text style={styles.optionalHint}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Late night, flirty tone / Post-meeting, still tense / Group chat, everyone's watching"
            placeholderTextColor={colors.textTertiary}
            value={environment}
            onChangeText={setEnvironment}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Get suggestions</Text>
            )}
          </TouchableOpacity>

          {error !== '' && <Text style={styles.error}>{error}</Text>}

          {response && (
            <View style={styles.resultsContainer}>
              {response.options.map((option) => (
                <OptionCard
                  key={option.type}
                  option={option}
                  recordId={response.record_id}
                  feedbackGiven={feedbackGiven}
                  isSaved={savedOptions.has(option.type)}
                  onFeedback={handleFeedback}
                  onSave={() => handleSave(option.type, option.text)}
                />
              ))}
              <View style={styles.deliveryCard}>
                <Text style={styles.deliveryLabel}>Delivery</Text>
                <Text style={styles.deliveryText}>{response.delivery}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
