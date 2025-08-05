#!/usr/bin/env node

/**
 * Script para testar a API do Resend via linha de comando
 * 
 * Uso:
 * node scripts/test-resend.js
 * node scripts/test-resend.js --email=seu@email.com
 * node scripts/test-resend.js --template=welcome --email=seu@email.com
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias');
    process.exit(1);
}

const args = process.argv.slice(2);
const email = args.find(arg => arg.startsWith('--email='))?.split('=')[1] || null;
const template = args.find(arg => arg.startsWith('--template='))?.split('=')[1] || null;

async function testSimpleConnection(testEmail = null) {
    console.log('🧪 Testando conexão simples com Resend...\n');

    try {
        const body = testEmail ? JSON.stringify({ to: testEmail }) : '{}';

        const response = await fetch(`${supabaseUrl}/functions/v1/test-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Teste de conexão bem-sucedido!');
            console.log(`📧 Email enviado para: ${testEmail || 'contato@naragrommer.com.br'}`);
            console.log(`🆔 ID do email: ${data.emailId}`);
            console.log(`💬 Mensagem: ${data.message}\n`);
        } else {
            console.log('❌ Falha no teste de conexão:');
            console.log(`💬 Erro: ${data.error}\n`);
        }

        return data.success;
    } catch (error) {
        console.error('❌ Erro ao conectar com a API:', error.message);
        return false;
    }
}

async function testTemplate(templateType, testEmail) {
    console.log(`🧪 Testando template '${templateType}'...\n`);

    const templateData = {
        welcome: {
            type: 'welcome',
            to: testEmail,
            data: {
                userName: 'João Teste',
                userEmail: testEmail
            }
        },
        appointment_confirmation: {
            type: 'appointment_confirmation',
            to: testEmail,
            data: {
                userName: 'João Teste',
                userEmail: testEmail,
                petName: 'Rex',
                serviceType: 'banho',
                appointmentDate: '2024-02-15',
                appointmentTime: '14:00',
                price: 50.00
            }
        },
        appointment_reminder: {
            type: 'appointment_reminder',
            to: testEmail,
            data: {
                userName: 'João Teste',
                userEmail: testEmail,
                petName: 'Rex',
                serviceType: 'tosa_completa',
                appointmentDate: '2024-02-16',
                appointmentTime: '10:30',
                price: 80.00
            }
        }
    };

    if (!templateData[templateType]) {
        console.error(`❌ Erro: Template '${templateType}' não encontrado. Disponíveis: ${Object.keys(templateData).join(', ')}`);
        return false;
    }

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateData[templateType])
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Template enviado com sucesso!');
            console.log(`📧 Email enviado para: ${testEmail}`);
            console.log(`🆔 ID do email: ${data.messageId}`);
            console.log(`💬 Mensagem: ${data.message}\n`);
        } else {
            console.log('❌ Falha ao enviar template:');
            console.log(`💬 Erro: ${data.error}\n`);
        }

        return data.success;
    } catch (error) {
        console.error('❌ Erro ao enviar template:', error.message);
        return false;
    }
}

async function main() {
    console.log('🐾 Nara Groomer - Teste da API Resend\n');
    console.log('═'.repeat(50));

    // Verificar configuração
    console.log('🔧 Configuração:');
    console.log(`   Supabase URL: ${supabaseUrl}`);
    console.log(`   Email de teste: ${email || 'Padrão (contato@naragrommer.com.br)'}`);
    console.log(`   Template: ${template || 'Conexão simples'}\n`);

    let success = false;

    if (template && email) {
        // Testar template específico
        success = await testTemplate(template, email);
    } else {
        // Testar conexão simples
        success = await testSimpleConnection(email);
    }

    console.log('═'.repeat(50));

    if (success) {
        console.log('🎉 Teste concluído com sucesso!');
        console.log('💡 Dica: Verifique sua caixa de entrada (incluindo spam)');
    } else {
        console.log('💥 Teste falhou!');
        console.log('💡 Dicas para resolução:');
        console.log('   • Verifique se RESEND_API_KEY está configurada no Supabase');
        console.log('   • Confirme se o domínio está verificado no Resend');
        console.log('   • Verifique os logs das Edge Functions no Supabase');
    }

    console.log('\n📖 Exemplos de uso:');
    console.log('   node scripts/test-resend.js');
    console.log('   node scripts/test-resend.js --email=seu@email.com');
    console.log('   node scripts/test-resend.js --template=welcome --email=seu@email.com');
    console.log('   node scripts/test-resend.js --template=appointment_confirmation --email=seu@email.com\n');
}

main().catch(console.error);