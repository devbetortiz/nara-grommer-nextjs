import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Interfaces
interface EmailRequest {
  type: EmailType;
  to: string;
  userName: string;
  data?: Record<string, any>;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
  details?: any;
}

type EmailType = 'welcome' | 'password-reset' | 'appointment-confirmation' | 'appointment-reminder' | 'health-check';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

// Template generators
class EmailTemplateGenerator {
  static generateWelcomeEmail(userName: string, data: any): { subject: string; html: string } {
    const subject = `Bem-vindo(a) ao Nara Grommer, ${userName}! 🐾`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0; font-size: 32px; font-weight: 700;">🐾 Nara Grommer</h1>
            <p style="color: #64748b; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">Cuidado especial para seu pet</p>
          </div>
          
          <!-- Main Content -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
              <h2 style="margin: 0; font-size: 24px;">Olá, ${userName}! 👋</h2>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Seja muito bem-vindo(a) à nossa família!</p>
            </div>
          </div>
          
          <p style="color: #475569; line-height: 1.7; margin-bottom: 25px; font-size: 16px; text-align: center;">
            Estamos muito felizes em tê-lo(a) conosco. Nossa plataforma foi criada com muito carinho para oferecer o melhor cuidado para seu pet.
          </p>
          
          <!-- Features -->
          <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0;">
            <h3 style="color: #334155; margin: 0 0 20px 0; text-align: center; font-size: 18px;">O que você pode fazer:</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; color: #475569;">
                <span style="margin-right: 12px; font-size: 20px;">🗓️</span>
                <span>Agendar consultas e procedimentos</span>
              </div>
              <div style="display: flex; align-items: center; color: #475569;">
                <span style="margin-right: 12px; font-size: 20px;">📋</span>
                <span>Acompanhar o histórico de saúde do seu pet</span>
              </div>
              <div style="display: flex; align-items: center; color: #475569;">
                <span style="margin-right: 12px; font-size: 20px;">💬</span>
                <span>Receber lembretes importantes</span>
              </div>
              <div style="display: flex; align-items: center; color: #475569;">
                <span style="margin-right: 12px; font-size: 20px;">📞</span>
                <span>Entrar em contato com nossa equipe</span>
              </div>
            </div>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${data?.loginUrl || 'http://localhost:3000/auth'}" 
               style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3); transition: all 0.3s ease;">
              Acessar Minha Conta 🚀
            </a>
          </div>
          
