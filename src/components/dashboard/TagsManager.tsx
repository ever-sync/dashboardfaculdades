'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Plus, Edit2, Loader2 } from 'lucide-react'

interface Tag {
  id: string
  nome: string
  cor: string
  setor?: string
}

interface TagsManagerProps {
  tagsAtuais: string[]
  conversaId: string
  faculdadeId: string
  setor?: string
  onTagsChanged?: (novasTags: string[]) => void
}

// Tags educacionais pré-definidas
const TAGS_PREDEFINIDAS: Tag[] = [
  { id: 'matricula', nome: 'Interesse em Matrícula', cor: 'emerald', setor: 'Vendas' },
  { id: 'duvida-curso', nome: 'Dúvida sobre Curso', cor: 'blue', setor: 'Vendas' },
  { id: 'financeiro', nome: 'Financeiro', cor: 'yellow', setor: 'Financeiro' },
  { id: 'vestibular', nome: 'Vestibular', cor: 'purple', setor: 'Vendas' },
  { id: 'ead', nome: 'EAD', cor: 'cyan', setor: 'Vendas' },
  { id: 'presencial', nome: 'Presencial', cor: 'indigo', setor: 'Vendas' },
  { id: 'bolsa', nome: 'Bolsa de Estudos', cor: 'orange', setor: 'Financeiro' },
  { id: 'urgente', nome: 'Urgente', cor: 'red', setor: 'Atendimento' },
  { id: 'retorno', nome: 'Retorno', cor: 'gray', setor: 'Atendimento' },
  { id: 'primeira-vez', nome: 'Primeira Vez', cor: 'green', setor: 'Atendimento' },
]

const CORES_DISPONIVEIS = [
  { id: 'emerald', nome: 'Verde', classe: 'bg-emerald-500 text-white' },
  { id: 'blue', nome: 'Azul', classe: 'bg-blue-500 text-white' },
  { id: 'yellow', nome: 'Amarelo', classe: 'bg-yellow-500 text-white' },
  { id: 'purple', nome: 'Roxo', classe: 'bg-purple-500 text-white' },
  { id: 'cyan', nome: 'Ciano', classe: 'bg-cyan-500 text-white' },
  { id: 'indigo', nome: 'Índigo', classe: 'bg-indigo-500 text-white' },
  { id: 'orange', nome: 'Laranja', classe: 'bg-orange-500 text-white' },
  { id: 'red', nome: 'Vermelho', classe: 'bg-red-500 text-white' },
  { id: 'gray', nome: 'Cinza', classe: 'bg-gray-500 text-white' },
  { id: 'green', nome: 'Verde Escuro', classe: 'bg-green-600 text-white' },
  { id: 'pink', nome: 'Rosa', classe: 'bg-pink-500 text-white' },
  { id: 'teal', nome: 'Verde Água', classe: 'bg-teal-500 text-white' },
]

