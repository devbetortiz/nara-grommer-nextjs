import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Pegar email de destino do body se fornecido, senão usar padrão
    let testEmail = "contato@naragrommer.com.br";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.to) {
          testEmail = body.to;
        }
      } catch {
        // Se não conseguir fazer parse do JSON, usar email padrão
      }
    }

    console.log(`[${new Date().toISOString()}] Testando conexão do Resend para: ${testEmail}`);

    const emailResponse = await resend.emails.send({
      from: "Nara Grommer <noreply@naragrommer.com.br>",
      to: [testEmail],
      subject: "🧪 Teste de Conexão - Resend API",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; text-align: center;">✅ Teste de Conexão Bem-sucedido!</h1>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>🎯 Objetivo:</strong> Verificar se o Resend está funcionando corretamente</p>
            <p><strong>📅 Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>🌐 Domínio:</strong> naragrommer.com.br</p>
            <p><strong>📧 Email de destino:</strong> ${testEmail}</p>
          </div>

          <h3 style="color: #1f2937;">🔍 Status das Verificações:</h3>
          <ul style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e;">
            <li style="margin: 8px 0;">✅ A API key do Resend está configurada corretamente</li>
            <li style="margin: 8px 0;">✅ O domínio está verificado no Resend</li>
            <li style="margin: 8px 0;">✅ Os registros SPF/DKIM estão funcionando</li>
            <li style="margin: 8px 0;">✅ A Edge Function está operacional</li>
            <li style="margin: 8px 0;">✅ O sistema de templates está funcionando</li>
          </ul>

          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af;">
              <strong>🚀 Próximos passos:</strong> Agora você pode testar os templates específicos (boas-vindas, confirmação de agendamento, lembretes) através da interface de teste.
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="text-align: center; color: #6b7280; font-size: 14px;">
            🐾 <strong>Nara Grommer</strong> - Sistema de Gerenciamento para Pet Shop
          </p>
        </div>
      `,
    });

    console.log(`[${new Date().toISOString()}] Email de teste enviado com sucesso:`, emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: "Email de teste enviado com sucesso!",
      emailId: emailResponse.data?.id,
      response: emailResponse
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Erro ao enviar email de teste:`, error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: error
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);