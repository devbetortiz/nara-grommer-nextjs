// Utilitário para verificar e corrigir configurações do Supabase Auth
export const checkSupabaseAuthSettings = async () => {
  console.log('🔧 Verificando configurações do Supabase Auth...');
  
  try {
    // As configurações remotas só podem ser alteradas via Dashboard
    // Esta função serve apenas para documentar o que precisa ser alterado
    
    const settingsToCheck = {
      'enable_confirmations': false,
      'secure_password_change': false,
      'double_confirm_changes': false,
      'enable_signup': true
    };
    
    console.log('📋 Configurações recomendadas para evitar erros de email:');
    console.table(settingsToCheck);
    
    console.log(`
🔧 Para corrigir o erro "Error sending confirmation email":

1. 📱 Acesse o Dashboard do Supabase:
   https://supabase.com/dashboard/project/dsmtvpcdifooagtjqjve

2. 🔐 Vá para Authentication → Settings

3. ⚙️ Configure estas opções:
   • "Enable email confirmations": DESABILITADO
   • "Secure password change": DESABILITADO  
   • "Double confirm email changes": DESABILITADO
   • "Enable signups": HABILITADO

4. 💾 Salve as configurações

5. ✅ Teste o cadastro novamente

💡 Alternativa: Configure um provedor SMTP personalizado em:
   Authentication → Settings → SMTP Settings
`);
    
    return {
      needsManualFix: true,
      dashboardUrl: 'https://supabase.com/dashboard/project/dsmtvpcdifooagtjqjve/auth/settings'
    };
    
  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error);
    return { error };
  }
};

export const getSupabaseProjectInfo = () => {
  return {
    projectRef: 'dsmtvpcdifooagtjqjve',
    dashboardUrl: 'https://supabase.com/dashboard/project/dsmtvpcdifooagtjqjve',
    authSettingsUrl: 'https://supabase.com/dashboard/project/dsmtvpcdifooagtjqjve/auth/settings'
  };
};
