'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from './supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch additional user details
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          setUser({
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            username: userData.username
          });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userData && !userError) {
          setUser({
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            username: userData.username
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    username: string
  ): Promise<void> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              first_name: firstName,
              last_name: lastName,
              username: username,
              password_hash: 'managed_by_supabase_auth'
            }
          ]);

        if (insertError) throw insertError;

        // Create default library
        const { error: libraryError } = await supabase
          .from('libraries')
          .insert([
            {
              owner_id: data.user.id,
              name: `${firstName}'s Library`,
              description: 'My personal book collection'
            }
          ]);

        if (libraryError) throw libraryError;

        setUser({
          id: data.user.id,
          email: data.user.email!,
          firstName,
          lastName,
          username
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}