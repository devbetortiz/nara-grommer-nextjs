import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface TomorrowAppointment {
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

export const useTomorrowAppointments = () => {
  const [appointments, setAppointments] = useState<TomorrowAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    const fetchTomorrowAppointments = async () => {
      console.log('fetchTomorrowAppointments started, isAdmin:', isAdmin);
      
      if (!isAdmin) {
        console.log('User is not admin, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        // Calcular a data de amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        
        console.log('Searching for appointments on:', tomorrowStr);

        const { data, error: queryError } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_time,
            service_type,
            status,
            price,
            notes,
            user_id,
            pet_id
          `)
          .eq('appointment_date', tomorrowStr)
          .order('appointment_time', { ascending: true });

        console.log('Tomorrow appointments query result:', { data, queryError });

        if (queryError) {
          throw queryError;
        }

        if (!data || data.length === 0) {
          console.log('No appointments found for tomorrow');
          setAppointments([]);
          return;
        }

        // Buscar informações dos pets e usuários separadamente
        const appointmentsWithDetails = await Promise.all(
          data.map(async (appointment) => {
            // Buscar pet
            const { data: petData, error: petError } = await supabase
              .from('pets')
              .select('name, breed')
              .eq('id', appointment.pet_id)
              .single();

            console.log('Pet query for', appointment.pet_id, ':', { petData, petError });

            // Buscar usuário
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', appointment.user_id)
              .single();

            console.log('User query for', appointment.user_id, ':', { userData, userError });

            return {
              id: appointment.id,
              appointment_time: appointment.appointment_time,
              service_type: appointment.service_type,
              status: appointment.status,
              price: appointment.price,
              notes: appointment.notes,
              pet: {
                name: petData?.name || 'Pet não encontrado',
                breed: petData?.breed
              },
              user: {
                full_name: userData?.full_name,
                email: userData?.email || 'Usuário não encontrado'
              }
            };
          })
        );

        console.log('Final tomorrow appointments with details:', appointmentsWithDetails);
        setAppointments(appointmentsWithDetails);
      } catch (err) {
        console.error('Erro ao buscar agendamentos de amanhã:', err);
        setError('Erro ao carregar agendamentos');
      } finally {
        setLoading(false);
      }
    };

    fetchTomorrowAppointments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('tomorrow-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          fetchTomorrowAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  return {
    appointments,
    loading,
    error,
    count: appointments.length
  };
};