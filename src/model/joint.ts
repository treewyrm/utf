import BufferView from '../bufferview.js'
import type { Vector3, Matrix3 } from '../math/index.js'

/** Fixed joint. */
interface Fixed {
  type: 'fixed'
  position: Vector3
  rotation: Matrix3
}

/** Revolute joint. Fixed axis rotation constraint. */
interface Revolute {
  type: 'revolute'
  position: Vector3
  offset: Vector3
  rotation: Matrix3
  axis: Vector3
  min: number
  max: number
}

/** Prismatic joint. Fixed axis movement constraint. */
interface Prismatic {
  type: 'prismatic'
  position: Vector3
  offset: Vector3
  rotation: Matrix3
  axis: Vector3
  min: number
  max: number
}

/** Cylinder joint. Fixed axis rotation and movement constraint. */
interface Cylinder {
  type: 'cylinder'
  position: Vector3
  rotation: Matrix3
  axis: Vector3
  minPris: number
  maxPris: number
  minRev: number
  maxRev: number
}

/** Sphere/ball joint. Rotation constraint. */
interface Sphere {
  type: 'sphere'
  position: Vector3
  offset: Vector3
  rotation: Matrix3
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

/** Loose joint. Unconstrainted. */
interface Loose {
  type: 'loose'
  position: Vector3
  rotation: Matrix3
}

export const readVector3 = (view: BufferView): Vector3 => ({
  x: view.readFloat32(),
  y: view.readFloat32(),
  z: view.readFloat32(),
})

export const writeVector3 = ({ x, y, z }: Vector3): BufferView =>
  BufferView.allocate(Float32Array.BYTES_PER_ELEMENT * 3)
    .writeFloat32(x)
    .writeFloat32(y)
    .writeFloat32(z)

export const readMatrix3 = (view: BufferView): Matrix3 => ({
  x: readVector3(view),
  y: readVector3(view),
  z: readVector3(view),
})

export const writeMatrix3 = ({ x, y, z }: Matrix3): BufferView =>
  BufferView.join(writeVector3(x), writeVector3(y), writeVector3(z))

/** Compound object child to parent connection joint. */
export type Joint = Fixed | Revolute | Prismatic | Cylinder | Sphere | Loose

export const readFixed = (view: BufferView): Fixed => ({
  type: 'fixed',
  position: readVector3(view),
  rotation: readMatrix3(view),
})

export const writeFixed = ({ position, rotation }: Fixed): BufferView =>
  BufferView.join(writeVector3(position), writeMatrix3(rotation))

export const readRevolute = (view: BufferView): Revolute => ({
  type: 'revolute',
  position: readVector3(view),
  offset: readVector3(view),
  rotation: readMatrix3(view),
  axis: readVector3(view),
  min: view.readFloat32(),
  max: view.readFloat32(),
})

export const writeRevolute = ({
  position,
  offset,
  rotation,
  axis,
  min,
  max,
}: Revolute): BufferView =>
  BufferView.join(
    writeVector3(position),
    writeVector3(offset),
    writeMatrix3(rotation),
    writeVector3(axis),
    BufferView.allocate(Float32Array.BYTES_PER_ELEMENT * 2)
      .writeFloat32(min)
      .writeFloat32(max),
  )

export const readPrismatic = (view: BufferView): Prismatic => ({
  type: 'prismatic',
  position: readVector3(view),
  offset: readVector3(view),
  rotation: readMatrix3(view),
  axis: readVector3(view),
  min: view.readFloat32(),
  max: view.readFloat32(),
})

export const writePrismatic = ({
  position,
  offset,
  rotation,
  axis,
  min,
  max,
}: Prismatic): BufferView =>
  BufferView.join(
    writeVector3(position),
    writeVector3(offset),
    writeMatrix3(rotation),
    writeVector3(axis),
    BufferView.allocate(Float32Array.BYTES_PER_ELEMENT * 2)
      .writeFloat32(min)
      .writeFloat32(max),
  )

export const readSphere = (view: BufferView): Sphere => ({
  type: 'sphere',
  position: readVector3(view),
  offset: readVector3(view),
  rotation: readMatrix3(view),
  minX: view.readFloat32(),
  maxX: view.readFloat32(),
  minY: view.readFloat32(),
  maxY: view.readFloat32(),
  minZ: view.readFloat32(),
  maxZ: view.readFloat32(),
})

export const writeSphere = ({
  position,
  offset,
  rotation,
  minX,
  maxX,
  minY,
  maxY,
  minZ,
  maxZ,
}: Sphere): BufferView =>
  BufferView.join(
    writeVector3(position),
    writeVector3(offset),
    writeMatrix3(rotation),
    BufferView.allocate(Float32Array.BYTES_PER_ELEMENT * 6)
      .writeFloat32(minX)
      .writeFloat32(maxX)
      .writeFloat32(minY)
      .writeFloat32(maxY)
      .writeFloat32(minZ)
      .writeFloat32(maxZ),
  )

export const readLoose = (view: BufferView): Loose => ({
  type: 'loose',
  position: readVector3(view),
  rotation: readMatrix3(view),
})

export const writeLoose = ({ position, rotation }: Loose): BufferView =>
  BufferView.join(writeVector3(position), writeMatrix3(rotation))
