import { useState, useEffect, useCallback } from 'react';
import * as profileService from '../services/profileService';
import { Profile, ProfileUpdate } from '../types/profile';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    profileService.getProfile()
      .then(setProfile)
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setIsLoading(false));
  }, []);

  const update = useCallback(async (data: ProfileUpdate): Promise<void> => {
    const updated = await profileService.updateProfile(data);
    setProfile(updated);
  }, []);

  return { profile, isLoading, error, update };
}
