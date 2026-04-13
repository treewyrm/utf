import BufferView from '../utility/bufferview.js'
import Vector3 from '../math/vector3.js'

export interface Point extends Vector3 {
  id: number
}

export const readPoint = (view: BufferView): Point => ({
  id: view.readInt32(),
  x: view.readFloat32(),
  y: view.readFloat32(),
  z: view.readFloat32(),
})

export function writePoint(view: BufferView, { id, x, y, z }: Point): void {
  view.writeInt32(id)
  view.writeFloat32(x)
  view.writeFloat32(y)
  view.writeFloat32(z)
}
