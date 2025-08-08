import { supabase } from '@/integrations/supabase/client';

export interface EmailData {
  to: string;
  subject: string;
  userName: string;
  data?: Record<string, unknown>;
}

export interface WelcomeEmailData extends EmailData {
  data: {
    userName: string;
    loginUrl: string;
    supportEmail: string;
  };
}

export interface PasswordResetEmailData extends EmailData {
  data: {
    userName: string;
    resetUrl: string;
    expirationTime: string;
  };
}

export interface AppointmentEmailData extends EmailData {
  data: {
    userName: string;
    petName: string;
    appointmentDate: string;
    appointmentTime: string;
    veterinarianName: string;
    clinicName: string;
    clinicAddress: string;
    confirmationUrl?: string;
  };
}

export type EmailType = 'welcome' | 'password-reset' | 'appointment-confirmation' | 'appointment-reminder';

class EmailService {
  private readonly functionName = 'send-notification-email';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Envia um email usando a edge function do Supabase
   */
  private async sendEmail(type: EmailType, emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📧 [EmailService] Tentativa ${attempt}/${this.maxRetries} - Enviando email tipo "${type}" para ${emailData.to}`);

        const { data, error } = await supabase.functions.invoke(this.functionName, {
          body: {
            type,
            to: emailData.to,
            userName: emailData.userName,
            data: emailData.data
          }
        });

        if (error) {
          console.error(`❌ [EmailService] Erro na tentativa ${attempt}:`, error);
          lastError = error;
          
          if (attempt < this.maxRetries) {
            console.log(`⏳ [EmailService] Aguardando ${this.retryDelay}ms antes da próxima tentativa...`);
            await this.delay(this.retryDelay);
            continue;
          }
        } else {
          console.log(`✅ [EmailService] Email enviado com sucesso na tentativa ${attempt}:`, data);
          return { success: true };
        }
      } catch (error) {
        console.error(`💥 [EmailService] Erro inesperado na tentativa ${attempt}:`, error);
        lastError = error;
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }

    const errorMessage = this.extractErrorMessage(lastError);
    console.error(`❌ [EmailService] Falha após ${this.maxRetries} tentativas. Erro: ${errorMessage}`);
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }

  /**
   * Envia email de boas-vindas
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const emailData: WelcomeEmailData = {
      to: userEmail,
      subject: `Bem-vindo(a) ao Nara Grommer, ${userName}!`,
      userName,
      data: {
        userName,
        loginUrl: `${window.location.origin}/auth`,
        supportEmail: 'suporte@naragrommer.com'
      }
    };

    console.log(`🎉 [EmailService] Enviando email de boas-vindas para ${userName} (${userEmail})`);
    return this.sendEmail('welcome', emailData);
  }

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordResetEmail(userEmail: string, userName: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
    const emailData: PasswordResetEmailData = {
      to: userEmail,
      subject: 'Recuperação de Senha - Nara Grommer',
      userName,
      data: {
        userName,
        resetUrl,
        expirationTime: '1 hora'
      }
    };

    console.log(`🔐 [EmailService] Enviando email de recuperação de senha para ${userName} (${userEmail})`);
    return this.sendEmail('password-reset', emailData);
  }

  /**
   * Envia email de confirmação de agendamento
   */
  async sendAppointmentConfirmation(
    userEmail: string, 
    userName: string, 
    appointmentData: AppointmentEmailData['data']
  ): Promise<{ success: boolean; error?: string }> {
    const emailData: AppointmentEmailData = {
      to: userEmail,
      subject: `Agendamento Confirmado - ${appointmentData.appointmentDate}`,
      userName,
      data: appointmentData
    };

    console.log(`📅 [EmailService] Enviando confirmação de agendamento para ${userName} (${userEmail})`);
    return this.sendEmail('appointment-confirmation', emailData);
  }

  /**
   * Envia email de lembrete de agendamento
   */
  async sendAppointmentReminder(
    userEmail: string, 
    userName: string, 
    appointmentData: AppointmentEmailData['data']
  ): Promise<{ success: boolean; error?: string }> {
    const emailData: AppointmentEmailData = {
      to: userEmail,
      subject: `Lembrete: Consulta amanhã - ${appointmentData.appointmentDate}`,
      userName,
      data: appointmentData
    };

    console.log(`⏰ [EmailService] Enviando lembrete de agendamento para ${userName} (${userEmail})`);
    return this.sendEmail('appointment-reminder', emailData);
  }

  /**
   * Verifica se o serviço de email está configurado corretamente
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      console.log('🏥 [EmailService] Verificando saúde do serviço de email...');
      
      const { data, error } = await supabase.functions.invoke(this.functionName, {
        body: {
          type: 'health-check'
        }
      });

      if (error) {
        console.error('❌ [EmailService] Health check falhou:', error);
        return { healthy: false, error: this.extractErrorMessage(error) };
      }

      console.log('✅ [EmailService] Serviço de email está saudável:', data);
      return { healthy: true };
    } catch (error) {
      console.error('💥 [EmailService] Erro no health check:', error);
      return { healthy: false, error: this.extractErrorMessage(error) };
    }
  }

  /**
   * Extrai mensagem de erro de diferentes tipos de erro
   */
  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (err.message && typeof err.message === 'string') return err.message;
      if (err.error && typeof err.error === 'object') {
        const nestedErr = err.error as Record<string, unknown>;
        if (nestedErr.message && typeof nestedErr.message === 'string') return nestedErr.message;
      }
      if (err.details && typeof err.details === 'string') return err.details;
    }
    return 'Erro desconhecido no serviço de email';
  }

  /**
   * Delay helper para retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valida dados de email antes do envio
   */
  private validateEmailData(emailData: EmailData): { valid: boolean; error?: string } {
    if (!emailData.to || !this.isValidEmail(emailData.to)) {
      return { valid: false, error: 'Email destinatário inválido' };
    }

    if (!emailData.userName || emailData.userName.trim().length === 0) {
      return { valid: false, error: 'Nome do usuário é obrigatório' };
    }

    if (!emailData.subject || emailData.subject.trim().length === 0) {
      return { valid: false, error: 'Assunto do email é obrigatório' };
    }

    return { valid: true };
  }

  /**
   * Validação simples de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Singleton instance
export const emailService = new EmailService();

// Export para compatibilidade com código existente
export default emailService;
