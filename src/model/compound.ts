import { getResource, getResourceId, type Hashable } from '../hash.js'
import Directory from '../directory.js'
import { readConstraints, writeConstraints, type Constraint } from './constraint.js'
import { type Hardpoint } from './hardpoint.js'
import { type Joint } from './joint.js'

/** Compound model object for hierarchical multipart models. */
export interface Compound<T> {
  /** Object name. */
  name: string

  /** Object index. */
  index: number

  /** Object fragment filename. */
  filename: string

  /** Object. */
  part: T

  /** Joint connecting to parent object. */
  joint?: Joint

  /** Object children. */
  children: Compound<T>[]
}

/**
 * Lists all objects in compound hierachy.9
 * @param value
 */
export function* getChildren<T>(value: Compound<T>): Generator<Compound<T>> {
  yield value
  for (const child of value.children) yield* getChildren(child)
}

/**
 * Arranges compound objects into hierarchy from constraints.
 * @param objects
 * @param constraints
 */
export const arrange = (objects: Compound<unknown>[], constraints: Constraint[]): void => {
  /** Exclude root from array of children. */
  const [, ...children] = objects

  for (const constraint of constraints) {
    const parent = getResource(objects, ({ name }) => name, constraint.parent)
    const child = getResource(children, ({ name }) => name, constraint.child)

    if (!parent || !child) continue

    child.joint = constraint.joint
    parent.children.push(child)
  }
}

/**
 * Reads compound object from directory.
 * @param parent Input directory
 * @param read Object fragment directory reader
 * @returns Root object
 */
export const readCompound = <T>(parent: Directory, read: (parent: Directory) => T): Compound<T> => {
  const compound = parent.getDirectory('Cmpnd')
  if (!compound) throw new Error('Missing compound directory')

  let objects: Compound<T>[] = []
  let constraints: Constraint[] = []

  for (const directory of compound.directories) {
    let isRoot = false

    switch (directory.name.substring(0, 4).toLowerCase()) {
      case 'root': // Flags object as root
        isRoot = true
      case 'part': // Object
        const [name] = directory.getFile('Object name')?.readStrings() ?? []
        if (!name) throw new Error('Missing compound object name')

        const [index = 0] = directory.getFile('Index')?.readIntegers() ?? []

        const [filename] = directory.getFile('File name')?.readStrings() ?? []
        if (!filename) throw new Error('Missing compound object file name')

        const fragment = parent.getDirectory(filename)
        if (!fragment) throw new Error('Missing object fragment directory')

        const compound: Compound<T> = {
          name,
          index,
          filename,
          part: read(fragment),
          children: [],
        }

        isRoot ? objects.unshift(compound) : objects.push(compound)

        break
      case 'cons': // Constraints
        constraints = [...readConstraints(directory.files)]
        break
    }
  }

  const root = objects.at(0)
  if (!root) throw new Error('Missing root object')

  if (constraints) arrange(objects, constraints)

  return root
}

/**
 * Writes compound object into directory.
 * @param root Root compound object
 * @param write Object fragment directory writer
 * @param parent Output directory
 */
export const writeCompound = <T>(root: Compound<T>, write: (value: T) => Directory): Directory => {
  const parent = new Directory()

  /** Compound directory. */
  const compound = parent.setDirectory('Cmpnd')

  /** Model constraint list. */
  const constraints: Constraint[] = []

  /** Unique object names. */
  const names = new Set<string>()
  const indices: number[] = []

  for (const object of getChildren(root)) {
    const { name, filename, index, part } = object

    if (!name.length) throw new RangeError(`Compound part has empty object name`)
    if (names.has(name)) throw new Error(`Duplicate compound part name: ${name}`)
    if (!Number.isInteger(index)) throw new RangeError(`Non-integer compound part index in ${name}`)

    names.add(name)
    indices.push(index)

    const directory = compound.setDirectory(object === root ? 'Root' : `Part_${name}`)

    directory.setFile('Object name').writeStrings(name)
    directory.setFile('Index').writeIntegers(index)
    directory.setFile('File name').writeStrings(filename)

    for (const { joint, name } of object.children)
      if (joint) constraints.push({ parent: object.name, child: name, joint })

    const fragment = parent.setDirectory(filename)
    fragment.children = write(part).children
  }

  // Write constraints.
  for (const file of writeConstraints(constraints))
    compound.setFile('cons', file.name).append(file.data)

  return parent
}

/**
 * Finds compound object by name.
 * @param root Root compound object
 * @param name Object name
 * @returns Compound object
 */
export const getPart = <T>(root: Compound<T>, name: Hashable): Compound<T> | undefined => {
  const crc = getResourceId(name)

  for (const part of getChildren(root)) if (getResourceId(part.name) === crc) return part
}

/**
 * Finds hardpoint compound model.
 * @param root Root compound object
 * @param name Hardpoint name
 * @returns Hardpoint and parent part
 */
export const getHardpoint = <T extends { hardpoints: Hardpoint[] }>(
  root: Compound<T>,
  name: Hashable,
) => {
  let hardpoint: Hardpoint | undefined

  for (const parent of getChildren(root))
    if ((hardpoint = getResource(parent.part.hardpoints, ({ name }) => name, name)))
      return { hardpoint, parent }
}
