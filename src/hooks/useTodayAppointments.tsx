import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface TodayAppointment {
  id: string;
  appointment_time: string;
  service_type: string;
  status: string;
  price: number | null;
  notes: string | null;
  pet: {
    name: string;
    breed: string | null;
  };
  user: {
    full_name: string | null;
    email: string | null;
  };
}

export const useTodayAppointments = () => {

  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAdmin } = useUserRole();

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];

        const { data, error: queryError } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_time,
            service_type,
            status,
            price,
            notes,
            pet: pets ( name, breed ),
            user: profiles ( full_name, email )
          `)
          .eq('appointment_date', today)
          .order('appointment_time', { ascending: true });

        if (queryError) {
          throw queryError;
        }

        setAppointments(data || []);
      } catch (err) {
        console.error('Erro ao buscar agendamentos de hoje:', err);
        setError('Erro ao carregar agendamentos');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, [isAdmin]);

  return {
    appointments,
    loading,
    error,
    count: appointments.length
  };
};