import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { PasswordResetEmail } from "./_templates/password-reset.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  to: string;
  userName: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { to, userName, resetLink }: PasswordResetRequest = await req.json();

    if (!to || !userName || !resetLink) {
      throw new Error("Parâmetros obrigatórios não fornecidos (to, userName, resetLink)");
    }

    const html = await renderAsync(
      React.createElement(PasswordResetEmail, { userName, resetLink })
    );

    await resend.emails.send({
      from: "Nara Grommer <noreply@naragrommer.com.br>",
      to: [to],
      subject: "Redefinição de Senha - Nara Grommer",
      html: html,
    });

    return new Response(JSON.stringify({ success: true, message: "Email de redefinição de senha enviado com sucesso" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Erro ao enviar email de redefinição de senha:`, error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);