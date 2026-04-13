import BufferView from '#/utility/bufferview.js'
import Directory from '#/directory.js'
import File from '#/file.js'
import { type Hashable, getResource } from '#/hash.js'
import Vector3 from '#/math/vector3.js'
import Matrix3 from '#/math/matrix3.js'

interface Base<T extends string> {
  type: T
  name: string
  position: Vector3
  orientation: Matrix3
}

/** Fixed attachment hardpoint. */
interface Fixed extends Base<'fixed'> {}

/** Revolute attachment hardpoint. */
interface Revolute extends Base<'revolute'> {
  axis: Vector3
  min: number
  max: number
}

/** Prismatic attachment hardpoint. */
interface Prismatic extends Base<'prismatic'> {
  axis: Vector3
  min: number
  max: number
}

/** Attachment hardpoint. */
export type Hardpoint = Fixed | Revolute | Prismatic

export const readPosition = (parent: Directory): Vector3 => {
  const file = parent.getFile('position')
  return (file && Vector3.read(BufferView.from(file))) ?? Vector3.copy({})
}

export const writePosition = (position: Vector3): File =>
  new File('Position', Vector3.write(position))

export const readOrientation = (parent: Directory): Matrix3 => {
  const file = parent.getFile('orientation')
  return (file && Matrix3.read(BufferView.from(file))) ?? Matrix3.copy({})
}

export const writeOrientation = (orientation: Matrix3): File =>
  new File('Orientation', Matrix3.write(orientation))

export const readAxis = (parent: Directory): Vector3 => {
  const file = parent.getFile('axis')
  return (file && Vector3.read(BufferView.from(file))) ?? Vector3.copy(Vector3.y)
}

export const writeAxis = (axis: Vector3): File => new File('Axis', Vector3.write(axis))

export const readFixed = (parent: Directory): Fixed => ({
  type: 'fixed',
  name: parent.name,
  position: readPosition(parent),
  orientation: readOrientation(parent),
})

export const writeFixed = ({ name, position, orientation }: Fixed): Directory =>
  new Directory(name, [writePosition(position), writeOrientation(orientation)])

const readSingleFloat = (file?: File) => {
  const [value = 0] = file?.readFloats() ?? []
  return value
}

export const readRevolute = (parent: Directory): Revolute => ({
  type: 'revolute',
  name: parent.name,
  position: readPosition(parent),
  orientation: readOrientation(parent),
  axis: readAxis(parent),
  min: readSingleFloat(parent.getFile('min')),
  max: readSingleFloat(parent.getFile('max')),
})

export const writeRevolute = ({
  name,
  position,
  orientation,
  axis,
  min,
  max,
}: Revolute): Directory => {
  const directory = new Directory(name, [
    writePosition(position),
    writeOrientation(orientation),
    writeAxis(axis),
  ])

  directory.setFile('Min').writeFloats(min)
  directory.setFile('Max').writeFloats(max)

  return directory
}

/**
 * Reads hardpoints from object directory.
 * @param parent Object directory
 * @returns
 */
export function* readHardpoints(parent: Directory): Generator<Hardpoint> {
  const hardpoints = parent.getDirectory('hardpoints')
  if (!hardpoints) return

  for (const directory of hardpoints.directories) {
    switch (directory.name.toLowerCase()) {
      case 'fixed':
        for (const subdirectory of directory.directories) yield readFixed(subdirectory)

        break
      case 'revolute':
        for (const subdirectory of directory.directories) yield readRevolute(subdirectory)

        break
    }
  }
}

export const writeHardpoints = (hardpoints: Iterable<Hardpoint>): Directory => {
  const directory = new Directory('Hardpoints')

  for (const hardpoint of hardpoints) {
    switch (hardpoint.type) {
      case 'fixed':
        directory.setDirectory('Fixed').children.push(writeFixed(hardpoint))
        break
      case 'revolute':
        directory.setDirectory('Revolute').children.push(writeRevolute(hardpoint))
        break
    }
  }

  return directory
}

export const getHardpoint = (hardpoints: Hardpoint[], name: Hashable): Hardpoint | undefined =>
  getResource(hardpoints, ({ name }) => name, name)
