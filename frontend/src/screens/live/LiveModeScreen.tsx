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
import api from '../../services/api';

type Props = NativeStackScreenProps<MainStackParamList, 'LiveMode'>;
type RecordingState = 'idle' | 'recording' | 'processing';

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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setCopied(false);
  }, [currentIndex]);

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
    await Clipboard.setStringAsync(response.options[currentIndex].text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            placeholder="e.g. Late night, conversation's been flirty, she takes a while to reply"
            value={environment}
            onChangeText={setEnvironment}
            editable={recordingState === 'idle'}
          />

          <View style={styles.recordSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  recordingState === 'recording' && styles.recordButtonActive,
                  (!canRecord || recordingState === 'processing') && styles.recordButtonDisabled,
                ]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={!canRecord || recordingState === 'processing'}
                activeOpacity={0.85}
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
                  ? 'Hold to speak'
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
  recordSection: {
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 8,
    gap: 14,
  },
  recordButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#e53e3e',
  },
  recordButtonDisabled: {
    opacity: 0.35,
  },
  recordDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  recordLabel: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  recordLabelMuted: {
    color: '#bbb',
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
    fontSize: 17,
    lineHeight: 25,
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  navArrow: {
    padding: 8,
  },
  navArrowText: {
    fontSize: 32,
    color: '#333',
    lineHeight: 36,
  },
  navArrowDisabled: {
    color: '#ccc',
  },
  navCounter: {
    fontSize: 14,
    color: '#666',
    minWidth: 48,
    textAlign: 'center',
  },
  deliveryToggle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deliveryToggleText: {
    fontSize: 14,
    color: '#4a6cf7',
  },
  deliveryCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    borderWidth: 1,
    borderColor: '#d6e0ff',
  },
  deliveryText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#333',
  },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
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
