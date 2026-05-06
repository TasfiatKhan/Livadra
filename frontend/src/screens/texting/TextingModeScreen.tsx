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
import { useStreamingResponse } from '../../hooks/useStreamingResponse';
import { TEXTING_PATH } from '../../services/humorService';

type Props = NativeStackScreenProps<MainStackParamList, 'TextingMode'>;

export default function TextingModeScreen({ navigation }: Props) {
  const { response, isStreaming, error, stream, reset } = useStreamingResponse();
  const [context, setContext] = useState('');
  const [userRequest, setUserRequest] = useState('');

  const handleSubmit = () => {
    reset();
    stream(TEXTING_PATH, { context, user_request: userRequest });
  };

  const showResponse = response !== '' || isStreaming;

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

          <Text style={styles.label}>The conversation</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Paste the conversation here…"
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!isStreaming}
          />

          <Text style={styles.label}>What do you need?</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Help me reply to this"
            value={userRequest}
            onChangeText={setUserRequest}
            editable={!isStreaming}
          />

          <TouchableOpacity
            style={[styles.button, isStreaming && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isStreaming}
          >
            <Text style={styles.buttonText}>
              {isStreaming ? 'Thinking…' : 'Get suggestions'}
            </Text>
          </TouchableOpacity>

          {showResponse && (
            <View style={styles.responseCard}>
              <Text style={styles.responseText}>{response}</Text>
              {isStreaming && (
                <ActivityIndicator style={styles.indicator} size="small" />
              )}
            </View>
          )}

          {error !== '' && <Text style={styles.error}>{error}</Text>}

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
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  responseCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#eee',
    gap: 12,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111',
  },
  indicator: {
    alignSelf: 'flex-start',
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
