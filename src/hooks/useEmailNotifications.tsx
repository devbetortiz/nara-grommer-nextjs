import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailData {
  userName: string;
  userEmail: string;
  petName?: string;
  serviceType?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  price?: number;
  notes?: string;
  appointmentId?: string;
  userId?: string;
}

type EmailType = 'welcome' | 'appointment_confirmation' | 'appointment_reminder';

export const useEmailNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendEmail = async (type: EmailType, to: string, data: EmailData) => {
    try {
      console.log(`Enviando email tipo: ${type} para: ${to}`);
      
      const { data: response, error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type,
          to,
          data,
        },
      });

      if (error) {
        throw error;
      }

      if (!response.success) {
        throw new Error(response.error || 'Erro ao enviar email');
      }

      console.log('Email enviado com sucesso:', response);
      return response;

    } catch (error: unknown) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Não foi possível enviar o email de notificação",
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendWelcomeEmail = async (userName: string, userEmail: string) => {
    return sendEmail('welcome', userEmail, {
      userName,
      userEmail,
    });
  };

  const sendAppointmentConfirmation = async (
    userEmail: string,
    userName: string,
    petName: string,
    serviceType: string,
    appointmentDate: string,
    appointmentTime: string,
    appointmentId: string,
    userId: string,
    price?: number,
    notes?: string
  ) => {
    return sendEmail('appointment_confirmation', userEmail, {
      userName,
      userEmail,
      petName,
      serviceType,
      appointmentDate,
      appointmentTime,
      price,
      notes,
      appointmentId,
      userId,
    });
  };

  const sendAppointmentReminder = async (
    userEmail: string,
    userName: string,
    petName: string,
    serviceType: string,
    appointmentDate: string,
    appointmentTime: string,
    price?: number
  ) => {
    return sendEmail('appointment_reminder', userEmail, {
      userName,
      userEmail,
      petName,
      serviceType,
      appointmentDate,
      appointmentTime,
      price,
    });
  };

  const formatAppointmentDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return dateString;
    }
  };

  const formatAppointmentTime = (timeString: string) => {
    try {
      return timeString.slice(0, 5); // Remove seconds if present
    } catch (error) {
      console.error('Erro ao formatar horário:', error);
      return timeString;
    }
  };

  return {
    sendWelcomeEmail,
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    formatAppointmentDate,
    formatAppointmentTime,
  };
};