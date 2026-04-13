import BufferView from '../utility/bufferview.js'
import { readPart, writePart, type Part } from './part.js'

const SIGNATURE = 0x73726576 // 'vers'
const VERSION = Math.fround(2.0)

export function readSurfaceLibrary(view: BufferView): Part[] {
  const parts: Part[] = []

  while (view.byteRemain) {
    if (view.readUint32() !== SIGNATURE) throw new Error('Invalid SUR header')
    if (view.readFloat32() !== VERSION) throw new RangeError('Invalid SUR version')
    
    parts.push(readPart(view))
  }

  return parts
}

export const writeSurfaceLibrary = (parts: Part[]): BufferView =>
  BufferView.join(
    BufferView.allocate(8).writeUint32(SIGNATURE).writeFloat32(VERSION),
    ...parts.map(writePart),
  )
