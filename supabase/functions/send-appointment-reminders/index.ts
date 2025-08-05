import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.44.4";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { AppointmentReminder } from "./appointment-reminder.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// A função principal que será executada pelo cron job
const handler = async (_req: Request): Promise<Response> => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` } } }
    );

    // Lógica para buscar agendamentos de amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    const { data: appointments, error } = await supabaseClient
      .from('appointments')
      .select(`
        *, 
        pets (*), 
        clients (*)
      `)
      .eq('date', dateString);

    if (error) {
      throw error;
    }

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum agendamento para amanhã." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    for (const appointment of appointments) {
      const html = await renderAsync(
        React.createElement(AppointmentReminder, {
          userName: appointment.clients.name,
          petName: appointment.pets.name,
          appointmentDate: appointment.date,
          appointmentTime: appointment.time,
        })
      );

      await resend.emails.send({
        from: "Nara Grommer <noreply@naragrommer.com.br>",
        to: [appointment.clients.email],
        subject: `Lembrete de Agendamento para ${appointment.pets.name}`,
        html: html,
      });
    }

    return new Response(JSON.stringify({ success: true, message: `${appointments.length} lembretes de agendamento enviados.` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Erro ao enviar lembretes de agendamento:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

serve(handler);
