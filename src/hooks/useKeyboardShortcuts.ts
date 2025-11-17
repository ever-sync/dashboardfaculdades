'use client'

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcutsConfig {
  onBuscar?: () => void
  onMarcarLida?: () => void
  onTransferir?: () => void
  onFechar?: () => void
  onNavegarProxima?: () => void
  onNavegarAnterior?: () => void
  onEnviar?: () => void
  enabled?: boolean
}

/**
 * Hook para gerenciar atalhos de teclado no chat
 * 
 * Atalhos disponíveis:
 * - Ctrl+K ou Cmd+K: Buscar conversa
 * - Ctrl+L ou Cmd+L: Marcar como lida
 * - Ctrl+T ou Cmd+T: Transferir conversa
 * - Esc: Fechar modal/painel
 * - Tab: Navegar para próxima conversa
 * - Shift+Tab: Navegar para conversa anterior
 * - Ctrl+Enter ou Cmd+Enter: Enviar mensagem (se não estiver em textarea)
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const {
    onBuscar,
    onMarcarLida,
    onTransferir,
    onFechar,
    onNavegarProxima,
    onNavegarAnterior,
    onEnviar,
    enabled = true,
  } = config

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Não processar se não estiver habilitado
      if (!enabled) return

      // Não processar se estiver digitando em input, textarea ou select
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      // Ctrl+K ou Cmd+K: Buscar conversa
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        // Permitir em inputs para busca
        if (!isInput || target.tagName === 'INPUT') {
          event.preventDefault()
          onBuscar?.()
        }
        return
      }

      // Ctrl+L ou Cmd+L: Marcar como lida
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        if (!isInput) {
          event.preventDefault()
          onMarcarLida?.()
        }
        return
      }

      // Ctrl+T ou Cmd+T: Transferir conversa
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        if (!isInput) {
          event.preventDefault()
          onTransferir?.()
        }
        return
      }

      // Esc: Fechar modal/painel
      if (event.key === 'Escape') {
        if (!isInput) {
          event.preventDefault()
          onFechar?.()
        }
        return
      }

      // Tab: Navegar para próxima conversa (apenas fora de inputs)
      if (event.key === 'Tab' && !event.shiftKey && !isInput) {
        // Não prevenir comportamento padrão, mas chamar callback
        onNavegarProxima?.()
        return
      }

      // Shift+Tab: Navegar para conversa anterior (apenas fora de inputs)
      if (event.key === 'Tab' && event.shiftKey && !isInput) {
        // Não prevenir comportamento padrão, mas chamar callback
        onNavegarAnterior?.()
        return
      }

      // Ctrl+Enter ou Cmd+Enter: Enviar mensagem (apenas fora de textarea)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (!isInput || target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          onEnviar?.()
        }
        return
      }
    },
    [
      enabled,
      onBuscar,
      onMarcarLida,
      onTransferir,
      onFechar,
      onNavegarProxima,
      onNavegarAnterior,
      onEnviar,
    ]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

