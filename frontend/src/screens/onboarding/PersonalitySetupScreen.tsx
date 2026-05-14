import React, { useMemo, useState, useEffect } from 'react';
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
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, radii, shadow } from '../../theme';

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
  const { colors } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    chipGroup: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 7 },
    chipSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
    chipText: { fontSize: typography.sizes.label, color: colors.textSecondary },
    chipTextSelected: { color: colors.surface, fontWeight: typography.weights.semibold },
  }), [colors]);

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
  const { colors } = useTheme();

  const [humorStyle, setHumorStyle] = useState('');
  const [personaType, setPersonaType] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('');
  const [culturalTone, setCulturalTone] = useState('');
  const [socialAnxietyLevel, setSocialAnxietyLevel] = useState('mild');
  const [personalityDescription, setPersonalityDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.sm },
    title: { fontSize: typography.sizes.title, fontWeight: typography.weights.bold, marginBottom: spacing.md, color: colors.textPrimary },
    sectionLabel: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, marginTop: spacing.md, marginBottom: spacing.sm, color: colors.textPrimary },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: typography.sizes.base,
      minHeight: 100,
      marginTop: spacing.xs,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    error: { color: colors.error, fontSize: typography.sizes.label, marginTop: spacing.sm },
    savedBanner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      ...shadow.card,
    },
    savedBannerText: { fontSize: typography.sizes.base, fontWeight: typography.weights.semibold, color: colors.textPrimary },
    savedBannerArrow: { fontSize: 20, color: colors.textTertiary },
    button: { backgroundColor: colors.accent, borderRadius: radii.sm, paddingVertical: 14, alignItems: 'center' as const, marginTop: spacing.lg },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: colors.surface, fontSize: typography.sizes.base, fontWeight: typography.weights.semibold },
  }), [colors]);

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
      navigation.navigate('Home');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonLabel = profile?.is_onboarding_complete ? 'Save changes' : 'Save & continue';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>My Profile</Text>

        <TouchableOpacity style={styles.savedBanner} onPress={() => navigation.navigate('SavedResponses')}>
          <Text style={styles.savedBannerText}>💾 Saved responses</Text>
          <Text style={styles.savedBannerArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Humor Style</Text>
        <ChipGroup options={HUMOR_STYLES} selected={humorStyle} onSelect={setHumorStyle} disabled={isSubmitting} />

        <Text style={styles.sectionLabel}>Persona</Text>
        <ChipGroup options={PERSONA_TYPES} selected={personaType} onSelect={setPersonaType} disabled={isSubmitting} />

        <Text style={styles.sectionLabel}>Confidence Level</Text>
        <ChipGroup options={CONFIDENCE_LEVELS} selected={confidenceLevel} onSelect={setConfidenceLevel} disabled={isSubmitting} />

        <Text style={styles.sectionLabel}>Cultural Tone</Text>
        <ChipGroup options={CULTURAL_TONES} selected={culturalTone} onSelect={setCulturalTone} disabled={isSubmitting} />

        <Text style={styles.sectionLabel}>Social anxiety</Text>
        <ChipGroup options={SOCIAL_ANXIETY_LEVELS} selected={socialAnxietyLevel} onSelect={setSocialAnxietyLevel} disabled={isSubmitting} />

        <Text style={styles.sectionLabel}>About you</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your humor style and personality in your own words…"
          placeholderTextColor={colors.textTertiary}
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
          <Text style={styles.buttonText}>{isSubmitting ? 'Saving…' : buttonLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
