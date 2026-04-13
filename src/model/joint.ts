import BufferView from '#/utility/bufferview.js'
import Vector3 from '#/math/vector3.js'
import Matrix3 from '#/math/matrix3.js'

/** Fixed joint. Cannot be animated. */
interface Fixed {
  type: 'fixed'
  position: Vector3
  rotation: Matrix3
}

/** Revolute joint. Fixed axis rotation constraint. Animation controls angle between min/max. */
interface Revolute {
  type: 'revolute'
  position: Vector3
  offset: Vector3
  rotation: Matrix3
  axis: Vector3
  min: number
  max: number
}

/** Prismatic joint. Fixed axis movement constraint. Animation controls offset between min/max. */
interface Prismatic {
  type: 'prismatic'
  position: Vector3
  offset: Vector3
  rotation: Matrix3
  axis: Vector3
  min: number
  max: number
}

/** Cylinder joint. Fixed axis rotation and movement constraint. Unknown animation keyframe structure. */
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

/** Sphere/ball joint. Rotation constraint. Animation controls rotation by quat. */
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

/** Loose joint. Unconstrainted. Animation controls free motion by vector3 + quat/matrix3. */
interface Loose {
  type: 'loose'
  position: Vector3
  rotation: Matrix3
}

/** Compound object child to parent connection joint. */
export type Joint = Fixed | Revolute | Prismatic | Cylinder | Sphere | Loose

export const readFixed = (view: BufferView): Fixed => ({
  type: 'fixed',
  position: Vector3.read(view),
  rotation: Matrix3.read(view),
})

export const writeFixed = ({ position, rotation }: Fixed): BufferView =>
  BufferView.join(Vector3.write(position), Matrix3.write(rotation))

export const readRevolute = (view: BufferView): Revolute => ({
  type: 'revolute',
  position: Vector3.read(view),
  offset: Vector3.read(view),
  rotation: Matrix3.read(view),
  axis: Vector3.read(view),
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
    Vector3.write(position),
    Vector3.write(offset),
    Matrix3.write(rotation),
    Vector3.write(axis),
    BufferView.allocate(Float32Array.BYTES_PER_ELEMENT * 2)
      .writeFloat32(min)
      .writeFloat32(max),
  )

export const readPrismatic = (view: BufferView): Prismatic => ({
  type: 'prismatic',
  position: Vector3.read(view),
  offset: Vector3.read(view),
  rotation: Matrix3.read(view),
  axis: Vector3.read(view),
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
    Vector3.write(position),
    Vector3.write(offset),
    Matrix3.write(rotation),
    Vector3.write(axis),
    BufferView.allocate(Float32Array.BYTES_PER_ELEMENT * 2)
      .writeFloat32(min)
      .writeFloat32(max),
  )

export const readSphere = (view: BufferView): Sphere => ({
  type: 'sphere',
  position: Vector3.read(view),
  offset: Vector3.read(view),
  rotation: Matrix3.read(view),
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
    Vector3.write(position),
    Vector3.write(offset),
    Matrix3.write(rotation),
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
  position: Vector3.read(view),
  rotation: Matrix3.read(view),
})

export const writeLoose = ({ position, rotation }: Loose): BufferView =>
  BufferView.join(Vector3.write(position), Matrix3.write(rotation))
