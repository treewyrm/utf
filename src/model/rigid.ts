import Directory from '../directory.js'
import { getResource, type Hashable } from '../hash.js'
import { readMultiLevel, writeMultiLevel, type MultiLevel } from '../vmesh/multilevel.js'
import { readVMeshPart, writeVMeshPart, type VMeshPart } from '../vmesh/part.js'
import { readHardpoints, writeHardpoints, type Hardpoint } from './hardpoint.js'

export interface Rigid {
  type: 'rigid'
  hardpoints: Hardpoint[]
  part?: MultiLevel | VMeshPart
}

export const read = (parent: Directory): Rigid => {
  const hardpoints = [...readHardpoints(parent)]
  const part = readMultiLevel(parent) ?? readVMeshPart(parent)

  return { type: 'rigid', hardpoints, part }
}

export const write = ({ part, hardpoints }: Rigid): Directory => {
  const directory = new Directory()

  switch (part?.type) {
    case 'vmeshpart':
      directory.children.push(writeVMeshPart(part))
      break
    case 'multilevel':
      directory.children.push(writeMultiLevel(part))
      break
  }

  if (hardpoints.length) directory.children.push(writeHardpoints(hardpoints))

  return directory
}

export const getHardpoint = (object: Rigid, name: Hashable): Hardpoint | undefined =>
  getResource(object.hardpoints, ({ name }) => name, name)
