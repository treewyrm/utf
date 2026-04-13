import BufferView from '../utility/bufferview.js'
import type Vector3 from '../math/vector3.js'

/** Extents section (bounding box). */
export interface Extent {
  /** Boundary box minimum. */
  minimum: Vector3

  /** Boundary box maximum. */
  maximum: Vector3
}

export function readExtent(view: BufferView, { minimum, maximum }: Extent): BufferView {
  minimum.x = view.readFloat32()
  maximum.x = view.readFloat32()
  minimum.y = view.readFloat32()
  maximum.y = view.readFloat32()
  minimum.z = view.readFloat32()
  maximum.z = view.readFloat32()
  return view
}

export const writeExtent = ({ minimum, maximum }: Extent): BufferView =>
  BufferView.allocate(Float32Array.BYTES_PER_ELEMENT * 6)
    .writeFloat32(minimum.x)
    .writeFloat32(maximum.x)
    .writeFloat32(minimum.y)
    .writeFloat32(maximum.y)
    .writeFloat32(minimum.z)
    .writeFloat32(maximum.z)
