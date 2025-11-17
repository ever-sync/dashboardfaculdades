'use client'

import { Header } from '@/components/dashboard/Header'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  GraduationCap, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Download
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Curso } from '@/types/supabase'
import { formatCurrency } from '@/lib/utils'

export default function CursosPage() {
  const { faculdadeSelecionada } = useFaculdade()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchCursos = useCallback(async () => {
    if (!faculdadeSelecionada) {
      setCursos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

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

  useEffect(() => {
    fetchCursos()
  }, [fetchCursos])

  const cursosFiltrados = cursos.filter(curso => {
    const matchSearch = curso.curso.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       curso.modalidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       curso.duracao.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

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
              <div className="flex gap-2">
                <Button variant="secondary" className="w-full md:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={() => {}} className="w-full md:w-auto">
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
                <Button onClick={() => {}}>
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
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Curso</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Qtd. Parcelas</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Modalidade</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Duração</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Valor c/ Desconto</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Desconto %</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Prática</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Laboratório</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Estágio</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">TCC</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cursosFiltrados.map((curso) => (
                    <tr key={curso.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{curso.curso}</div>
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
                      <td className="py-3 px-4 text-center">
                        {curso.pratica ? (
                          <Badge variant="success">Sim</Badge>
                        ) : (
                          <span className="text-gray-400">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {curso.laboratorio ? (
                          <Badge variant="success">Sim</Badge>
                        ) : (
                          <span className="text-gray-400">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {curso.estagio ? (
                          <Badge variant="success">Sim</Badge>
                        ) : (
                          <span className="text-gray-400">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {curso.tcc ? (
                          <Badge variant="success">Sim</Badge>
                        ) : (
                          <span className="text-gray-400">Não</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {}}
                            className="p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {}}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </div>
  )
}

