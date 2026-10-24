import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { dailyTarget, type Profile, type Target } from '@/lib/calories';
import { loadProfile } from '@/lib/db';

/** Profil et objectif calorique, rechargés à chaque retour sur l'écran ou sur demande. */
export function useTarget() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [target, setTarget] = useState<Target | null>(null);

  const reload = useCallback(() => {
    let active = true;
    loadProfile()
      .then(({ profile: p }) => {
        if (!active) return;
        setProfile(p);
        setTarget(p ? dailyTarget(p) : null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(reload);

  return { profile, target, reload };
}
