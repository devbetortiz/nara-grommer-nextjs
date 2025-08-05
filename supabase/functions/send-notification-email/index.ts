import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { AppointmentConfirmationSimple } from "./_templates/appointment-confirmation-simple.tsx";
import { AppointmentReminder } from "./_templates/appointment-reminder.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'appointment_confirmation' | 'appointment_reminder';
  to: string;
  data: {
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
  };
}

const getEmailTemplate = (emailType: string, data: any) => {
  switch (emailType) {
    case 'welcome':
      return {
        component: React.createElement(WelcomeEmail, {
          userName: data.userName,
          userEmail: data.userEmail,
        }),
        subject: `Bem-vindo ao Nara Groomer, ${data.userName}! 🐾`,
      };
    
    case 'appointment_confirmation':
      return {
        component: React.createElement(AppointmentConfirmationSimple, {
          userName: data.userName,
          petName: data.petName,
          serviceType: data.serviceType,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
        }),
        subject: `Confirme seu agendamento para ${data.petName}! 📅`,
      };
    
    case 'appointment_reminder':
      return {
        component: React.createElement(AppointmentReminder, {
          userName: data.userName,
          petName: data.petName,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
        }),
        subject: `Lembrete: ${data.petName} tem agendamento amanhã! ⏰`,
      };
    
    default:
      throw new Error(`Tipo de email não suportado: ${emailType}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log(`[${new Date().toISOString()}] Requisição recebida: ${req.method}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();
    
    console.log(`[${new Date().toISOString()}] Enviando email tipo: ${type} para: ${to}`);

    if (!type || !to || !data) {
      throw new Error("Parâmetros obrigatórios não fornecidos (type, to, data)");
    }

    if (!data.userName || !data.userEmail) {
      throw new Error("userName e userEmail são obrigatórios nos dados");
    }

    const { component, subject } = getEmailTemplate(type, data);

    console.log(`[${new Date().toISOString()}] Renderizando template...`);
    const html = await renderAsync(component);

    console.log(`[${new Date().toISOString()}] Enviando email via Resend...`);
    const emailResponse = await resend.emails.send({
      from: "Nara Grommer <noreply@naragrommer.com.br>",
      to: [to],
      subject: subject,
      html: html,
    });

    console.log(`[${new Date().toISOString()}] Email enviado com sucesso:`, emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.data?.id,
        message: "Email enviado com sucesso",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Erro ao enviar email:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno do servidor",
        details: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);