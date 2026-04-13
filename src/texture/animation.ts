import type Directory from '#/directory.js'
import BufferView from '#/utility/bufferview.js'

export interface AnimatedTextureFrame {
  /** Texture image index. */
  index: number

  /** Start point U coordinate. */
  u1: number

  /** Start point V coordinate. */
  v1: number

  /** End point U coordinate. */
  u2: number

  /** End point V coordinate. */
  v2: number
}

export interface AnimatedTexture {
  /** Animation frames (read 'Frame count' to know how many). */
  frames: AnimatedTextureFrame[]

  /** Frame rate per second. */
  rate: number
}

export const readAnimatedTexture = (parent: Directory): AnimatedTexture | undefined => {
  const fps = parent.getFile('FPS')
  const rate = fps ? BufferView.from(fps.data).readFloat32() : 15
  if (!rate) return

  const count = parent.getFile('Frame count')
  const frameCount = count ? BufferView.from(count.data).readInt32() : 0
  if (!frameCount) return

  const file = parent.getFile('Frame rects')
  if (!file) return

  const frames: AnimatedTextureFrame[] = []

  if (file) {
    const view = BufferView.from(file.data)

    for (let i = 0; i < frameCount; i++) {
      frames[i] = {
        index: view.readInt32(),
        u1: view.readFloat32(),
        v1: view.readFloat32(),
        u2: view.readFloat32(),
        v2: view.readFloat32(),
      }
    }
  }

  return { rate, frames }
}