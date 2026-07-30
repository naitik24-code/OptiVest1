export interface UserPreference {
  max_reallocation_pct: number;
  risk_tolerance_level: number;
  preferred_benchmark: string;
  investment_goal: string;
  timezone: string;
  preferred_currency: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  is_verified?: boolean;
  avatar_url?: string | null;
  created_at: string;
}

export interface UserProfile extends User {
  preference?: UserPreference;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  avatar_url?: string | null;
  max_reallocation_pct?: number;
  risk_tolerance_level?: number;
  preferred_benchmark?: string;
  investment_goal?: string;
  timezone?: string;
  preferred_currency?: string;
}
