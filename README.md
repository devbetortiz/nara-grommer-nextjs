# 🐾 Nara Groomer

> **O melhor cuidado para seu pet está aqui**

Sistema completo de gerenciamento para pet shop e grooming, desenvolvido com Next.js 15 e Supabase. Oferece uma experiência moderna e intuitiva tanto para clientes quanto para administradores.

![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Funcionalidades

### 👥 Para Clientes
- **Cadastro e Login** - Sistema de autenticação seguro
- **Gerenciamento de Pets** - Cadastro completo com fotos, raça, idade, peso, etc.
- **Agendamentos** - Sistema intuitivo para agendar serviços
- **Histórico** - Visualização de agendamentos passados e futuros
- **Notificações** - Confirmações e lembretes por email

### 🔧 Para Administradores
- **Dashboard Completo** - Métricas e estatísticas em tempo real
- **Calendário de Agendamentos** - Visualização mensal com status dos serviços
- **Gerenciamento de Clientes** - Lista e edição de todos os clientes
- **Controle de Pets** - Visualização de todos os pets cadastrados
- **Analytics** - Relatórios de receita, agendamentos e crescimento
- **Sistema de Status** - Controle completo do fluxo de atendimento

### 🛁 Serviços Oferecidos
- **Banho Completo** - Banho relaxante com produtos especiais
- **Tosa Higiênica** - Tosa das áreas sensíveis
- **Tosa Completa** - Corte estilizado e completo
- **Hidratação** - Tratamento especial para pelos macios
- **Banho + Tosa** - Pacote completo de cuidados

## 🚀 Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React com App Router
- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **Lucide React** - Ícones modernos e leves
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Date-fns** - Manipulação de datas
- **Recharts** - Gráficos e visualizações
- **Sonner** - Sistema de notificações (toasts)

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Banco de dados relacional
- **Supabase Auth** - Sistema de autenticação
- **Supabase Storage** - Armazenamento de arquivos (fotos dos pets)
- **Supabase Edge Functions** - Funções serverless

### Desenvolvimento
- **ESLint** - Linting de código
- **PostCSS** - Processamento de CSS
- **Turbopack** - Build tool ultra-rápido

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **npm**, **yarn**, **pnpm** ou **bun**
- **Conta no Supabase** (para banco de dados)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/nara-grommer-nextjs.git
cd nara-grommer-nextjs
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase


```

### 4. Configure o banco de dados
```bash
# Instale a CLI do Supabase
npm install -g supabase

# Faça login no Supabase
supabase login

# Rode as migrações
supabase db push
```

### 5. Execute o projeto
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **`profiles`** - Informações dos usuários (clientes e admins)
- **`pets`** - Cadastro dos pets com informações detalhadas
- **`appointments`** - Agendamentos com data, hora, serviço e status
- **`pet_photos`** - Storage para fotos dos pets

### Status dos Agendamentos
- `agendado` - Agendamento criado
- `confirmado` - Agendamento confirmado
- `em_andamento` - Serviço em execução
- `concluido` - Serviço finalizado
- `cancelado` - Agendamento cancelado

## 🎨 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── appointments/       # Página de agendamentos
│   ├── auth/              # Sistema de autenticação
│   ├── clients/           # Área do cliente
│   ├── dashboard/         # Dashboard administrativo
│   ├── pets/              # Gerenciamento de pets
│   └── settings/          # Configurações
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes base (Radix UI)
│   └── pages/            # Componentes específicos de páginas
├── contexts/             # Contextos React (Auth, etc.)
├── hooks/               # Hooks customizados
├── integrations/        # Integrações (Supabase)
└── lib/                # Utilitários e configurações
```

## 🔐 Autenticação e Autorização

O sistema possui dois tipos de usuários:

### Clientes
- Podem cadastrar e gerenciar seus próprios pets
- Fazem agendamentos para seus pets
- Visualizam histórico de serviços
- Recebem notificações por email

### Administradores
- Acesso completo ao dashboard
- Gerenciam todos os clientes e pets
- Controlam agendamentos e status
- Visualizam relatórios e analytics
- Podem atualizar status dos serviços

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 📱 **Mobile** (320px+)
- 📲 **Tablet** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Large Desktop** (1280px+)

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção

# Qualidade de código
npm run lint         # Executa ESLint
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas
O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔧 Configuração do Supabase

### 1. Crie um projeto no Supabase
Acesse [supabase.com](https://supabase.com) e crie um novo projeto.

### 2. Configure a autenticação
- Ative o provedor de email
- Configure templates de email personalizados
- Defina URLs de redirecionamento

### 3. Configure o Storage
```sql
-- Política para upload de fotos dos pets
CREATE POLICY "Users can upload pet photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pet-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para visualizar fotos dos pets
CREATE POLICY "Anyone can view pet photos" ON storage.objects
FOR SELECT USING (bucket_id = 'pet-photos');
```

## 🎨 Temas e Personalização

O sistema suporta temas claro e escuro usando `next-themes`. A paleta de cores principal é baseada em tons de rosa, criando uma identidade visual acolhedora e moderna.

### Cores Principais
- **Primary**: Rosa (#FF69B4)
- **Secondary**: Rosa claro
- **Accent**: Complementares harmoniosos
- **Background**: Gradientes suaves

## 📧 Sistema de Email

O sistema inclui templates personalizados para:
- ✅ Confirmação de agendamento
- 🔔 Lembretes de agendamento
- 🎉 Boas-vindas para novos clientes
- 🔑 Reset de senha

## 🔍 Monitoramento e Analytics

- Dashboard com métricas em tempo real
- Gráficos de crescimento e receita
- Relatórios de agendamentos
- Análise de pets cadastrados
- Atividade recente

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvido por

**[Seu Nome]** - Sistema de Gerenciamento para Pet Shop

---

<div align="center">
  <p>Feito com ❤️ para o melhor cuidado dos nossos pets</p>
  <p>🐾 <strong>Nara Groomer</strong> - Onde cada pet é tratado como família</p>
</div>