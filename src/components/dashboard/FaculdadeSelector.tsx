'use client'

import { useFaculdade } from '@/contexts/FaculdadeContext'
import { Building2, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function FaculdadeSelector() {
  const { faculdadeSelecionada, faculdades, setFaculdadeSelecionada } = useFaculdade()
  const [open, setOpen] = useState(false)
  if (!faculdadeSelecionada) return null
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 max-w-full transition-colors">
        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium text-black dark:text-white truncate">{faculdadeSelecionada.nome}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Plano {faculdadeSelecionada.plano}</span>
        </div>
        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 z-20 min-w-[280px] max-w-sm">
          {faculdades.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFaculdadeSelecionada(f)
                setOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                f.id === faculdadeSelecionada.id ? 'bg-gray-100 dark:bg-gray-900' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-black dark:text-white truncate">{f.nome}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{f.plano} • {f.status}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}