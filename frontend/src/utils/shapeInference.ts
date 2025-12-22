/**
 * 配列の形状を推論する関数
 */
export function inferShape(value: any): number[] | null {
  if (!Array.isArray(value)) {
    return null // スカラー
  }

  const shape: number[] = []
  let current: any = value

  while (Array.isArray(current)) {
    shape.push(current.length)
    if (current.length === 0) break
    current = current[0]
  }

  return shape
}

/**
 * パラメータの集合から最大の形状を推論する
 * ブロードキャスト可能な形状を考慮
 */
export function inferShapeFromParameters(parameters: Record<string, any>): number[] | null {
  const shapes: number[][] = []

  for (const value of Object.values(parameters)) {
    // 参照(@で始まる)や空文字列はスキップ
    if (typeof value === 'string' && (value.startsWith('@') || value === '')) {
      continue
    }

    const shape = inferShape(value)
    if (shape && shape.length > 0) {
      shapes.push(shape)
    }
  }

  if (shapes.length === 0) {
    return null // すべてスカラーか未定義
  }

  // 最も次元数が多い形状を返す
  // TODO: より高度なブロードキャスト推論を実装する場合はここを拡張
  return shapes.reduce((maxShape, currentShape) => {
    if (currentShape.length > maxShape.length) {
      return currentShape
    }
    if (currentShape.length === maxShape.length) {
      // 同じ次元の場合、各次元の最大値を取る
      return maxShape.map((dim, i) => Math.max(dim, currentShape[i] || 1))
    }
    return maxShape
  })
}

/**
 * パラメータ値を文字列表現に変換する（表示用）
 */
export function parameterValueToString(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value)
  }
  return String(value)
}
