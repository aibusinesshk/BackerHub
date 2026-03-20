'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/types';
import type { UserRole, Region } from '@/types';

type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  displayNameZh?: string | null;
  role: UserRole;
  region: Region;
  avatarUrl: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  kycStatus: KycStatus;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    displayName: string;
    email: string;
    password: string;
    role: UserRole;
    region: Region;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_SESSION_KEY = 'backerhub-demo-session';

function mapProfileToAuthUser(profile: Profile): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
    displayNameZh: profile.display_name_zh,
    role: profile.role as UserRole,
    region: profile.region as Region,
    avatarUrl: profile.avatar_url,
    isVerified: profile.is_verified,
    isAdmin: profile.is_admin,
    kycStatus: (profile.kyc_status || 'none') as KycStatus,
  };
}

// --- Demo auth helpers (used when Supabase is not configured) ---

function getDemoSession(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY) || sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function setDemoSession(user: AuthUser, remember: boolean) {
  const json = JSON.stringify(user);
  // Also set a cookie so middleware can detect the session
  const maxAge = remember ? 60 * 60 * 24 * 30 : ''; // 30 days or session
  const expires = remember ? `; max-age=${maxAge}` : '';
  document.cookie = `${DEMO_SESSION_KEY}=${encodeURIComponent(json)}; path=/${expires}; SameSite=Lax`;
  if (remember) {
    localStorage.setItem(DEMO_SESSION_KEY, json);
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } else {
    sessionStorage.setItem(DEMO_SESSION_KEY, json);
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
  sessionStorage.removeItem(DEMO_SESSION_KEY);
  document.cookie = `${DEMO_SESSION_KEY}=; path=/; max-age=0`;
}

function makeDemoUser(email: string, displayName: string, role: UserRole, region: Region): AuthUser {
  // Deterministic ID from email
  const id = crypto.randomUUID?.() || `demo-${Date.now()}`;
  return {
    id,
    email,
    displayName,
    displayNameZh: null,
    role,
    region,
    avatarUrl: null,
    isVerified: false,
    isAdmin: false,
    kycStatus: 'none' as KycStatus,
  };
}

// Store registered demo accounts in localStorage so they persist
function getDemoAccounts(): Record<string, { password: string; user: AuthUser }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('backerhub-demo-accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDemoAccount(email: string, password: string, user: AuthUser) {
  const accounts = getDemoAccounts();
  accounts[email.toLowerCase()] = { password, user };
  localStorage.setItem('backerhub-demo-accounts', JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const useDemo = !isSupabaseConfigured();
  const supabase = createClient();

  const fetchProfile = useCallback(async (authUser: User) => {
    // Retry up to 3 times with delay — profile may not exist yet due to DB trigger timing
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(mapProfileToAuthUser(profile));
        return;
      }

      // Wait before retrying (500ms, 1000ms)
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    // If all retries failed, log but don't crash
    console.warn('Profile not found after retries for user:', authUser.id);
  }, [supabase]);

  // Listen for auth state changes
  useEffect(() => {
    if (useDemo) {
      // Demo mode: restore session from storage
      const saved = getDemoSession();
      if (saved) setUser(saved);
      setIsLoading(false);
      return;
    }

    // Supabase mode
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user);
      }
      setIsLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, useDemo]);

  const login = async (email: string, password: string, rememberMe = false) => {
    if (useDemo) {
      // Demo mode: check against registered demo accounts
      const accounts = getDemoAccounts();
      const account = accounts[email.toLowerCase()];
      if (account) {
        if (account.password !== password) {
          return { success: false, error: 'Invalid login credentials' };
        }
        setDemoSession(account.user, rememberMe);
        setUser(account.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid login credentials' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const signup = async (data: {
    displayName: string;
    email: string;
    password: string;
    role: UserRole;
    region: Region;
  }) => {
    if (useDemo) {
      // Demo mode: register locally and auto-login
      const accounts = getDemoAccounts();
      if (accounts[data.email.toLowerCase()]) {
        return { success: false, error: 'An account with this email already exists' };
      }
      const demoUser = makeDemoUser(data.email, data.displayName, data.role, data.region);
      saveDemoAccount(data.email, data.password, demoUser);
      setDemoSession(demoUser, true);
      setUser(demoUser);
      return { success: true };
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          role: data.role,
          region: data.region,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Signup failed' };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        // Account was created but auto-login failed — user should log in manually
        return { success: false, error: signInError.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    if (useDemo) {
      clearDemoSession();
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshProfile = async () => {
    if (useDemo) {
      const saved = getDemoSession();
      if (saved) setUser(saved);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfile(session.user);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
