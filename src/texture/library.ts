import BufferView from '#/utility/bufferview.js'
import type Directory from '#/directory.js'
import { Compression, readDirectDrawSurface } from './dds.js'
import { readTargaImage } from './targa.js'
import { readAnimatedTexture, type AnimatedTexture } from './animation.js'

export enum TextureType {
  NONE,

  /** Uncompressed 24bpp image (gl.RGB, gl.UNSIGNED_BYTE). */
  RGB24_888,

  /** Uncompressed 32bpp image with 8-bit transparency (gl.RGBA, gl.UNSIGNED_BYTE). */
  RGBA32_8888,

  /** Uncompressed 16bpp image (gl.RGB, gl.UNSIGNED_SHORT_5_6_5). */
  RGB16_565,

  /** Uncompressed 16bpp image with 4-bit transparency (gl.RGBA, gl.UNSIGNED_SHORT_4_4_4_4). */
  RGBA16_4444,

  /** Uncompressed 16bpp image with 1-bit transparency (gl.RGBA, gl.UNSIGNED_SHORT_5_5_5_1). */
  RGBA16_5551,

  /** DXT1 compressed image (s3tc.COMPRESSED_RGB_S3TC_DXT1_EXT). */
  DXT1,

  /** DXT1a compressed image (s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT). */
  DXT1A,

  /** DXT3 compressed image (s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT). */
  DXT3,

  /** DXT5 compressed image (s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT). */
  DXT5,
}

export interface Texture {
  /** Texture type specifying layout of data buffers.  */
  type: TextureType

  /** Texture base width. */
  width: number

  /** Texture base height. */
  height: number

  /** Texture uses transparency. */
  alpha?: boolean

  /** Flip vertically. */
  flip?: boolean

  /** Texture mipmap buffers. */
  levels: Uint8Array[]
}

// export type TextureLibrary = { name: string; value: Texture | AnimatedTexture }[]

/**
 * Reads texture as sequence of uncompressed Targa images.
 * @param parent Texture directory
 * @returns
 */
export function readMIP(parent: Directory): Texture | undefined {
  let width: number | undefined
  let height: number | undefined
  let depth: number | undefined
  let type = TextureType.NONE

  const levels: Uint8Array[] = []

  // TODO: Check targa image dimensions.
  // TODO: Check targa mipmap dimensions being half the previous.

  for (let level = 0; ; level++) {
    const mipmap = parent.getFile(`MIP${level}`)
    if (!mipmap) break

    const image = readTargaImage(BufferView.from(mipmap.data))

    width ??= image.width
    height ??= image.height
    depth ??= image.depth

    if (depth !== image.depth) throw new RangeError(`Invalid bit depth on level ${level}`)

    levels[level] = image.bitmap
  }

  if (!width || !height || !depth) return

  // Set type according to bit depth.
  // Note: depth === 16 should not occur as readTarga is expected to expand 16-bit images to 24.
  if (depth === 16) type = TextureType.RGBA16_5551
  else if (depth === 24) type = TextureType.RGB24_888
  else if (depth === 32) type = TextureType.RGBA32_8888
  else throw new RangeError(`Invalid targa mipmap bit depth: ${depth}`)

  return { width, height, type, levels }
}

const getTypeByMask = (r: number, g: number, b: number, a: number): TextureType => {
  switch (true) {
    case r === 0xf800 && g === 0x7e0 && b === 0x1f && a === 0:
      return TextureType.RGB16_565
    case r === 0xf00 && g === 0xf0 && b === 0xf && a === 0xf000:
      return TextureType.RGBA16_4444
    case r === 0x7c00 && g === 0x3e0 && b === 0x1f && a === 0x8000:
      return TextureType.RGBA16_5551
    case r === 0xff0000 && g === 0xff00 && b === 0xff && a === 0:
      return TextureType.RGB24_888
    case r === 0xff0000 && g === 0xff00 && b === 0xff && a === 0xff000000:
      return TextureType.RGBA32_8888
    default:
      throw new RangeError('Unsupported DirectDrawSurface color mask')
  }
}

/**
 * Reads texture as mipmaps (uncompressed or DXTn) stored in DirectDrawSurface.
 * @param parent
 * @returns
 */
export function readMIPS(parent: Directory): Texture | undefined {
  const file = parent.getFile('MIPS')
  if (!file) return

  const { width, height, mask, compression, mipmaps } = readDirectDrawSurface(
    BufferView.from(file.data),
  )

  let type = TextureType.NONE
  let alpha = false

  switch (compression) {
    case Compression.DXT1:
      type = TextureType.DXT1
      alpha = true
      break
    case Compression.DXT3:
      type = TextureType.DXT3
      alpha = true
      break
    case Compression.DXT5:
      type = TextureType.DXT5
      alpha = true
      break
    case Compression.NONE:
      type = getTypeByMask(mask.r, mask.g, mask.b, mask.a)
      break
    default:
      throw new RangeError(`Unsupported compression method in texture`)
  }

  return { width, height, type, levels: mipmaps, alpha, flip: true }
}

export function readTexture(parent: Directory): Texture | AnimatedTexture | undefined {
  let texture: Texture | AnimatedTexture | undefined

  // Try to read animated texture.
  texture = readAnimatedTexture(parent)
  if (texture) return texture

  // TODO: Try to read texture as DirectDrawSurface cubemap.

  // Try to read texture as DirectDrawSurface.
  texture = readMIPS(parent)
  if (texture) return texture

  // Try to read texture as sequence of uncompressed Targa images.
  texture = readMIP(parent)
  return texture
}

/**
 * Reads textures from directory.
 * Looks for `Texture library` directory within.
 * @param parent Parent directory (typically root)
 * @returns
 */
export function* readTextures(parent: Directory): Generator<[string, Texture | AnimatedTexture]> {
  const library = parent.getDirectory('Texture library')
  if (!library) return

  const errors: unknown[] = []

  let name: string | undefined

  for (const child of library.directories) {
    try {
      name = child.name
      console.log(`Reading texture: ${name}`)

      const texture = readTexture(child)
      if (texture) yield [name, texture]
    } catch (error) {
      errors.push({ name, error })
    }
  }

  if (errors.length) throw new AggregateError(errors, 'Error reading one or more textures')
}
