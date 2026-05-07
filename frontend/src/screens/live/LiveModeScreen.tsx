import React, { useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAIResponse } from '../../hooks/useAIResponse';
import { LIVE_PATH } from '../../services/humorService';
import { AIOption } from '../../types/humor';
import { RELATIONSHIP_CONTEXTS } from '../../constants/humor';

type Props = NativeStackScreenProps<MainStackParamList, 'LiveMode'>;

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

function OptionCard({ option }: { option: AIOption }) {
  const color = OPTION_COLORS[option.type];
  return (
    <View style={styles.optionCard}>
      <View style={[styles.optionPill, { backgroundColor: color }]}>
        <Text style={styles.optionPillText}>{OPTION_LABELS[option.type]}</Text>
      </View>
      <Text style={styles.optionText}>{option.text}</Text>
      <Text style={styles.optionNote}>{option.note}</Text>
    </View>
  );
}

export default function LiveModeScreen({ navigation }: Props) {
  const { response, isLoading, error, submit, reset } = useAIResponse();
  const [situation, setSituation] = useState('');
  const [userRequest, setUserRequest] = useState('');
  const [relationshipContext, setRelationshipContext] = useState('');
  const [relationshipOther, setRelationshipOther] = useState('');
  const [environment, setEnvironment] = useState('');

  const handleSubmit = () => {
    reset();
    submit(LIVE_PATH, {
      situation,
      user_request: userRequest,
      relationship_context: relationshipContext,
      relationship_other: relationshipOther,
      environment,
    });
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
          <Text style={styles.title}>Live Mode</Text>

          <Text style={styles.label}>What's the situation?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe what's happening right now…"
            value={situation}
            onChangeText={setSituation}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!isLoading}
          />

          <Text style={styles.label}>What do you need?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Make them laugh"
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
            placeholder="Describe the vibe… busy bar, late night texting, office lunch break"
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
                <OptionCard key={option.type} option={option} />
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
            <Text style={styles.editLinkText}>Edit profile</Text>
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
