"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DashboardPayload, UserProfileForm } from "./types";

interface PlannerState {
  profile: UserProfileForm | null;
  reviews: Record<string, string>;
  result: DashboardPayload | null;
  analyzedProfileKey: string | null;
  setProfile: (p: UserProfileForm) => void;
  setReview: (clinicId: string, raw: string) => void;
  setResult: (r: DashboardPayload | null) => void;
  reset: () => void;
  isResultStale: () => boolean;
}

function profileKey(p: UserProfileForm | null): string {
  if (!p) return "";
  return JSON.stringify({
    skin: p.skin_type,
    concerns: p.concerns.map((c) => `${c.priority}:${c.name}`),
    age: p.age_range,
    action: p.action_day,
    care: p.care_level,
    budget: p.budget,
  });
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      profile: null,
      reviews: {},
      result: null,
      analyzedProfileKey: null,
      setProfile: (p) =>
        set((s) => {
          const newKey = profileKey(p);
          const sameAsAnalyzed = newKey === s.analyzedProfileKey;
          return {
            profile: p,
            result: sameAsAnalyzed ? s.result : null,
          };
        }),
      setReview: (clinicId, raw) =>
        set((s) => ({ reviews: { ...s.reviews, [clinicId]: raw } })),
      setResult: (r) =>
        set((s) => ({
          result: r,
          analyzedProfileKey: r ? profileKey(s.profile) : null,
        })),
      reset: () =>
        set({ profile: null, reviews: {}, result: null, analyzedProfileKey: null }),
      isResultStale: () => {
        const s = get();
        if (!s.profile || !s.analyzedProfileKey) return false;
        return profileKey(s.profile) !== s.analyzedProfileKey;
      },
    }),
    { name: "skincare-planner" }
  )
);
