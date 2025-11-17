/**
 * Função para exportar conversa como arquivo TXT
 * 
 * Exporta o histórico completo da conversa incluindo:
 * - Informações do prospect
 * - Todas as mensagens com timestamps
 * - Metadados da conversa
 */

import { Mensagem, Prospect, ConversaWhatsApp } from '@/types/supabase'

export interface DadosExportacao {
  conversa: ConversaWhatsApp
  mensagens: Mensagem[]
  prospect?: Prospect | null
}

// Função auxiliar para formatar data completa
const formatarDataCompleta = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateString
  }
}

// Função auxiliar para formatar nome do remetente
const formatarRemetente = (remetente: string | null | undefined): string => {
  if (!remetente) return 'Sistema'
  const remetenteLower = remetente.toLowerCase()
  
  switch (remetenteLower) {
    case 'cliente':
    case 'usuario':
      return 'Cliente'
    case 'robo':
    case 'bot':
      return 'IA/Robô'
    case 'humano':
      return 'Atendente Humano'
    case 'agente':
      return 'Agente'
    default:
      return remetente.charAt(0).toUpperCase() + remetente.slice(1)
  }
}

/**
 * Formatar conteúdo da conversa para exportação
 */
export function formatarConversaParaExportacao(dados: DadosExportacao): string {
  const { conversa, mensagens, prospect } = dados

  let conteudo = '='.repeat(80) + '\n'
  conteudo += 'EXPORTAÇÃO DE CONVERSA - EDU.ZAP\n'
  conteudo += '='.repeat(80) + '\n\n'

  // Informações da Conversa
  conteudo += 'INFORMAÇÕES DA CONVERSA\n'
  conteudo += '-'.repeat(80) + '\n'
  conteudo += `ID da Conversa: ${conversa.id}\n`
  conteudo += `Nome do Contato: ${conversa.nome || 'N/A'}\n`
  conteudo += `Telefone: ${conversa.telefone || 'N/A'}\n`
  conteudo += `Status: ${conversa.status_conversa || conversa.status || 'N/A'}\n`
  if (conversa.setor) {
    conteudo += `Setor: ${conversa.setor}\n`
  }
  if (conversa.atendente) {
    conteudo += `Atendente: ${conversa.atendente}\n`
  }
  conteudo += `Data de Início: ${formatarDataCompleta(conversa.created_at)}\n`
  conteudo += `Última Atualização: ${formatarDataCompleta(conversa.updated_at)}\n`
  if (conversa.duracao_segundos) {
    const minutos = Math.floor(conversa.duracao_segundos / 60)
    const segundos = conversa.duracao_segundos % 60
    conteudo += `Duração: ${minutos}m ${segundos}s\n`
  }
  if (conversa.tags && conversa.tags.length > 0) {
    conteudo += `Tags: ${conversa.tags.join(', ')}\n`
  }
  conteudo += '\n'

  // Informações do Prospect (se disponível)
  if (prospect) {
    conteudo += 'INFORMAÇÕES DO PROSPECT/ALUNO\n'
    conteudo += '-'.repeat(80) + '\n'
    conteudo += `Nome: ${prospect.nome || prospect.nome_completo || 'N/A'}\n`
    if (prospect.nome_completo && prospect.nome_completo !== prospect.nome) {
      conteudo += `Nome Completo: ${prospect.nome_completo}\n`
    }
    if (prospect.email) {
      conteudo += `E-mail: ${prospect.email}\n`
    }
    if (prospect.telefone) {
      conteudo += `Telefone: ${prospect.telefone}\n`
    }
    if (prospect.cpf) {
      conteudo += `CPF: ${prospect.cpf}\n`
    }
    if (prospect.curso || prospect.curso_pretendido) {
      conteudo += `Curso: ${prospect.curso || prospect.curso_pretendido || 'N/A'}\n`
    }
    if (prospect.status_academico) {
      conteudo += `Status: ${prospect.status_academico}\n`
    }
    if (prospect.valor_mensalidade) {
      conteudo += `Valor Mensalidade: R$ ${Number(prospect.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`
    }
    if (prospect.created_at) {
      conteudo += `Data de Cadastro: ${formatarDataCompleta(prospect.created_at)}\n`
    }
    conteudo += '\n'
  }

  // Mensagens
  conteudo += 'HISTÓRICO DE MENSAGENS\n'
  conteudo += '-'.repeat(80) + '\n\n'

  if (mensagens.length === 0) {
    conteudo += 'Nenhuma mensagem registrada.\n\n'
  } else {
    // Ordenar mensagens por timestamp (mais antiga primeiro)
    const mensagensOrdenadas = [...mensagens].sort((a, b) => {
      const timestampA = new Date(a.timestamp || a.created_at).getTime()
      const timestampB = new Date(b.timestamp || b.created_at).getTime()
      return timestampA - timestampB
    })

    mensagensOrdenadas.forEach((mensagem, index) => {
      const timestamp = formatarDataCompleta(mensagem.timestamp || mensagem.created_at)
      const remetente = formatarRemetente(mensagem.remetente)
      
      conteudo += `[${timestamp}] ${remetente}:\n`
      conteudo += `${mensagem.conteudo || '(sem conteúdo)'}\n`
      
      if (mensagem.tipo_mensagem && mensagem.tipo_mensagem !== 'texto') {
        conteudo += `[Tipo: ${mensagem.tipo_mensagem}]\n`
      }
      
      if (mensagem.lida !== undefined) {
        conteudo += `[${mensagem.lida ? 'Lida' : 'Não lida'}]\n`
      }
      
      conteudo += '\n'
      
      // Separador a cada 10 mensagens para melhor leitura
      if ((index + 1) % 10 === 0 && index < mensagensOrdenadas.length - 1) {
        conteudo += '-'.repeat(80) + '\n\n'
      }
    })
  }

  // Estatísticas
  conteudo += '\n' + '='.repeat(80) + '\n'
  conteudo += 'ESTATÍSTICAS\n'
  conteudo += '-'.repeat(80) + '\n'
  conteudo += `Total de Mensagens: ${mensagens.length}\n`
  
  const mensagensCliente = mensagens.filter(m => {
    const remetente = (m.remetente || '').toLowerCase()
    return remetente === 'cliente' || remetente === 'usuario'
  }).length
  
  const mensagensAtendente = mensagens.filter(m => {
    const remetente = (m.remetente || '').toLowerCase()
    return remetente === 'humano' || remetente === 'agente' || remetente === 'robo' || remetente === 'bot'
  }).length

  conteudo += `Mensagens do Cliente: ${mensagensCliente}\n`
  conteudo += `Mensagens do Atendente/IA: ${mensagensAtendente}\n`
  
  if (conversa.nao_lidas !== undefined) {
    conteudo += `Mensagens Não Lidas: ${conversa.nao_lidas}\n`
  }

  conteudo += '\n' + '='.repeat(80) + '\n'
  conteudo += `Exportado em: ${formatarDataCompleta(new Date().toISOString())}\n`
  conteudo += '='.repeat(80) + '\n'

  return conteudo
}

/**
 * Exportar conversa como arquivo TXT
 */
export function exportarConversaTXT(dados: DadosExportacao): void {
  const conteudo = formatarConversaParaExportacao(dados)
  
  // Criar nome do arquivo
  const nomeContato = dados.conversa.nome || dados.prospect?.nome || 'Conversa'
  const nomeLimpo = nomeContato.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const data = new Date().toISOString().split('T')[0]
  const nomeArquivo = `conversa_${nomeLimpo}_${data}.txt`

  // Criar blob e fazer download
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

