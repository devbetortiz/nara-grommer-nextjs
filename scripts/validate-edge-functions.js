#!/usr/bin/env node

/**
 * Script para validar todas as Edge Functions do Supabase
 * 
 * Uso: node scripts/validate-edge-functions.js
 */

const path = require('path');
const fs = require('fs');

const functionsDir = path.join(process.cwd(), 'supabase', 'functions');

// Funções esperadas
const expectedFunctions = [
  'confirm-appointment',
  'receive-email', 
  'send-appointment-reminders',
  'send-notification-email',
  'send-password-reset',
  'test-email',
  'validate-reset-token'
];

// Validações específicas
const validations = {
  // Verificar versões consistentes do Resend
  resendVersion: (content, functionName) => {
    const resendImports = content.match(/from "npm:resend@([\d\.]+)"/g);
    if (resendImports) {
      const versions = resendImports.map(imp => imp.match(/@([\d\.]+)/)[1]);
      if (versions.some(v => v !== '4.0.0')) {
        return `❌ ${functionName}: Versão inconsistente do Resend (esperado: 4.0.0, encontrado: ${versions.join(', ')})`;
      }
    }
    return null;
  },

  // Verificar versões do Supabase
  supabaseVersion: (content, functionName) => {
    const supabaseImports = content.match(/from ['"]https:\/\/esm\.sh\/@supabase\/supabase-js@([\d\.]+)['"]/g);
    if (supabaseImports) {
      const versions = supabaseImports.map(imp => imp.match(/@([\d\.]+)/)[1]);
      if (versions.some(v => !v.startsWith('2.'))) {
        return `❌ ${functionName}: Versão inconsistente do Supabase (esperado: 2.x, encontrado: ${versions.join(', ')})`;
      }
    }
    return null;
  },

  // Verificar URLs hardcoded
  hardcodedUrls: (content, functionName) => {
    const hardcodedPatterns = [
      /https:\/\/nara-pawsome-schedule\.lovable\.app/g,
      /https:\/\/lovable\.app/g,
      /NaraGrommer@resend\.dev/g
    ];
    
    for (const pattern of hardcodedPatterns) {
      if (pattern.test(content)) {
        return `⚠️  ${functionName}: URL hardcoded encontrada (${pattern.source})`;
      }
    }
    return null;
  },

  // Verificar CORS headers
  corsHeaders: (content, functionName) => {
    if (!content.includes('corsHeaders') && !content.includes('Access-Control-Allow-Origin')) {
      return `❌ ${functionName}: Headers CORS ausentes`;
    }
    return null;
  },

  // Verificar tratamento de OPTIONS
  optionsHandling: (content, functionName) => {
    if (!content.includes('req.method === "OPTIONS"')) {
      return `⚠️  ${functionName}: Tratamento de preflight OPTIONS ausente`;
    }
    return null;
  },

  // Verificar logs adequados
  logging: (content, functionName) => {
    if (!content.includes('console.log') && !content.includes('console.error')) {
      return `⚠️  ${functionName}: Sistema de logs ausente`;
    }
    return null;
  },

  // Verificar tratamento de erros
  errorHandling: (content, functionName) => {
    if (!content.includes('try {') || !content.includes('} catch')) {
      return `❌ ${functionName}: Tratamento de erros ausente`;
    }
    return null;
  }
};

function validateFunction(functionName) {
  const functionPath = path.join(functionsDir, functionName, 'index.ts');
  
  if (!fs.existsSync(functionPath)) {
    return [`❌ ${functionName}: Arquivo index.ts não encontrado`];
  }

  const content = fs.readFileSync(functionPath, 'utf8');
  const issues = [];

  // Executar todas as validações
  for (const [validationName, validationFn] of Object.entries(validations)) {
    const issue = validationFn(content, functionName);
    if (issue) {
      issues.push(issue);
    }
  }

  return issues;
}

function validateSharedTypes() {
  const typesPath = path.join(functionsDir, '_shared', 'types.ts');
  
  if (!fs.existsSync(typesPath)) {
    return ['❌ _shared/types.ts: Arquivo de tipos compartilhados não encontrado'];
  }

  const content = fs.readFileSync(typesPath, 'utf8');
  const issues = [];

  // Verificar exports essenciais
  const requiredExports = [
    'corsHeaders',
    'validateEmail', 
    'sanitizeInput',
    'getBaseUrl',
    'getEmailFrom',
    'createErrorResponse',
    'createSuccessResponse'
  ];

  for (const exportName of requiredExports) {
    if (!content.includes(`export const ${exportName}`) && !content.includes(`export function ${exportName}`)) {
      issues.push(`❌ _shared/types.ts: Export '${exportName}' ausente`);
    }
  }

  return issues;
}

function main() {
  console.log('🔍 Validando Edge Functions do Supabase...\n');
  console.log('═'.repeat(60));

  let totalIssues = 0;
  const allIssues = [];

  // Validar arquivo de tipos compartilhados
  console.log('📁 Validando tipos compartilhados...');
  const sharedIssues = validateSharedTypes();
  if (sharedIssues.length > 0) {
    allIssues.push(...sharedIssues);
    totalIssues += sharedIssues.length;
    sharedIssues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('   ✅ _shared/types.ts: OK');
  }

  console.log('\n📁 Validando funções individuais...');

  // Validar cada função
  for (const functionName of expectedFunctions) {
    console.log(`\n🔧 ${functionName}:`);
    const issues = validateFunction(functionName);
    
    if (issues.length === 0) {
      console.log('   ✅ Todos os testes passaram');
    } else {
      allIssues.push(...issues);
      totalIssues += issues.length;
      issues.forEach(issue => console.log(`   ${issue}`));
    }
  }

  // Verificar se todas as funções esperadas existem
  console.log('\n📋 Verificando completude...');
  const existingFunctions = fs.readdirSync(functionsDir)
    .filter(item => {
      const itemPath = path.join(functionsDir, item);
      return fs.statSync(itemPath).isDirectory() && !item.startsWith('_');
    });

  const missingFunctions = expectedFunctions.filter(fn => !existingFunctions.includes(fn));
  const extraFunctions = existingFunctions.filter(fn => !expectedFunctions.includes(fn));

  if (missingFunctions.length > 0) {
    console.log(`   ❌ Funções ausentes: ${missingFunctions.join(', ')}`);
    totalIssues += missingFunctions.length;
  }

  if (extraFunctions.length > 0) {
    console.log(`   ⚠️  Funções extras: ${extraFunctions.join(', ')}`);
  }

  if (missingFunctions.length === 0 && extraFunctions.length === 0) {
    console.log('   ✅ Todas as funções esperadas estão presentes');
  }

  // Resumo final
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMO DA VALIDAÇÃO:');
  console.log(`   Funções verificadas: ${expectedFunctions.length}`);
  console.log(`   Problemas encontrados: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n🎉 Todas as Edge Functions estão configuradas corretamente!');
    console.log('💡 Próximos passos:');
    console.log('   1. Deploy das funções: supabase functions deploy');
    console.log('   2. Teste das funções: npm run test-resend');
    console.log('   3. Configurar variáveis de ambiente no Supabase');
  } else {
    console.log('\n💥 Problemas encontrados que precisam ser corrigidos:');
    
    // Agrupar problemas por tipo
    const criticalIssues = allIssues.filter(issue => issue.includes('❌'));
    const warnings = allIssues.filter(issue => issue.includes('⚠️'));
    
    if (criticalIssues.length > 0) {
      console.log('\n🚨 Problemas críticos:');
      criticalIssues.forEach(issue => console.log(`   ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Avisos:');
      warnings.forEach(issue => console.log(`   ${issue}`));
    }
  }

  console.log('\n📖 Documentação: https://supabase.com/docs/guides/functions');
  console.log('🔧 Para corrigir problemas, execute: node scripts/fix-edge-functions.js');
  
  process.exit(totalIssues > 0 ? 1 : 0);
}

main();