/**
 * 颜色提取工具 - 从图片中提取主色调
 * 用于实现动态应援色（Theme-Syncing）
 */

export interface RGB {
  r: number
  g: number
  b: number
}

/**
 * 从图片URL提取主色调
 */
export async function extractDominantColor(imageUrl: string): Promise<RGB> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'))
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // 使用简化版 ColorThief 算法
        const colorMap = new Map<string, number>()
        const step = 5 // 采样步长，提高性能

        for (let i = 0; i < data.length; i += step * 4) {
          const r = data[i] ?? 0
          const g = data[i + 1] ?? 0
          const b = data[i + 2] ?? 0
          const a = data[i + 3] ?? 0

          // 跳过透明和过于暗/亮的像素
          if (a < 128) continue
          if (r + g + b < 30 || r + g + b > 750) continue

          // 量化颜色到32级
          const quantizedR = Math.floor(r / 8) * 8
          const quantizedG = Math.floor(g / 8) * 8
          const quantizedB = Math.floor(b / 8) * 8
          const key = `${quantizedR},${quantizedG},${quantizedB}`

          colorMap.set(key, (colorMap.get(key) || 0) + 1)
        }

        // 找到出现频率最高的颜色
        let maxCount = 0
        let dominantColor = { r: 57, g: 197, b: 187 } // 默认 primary 色

        colorMap.forEach((count, key) => {
          if (count > maxCount) {
            maxCount = count
            const parts = key.split(',').map((v) => Number(v))
            const r = parts[0] ?? 0
            const g = parts[1] ?? 0
            const b = parts[2] ?? 0
            dominantColor = { r, g, b }
          }
        })

        resolve(dominantColor)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = imageUrl
  })
}

/**
 * RGB 转 HSL
 */
export function rgbToHsl(rgb: RGB): { h: number; s: number; l: number } {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

/**
 * 生成渐变背景CSS - 毛玻璃渐变效果
 * 80% 极深色，20% 从顶部透下来的流动色彩
 */
export function generateGradient(rgb: RGB, intensity: number = 0.2): string {
  const { h, s, l } = rgbToHsl(rgb)
  // 极深色背景（80%）
  const darkL = 5
  // 流动色彩（20%），从顶部透下来
  const flowL = Math.max(15, Math.min(25, l * intensity))

  // 创建毛玻璃渐变：顶部有轻微色彩，底部极深
  return `linear-gradient(180deg, 
    hsla(${h}, ${Math.min(60, s * 0.4)}%, ${flowL}%, 0.3) 0%, 
    hsla(${(h + 20) % 360}, ${Math.min(50, s * 0.3)}%, ${flowL * 0.8}%, 0.2) 15%,
    hsla(${(h + 40) % 360}, ${Math.min(40, s * 0.2)}%, ${flowL * 0.6}%, 0.1) 30%,
    hsl(${h}, ${s * 0.1}%, ${darkL}%) 50%,
    hsl(${(h + 60) % 360}, ${s * 0.05}%, ${darkL}%) 100%)`
}
