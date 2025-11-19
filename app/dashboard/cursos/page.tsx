'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CursoModal } from '@/components/dashboard/CursoModal'
import { 
  GraduationCap, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  ExternalLink,
  Building2,
  FileDown,
  Eye,
  X
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Curso, Faculdade } from '@/types/supabase'
import { formatCurrency } from '@/lib/utils'

export default function CursosPage() {
  const { faculdadeSelecionada, faculdades } = useFaculdade()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [cursoEditando, setCursoEditando] = useState<Curso | null>(null)
  const [cursoVisualizando, setCursoVisualizando] = useState<Curso | null>(null)
  const [faculdadesMap, setFaculdadesMap] = useState<Record<string, Faculdade>>({})
  const [importando, setImportando] = useState(false)

  const fetchCursos = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setCursos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Buscar cursos apenas da faculdade selecionada
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .eq('ativo', true)
        .order('curso', { ascending: true })

      if (error) {
        console.error('Erro ao buscar cursos:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Se a tabela não existe, mostrar mensagem específica
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          console.warn('⚠️ A tabela "cursos" não existe no banco de dados.')
          console.warn('📋 Execute a migração SQL: supabase/migrations/009_create_cursos_table.sql')
        }
        
        setCursos([])
        return
      }

      setCursos(data || [])
    } catch (error: any) {
      console.error('Erro inesperado ao buscar cursos:', {
        message: error?.message || 'Erro desconhecido',
        error: error
      })
      setCursos([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada])

  // Criar mapa de faculdades para busca rápida
  useEffect(() => {
    const map: Record<string, Faculdade> = {}
    faculdades.forEach(faculdade => {
      map[faculdade.id] = faculdade
    })
    setFaculdadesMap(map)
  }, [faculdades])

  useEffect(() => {
    fetchCursos()
  }, [fetchCursos])

  const cursosFiltrados = cursos.filter(curso => {
    const matchSearch = curso.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       curso.modalidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       curso.duracao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (curso.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const handleNovoCurso = () => {
    setCursoEditando(null)
    setModalAberto(true)
  }

  const handleEditarCurso = (curso: Curso) => {
    setCursoEditando(curso)
    setModalAberto(true)
  }

  const handleDeletarCurso = async (curso: Curso) => {
    if (!confirm(`Tem certeza que deseja excluir o curso "${curso.curso}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', curso.id)

      if (error) {
        console.error('Erro ao deletar curso:', error)
        alert('Erro ao deletar curso: ' + error.message)
        return
      }

      // Atualizar lista
      await fetchCursos()
      alert('Curso deletado com sucesso!')
    } catch (error: any) {
      console.error('Erro inesperado ao deletar curso:', error)
      alert('Erro ao deletar curso: ' + error.message)
    }
  }

  const handleModalClose = () => {
    setModalAberto(false)
    setCursoEditando(null)
  }

  const handleModalSuccess = () => {
    fetchCursos()
  }

  const handleBaixarModelo = () => {
    // Criar CSV modelo com cabeçalhos e exemplo
    const headers = [
      'Faculdade',
      'Curso',
      'Categoria',
      'Descrição',
      'Link',
      'Quantidade de Parcelas',
      'Modalidade',
      'Duração',
      'Valor com Desconto',
      'Desconto %',
      'Prática',
      'Laboratório',
      'Estágio',
      'TCC',
      'Ativo'
    ]

    // Pegar primeira faculdade como exemplo, ou usar um nome genérico
    const faculdadeExemplo = faculdades.length > 0 ? faculdades[0].nome : 'Nome da Faculdade'
    
    // Linha de exemplo
    const exemplo = [
      faculdadeExemplo,
      'Engenharia de Software',
      'Tecnologia',
      'Curso completo de engenharia de software com foco em desenvolvimento',
      'https://exemplo.com/engenharia-software',
      '48',
      'Presencial',
      '4 anos',
      '850.00',
      '10.0',
      'Sim',
      'Sim',
      'Sim',
      'Sim',
      'Sim'
    ]

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      exemplo.map(cell => `"${cell}"`).join(',')
    ].join('\n')

    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'modelo_importacao_cursos.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportar = () => {
    // Criar CSV
    const headers = [
      'Faculdade',
      'Curso',
      'Categoria',
      'Descrição',
      'Link',
      'Quantidade de Parcelas',
      'Modalidade',
      'Duração',
      'Valor com Desconto',
      'Desconto %',
      'Prática',
      'Laboratório',
      'Estágio',
      'TCC',
      'Ativo'
    ]

    const rows = cursosFiltrados.map(curso => {
      const faculdade = faculdadesMap[curso.faculdade_id]
      return [
        faculdade?.nome || 'N/A',
        curso.curso,
        curso.categoria || '',
        curso.descricao || '',
        curso.link || '',
        curso.quantidade_de_parcelas.toString(),
        curso.modalidade,
        curso.duracao,
        curso.valor_com_desconto_pontualidade.toString(),
        curso.desconto_percentual.toString(),
        curso.pratica ? 'Sim' : 'Não',
        curso.laboratorio ? 'Sim' : 'Não',
        curso.estagio ? 'Sim' : 'Não',
        curso.tcc ? 'Sim' : 'Não',
        curso.ativo ? 'Sim' : 'Não'
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `cursos_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportarCSV = () => {
    // Criar input file invisível
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.style.display = 'none'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        setImportando(true)
        
        // Ler arquivo CSV
        const text = await file.text()
        
        // Função para fazer parse correto de CSV (trata vírgulas dentro de aspas)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let insideQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            const nextChar = line[i + 1]
            
            if (char === '"') {
              if (insideQuotes && nextChar === '"') {
                // Escape de aspas duplas ("" vira ")
                current += '"'
                i++ // Pular próximo caractere
              } else {
                // Toggle inside quotes
                insideQuotes = !insideQuotes
              }
            } else if (char === ',' && !insideQuotes) {
              // Vírgula fora de aspas = separador de campo
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          
          // Adicionar último campo
          result.push(current.trim())
          return result
        }

        // Parse CSV - normalizar quebras de linha e processar campos multilinhas
        // Remover \r e dividir por \n, mas preservar linhas vazias dentro de campos entre aspas
        const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        // Dividir em linhas, mas precisamos ter cuidado com campos multilinhas
        let lines: string[] = []
        let currentLine = ''
        let insideQuotes = false
        let quoteCount = 0
        
        for (let i = 0; i < normalizedText.length; i++) {
          const char = normalizedText[i]
          const nextChar = normalizedText[i + 1]
          
          if (char === '"') {
            if (insideQuotes && nextChar === '"') {
              // Escape de aspas duplas
              currentLine += '"'
              i++ // Pular próximo caractere
            } else {
              // Toggle inside quotes
              insideQuotes = !insideQuotes
              quoteCount++
              currentLine += char
            }
          } else if (char === '\n' && !insideQuotes) {
            // Nova linha fora de aspas = fim de linha CSV
            if (currentLine.trim()) {
              lines.push(currentLine)
            }
            currentLine = ''
            quoteCount = 0
          } else if (char === '\n' && insideQuotes) {
            // Nova linha dentro de aspas = parte do campo multilinha
            currentLine += '\n'
          } else {
            currentLine += char
          }
        }
        
        // Adicionar última linha se houver
        if (currentLine.trim()) {
          lines.push(currentLine)
        }
        
        // Filtrar linhas vazias
        lines = lines.filter(line => line.trim())
        if (lines.length < 2) {
          alert('O arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados')
          return
        }

        // Processar cabeçalho usando parser CSV
        const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
        
        // Mapear índices dos campos
        const getIndex = (field: string) => {
          const index = headers.findIndex(h => 
            h.toLowerCase().includes(field.toLowerCase()) ||
            h.toLowerCase() === field.toLowerCase()
          )
          return index
        }

        // Função para converter valor numérico com vírgula decimal
        const parseNumberWithComma = (value: string): number => {
          if (!value) return 0
          // Remover caracteres não numéricos exceto vírgula e ponto
          let cleaned = value.replace(/[^\d,.-]/g, '')
          // Substituir vírgula por ponto para parseFloat
          cleaned = cleaned.replace(',', '.')
          const parsed = parseFloat(cleaned)
          return isNaN(parsed) ? 0 : parsed
        }

        const faculdadeIdx = getIndex('faculdade')
        const cursoIdx = getIndex('curso')
        const categoriaIdx = getIndex('categoria')
        const parcelasIdxTemp = getIndex('quantidade')
        const parcelasIdx = parcelasIdxTemp !== -1 ? parcelasIdxTemp : getIndex('parcelas')
        const modalidadeIdx = getIndex('modalidade')
        const duracaoIdx = getIndex('duracao') !== -1 ? getIndex('duracao') : getIndex('duração')
        
        // Buscar índice de valor - pode ser "Valor com Desconto" ou "Valor"
        let valorIdxTemp = getIndex('valor_com_desconto')
        if (valorIdxTemp === -1) {
          valorIdxTemp = getIndex('valor')
        }
        const valorIdx = valorIdxTemp
        
        // Buscar índice de desconto - pode ter "%" no final
        const descontoIdxTemp = getIndex('desconto %')
        const descontoIdx = descontoIdxTemp !== -1 ? descontoIdxTemp : getIndex('desconto')
        const praticaIdx = getIndex('pratica') || getIndex('prática')
        const laboratorioIdx = getIndex('laboratorio') || getIndex('laboratório')
        const estagioIdx = getIndex('estagio') || getIndex('estágio')
        const tccIdx = getIndex('tcc')
        const linkIdx = getIndex('link')
        const descricaoIdx = getIndex('descricao') || getIndex('descrição')
        const ativoIdx = getIndex('ativo')

        // Validar campos obrigatórios
        if (cursoIdx === -1) {
          alert('Erro: Coluna "Curso" não encontrada no CSV')
          return
        }
        if (faculdadeIdx === -1) {
          alert('Erro: Coluna "Faculdade" não encontrada no CSV')
          return
        }

        // Processar linhas
        const cursosParaImportar: any[] = []
        let erros: string[] = []

        for (let i = 1; i < lines.length; i++) {
          // Usar parser CSV para tratar vírgulas dentro de aspas corretamente
          const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim())
          
          // Buscar faculdade por nome
          const nomeFaculdade = values[faculdadeIdx]?.trim()
          const faculdade = faculdades.find(f => 
            f.nome.toLowerCase() === nomeFaculdade?.toLowerCase()
          )

          if (!faculdade) {
            erros.push(`Linha ${i + 1}: Faculdade "${nomeFaculdade}" não encontrada`)
            continue
          }

          const cursoNome = values[cursoIdx]?.trim()
          if (!cursoNome) {
            erros.push(`Linha ${i + 1}: Nome do curso é obrigatório`)
            continue
          }

          // Converter valores
          const parcelas = parseInt(values[parcelasIdx] || '1') || 1
          const modalidade = (values[modalidadeIdx] || 'Presencial').trim()
          if (!['Presencial', 'EAD', 'Híbrido'].includes(modalidade)) {
            erros.push(`Linha ${i + 1}: Modalidade inválida "${modalidade}". Deve ser: Presencial, EAD ou Híbrido`)
            continue
          }
          const duracao = values[duracaoIdx]?.trim() || ''
          // Usar função para converter números com vírgula decimal
          const valor = parseNumberWithComma(values[valorIdx] || '0')
          // Desconto pode ter % no final, remover primeiro
          const descontoStr = (values[descontoIdx] || '0').replace('%', '').trim()
          const desconto = parseNumberWithComma(descontoStr)
          const pratica = ['sim', 'yes', 'true', '1', 's'].includes((values[praticaIdx] || '').toLowerCase())
          const laboratorio = ['sim', 'yes', 'true', '1', 's'].includes((values[laboratorioIdx] || '').toLowerCase())
          const estagio = ['sim', 'yes', 'true', '1', 's'].includes((values[estagioIdx] || '').toLowerCase())
          const tcc = ['sim', 'yes', 'true', '1', 's'].includes((values[tccIdx] || '').toLowerCase())
          
          // Campos opcionais - só incluir se a coluna existir no CSV
          const link = linkIdx !== -1 ? (values[linkIdx]?.trim() || null) : null
          const descricao = descricaoIdx !== -1 ? (values[descricaoIdx]?.trim() || null) : null
          const categoria = categoriaIdx !== -1 ? (values[categoriaIdx]?.trim() || null) : null
          
          const ativo = ativoIdx === -1 ? true : ['sim', 'yes', 'true', '1', 's'].includes((values[ativoIdx] || 'sim').toLowerCase())

          // Construir objeto apenas com campos que existem
          const cursoData: any = {
            faculdade_id: faculdade.id,
            curso: cursoNome,
            quantidade_de_parcelas: parcelas,
            modalidade,
            duracao,
            valor_com_desconto_pontualidade: valor,
            desconto_percentual: desconto,
            pratica,
            laboratorio,
            estagio,
            tcc,
            ativo
          }

          // Adicionar campos opcionais apenas se a coluna existir no CSV
          // Só adicionar se não for null/vazio para evitar erros
          if (linkIdx !== -1 && link) cursoData.link = link
          if (descricaoIdx !== -1 && descricao) cursoData.descricao = descricao
          if (categoriaIdx !== -1 && categoria) cursoData.categoria = categoria

          cursosParaImportar.push(cursoData)
        }

        if (erros.length > 0) {
          const mensagemErros = erros.slice(0, 10).join('\n') + 
            (erros.length > 10 ? `\n... e mais ${erros.length - 10} erro(s)` : '')
          const continuar = confirm(
            `Foram encontrados ${erros.length} erro(s) ao processar o CSV:\n\n${mensagemErros}\n\nDeseja continuar importando os ${cursosParaImportar.length} curso(s) válido(s)?`
          )
          if (!continuar) return
        }

        if (cursosParaImportar.length === 0) {
          alert('Nenhum curso válido para importar')
          return
        }

        // Verificar duplicados antes de importar
        // Buscar todos os cursos existentes de uma vez para melhor performance
        const faculdadesIds = [...new Set(cursosParaImportar.map(c => c.faculdade_id))]
        const cursosNomes = [...new Set(cursosParaImportar.map(c => c.curso))]
        
        const { data: todosCursosExistentes } = await supabase
          .from('cursos')
          .select('id, curso, faculdade_id')
          .in('faculdade_id', faculdadesIds)
          .in('curso', cursosNomes)

        // Criar um mapa para busca rápida: chave = "faculdade_id|curso", valor = id
        const mapaCursosExistentes = new Map<string, string>()
        todosCursosExistentes?.forEach(curso => {
          const chave = `${curso.faculdade_id}|${curso.curso}`
          mapaCursosExistentes.set(chave, curso.id)
        })

        // Separar cursos em existentes e novos
        const cursosExistentes: any[] = []
        const cursosNovos: any[] = []
        const cursosDuplicados: string[] = []

        for (const curso of cursosParaImportar) {
          const chave = `${curso.faculdade_id}|${curso.curso}`
          const idExistente = mapaCursosExistentes.get(chave)

          if (idExistente) {
            cursosExistentes.push({ ...curso, id_existente: idExistente })
            cursosDuplicados.push(`"${curso.curso}" (${faculdades.find(f => f.id === curso.faculdade_id)?.nome || 'Faculdade desconhecida'})`)
          } else {
            cursosNovos.push(curso)
          }
        }

        // Se houver duplicados, perguntar ao usuário
        let acaoDuplicados: 'atualizar' | 'pular' | 'cancelar' = 'pular'
        if (cursosExistentes.length > 0) {
          const mensagemDuplicados = 
            `Foram encontrados ${cursosExistentes.length} curso(s) que já existem no banco de dados:\n\n` +
            cursosDuplicados.slice(0, 10).join('\n') +
            (cursosDuplicados.length > 10 ? `\n... e mais ${cursosDuplicados.length - 10} curso(s)` : '') +
            `\n\nDeseja ATUALIZAR os cursos existentes com os novos dados do CSV?`

          const atualizar = confirm(mensagemDuplicados)
          if (atualizar) {
            // Usuário clicou em OK = Atualizar
            acaoDuplicados = 'atualizar'
          } else {
            // Usuário clicou em Cancelar = Perguntar se quer pular ou cancelar tudo
            const continuar = confirm(
              `OK, os cursos duplicados serão ignorados.\n\nDeseja continuar importando os ${cursosNovos.length} curso(s) novo(s)?`
            )
            if (!continuar) {
              return // Cancelar importação
            }
            acaoDuplicados = 'pular'
          }
        }

        let cursosInseridos = 0
        let cursosAtualizados = 0
        let errosImportacao: string[] = []

        // Inserir cursos novos
        if (cursosNovos.length > 0) {
          // Limpar campos opcionais que não existem no banco
          // Criar uma cópia dos cursos sem campos que podem não existir
          const cursosParaInserir = cursosNovos.map(curso => {
            const cursoLimpo: any = {
              faculdade_id: curso.faculdade_id,
              curso: curso.curso,
              quantidade_de_parcelas: curso.quantidade_de_parcelas,
              modalidade: curso.modalidade,
              duracao: curso.duracao,
              valor_com_desconto_pontualidade: curso.valor_com_desconto_pontualidade,
              desconto_percentual: curso.desconto_percentual,
              pratica: curso.pratica,
              laboratorio: curso.laboratorio,
              estagio: curso.estagio,
              tcc: curso.tcc,
              ativo: curso.ativo
            }
            
            // Adicionar campos opcionais apenas se estiverem definidos
            // Não incluir se forem null ou undefined para evitar erros de coluna não encontrada
            if (curso.link !== null && curso.link !== undefined && curso.link !== '') {
              cursoLimpo.link = curso.link
            }
            if (curso.descricao !== null && curso.descricao !== undefined && curso.descricao !== '') {
              cursoLimpo.descricao = curso.descricao
            }
            if (curso.categoria !== null && curso.categoria !== undefined && curso.categoria !== '') {
              cursoLimpo.categoria = curso.categoria
            }
            
            return cursoLimpo
          })
          
          // Log dos dados antes de inserir para debug
          console.log('Cursos novos para inserir (primeiro):', JSON.stringify(cursosParaInserir[0], null, 2))
          console.log(`Total de cursos para inserir: ${cursosParaInserir.length}`)
          
          // Validar dados antes de inserir
          const cursosInvalidos: string[] = []
          cursosParaInserir.forEach((curso, index) => {
            if (!curso.faculdade_id) cursosInvalidos.push(`Curso ${index + 1}: faculdade_id ausente`)
            if (!curso.curso || !curso.curso.trim()) cursosInvalidos.push(`Curso ${index + 1}: nome do curso ausente`)
            if (!curso.modalidade || !['Presencial', 'EAD', 'Híbrido'].includes(curso.modalidade)) {
              cursosInvalidos.push(`Curso ${index + 1}: modalidade inválida (${curso.modalidade})`)
            }
          })
          
          if (cursosInvalidos.length > 0) {
            console.error('Cursos inválidos encontrados:', cursosInvalidos)
            errosImportacao.push(`Erro de validação: ${cursosInvalidos.slice(0, 5).join(', ')}`)
            return
          }
          
          try {
            // Tentar inserir em lotes menores para melhorar debugging
            const batchSize = 10
            const batches = []
            for (let i = 0; i < cursosParaInserir.length; i += batchSize) {
              batches.push(cursosParaInserir.slice(i, i + batchSize))
            }
            
            console.log(`Inserindo ${cursosParaInserir.length} cursos em ${batches.length} lote(s)`)
            
            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
              const batch = batches[batchIndex]
              console.log(`Inserindo lote ${batchIndex + 1}/${batches.length} com ${batch.length} curso(s)`)
              
              const { data: dataInsert, error: errorInsert } = await supabase
                .from('cursos')
                .insert(batch)
                .select()

              if (errorInsert) {
                // Tentar capturar o erro de múltiplas formas
                const errorInfo = {
                  message: errorInsert?.message || 'Sem mensagem',
                  details: errorInsert?.details || 'Sem detalhes',
                  hint: errorInsert?.hint || 'Sem hint',
                  code: errorInsert?.code || 'Sem código',
                  status: (errorInsert as any)?.status || 'Sem status',
                  statusCode: (errorInsert as any)?.statusCode || 'Sem statusCode',
                }
                
                // Tentar serializar o erro completo
                let errorString = 'Erro não serializável'
                try {
                  errorString = JSON.stringify(errorInsert, Object.getOwnPropertyNames(errorInsert), 2)
                } catch (e) {
                  errorString = String(errorInsert)
                }
                
                // Log completo do erro no console
                console.error('=== ERRO AO INSERIR CURSOS ===')
                console.error('Erro objeto completo:', errorInsert)
                console.error('Erro serializado:', errorString)
                console.error('Informações do erro:', errorInfo)
                console.error('Batch que causou erro:', JSON.stringify(batch, null, 2))
                console.error('================================')
              
                // Verificar se é erro de coluna não encontrada
                const errorMessage = errorInfo.message
                const errorDetails = errorInfo.details
                const errorCode = errorInfo.code
                const fullError = `${errorMessage} ${errorDetails}`.toLowerCase()
                
                // Preparar mensagem de erro para o usuário
                let mensagemErro = `Erro ao inserir lote ${batchIndex + 1} (${batch.length} curso(s)):\n\n`
                
                if (fullError.includes('column') || fullError.includes('schema cache') || fullError.includes('does not exist')) {
                  const camposFaltando = []
                  if (fullError.includes('descricao')) camposFaltando.push('descricao')
                  if (fullError.includes('link')) camposFaltando.push('link')
                  if (fullError.includes('categoria')) camposFaltando.push('categoria')
                  
                  if (camposFaltando.length > 0) {
                    mensagemErro += `Campos não encontrados na tabela 'cursos':\n${camposFaltando.map(c => `  • ${c}`).join('\n')}\n\n`
                    mensagemErro += `📋 Execute as migrações SQL necessárias:\n`
                    if (camposFaltando.includes('descricao') || camposFaltando.includes('link')) {
                      mensagemErro += `  • supabase/migrations/011_add_campos_cursos.sql\n`
                    }
                    if (camposFaltando.includes('categoria')) {
                      mensagemErro += `  • supabase/migrations/012_add_categoria_cursos.sql\n`
                    }
                  } else {
                    mensagemErro += `Erro de coluna não encontrada.\n`
                    mensagemErro += `Mensagem: ${errorMessage || 'Sem mensagem'}\n`
                    mensagemErro += `Detalhes: ${errorDetails || 'Sem detalhes'}`
                  }
                } else if (errorCode === '23505' || fullError.includes('unique')) {
                  mensagemErro += `Alguns cursos já existem (duplicado).\n`
                  mensagemErro += `Mensagem: ${errorMessage || 'Violação de constraint única'}\n`
                  mensagemErro += `Detalhes: ${errorDetails || 'Cursos duplicados detectados'}`
                } else if (errorCode === '23514' || fullError.includes('check constraint')) {
                  mensagemErro += `Erro de validação (check constraint).\n`
                  mensagemErro += `Mensagem: ${errorMessage || 'Valor inválido para algum campo'}\n`
                  mensagemErro += `Detalhes: ${errorDetails || 'Verifique os valores dos campos'}`
                } else if (errorCode === '23503' || fullError.includes('foreign key')) {
                  mensagemErro += `Erro de chave estrangeira.\n`
                  mensagemErro += `Mensagem: ${errorMessage || 'Faculdade não encontrada'}\n`
                  mensagemErro += `Detalhes: ${errorDetails || 'Verifique se a faculdade existe'}`
                } else {
                  mensagemErro += `Código do erro: ${errorCode || 'Desconhecido'}\n`
                  mensagemErro += `Mensagem: ${errorMessage || 'Erro desconhecido'}\n`
                  if (errorDetails) {
                    mensagemErro += `Detalhes: ${errorDetails}\n`
                  }
                  if (errorInfo.hint) {
                    mensagemErro += `Dica: ${errorInfo.hint}`
                  }
                }
                
                // Adicionar à lista de erros
                errosImportacao.push(mensagemErro)
                
                // Mostrar alerta imediato para o usuário
                alert(mensagemErro)
                
                break // Parar processamento se houver erro
              } else {
                const inseridosNoBatch = dataInsert?.length || 0
                cursosInseridos += inseridosNoBatch
                console.log(`✅ Lote ${batchIndex + 1}: ${inseridosNoBatch} curso(s) inserido(s)`)
              }
            }
            
            console.log(`✅ Total: ${cursosInseridos} curso(s) inserido(s) com sucesso`)
          } catch (err: any) {
            console.error('Erro inesperado ao tentar inserir cursos:', err)
            errosImportacao.push(`Erro inesperado: ${err?.message || JSON.stringify(err)}`)
          }
        }

        // Atualizar ou pular cursos existentes
        if (cursosExistentes.length > 0 && acaoDuplicados === 'atualizar') {
          for (const curso of cursosExistentes) {
            const { id_existente, ...dadosAtualizacao } = curso
            delete (dadosAtualizacao as any).id_existente

            const { error: errorUpdate } = await supabase
              .from('cursos')
              .update(dadosAtualizacao)
              .eq('id', curso.id_existente)

            if (errorUpdate) {
              console.error(`Erro ao atualizar curso ${curso.curso}:`, errorUpdate)
              errosImportacao.push(`Erro ao atualizar "${curso.curso}": ${errorUpdate.message}`)
            } else {
              cursosAtualizados++
            }
          }
        }

        // Verificar se houve erro de coluna não encontrada nos erros
        const temErroColuna = errosImportacao.some(e => 
          e.includes('column') || e.includes('schema cache')
        )

        if (temErroColuna) {
          const camposFaltando = []
          if (errosImportacao.some(e => e.includes('descricao'))) camposFaltando.push('descricao')
          if (errosImportacao.some(e => e.includes('link'))) camposFaltando.push('link')
          if (errosImportacao.some(e => e.includes('categoria'))) camposFaltando.push('categoria')
          
          let mensagem = `Erro: Campos não encontrados na tabela 'cursos':\n\n`
          if (camposFaltando.length > 0) {
            mensagem += camposFaltando.map(c => `  - ${c}`).join('\n')
            mensagem += `\n\n📋 Execute as migrações SQL necessárias:\n`
            if (camposFaltando.includes('descricao') || camposFaltando.includes('link')) {
              mensagem += `  - supabase/migrations/011_add_campos_cursos.sql\n`
            }
            if (camposFaltando.includes('categoria')) {
              mensagem += `  - supabase/migrations/012_add_categoria_cursos.sql\n`
            }
          } else {
            mensagem += errosImportacao.join('\n')
          }
          alert(mensagem)
          return
        }

        if (errosImportacao.length > 0 && cursosInseridos === 0 && cursosAtualizados === 0) {
          alert(`Erro ao importar cursos:\n\n${errosImportacao.slice(0, 5).join('\n')}`)
          return
        }

        // Sucesso
        const totalErros = erros.length
        let mensagemSucesso = `Importação concluída!\n\n`
        
        if (cursosInseridos > 0) {
          mensagemSucesso += `✅ ${cursosInseridos} curso(s) novo(s) inserido(s)\n`
        }
        if (cursosAtualizados > 0) {
          mensagemSucesso += `🔄 ${cursosAtualizados} curso(s) existente(s) atualizado(s)\n`
        }
        if (cursosExistentes.length > 0 && acaoDuplicados === 'pular') {
          mensagemSucesso += `⏭️ ${cursosExistentes.length} curso(s) duplicado(s) ignorado(s)\n`
        }
        if (totalErros > 0) {
          mensagemSucesso += `\n⚠️ ${totalErros} erro(s) encontrado(s) durante a validação\n`
        }
        if (errosImportacao.length > 0) {
          mensagemSucesso += `\n❌ ${errosImportacao.length} erro(s) durante a importação:\n${errosImportacao.slice(0, 3).join('\n')}`
        }

        alert(mensagemSucesso)

        // Atualizar lista
        await fetchCursos()
      } catch (error: any) {
        console.error('Erro ao processar CSV:', error)
        alert('Erro ao processar arquivo CSV: ' + error.message)
      } finally {
        setImportando(false)
        // Limpar input
        if (input.parentNode) {
          input.parentNode.removeChild(input)
        }
      }
    }

    document.body.appendChild(input)
    input.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Cursos"
          subtitle="Lista de cursos disponíveis"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Cursos"
        subtitle="Lista de cursos disponíveis"
      />
      
      <div className="p-8 space-y-6">
        {/* Ações e Busca */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="secondary" 
                  className="w-full md:w-auto"
                  onClick={handleBaixarModelo}
                  title="Baixar modelo/template CSV para importação"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Baixar Modelo
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full md:w-auto"
                  onClick={handleImportarCSV}
                  disabled={importando}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importando ? 'Importando...' : 'Importar CSV'}
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full md:w-auto"
                  onClick={handleExportar}
                  disabled={cursosFiltrados.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={handleNovoCurso} className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Curso
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabela de Cursos */}
        {cursosFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Tente ajustar sua busca'
                  : 'Comece cadastrando seu primeiro curso'}
              </p>
              {!searchTerm && (
                <Button onClick={handleNovoCurso}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Curso
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Faculdade</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Curso</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Categoria</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Qtd. Parcelas</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Modalidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Duração</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Valor c/ Desconto</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Desconto %</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosFiltrados.map((curso) => {
                    const faculdade = faculdadesMap[curso.faculdade_id]
                    return (
                    <tr key={curso.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{faculdade?.nome || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{curso.curso}</div>
                      </td>
                      <td className="py-3 px-4">
                        {curso.categoria ? (
                          <Badge variant="info" className="text-xs">
                            {curso.categoria}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{curso.quantidade_de_parcelas}</td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={curso.modalidade === 'Presencial' ? 'info' : curso.modalidade === 'EAD' ? 'warning' : 'success'}
                        >
                          {curso.modalidade}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{curso.duracao}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(curso.valor_com_desconto_pontualidade)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        {curso.desconto_percentual.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setCursoVisualizando(curso)}
                            className="p-1"
                            title="Visualizar curso"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditarCurso(curso)}
                            className="p-1"
                            title="Editar curso"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeletarCurso(curso)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Deletar curso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {/* Resumo */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Total de cursos: <strong className="text-gray-900">{cursosFiltrados.length}</strong></span>
                <span>Total de valor: <strong className="text-gray-900">
                  {formatCurrency(cursosFiltrados.reduce((sum, curso) => sum + curso.valor_com_desconto_pontualidade, 0))}
                </strong></span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modal de Criar/Editar Curso */}
      <CursoModal
        curso={cursoEditando}
        isOpen={modalAberto}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Modal de Visualização do Curso */}
      {cursoVisualizando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {cursoVisualizando.curso}
              </h2>
              <button
                onClick={() => setCursoVisualizando(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-6">
              {/* Informações Principais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Faculdade</label>
                  <p className="text-gray-900 font-medium">
                    {faculdadesMap[cursoVisualizando.faculdade_id]?.nome || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Categoria</label>
                  <div className="mt-1">
                    {cursoVisualizando.categoria ? (
                      <Badge variant="info">{cursoVisualizando.categoria}</Badge>
                    ) : (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Modalidade</label>
                  <div className="mt-1">
                    <Badge 
                      variant={cursoVisualizando.modalidade === 'Presencial' ? 'info' : cursoVisualizando.modalidade === 'EAD' ? 'warning' : 'success'}
                    >
                      {cursoVisualizando.modalidade}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duração</label>
                  <p className="text-gray-900">{cursoVisualizando.duracao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantidade de Parcelas</label>
                  <p className="text-gray-900">{cursoVisualizando.quantidade_de_parcelas}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor com Desconto</label>
                  <p className="text-gray-900 font-semibold text-lg">
                    {formatCurrency(cursoVisualizando.valor_com_desconto_pontualidade)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Desconto Percentual</label>
                  <p className="text-gray-900">{cursoVisualizando.desconto_percentual.toFixed(1)}%</p>
                </div>
                {cursoVisualizando.link && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Link do Curso</label>
                    <div className="mt-1">
                      <a
                        href={cursoVisualizando.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">Abrir link</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {cursoVisualizando.descricao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descrição</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{cursoVisualizando.descricao}</p>
                </div>
              )}

              {/* Componentes do Curso */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Componentes do Curso</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cursoVisualizando.pratica ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">Prática</span>
                    <Badge variant={cursoVisualizando.pratica ? 'success' : 'info'} className="ml-auto">
                      {cursoVisualizando.pratica ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cursoVisualizando.laboratorio ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">Laboratório</span>
                    <Badge variant={cursoVisualizando.laboratorio ? 'success' : 'info'} className="ml-auto">
                      {cursoVisualizando.laboratorio ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cursoVisualizando.estagio ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">Estágio</span>
                    <Badge variant={cursoVisualizando.estagio ? 'success' : 'info'} className="ml-auto">
                      {cursoVisualizando.estagio ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cursoVisualizando.tcc ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-700">TCC</span>
                    <Badge variant={cursoVisualizando.tcc ? 'success' : 'info'} className="ml-auto">
                      {cursoVisualizando.tcc ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Status: <Badge variant={cursoVisualizando.ativo ? 'success' : 'info'}>
                    {cursoVisualizando.ativo ? 'Ativo' : 'Inativo'}
                  </Badge></span>
                  <span>Criado em: {new Date(cursoVisualizando.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => {
                  setCursoVisualizando(null)
                  handleEditarCurso(cursoVisualizando)
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Curso
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCursoVisualizando(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

