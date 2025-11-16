// Funções para exportar relatórios

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header]
      return typeof value === 'string' ? `"${value}"` : value
    }).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

export function exportToExcel(data: any[], filename: string) {
  // Para Excel, vamos usar CSV (formato compatível)
  // Em produção, considere usar uma biblioteca como xlsx
  exportToCSV(data, filename)
}

export function exportToPDF(data: any[], title: string, filename: string) {
  // Implementação básica de PDF usando window.print
  // Em produção, considere usar uma biblioteca como jsPDF ou react-pdf
  
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            body { margin: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${Object.values(row).map(val => `<td>${val}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.print()
}

