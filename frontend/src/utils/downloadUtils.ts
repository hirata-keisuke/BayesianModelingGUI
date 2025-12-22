/**
 * Base64エンコードされた画像をダウンロード
 */
export function downloadImage(base64Data: string, filename: string) {
  const link = document.createElement('a')
  link.href = `data:image/png;base64,${base64Data}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * オブジェクトをCSVファイルとしてダウンロード
 */
export function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return

  // ヘッダー行を作成
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // 文字列の場合はダブルクォートで囲む
        if (typeof value === 'string') {
          return `"${value}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * サマリー統計量をCSV形式に変換
 */
export function summaryToCSV(summary: Record<string, any>): Record<string, any>[] {
  return Object.entries(summary).map(([param, stats]: [string, any]) => ({
    parameter: param,
    mean: stats.mean,
    sd: stats.sd,
    hdi_lower: stats.hdi_lower,
    hdi_upper: stats.hdi_upper,
    r_hat: stats.r_hat,
    ess_bulk: stats.ess_bulk,
    ess_tail: stats.ess_tail
  }))
}

/**
 * Base64エンコードされたCSVデータをダウンロード
 */
export function downloadBase64CSV(base64Data: string, filename: string) {
  // Base64デコード
  const csvData = atob(base64Data)
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
