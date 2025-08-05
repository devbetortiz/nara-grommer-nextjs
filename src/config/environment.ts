// Configurações de ambiente para produção
export const config = {
  // URLs da aplicação
  app: {
    baseUrl: typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://naragrommer.com.br',
    name: 'Nara Grommer',
    description: 'Sistema de agendamento para pet grooming',
  },
  
  // Configurações de email
  email: {
    fromAddress: 'noreply@naragrommer.com.br',
    supportEmail: 'contato@naragrommer.com.br',
  },
  
  // URLs de redirecionamento
  redirects: {
    afterLogin: '/dashboard',
    afterSignup: '/client-registration',
    afterLogout: '/',
  },
  
  // Configurações de SEO
  seo: {
    defaultTitle: 'Nara Grommer - Pet Grooming Profissional',
    defaultDescription: 'Agendamento online para serviços de pet grooming profissional. Cuidado especializado para seu pet.',
    keywords: 'pet grooming, banho e tosa, agendamento online, cuidados pet',
  },
  
  // Configurações de mídia social
  social: {
    facebook: '',
    instagram: '',
    whatsapp: '',
  },
};