import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePetsCount = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPetsCount = async () => {
      if (!user) {
        setCount(0);
        setThisMonthCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get total pets count
        const { count: totalCount, error: totalError } = await supabase
          .from('pets')
          .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // Get pets count for this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: monthCount, error: monthError } = await supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString());

        if (monthError) throw monthError;

        setCount(totalCount || 0);
        setThisMonthCount(monthCount || 0);
      } catch (err) {
        console.error('Error fetching pets count:', err);
        setError('Erro ao carregar dados dos pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPetsCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pets-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets'
        },
        () => {
          fetchPetsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    count,
    thisMonthCount,
    loading,
    error
  };
};