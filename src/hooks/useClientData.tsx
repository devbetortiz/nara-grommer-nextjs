import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useClientData = () => {
  const { user } = useAuth();
  const [hasClientData, setHasClientData] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkClientData = async () => {
      if (!user) {
        setHasClientData(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('cpf')
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking client data:', error);
          setHasClientData(false);
        } else {
          setHasClientData(!!data?.cpf);
        }
      } catch (error) {
        console.error('Error checking client data:', error);
        setHasClientData(false);
      } finally {
        setLoading(false);
      }
    };

    checkClientData();
  }, [user]);

  return {
    hasClientData,
    loading
  };
};