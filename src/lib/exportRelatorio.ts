import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ============================================================================
// PDF Export Functions
// ============================================================================

interface ExportColumn {
  header: string
  dataKey: string
}

interface PDFExportOptions {
  title: string
  subtitle?: string
  filename: string
  columns: ExportColumn[]
  data: any[]
  faculdadeName?: string
}

export function exportToPDF(options: PDFExportOptions) {
  const { title, subtitle, filename, columns, data, faculdadeName } = options

  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header
  doc.setFontSize(18)
  doc.setTextColor(40, 40, 40)
  doc.text(title, pageWidth / 2, 20, { align: 'center' })

  if (subtitle) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, pageWidth / 2, 28, { align: 'center' })
  }

  if (faculdadeName) {
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(`Faculdade: ${faculdadeName}`, 14, 35)
  }

  // Date
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Gerado em: ${dateStr}`, pageWidth - 14, 35, { align: 'right' })

  // Table
  autoTable(doc, {
    startY: faculdadeName ? 40 : 35,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] ?? '')),
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { top: 40, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      const pageNumber = `Página ${doc.getCurrentPageInfo().pageNumber}`
      doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' })
    }
  })

  // Save
  doc.save(`${filename}.pdf`)
}

// ============================================================================
// Excel Export Functions
// ============================================================================

interface ExcelExportOptions {
  filename: string
  sheetName: string
  data: any[]
  columns?: ExportColumn[]
}

export function exportToExcel(options: ExcelExportOptions) {
  const { filename, sheetName, data, columns } = options

  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  // Transform data if columns are specified
  let exportData = data
  if (columns) {
    exportData = data.map(row => {
      const newRow: any = {}
      columns.forEach(col => {
        newRow[col.header] = row[col.dataKey] ?? ''
      })
      return newRow
    })
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)

  // Auto-size columns
  const colWidths = Object.keys(exportData[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...exportData.map(row => String(row[key] || '').length)
    )
    return { wch: Math.min(maxLength + 2, 50) }
  })
  ws['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// Multi-sheet Excel export
interface MultiSheetExcelOptions {
  filename: string
  sheets: Array<{
    name: string
    data: any[]
    columns?: ExportColumn[]
  }>
}

export function exportToExcelMultiSheet(options: MultiSheetExcelOptions) {
  const { filename, sheets } = options

  if (!sheets || sheets.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  const wb = XLSX.utils.book_new()

  sheets.forEach(sheet => {
    if (sheet.data && sheet.data.length > 0) {
      // Transform data if columns are specified
      let exportData = sheet.data
      if (sheet.columns) {
        exportData = sheet.data.map(row => {
          const newRow: any = {}
          sheet.columns!.forEach(col => {
            newRow[col.header] = row[col.dataKey] ?? ''
          })
          return newRow
        })
      }

      const ws = XLSX.utils.json_to_sheet(exportData)

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key] || '').length)
        )
        return { wch: Math.min(maxLength + 2, 50) }
      })
      ws['!cols'] = colWidths

      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    }
  })

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ============================================================================
// CSV Export Functions
// ============================================================================

interface CSVExportOptions {
  filename: string
  data: any[]
  columns?: ExportColumn[]
}

export function exportToCSV(options: CSVExportOptions) {
  const { filename, data, columns } = options

  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  // Determine headers
  let headers: string[]
  let rows: any[]

  if (columns) {
    headers = columns.map(col => col.header)
    rows = data.map(row => columns.map(col => row[col.dataKey] ?? ''))
  } else {
    headers = Object.keys(data[0])
    rows = data.map(row => headers.map(header => row[header] ?? ''))
  }

  // Escape CSV values
  const escapeCsvValue = (value: any): string => {
    const str = String(value ?? '')
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Build CSV content
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(','))
  ].join('\n')

  // Add UTF-8 BOM for proper Excel compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // Download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// ============================================================================
// Specialized Export Functions
// ============================================================================

export interface ConversaExportData {
  data: string
  telefone: string
  nome: string
  status: string
  atendente: string
  tags: string
  mensagens: number
  duracao: string
}

export function exportConversasToPDF(
  data: ConversaExportData[],
  filename: string,
  faculdadeName?: string
) {
  exportToPDF({
    title: 'Relatório de Conversas',
    subtitle: 'Histórico de atendimentos via WhatsApp',
    filename,
    faculdadeName,
    columns: [
      { header: 'Data', dataKey: 'data' },
      { header: 'Telefone', dataKey: 'telefone' },
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Atendente', dataKey: 'atendente' },
      { header: 'Tags', dataKey: 'tags' },
      { header: 'Msgs', dataKey: 'mensagens' },
      { header: 'Duração', dataKey: 'duracao' }
    ],
    data
  })
}

export function exportConversasToExcel(
  data: ConversaExportData[],
  filename: string
) {
  exportToExcel({
    filename,
    sheetName: 'Conversas',
    data,
    columns: [
      { header: 'Data', dataKey: 'data' },
      { header: 'Telefone', dataKey: 'telefone' },
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Atendente', dataKey: 'atendente' },
      { header: 'Tags', dataKey: 'tags' },
      { header: 'Mensagens', dataKey: 'mensagens' },
      { header: 'Duração', dataKey: 'duracao' }
    ]
  })
}

export function exportConversasToCSV(
  data: ConversaExportData[],
  filename: string
) {
  exportToCSV({
    filename,
    data,
    columns: [
      { header: 'Data', dataKey: 'data' },
      { header: 'Telefone', dataKey: 'telefone' },
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Atendente', dataKey: 'atendente' },
      { header: 'Tags', dataKey: 'tags' },
      { header: 'Mensagens', dataKey: 'mensagens' },
      { header: 'Duração', dataKey: 'duracao' }
    ]
  })
}

export interface ProspectExportData {
  data: string
  nome: string
  telefone: string
  email: string
  curso: string
  origem: string
  status: string
  nota: number
}

export function exportProspectsToPDF(
  data: ProspectExportData[],
  filename: string,
  faculdadeName?: string
) {
  exportToPDF({
    title: 'Relatório de Prospects',
    subtitle: 'Leads e candidatos acadêmicos',
    filename,
    faculdadeName,
    columns: [
      { header: 'Data', dataKey: 'data' },
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Telefone', dataKey: 'telefone' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Curso', dataKey: 'curso' },
      { header: 'Origem', dataKey: 'origem' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Nota', dataKey: 'nota' }
    ],
    data
  })
}

export function exportProspectsToExcel(
  data: ProspectExportData[],
  filename: string
) {
  exportToExcel({
    filename,
    sheetName: 'Prospects',
    data,
    columns: [
      { header: 'Data', dataKey: 'data' },
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Telefone', dataKey: 'telefone' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Curso', dataKey: 'curso' },
      { header: 'Origem', dataKey: 'origem' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Nota', dataKey: 'nota' }
    ]
  })
}

export function exportProspectsToCSV(
  data: ProspectExportData[],
  filename: string
) {
  exportToCSV({
    filename,
    data,
    columns: [
      { header: 'Data', dataKey: 'data' },
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Telefone', dataKey: 'telefone' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Curso', dataKey: 'curso' },
      { header: 'Origem', dataKey: 'origem' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Nota', dataKey: 'nota' }
    ]
  })
}

export interface MetricaExportData {
  periodo: string
  matriculas: number
  prospects: number
  conversoes: number
  taxaConversao: string
  receita: string
  ticketMedio: string
}

export function exportMetricasToPDF(
  data: MetricaExportData[],
  filename: string,
  faculdadeName?: string
) {
  exportToPDF({
    title: 'Relatório de Métricas',
    subtitle: 'Indicadores de desempenho',
    filename,
    faculdadeName,
    columns: [
      { header: 'Período', dataKey: 'periodo' },
      { header: 'Matrículas', dataKey: 'matriculas' },
      { header: 'Prospects', dataKey: 'prospects' },
      { header: 'Conversões', dataKey: 'conversoes' },
      { header: 'Taxa Conv.', dataKey: 'taxaConversao' },
      { header: 'Receita', dataKey: 'receita' },
      { header: 'Ticket Médio', dataKey: 'ticketMedio' }
    ],
    data
  })
}

export function exportMetricasToExcel(
  data: MetricaExportData[],
  filename: string
) {
  exportToExcel({
    filename,
    sheetName: 'Métricas',
    data,
    columns: [
      { header: 'Período', dataKey: 'periodo' },
      { header: 'Matrículas', dataKey: 'matriculas' },
      { header: 'Prospects', dataKey: 'prospects' },
      { header: 'Conversões', dataKey: 'conversoes' },
      { header: 'Taxa de Conversão', dataKey: 'taxaConversao' },
      { header: 'Receita', dataKey: 'receita' },
      { header: 'Ticket Médio', dataKey: 'ticketMedio' }
    ]
  })
}

export function exportMetricasToCSV(
  data: MetricaExportData[],
  filename: string
) {
  exportToCSV({
    filename,
    data,
    columns: [
      { header: 'Período', dataKey: 'periodo' },
      { header: 'Matrículas', dataKey: 'matriculas' },
      { header: 'Prospects', dataKey: 'prospects' },
      { header: 'Conversões', dataKey: 'conversoes' },
      { header: 'Taxa de Conversão', dataKey: 'taxaConversao' },
      { header: 'Receita', dataKey: 'receita' },
      { header: 'Ticket Médio', dataKey: 'ticketMedio' }
    ]
  })
}
