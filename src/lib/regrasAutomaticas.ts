/**
 * Regras Automáticas Educacionais
 * 
 * Sistema de regras para respostas automáticas baseadas em contexto educacional.
 * Detecta keywords nas mensagens e sugere/executa ações apropriadas.
 */

import { supabase } from '@/lib/supabase'
import { Prospect, Curso } from '@/types/supabase'

export interface RegraAutomatica {
  id: string
  nome: string
  keywords: string[]
  contexto: 'vestibular' | 'bolsa' | 'valor' | 'ead' | 'presencial' | 'matricula' | 'duvida'
  acao: 'responder' | 'oferecer_link' | 'listar_cursos' | 'formatar_info'
  resposta?: string
  link?: string
  categoria?: string
}

// Regras pré-definidas
export const REGRAS_AUTOMATICAS: RegraAutomatica[] = [
  {
    id: 'vestibular',
    nome: 'Informações sobre Vestibular',
    keywords: ['vestibular', 'prova', 'processo seletivo', 'ingresso', 'entrada', 'admissão'],
    contexto: 'vestibular',
    acao: 'responder',
    resposta: 'Olá! Temos um processo seletivo simplificado. Você pode se inscrever online ou presencialmente. Gostaria de mais informações sobre as datas e formas de ingresso?',
    categoria: 'Vendas',
  },
  {
    id: 'bolsa',
    nome: 'Bolsa de Estudos',
    keywords: ['bolsa', 'desconto', 'financiamento', 'parceria', 'benefício', 'auxílio'],
    contexto: 'bolsa',
    acao: 'oferecer_link',
    resposta: 'Temos várias opções de bolsas e financiamentos disponíveis! Você pode conferir nossos editais e programas de descontos. Gostaria que eu envie o link com mais informações?',
    link: '/editais',
    categoria: 'Financeiro',
  },
  {
    id: 'valor',
    nome: 'Valor e Mensalidade',
    keywords: ['valor', 'preço', 'mensalidade', 'parcela', 'pagamento', 'custo', 'quanto custa'],
    contexto: 'valor',
    acao: 'formatar_info',
    resposta: 'Os valores variam por curso e modalidade. Posso buscar informações específicas sobre o curso que você tem interesse. Qual curso você está pensando em fazer?',
    categoria: 'Vendas',
  },
  {
    id: 'ead',
    nome: 'Cursos EAD',
    keywords: ['ead', 'online', 'distância', 'remoto', 'a distância', 'ensino a distância'],
    contexto: 'ead',
    acao: 'listar_cursos',
    resposta: 'Temos vários cursos na modalidade EAD! Posso listar todos os cursos disponíveis nessa modalidade. Gostaria que eu envie a lista completa?',
    categoria: 'Vendas',
  },
  {
    id: 'presencial',
    nome: 'Cursos Presenciais',
    keywords: ['presencial', 'sala de aula', 'campus', 'presencialmente', 'aula presencial'],
    contexto: 'presencial',
    acao: 'listar_cursos',
    resposta: 'Temos vários cursos na modalidade presencial! Posso listar todos os cursos disponíveis nessa modalidade. Qual área do conhecimento você tem interesse?',
    categoria: 'Vendas',
  },
  {
    id: 'matricula',
    nome: 'Interesse em Matrícula',
    keywords: ['matricula', 'matricular', 'inscrever', 'inscrição', 'quer fazer', 'quero entrar'],
    contexto: 'matricula',
    acao: 'responder',
    resposta: 'Que ótimo interesse em se matricular conosco! Vou te ajudar com todo o processo. Qual curso você tem interesse e qual modalidade (EAD ou Presencial)?',
    categoria: 'Vendas',
  },
  {
    id: 'duvida',
    nome: 'Dúvidas sobre Cursos',
    keywords: ['dúvida', 'pergunta', 'quero saber', 'como funciona', 'o que preciso', 'requisitos'],
    contexto: 'duvida',
    acao: 'responder',
    resposta: 'Fico feliz em ajudar! Posso esclarecer suas dúvidas sobre nossos cursos, modalidades, valores e processo de ingresso. Sobre o que você gostaria de saber?',
    categoria: 'Atendimento',
  },
]

/**
 * Detecta qual regra se aplica baseado no conteúdo da mensagem
 */
