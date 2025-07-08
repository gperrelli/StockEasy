/**
 * Componente para gerenciar o modo de desenvolvimento
 * Executa logout automático e limpeza de cache após mudanças
 */

import { useEffect } from 'react';
import { devLogoutAndClearCache } from '@/lib/devUtils';

export function DevModeManager() {
  useEffect(() => {
    // Detectar mudanças no sistema através de hot reload
    if (process.env.NODE_ENV === 'development') {
      // Verificar se há flag de reset no sessionStorage
      const shouldReset = sessionStorage.getItem('dev_reset_pending');
      
      if (shouldReset) {
        console.log('🔄 [DEV] Reset pendente detectado - executando limpeza...');
        sessionStorage.removeItem('dev_reset_pending');
        devLogoutAndClearCache();
      }
    }
  }, []);

  return null; // Componente invisível
}

// Função para marcar reset pendente (será chamada após mudanças)
export const markDevResetPending = () => {
  if (process.env.NODE_ENV === 'development') {
    sessionStorage.setItem('dev_reset_pending', 'true');
    console.log('⏳ [DEV] Reset marcado como pendente');
  }
};

// Função para executar reset imediato
export const executeDevReset = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 [DEV] Executando reset imediato...');
    devLogoutAndClearCache();
  }
};