          <!-- Support Info -->
          <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <p style="color: #065f46; margin: 0; font-size: 14px; text-align: center;">
              <strong>💚 Precisa de ajuda?</strong><br>
              Nossa equipe está sempre pronta para ajudar!<br>
              📧 ${data?.supportEmail || 'suporte@naragrommer.com'}
            </p>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              © 2024 Nara Grommer. Todos os direitos reservados.<br>
              <span style="color: #ef4444;">❤️</span> Feito com amor para o bem-estar dos pets.
            </p>
          </div>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  static generatePasswordResetEmail(userName: string, data: any): { subject: string; html: string } {
    const subject = `Recuperação de Senha - Nara Grommer 🔐`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Recuperação de Senha</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Nara Grommer</p>
            </div>
          </div>
          
          <h2 style="color: #334155; margin-bottom: 20px; text-align: center;">Olá, ${userName}!</h2>
          
          <p style="color: #475569; line-height: 1.7; margin-bottom: 25px; text-align: center; font-size: 16px;">
            Recebemos uma solicitação para redefinir a senha da sua conta.
          </p>
          
          <!-- Security Notice -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Se você não solicitou esta alteração, pode ignorar este email com segurança.
            </p>
          </div>
          
          <p style="color: #475569; line-height: 1.7; margin: 25px 0; text-align: center;">
            Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>${data?.expirationTime || '1 hora'}</strong>.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${data?.resetUrl || '#'}" 
               style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);">
              Redefinir Senha 🔑
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
            Ou copie e cole este link no seu navegador:<br>
            <a href="${data?.resetUrl || '#'}" style="color: #3b82f6; word-break: break-all;">${data?.resetUrl || 'Link não disponível'}</a>
          </p>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              © 2024 Nara Grommer. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  static generateAppointmentConfirmation(userName: string, data: any): { subject: string; html: string } {
    const subject = `Agendamento Confirmado - ${data?.appointmentDate || 'Data'} 📅`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 20px; border-radius: 12px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Agendamento Confirmado</h1>
            </div>
          </div>
          
          <h2 style="color: #334155; margin-bottom: 20px; text-align: center;">Olá, ${userName}!</h2>
          
          <p style="color: #475569; line-height: 1.7; margin-bottom: 30px; text-align: center; font-size: 16px;">
            Seu agendamento foi confirmado com sucesso! 🎉
          </p>
          
          <!-- Appointment Details -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; padding: 25px; border-radius: 12px; margin: 30px 0;">
            <h3 style="color: #0369a1; margin: 0 0 20px 0; text-align: center; font-size: 18px;">📋 Detalhes do Agendamento</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bae6fd;">
                <strong style="color: #0c4a6e;">🐕 Pet:</strong>
                <span style="color: #374151;">${data?.petName || 'Não informado'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bae6fd;">
                <strong style="color: #0c4a6e;">📅 Data:</strong>
                <span style="color: #374151;">${data?.appointmentDate || 'Não informada'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bae6fd;">
                <strong style="color: #0c4a6e;">⏰ Horário:</strong>
                <span style="color: #374151;">${data?.appointmentTime || 'Não informado'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #bae6fd;">
                <strong style="color: #0c4a6e;">👩‍⚕️ Veterinário(a):</strong>
                <span style="color: #374151;">${data?.veterinarianName || 'Não informado'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <strong style="color: #0c4a6e;">🏥 Local:</strong>
                <span style="color: #374151;">${data?.clinicName || 'Clínica Nara Grommer'}</span>
              </div>
            </div>
          </div>
          
          <!-- Instructions -->
          <div style="background-color: #fefce8; border: 1px solid #fde047; padding: 20px; border-radius: 10px; margin: 25px 0;">
            <h4 style="color: #a16207; margin: 0 0 10px 0;">📝 Instruções Importantes:</h4>
            <ul style="color: #713f12; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Chegue com <strong>15 minutos de antecedência</strong></li>
              <li>Traga a <strong>carteira de vacinação</strong> do seu pet</li>
              <li>Se necessário, traga <strong>exames anteriores</strong></li>
              <li>Em caso de emergência, ligue para nossa clínica</li>
            </ul>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${data?.confirmationUrl || '#'}" 
               style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);">
              Ver Agendamento 📱
            </a>
          </div>
        </div>
      </div>
    `;
    
    return { subject, html };
  }

  static generateAppointmentReminder(userName: string, data: any): { subject: string; html: string } {
    const subject = `Lembrete: Consulta amanhã - ${data?.appointmentDate || 'Data'} ⏰`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 20px; border-radius: 12px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Lembrete de Consulta</h1>
            </div>
          </div>
          
          <h2 style="color: #334155; margin-bottom: 20px; text-align: center;">Olá, ${userName}!</h2>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border: 2px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 18px; font-weight: 600;">
                🗓️ Você tem uma consulta agendada para <strong>AMANHÃ</strong>!
              </p>
            </div>
          </div>
          
          <!-- Appointment Details -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 25px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">📋 Detalhes da Consulta</h3>
            <div style="color: #374151; line-height: 1.8;">
              <p style="margin: 8px 0;"><strong>🐕 Pet:</strong> ${data?.petName || 'Não informado'}</p>
              <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${data?.appointmentDate || 'Amanhã'}</p>
              <p style="margin: 8px 0;"><strong>⏰ Horário:</strong> ${data?.appointmentTime || 'Não informado'}</p>
              <p style="margin: 8px 0;"><strong>👩‍⚕️ Veterinário(a):</strong> ${data?.veterinarianName || 'Não informado'}</p>
              <p style="margin: 8px 0;"><strong>🏥 Local:</strong> ${data?.clinicName || 'Clínica Nara Grommer'}</p>
            </div>
          </div>
          
          <p style="color: #475569; line-height: 1.7; margin: 25px 0; text-align: center;">
            📍 <strong>Endereço:</strong> ${data?.clinicAddress || 'Consulte nosso endereço no aplicativo'}
          </p>
          
          <!-- Important Reminder -->
          <div style="background-color: #fef2f2; border: 2px solid #fca5a5; padding: 20px; border-radius: 10px; margin: 25px 0;">
            <p style="color: #dc2626; line-height: 1.7; margin: 0; font-weight: 600; text-align: center;">
              ⚠️ <strong>Lembre-se:</strong><br>
              • Chegue 15 minutos antes<br>
              • Traga a carteira de vacinação<br>
              • Tenha em mãos exames anteriores (se houver)
            </p>
          </div>
          
          <!-- Contact Info -->
          <div style="background-color: #f0f9ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 10px; margin: 30px 0;">
            <p style="color: #1e40af; margin: 0; text-align: center; font-size: 14px;">
              <strong>📞 Precisa remarcar ou tem dúvidas?</strong><br>
              Entre em contato conosco o quanto antes!
            </p>
          </div>
        </div>
      </div>
    `;
    
    return { subject, html };
  }
}

// Validation functions
function validateEmailRequest(req: EmailRequest): { valid: boolean; error?: string } {
  if (!req.type) {
    return { valid: false, error: 'Campo "type" é obrigatório' };
  }

  if (!req.to || !isValidEmail(req.to)) {
    return { valid: false, error: 'Campo "to" deve conter um email válido' };
  }

  if (!req.userName || req.userName.trim().length === 0) {
    return { valid: false, error: 'Campo "userName" é obrigatório' };
  }

  const validTypes: EmailType[] = ['welcome', 'password-reset', 'appointment-confirmation', 'appointment-reminder', 'health-check'];
  if (!validTypes.includes(req.type)) {
    return { valid: false, error: `Tipo "${req.type}" não é suportado. Tipos válidos: ${validTypes.join(', ')}` };
  }

  return { valid: true };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Main handler
serve(async (req) => {
  console.log(`🌐 [EmailFunction] ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: EmailRequest = await req.json();
    console.log('📧 [EmailFunction] Requisição recebida:', { 
      type: requestData.type, 
      to: requestData.to, 
      userName: requestData.userName 
    });

    // Health check endpoint
    if (requestData.type === 'health-check') {
      console.log('🏥 [EmailFunction] Health check solicitado');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email service is healthy',
          timestamp: new Date().toISOString(),
          version: '2.0.0'
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Validate request
    const validation = validateEmailRequest(requestData);
    if (!validation.valid) {
      console.error('❌ [EmailFunction] Validação falhou:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check RESEND_API_KEY
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('❌ [EmailFunction] RESEND_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de email não encontrada' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate email content
    let emailContent: { subject: string; html: string };
    
    try {
      switch (requestData.type) {
        case 'welcome':
          emailContent = EmailTemplateGenerator.generateWelcomeEmail(requestData.userName, requestData.data);
          break;
        case 'password-reset':
          emailContent = EmailTemplateGenerator.generatePasswordResetEmail(requestData.userName, requestData.data);
          break;
        case 'appointment-confirmation':
          emailContent = EmailTemplateGenerator.generateAppointmentConfirmation(requestData.userName, requestData.data);
          break;
        case 'appointment-reminder':
          emailContent = EmailTemplateGenerator.generateAppointmentReminder(requestData.userName, requestData.data);
          break;
        default:
          throw new Error(`Tipo de email não implementado: ${requestData.type}`);
      }
    } catch (error) {
      console.error('❌ [EmailFunction] Erro ao gerar conteúdo do email:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar conteúdo do email', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('📤 [EmailFunction] Enviando email via Resend:', { 
      to: requestData.to, 
      subject: emailContent.subject 
    });

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Nara Grommer <noreply@naragrommer.com>',
        to: [requestData.to],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const resendResult = await resendResponse.json();
    
    console.log('📡 [EmailFunction] Resposta do Resend:', { 
      status: resendResponse.status, 
      success: resendResponse.ok,
      id: resendResult.id 
    });

    if (!resendResponse.ok) {
      console.error('❌ [EmailFunction] Erro do Resend:', resendResult);
      return new Response(
        JSON.stringify({ 
          error: 'Falha ao enviar email via Resend', 
          details: resendResult 
        }),
        { status: resendResponse.status, headers: corsHeaders }
      );
    }

    console.log('✅ [EmailFunction] Email enviado com sucesso!', { messageId: resendResult.id });

    const response: EmailResponse = {
      success: true,
      messageId: resendResult.id,
      message: `Email de ${requestData.type} enviado com sucesso para ${requestData.to}`
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('💥 [EmailFunction] Erro inesperado:', error);
    
    const errorResponse: EmailResponse = {
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    };

    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: corsHeaders }
    );
  }
})