export function detectarRegra(mensagem: string): RegraAutomatica | null {
  if (!mensagem || mensagem.trim().length === 0) return null

  const mensagemLower = mensagem.toLowerCase()

  // Buscar a regra com maior correspondência de keywords
  let melhorRegra: RegraAutomatica | null = null
  let maiorScore = 0

  for (const regra of REGRAS_AUTOMATICAS) {
    let score = 0
    for (const keyword of regra.keywords) {
      if (mensagemLower.includes(keyword.toLowerCase())) {
        score += 1
      }
    }

    if (score > maiorScore) {
      maiorScore = score
      melhorRegra = regra
    }
  }

  // Retornar apenas se houver pelo menos 1 keyword correspondente
  return maiorScore > 0 ? melhorRegra : null
}

/**
 * Processa uma regra automática e retorna a resposta formatada
 */
export async function processarRegra(
  regra: RegraAutomatica,
  prospect?: Prospect | null,
  faculdadeId?: string
): Promise<string> {
  let resposta = regra.resposta || ''

  // Substituir variáveis dinâmicas
  if (prospect) {
    const nome = prospect.nome || prospect.nome_completo || 'Cliente'
    const curso = prospect.curso || prospect.curso_pretendido || 'curso'
    const valorMensalidade = prospect.valor_mensalidade
      ? `R$ ${Number(prospect.valor_mensalidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : 'valor'

    resposta = resposta
      .replace(/\{\{nome\}\}/g, nome)
      .replace(/\{\{nome_completo\}\}/g, nome)
      .replace(/\{\{curso\}\}/g, curso)
      .replace(/\{\{curso_pretendido\}\}/g, curso)
      .replace(/\{\{valor_mensalidade\}\}/g, valorMensalidade)
      .replace(/\{\{valor\}\}/g, valorMensalidade)
  }

  // Executar ação específica
  switch (regra.acao) {
    case 'listar_cursos':
      if (faculdadeId) {
        const cursos = await buscarCursosPorCategoria(regra.contexto, faculdadeId)
        if (cursos.length > 0) {
          resposta += '\n\n📚 *Cursos Disponíveis:*\n'
          cursos.slice(0, 5).forEach((curso, index) => {
            resposta += `\n${index + 1}. ${curso.curso}`
            if (curso.modalidade) {
              resposta += ` (${curso.modalidade})`
            }
            if (curso.valor_com_desconto_pontualidade) {
              resposta += ` - R$ ${Number(curso.valor_com_desconto_pontualidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
            }
          })
          if (cursos.length > 5) {
            resposta += `\n\n... e mais ${cursos.length - 5} cursos!`
          }
        }
      }
      break

    case 'oferecer_link':
      if (regra.link) {
        resposta += `\n\n🔗 *Link:* ${regra.link}`
      }
      break

    case 'formatar_info':
      // Info já formatada na resposta base
      break

    case 'responder':
      // Resposta padrão já está definida
      break
  }

  return resposta
}

/**
 * Busca cursos por categoria/modalidade
 */
async function buscarCursosPorCategoria(
  contexto: RegraAutomatica['contexto'],
  faculdadeId: string
): Promise<Curso[]> {
  try {
    let query = supabase
      .from('cursos')
      .select('*')
      .eq('faculdade_id', faculdadeId)
      .eq('ativo', true)
      .order('curso', { ascending: true })

    // Filtrar por modalidade se aplicável
    if (contexto === 'ead') {
      query = query.ilike('modalidade', '%ead%')
    } else if (contexto === 'presencial') {
      query = query.ilike('modalidade', '%presencial%')
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar cursos:', error)
      return []
    }

    return (data || []) as Curso[]
  } catch (error) {
    console.error('Erro ao buscar cursos:', error)
    return []
  }
}

/**
 * Sugere resposta automática baseada na mensagem recebida
 */
export async function sugerirRespostaAutomatica(
  mensagem: string,
  prospect?: Prospect | null,
  faculdadeId?: string
): Promise<string | null> {
  const regra = detectarRegra(mensagem)
  
  if (!regra) {
    return null
  }

  try {
    const resposta = await processarRegra(regra, prospect, faculdadeId)
    return resposta
  } catch (error) {
    console.error('Erro ao processar regra automática:', error)
    return null
  }
}

/**
 * Verifica se uma mensagem requer resposta automática
 */
export function requerRespostaAutomatica(mensagem: string): boolean {
  return detectarRegra(mensagem) !== null
}

/**
 * Obtém contexto educacional da mensagem
 */
export function obterContextoEducacional(mensagem: string): RegraAutomatica['contexto'] | null {
  const regra = detectarRegra(mensagem)
  return regra?.contexto || null
}

