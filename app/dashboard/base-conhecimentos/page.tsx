'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  BookOpen, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  FileText,
  X,
  Check
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { BaseConhecimento } from '@/types/supabase'

export default function BaseConhecimentosPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [conhecimentos, setConhecimentos] = useState<BaseConhecimento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('')
  const [modalAberto, setModalAberto] = useState(false)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [conhecimentoSelecionado, setConhecimentoSelecionado] = useState<BaseConhecimento | null>(null)
  const [uploadModalAberto, setUploadModalAberto] = useState(false)
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    pergunta: '',
    resposta: '',
    categoria: '',
    tags: '',
    ativo: true
  })

  const fetchConhecimentos = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setConhecimentos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('base_conhecimento')
        .select('*')
        .eq('faculdade_id', faculdadeSelecionada.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar base de conhecimentos:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('⚠️ A tabela "base_conhecimento" não existe no banco de dados.')
          console.warn('📋 Execute a migração SQL: supabase/migrations/010_create_base_conhecimento_table.sql')
        }
        
        setConhecimentos([])
        return
      }

      setConhecimentos(data || [])
    } catch (error: any) {
      console.error('Erro inesperado ao buscar base de conhecimentos:', {
        message: error?.message || 'Erro desconhecido',
        error: error
      })
      setConhecimentos([])
    } finally {
      setLoading(false)
    }
  }, [faculdadeSelecionada])

  useEffect(() => {
    fetchConhecimentos()
  }, [fetchConhecimentos])

  const categoriasUnicas = Array.from(new Set(conhecimentos.map(k => k.categoria).filter(Boolean)))

  const conhecimentosFiltrados = conhecimentos.filter(conhecimento => {
    const matchSearch = conhecimento.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       conhecimento.resposta.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (conhecimento.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (conhecimento.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchCategoria = !categoriaFilter || conhecimento.categoria === categoriaFilter
    return matchSearch && matchCategoria
  })

  const handleNovoConhecimento = () => {
    setConhecimentoSelecionado(null)
    setModoEdicao(false)
    setFormData({
      pergunta: '',
      resposta: '',
      categoria: '',
      tags: '',
      ativo: true
    })
    setModalAberto(true)
  }

  const handleEditarConhecimento = (conhecimento: BaseConhecimento) => {
    setConhecimentoSelecionado(conhecimento)
    setModoEdicao(true)
    setFormData({
      pergunta: conhecimento.pergunta,
      resposta: conhecimento.resposta,
      categoria: conhecimento.categoria || '',
      tags: (conhecimento.tags || []).join(', '),
      ativo: conhecimento.ativo
    })
    setModalAberto(true)
  }

  const handleSalvarConhecimento = async () => {
    if (!faculdadeSelecionada || !formData.pergunta.trim() || !formData.resposta.trim()) {
      alert('Por favor, preencha a pergunta e a resposta.')
      return
    }

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)

      if (modoEdicao && conhecimentoSelecionado) {
        const { error } = await supabase
          .from('base_conhecimento')
          .update({
            pergunta: formData.pergunta.trim(),
            resposta: formData.resposta.trim(),
            categoria: formData.categoria.trim() || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
            ativo: formData.ativo
          })
          .eq('id', conhecimentoSelecionado.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('base_conhecimento')
          .insert({
            faculdade_id: faculdadeSelecionada.id,
            pergunta: formData.pergunta.trim(),
            resposta: formData.resposta.trim(),
            categoria: formData.categoria.trim() || null,
            tags: tagsArray.length > 0 ? tagsArray : null,
            ativo: formData.ativo
          })

        if (error) throw error
      }

      await fetchConhecimentos()
      setModalAberto(false)
      setFormData({
        pergunta: '',
        resposta: '',
        categoria: '',
        tags: '',
        ativo: true
      })
    } catch (error: any) {
      console.error('Erro ao salvar conhecimento:', error)
      alert('Erro ao salvar conhecimento: ' + error.message)
    }
  }

  const handleExcluirConhecimento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conhecimento?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('base_conhecimento')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchConhecimentos()
    } catch (error: any) {
      console.error('Erro ao excluir conhecimento:', error)
      alert('Erro ao excluir conhecimento: ' + error.message)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setArquivoSelecionado(file)
      } else {
        alert('Por favor, selecione um arquivo CSV.')
        setArquivoSelecionado(null)
      }
    }
  }

  const handleUploadCSV = async () => {
    if (!arquivoSelecionado || !faculdadeSelecionada) {
      alert('Por favor, selecione um arquivo CSV.')
      return
    }

    try {
      const text = await arquivoSelecionado.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      // Pular cabeçalho se existir
      const header = lines[0].toLowerCase()
      const startIndex = (header.includes('pergunta') && header.includes('resposta')) ? 1 : 0

      const conhecimentosParaInserir: any[] = []

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Parse CSV (tratando vírgulas dentro de aspas)
        const values: string[] = []
        let currentValue = ''
        let insideQuotes = false

        for (let j = 0; j < line.length; j++) {
          const char = line[j]
          if (char === '"') {
            insideQuotes = !insideQuotes
          } else if (char === ',' && !insideQuotes) {
            values.push(currentValue.trim())
            currentValue = ''
          } else {
            currentValue += char
          }
        }
        values.push(currentValue.trim())

        const pergunta = values[0]?.replace(/^"|"$/g, '') || ''
        const resposta = values[1]?.replace(/^"|"$/g, '') || ''
        const categoria = values[2]?.replace(/^"|"$/g, '') || ''
        const tags = values[3]?.replace(/^"|"$/g, '').split(',').map((t: string) => t.trim()).filter(Boolean) || []

        if (pergunta && resposta) {
          conhecimentosParaInserir.push({
            faculdade_id: faculdadeSelecionada.id,
            pergunta: pergunta.trim(),
            resposta: resposta.trim(),
            categoria: categoria.trim() || null,
            tags: tags.length > 0 ? tags : null,
            ativo: true
          })
        }
      }

      if (conhecimentosParaInserir.length === 0) {
        alert('Nenhum conhecimento válido encontrado no arquivo CSV.')
        return
      }

      const { error } = await supabase
        .from('base_conhecimento')
        .insert(conhecimentosParaInserir)

      if (error) throw error

      alert(`${conhecimentosParaInserir.length} conhecimento(s) importado(s) com sucesso!`)
      setUploadModalAberto(false)
      setArquivoSelecionado(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await fetchConhecimentos()
    } catch (error: any) {
      console.error('Erro ao importar CSV:', error)
      alert('Erro ao importar CSV: ' + error.message)
    }
  }

  const handleExportCSV = () => {
    if (conhecimentosFiltrados.length === 0) {
      alert('Nenhum conhecimento para exportar.')
      return
    }

    const headers = ['Pergunta', 'Resposta', 'Categoria', 'Tags', 'Ativo']
    const rows = conhecimentosFiltrados.map(k => [
      `"${k.pergunta.replace(/"/g, '""')}"`,
      `"${k.resposta.replace(/"/g, '""')}"`,
      `"${k.categoria || ''}"`,
      `"${(k.tags || []).join(', ')}"`,
      k.ativo ? 'Sim' : 'Não'
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `base_conhecimentos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Conhecimento"
          subtitle="Gerencie perguntas e respostas"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    )
  }

  if (!faculdadeSelecionada) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Header
          title="Conhecimento"
          subtitle="Gerencie perguntas e respostas"
        />
        <div className="p-8">
          <Card>
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma faculdade selecionada
              </h3>
              <p className="text-gray-600">
                Por favor, selecione uma faculdade no menu superior para gerenciar a base de conhecimentos.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Header
        title="Conhecimento"
        subtitle={`Gerencie perguntas e respostas - ${faculdadeSelecionada.nome}`}
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
                  placeholder="Buscar por pergunta, resposta, categoria ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => setUploadModalAberto(true)}
                  className="flex-1 md:flex-none"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar CSV
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportCSV}
                  className="flex-1 md:flex-none"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={handleNovoConhecimento} className="flex-1 md:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Conhecimento
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Categoria
                </label>
                <select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent !text-black !bg-white"
                >
                  <option value="">Todas as categorias</option>
                  {categoriasUnicas.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Conhecimentos */}
        {conhecimentosFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || categoriaFilter 
                  ? 'Nenhum conhecimento encontrado' 
                  : `Nenhum conhecimento cadastrado para ${faculdadeSelecionada.nome}`}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || categoriaFilter
                  ? 'Tente ajustar sua busca ou filtros'
                  : 'Comece criando seu primeiro conhecimento ou importe um arquivo CSV'}
              </p>
              {!searchTerm && !categoriaFilter && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setUploadModalAberto(true)} variant="secondary">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </Button>
                  <Button onClick={handleNovoConhecimento}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Conhecimento
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conhecimentosFiltrados.map((conhecimento) => (
              <Card key={conhecimento.id} className="hover:shadow-lg transition-shadow flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {conhecimento.pergunta}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {conhecimento.categoria && (
                          <Badge variant="info">{conhecimento.categoria}</Badge>
                        )}
                        <Badge variant={conhecimento.ativo ? 'success' : 'danger'}>
                          {conhecimento.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {conhecimento.resposta}
                  </p>

                  {conhecimento.tags && conhecimento.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {conhecimento.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span>👁️ {conhecimento.visualizacoes}</span>
                    <span>👍 {conhecimento.util}</span>
                    <span>👎 {conhecimento.nao_util}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200 mt-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditarConhecimento(conhecimento)}
                    className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200 !border !border-gray-300"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleExcluirConhecimento(conhecimento.id)}
                    className="!bg-red-50 !text-red-600 hover:!bg-red-100 !border !border-red-300 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-black">
                {modoEdicao ? 'Editar Conhecimento' : 'Novo Conhecimento'}
              </h2>
              <Button
                variant="secondary"
                onClick={() => setModalAberto(false)}
                className="!bg-gray-100 !text-gray-800 hover:!bg-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pergunta <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.pergunta}
                  onChange={(e) => setFormData({ ...formData, pergunta: e.target.value })}
                  placeholder="Digite a pergunta..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none !text-black !bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resposta <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.resposta}
                  onChange={(e) => setFormData({ ...formData, resposta: e.target.value })}
                  placeholder="Digite a resposta..."
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none !text-black !bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <Input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Matrículas, Financeiro, Acadêmico..."
                  className="!bg-white !text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (separadas por vírgula)
                </label>
                <Input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Ex: matricula, financeiro, desconto"
                  className="!bg-white !text-black"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Ativo
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200 !border !border-gray-300"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSalvarConhecimento} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload */}
      {uploadModalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-black">Importar CSV</h2>
              <Button
                variant="secondary"
                onClick={() => {
                  setUploadModalAberto(false)
                  setArquivoSelecionado(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="!bg-gray-100 !text-gray-800 hover:!bg-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar arquivo CSV
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent !text-black !bg-white"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Formato esperado: Pergunta, Resposta, Categoria (opcional), Tags (opcional)
                </p>
              </div>

              {arquivoSelecionado && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Arquivo selecionado: <strong>{arquivoSelecionado.name}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setUploadModalAberto(false)
                    setArquivoSelecionado(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="flex-1 !bg-gray-100 !text-gray-900 hover:!bg-gray-200 !border !border-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUploadCSV}
                  disabled={!arquivoSelecionado}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

