'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/supabase/types';
import type { UserRole, Region } from '@/types';

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
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    displayName: string;
    email: string;
    password: string;
    role: UserRole;
    region: Region;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  loginWithLINE: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Subscribe to auth changes
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
  }, [supabase, fetchProfile]);

  const login = async (email: string, password: string) => {
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
    try {
      // Call server-side API that uses admin client (auto-confirms email)
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

      // Account created & confirmed — now sign in immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        // Account was created but auto-login failed — user can still login manually
        return { success: true, error: undefined };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const loginWithLINE = async () => {
    // LINE uses custom OIDC provider in Supabase
    await supabase.auth.signInWithOAuth({
      provider: 'google', // TODO: Replace with LINE when configured in Supabase
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshProfile = async () => {
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
      loginWithGoogle,
      loginWithLINE,
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
