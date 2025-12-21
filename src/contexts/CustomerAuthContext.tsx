import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface CustomerData {
  id: string;
  customer_id: string;
  email: string;
  name?: string;
  created_at: string;
  last_login: string;
}

interface CustomerAuthContextType {
  user: User | null;
  customerData: CustomerData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, customerId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkImpersonation = sessionStorage.getItem('admin_impersonation');

    if (checkImpersonation) {
      const impersonationData = JSON.parse(checkImpersonation);
      setUser({ id: impersonationData.customer_user_id, email: impersonationData.customer_email } as User);
      setCustomerData({
        id: impersonationData.customer_user_id,
        customer_id: impersonationData.customer_id,
        email: impersonationData.customer_email,
        name: impersonationData.customer_name,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCustomerData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCustomerData(session.user.id);
      } else {
        setCustomerData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCustomerData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCustomerData(data);
        await supabase
          .from('customer_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, customerId: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      const { error: insertError } = await supabase
        .from('customer_users')
        .insert({
          id: data.user.id,
          customer_id: customerId,
          email: email,
        });

      if (insertError) {
        await supabase.auth.signOut();
        throw insertError;
      }
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem('admin_impersonation');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <CustomerAuthContext.Provider value={{ user, customerData, loading, signIn, signUp, signOut }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
