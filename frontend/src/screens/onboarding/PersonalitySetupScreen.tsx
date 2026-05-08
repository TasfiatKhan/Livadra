import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
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
import { useProfile } from '../../hooks/useProfile';
import {
  ChoiceOption,
  HUMOR_STYLES,
  PERSONA_TYPES,
  CONFIDENCE_LEVELS,
  CULTURAL_TONES,
  SOCIAL_ANXIETY_LEVELS,
} from '../../constants/humor';

type Props = NativeStackScreenProps<MainStackParamList, 'PersonalitySetup'>;

function ChipGroup({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: ChoiceOption[];
  selected: string;
  onSelect: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.chipGroup}>
      {options.map(opt => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(opt.value)}
            disabled={disabled}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function PersonalitySetupScreen({ navigation }: Props) {
  const { profile, isLoading, update } = useProfile();

  const [humorStyle, setHumorStyle] = useState('');
  const [personaType, setPersonaType] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
  const [culturalTone, setCulturalTone] = useState('');
  const [socialAnxietyLevel, setSocialAnxietyLevel] = useState('mild');
  const [personalityDescription, setPersonalityDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setHumorStyle(profile.humor_style);
      setPersonaType(profile.persona_type);
      setConfidenceLevel(profile.confidence_level);
      setCulturalTone(profile.cultural_tone);
      setSocialAnxietyLevel(profile.social_anxiety_level || 'mild');
      setPersonalityDescription(profile.personality_description);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await update({
        humor_style: humorStyle,
        persona_type: personaType,
        confidence_level: confidenceLevel,
        cultural_tone: culturalTone,
        social_anxiety_level: socialAnxietyLevel,
        personality_description: personalityDescription,
      });
      navigation.navigate('TextingMode');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonLabel = profile?.is_onboarding_complete ? 'Save changes' : 'Save & continue';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>My Profile</Text>

        <TouchableOpacity
          style={styles.savedBanner}
          onPress={() => navigation.navigate('SavedResponses')}
        >
          <Text style={styles.savedBannerText}>💾 Saved responses</Text>
          <Text style={styles.savedBannerArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Humor Style</Text>
        <ChipGroup
          options={HUMOR_STYLES}
          selected={humorStyle}
          onSelect={setHumorStyle}
          disabled={isSubmitting}
        />

        <Text style={styles.sectionLabel}>Persona</Text>
        <ChipGroup
          options={PERSONA_TYPES}
          selected={personaType}
          onSelect={setPersonaType}
          disabled={isSubmitting}
        />

        <Text style={styles.sectionLabel}>Confidence Level</Text>
        <ChipGroup
          options={CONFIDENCE_LEVELS}
          selected={confidenceLevel}
          onSelect={setConfidenceLevel}
          disabled={isSubmitting}
        />

        <Text style={styles.sectionLabel}>Cultural Tone</Text>
        <ChipGroup
          options={CULTURAL_TONES}
          selected={culturalTone}
          onSelect={setCulturalTone}
          disabled={isSubmitting}
        />

        <Text style={styles.sectionLabel}>Social anxiety</Text>
        <ChipGroup
          options={SOCIAL_ANXIETY_LEVELS}
          selected={socialAnxietyLevel}
          onSelect={setSocialAnxietyLevel}
          disabled={isSubmitting}
        />

        <Text style={styles.sectionLabel}>About you</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your humor style and personality in your own words…"
          value={personalityDescription}
          onChangeText={setPersonalityDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          editable={!isSubmitting}
        />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Saving…' : buttonLabel}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipSelected: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  chipText: {
    fontSize: 14,
    color: '#444',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
    marginTop: 4,
  },
  error: {
    color: '#e53e3e',
    fontSize: 14,
    marginTop: 8,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  savedBannerText: { fontSize: 15, fontWeight: '600', color: '#111' },
  savedBannerArrow: { fontSize: 20, color: '#aaa' },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
