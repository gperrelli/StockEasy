/**
 * Utilitários de desenvolvimento para logout automático e limpeza de cache
 * Usado após mudanças no sistema para garantir testes limpos
 */

import { supabase } from './supabase';
import { queryClient } from './queryClient';

export const devLogoutAndClearCache = async () => {
  console.log('🔧 [DEV] Iniciando logout automático e limpeza de cache...');

  try {
    // 1. Limpar cache do React Query
    queryClient.clear();
    console.log('✅ [DEV] Cache do React Query limpo');

    // 2. Fazer logout no Supabase
    await supabase.auth.signOut();
    console.log('✅ [DEV] Logout do Supabase executado');

    // 3. Limpar localStorage
    localStorage.clear();
    console.log('✅ [DEV] LocalStorage limpo');

    // 4. Limpar sessionStorage
    sessionStorage.clear();
    console.log('✅ [DEV] SessionStorage limpo');

    // 5. Recarregar página para garantir estado limpo
    setTimeout(() => {
      window.location.reload();
    }, 100);

    console.log('🚀 [DEV] Limpeza completa! Redirecionando para login...');

  } catch (error) {
    console.error('❌ [DEV] Erro durante limpeza:', error);
    // Mesmo com erro, forçar reload
    window.location.reload();
  }
};

// Função para detectar mudanças no sistema (chamada após atualizações)
export const triggerDevReset = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 [DEV] Mudança detectada no sistema - acionando reset...');
    devLogoutAndClearCache();
  }
};

// Função para reset manual via console
(window as any).devReset = devLogoutAndClearCache;
console.log('🛠️ [DEV] Utilitário disponível: window.devReset()');

// Disabled automatic logout to prevent loops
// if (process.env.NODE_ENV === 'development') {
//   setTimeout(() => {
//     console.log('🔄 [DEV] Executando logout automático conforme solicitado...');
//     devLogoutAndClearCache();
//   }, 2000);
// }