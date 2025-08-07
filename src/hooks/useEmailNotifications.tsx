import { useState } from 'react';
import { emailService } from '@/services/EmailService';

export function useEmailNotifications() {
  const [isLoading, setIsLoading] = useState(false);

  const sendWelcomeEmail = async (userName: string, userEmail: string) => {
    setIsLoading(true);

    try {
      console.log('📧 [useEmailNotifications] Enviando email de boas-vindas:', { userName, userEmail });

      const result = await emailService.sendWelcomeEmail(userEmail, userName);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar email de boas-vindas');
      }

      console.log('✅ [useEmailNotifications] Email de boas-vindas enviado com sucesso!');
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [useEmailNotifications] Erro ao enviar email de boas-vindas:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendAppointmentConfirmation = async (
    userName: string,
    userEmail: string,
    appointmentData: {
      petName: string;
      appointmentDate: string;
      appointmentTime: string;
      veterinarianName: string;
      clinicName?: string;
      clinicAddress?: string;
      confirmationUrl?: string;
    }
  ) => {
    setIsLoading(true);

    try {
      console.log('📧 [useEmailNotifications] Enviando confirmação de agendamento:', { userName, userEmail });

      const result = await emailService.sendAppointmentConfirmation(userEmail, userName, {
        ...appointmentData,
        confirmationUrl: appointmentData.confirmationUrl || `${window.location.origin}/appointments`
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar confirmação de agendamento');
      }

      console.log('✅ [useEmailNotifications] Confirmação de agendamento enviada com sucesso!');
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [useEmailNotifications] Erro ao enviar confirmação de agendamento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendAppointmentReminder = async (
    userName: string,
    userEmail: string,
    appointmentData: {
      petName: string;
      appointmentDate: string;
      appointmentTime: string;
      veterinarianName: string;
      clinicName?: string;
      clinicAddress?: string;
    }
  ) => {
    setIsLoading(true);

    try {
      console.log('📧 [useEmailNotifications] Enviando lembrete de agendamento:', { userName, userEmail });

      const result = await emailService.sendAppointmentReminder(userEmail, userName, appointmentData);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar lembrete de agendamento');
      }

      console.log('✅ [useEmailNotifications] Lembrete de agendamento enviado com sucesso!');
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [useEmailNotifications] Erro ao enviar lembrete de agendamento:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailServiceHealth = async () => {
    setIsLoading(true);

    try {
      console.log('🏥 [useEmailNotifications] Verificando saúde do serviço de email...');

      const result = await emailService.healthCheck();

      console.log('📊 [useEmailNotifications] Status do serviço:', result);
      return result;

    } catch (error) {
      console.error('❌ [useEmailNotifications] Erro no health check:', error);
      return { healthy: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendWelcomeEmail,
    sendAppointmentConfirmation,
    sendAppointmentReminder,
    checkEmailServiceHealth,
    isLoading
  };
}