export function TagsManager({
  tagsAtuais = [],
  conversaId,
  faculdadeId,
  setor,
  onTagsChanged,
}: TagsManagerProps) {
  const [tags, setTags] = useState<string[]>(tagsAtuais)
  const [mostrarAdicionar, setMostrarAdicionar] = useState(false)
  const [novaTagNome, setNovaTagNome] = useState('')
  const [novaTagCor, setNovaTagCor] = useState('emerald')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setTags(tagsAtuais)
  }, [tagsAtuais])

  // Filtrar tags pré-definidas por setor se fornecido
  const tagsDisponiveis = setor
    ? TAGS_PREDEFINIDAS.filter(tag => !tag.setor || tag.setor === setor || setor === 'Atendimento')
    : TAGS_PREDEFINIDAS

  const getTagPredefinida = (tagId: string): Tag | undefined => {
    return TAGS_PREDEFINIDAS.find(t => t.id === tagId)
  }

  const getCorTag = (tagId: string): string => {
    const tagPredefinida = getTagPredefinida(tagId)
    if (tagPredefinida) {
      const cor = CORES_DISPONIVEIS.find(c => c.id === tagPredefinida.cor)
      return cor?.classe || 'bg-gray-500 text-white'
    }
    // Para tags customizadas, usar cor salva ou padrão
    const cor = CORES_DISPONIVEIS.find(c => c.id === novaTagCor)
    return cor?.classe || 'bg-gray-500 text-white'
  }

  const handleAdicionarTag = async (tagId: string) => {
    if (tags.includes(tagId)) return

    setLoading(true)
    setErro(null)

    try {
      const novasTags = [...tags, tagId]
      await atualizarTags(novasTags)
      setTags(novasTags)
      onTagsChanged?.(novasTags)
    } catch (error: any) {
      console.error('Erro ao adicionar tag:', error)
      setErro(error.message || 'Erro ao adicionar tag')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoverTag = async (tagId: string) => {
    setLoading(true)
    setErro(null)

    try {
      const novasTags = tags.filter(t => t !== tagId)
      await atualizarTags(novasTags)
      setTags(novasTags)
      onTagsChanged?.(novasTags)
    } catch (error: any) {
      console.error('Erro ao remover tag:', error)
      setErro(error.message || 'Erro ao remover tag')
    } finally {
      setLoading(false)
    }
  }

  const handleAdicionarTagCustomizada = async () => {
    if (!novaTagNome.trim()) {
      setErro('Digite um nome para a tag')
      return
    }

    if (tags.includes(novaTagNome)) {
      setErro('Esta tag já existe')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const novasTags = [...tags, novaTagNome]
      await atualizarTags(novasTags)
      setTags(novasTags)
      onTagsChanged?.(novasTags)
      setNovaTagNome('')
      setMostrarAdicionar(false)
    } catch (error: any) {
      console.error('Erro ao adicionar tag customizada:', error)
      setErro(error.message || 'Erro ao adicionar tag')
    } finally {
      setLoading(false)
    }
  }

  const atualizarTags = async (novasTags: string[]) => {
    const response = await fetch('/api/conversas/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversa_id: conversaId,
        tags: novasTags,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erro ao atualizar tags')
    }
  }

  return (
    <div className="space-y-3">
      {/* Tags Atuais */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tagId) => {
            const tagPredefinida = getTagPredefinida(tagId)
            const nomeTag = tagPredefinida?.nome || tagId
            const corClasse = getCorTag(tagId)

            return (
              <Badge
                key={tagId}
                variant="info"
                className={`${corClasse} flex items-center gap-1`}
              >
                <span>{nomeTag}</span>
                <button
                  onClick={() => handleRemoverTag(tagId)}
                  disabled={loading}
                  className="hover:opacity-75 transition-opacity"
                  title="Remover tag"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Tags Pré-definidas Disponíveis */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Tags Pré-definidas
        </label>
        <div className="flex flex-wrap gap-2">
          {tagsDisponiveis
            .filter(tag => !tags.includes(tag.id))
            .map((tag) => {
              const cor = CORES_DISPONIVEIS.find(c => c.id === tag.cor)
              const corClasse = cor?.classe || 'bg-gray-500 text-white'

              return (
                <button
                  key={tag.id}
                  onClick={() => handleAdicionarTag(tag.id)}
                  disabled={loading}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${corClasse}`}
                  title={tag.nome}
                >
                  {tag.nome}
                </button>
              )
            })}
        </div>
      </div>

      {/* Adicionar Tag Customizada */}
      {!mostrarAdicionar ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMostrarAdicionar(true)}
          className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Tag Customizada</span>
        </Button>
      ) : (
        <div className="space-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Nome da tag..."
              value={novaTagNome}
              onChange={(e) => setNovaTagNome(e.target.value)}
              className="flex-1 !bg-white !text-black"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdicionarTagCustomizada()
                }
                if (e.key === 'Escape') {
                  setMostrarAdicionar(false)
                  setNovaTagNome('')
                }
              }}
            />
            <select
              value={novaTagCor}
              onChange={(e) => setNovaTagCor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent !bg-white !text-black"
              disabled={loading}
            >
              {CORES_DISPONIVEIS.map((cor) => (
                <option key={cor.id} value={cor.id}>
                  {cor.nome}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAdicionarTagCustomizada}
              disabled={loading || !novaTagNome.trim()}
              className="!bg-gray-900 hover:!bg-gray-800"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMostrarAdicionar(false)
                setNovaTagNome('')
              }}
              disabled={loading}
              className="!bg-gray-100 hover:!bg-gray-200 !text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {erro}
        </div>
      )}
    </div>
  )
}

