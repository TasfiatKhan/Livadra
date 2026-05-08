import React, { useEffect, useState } from 'react';
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
import { submitFeedback, saveResponse } from '../../services/responsesService';
import { AIOption } from '../../types/humor';
import { RELATIONSHIP_CONTEXTS } from '../../constants/humor';

type Props = NativeStackScreenProps<MainStackParamList, 'TextingMode'>;

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
  const [copied, setCopied] = useState(false);
  const color = OPTION_COLORS[option.type];

  const handleCopy = async () => {
    await Clipboard.setStringAsync(option.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.optionCard}>
      <View style={[styles.optionPill, { backgroundColor: color }]}>
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
  const [context, setContext] = useState('');
  const [userRequest, setUserRequest] = useState('');
  const [relationshipContext, setRelationshipContext] = useState('');
  const [relationshipOther, setRelationshipOther] = useState('');
  const [environment, setEnvironment] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(null);
  const [savedOptions, setSavedOptions] = useState<Set<string>>(new Set());

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

  const canSubmit = relationshipContext !== '' && !isLoading;

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
          <Text style={styles.title}>Texting Mode</Text>

          <Text style={styles.label}>What's the context?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. We matched last week and she just said 'you seem different' / My manager publicly shut down my idea in a meeting / Friend group's been distant since the trip"
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
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  optionalLabel: {
    flexDirection: 'row',
  },
  optionalHint: {
    fontWeight: '400',
    color: '#999',
    fontSize: 14,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  otherInput: {
    marginTop: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f7f7f7',
  },
  chipSelected: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 24,
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },
  optionPill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  optionPillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 23,
    color: '#111',
    fontWeight: '500',
  },
  optionNote: {
    fontSize: 13,
    lineHeight: 19,
    color: '#888',
    fontStyle: 'italic',
  },
  copyButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  copyButtonText: {
    fontSize: 13,
    color: '#aaa',
  },
  copyButtonTextCopied: {
    color: '#22a06b',
    fontWeight: '600',
  },
  feedbackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  feedbackBtn: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#efefef',
  },
  feedbackBtnActive: {
    backgroundColor: '#111',
  },
  feedbackBtnSaved: {
    backgroundColor: '#22a06b',
  },
  feedbackBtnText: {
    fontSize: 12,
    color: '#555',
  },
  feedbackBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  deliveryCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#d6e0ff',
    gap: 6,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4a6cf7',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  deliveryText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
  },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    marginTop: 12,
  },
  editLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  editLinkText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
