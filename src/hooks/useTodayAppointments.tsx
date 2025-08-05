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
      console.log('fetchTodayAppointments started, isAdmin:', isAdmin);
      
      if (!isAdmin) {
        console.log('User is not admin, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Searching for appointments on:', today);
        
        // Primeiro, vamos tentar uma query mais simples para ver se há agendamentos
        const { data: simpleData, error: simpleError } = await supabase
          .from('appointments')
          .select('*')
          .eq('appointment_date', today);
        
        console.log('Simple query result:', { simpleData, simpleError });
        
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
          .eq('appointment_date', today)
          .order('appointment_time', { ascending: true });

        console.log('Query result:', { data, queryError });
        if (queryError) {
          throw queryError;
        }

        if (!data || data.length === 0) {
          console.log('No appointments found for today');
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

        console.log('Final appointments with details:', appointmentsWithDetails);
        setAppointments(appointmentsWithDetails);
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