import Directory from '#/directory.js'
import { readMultiLevel, writeMultiLevel, type MultiLevel } from '#/vmesh/multilevel.js'
import { readVMeshPart, writeVMeshPart, type VMeshPart } from '#/vmesh/part.js'
import { type Camera } from './camera.js'
import { type Model, readModel, writeModel } from './model.js'
import { readHardpoints, writeHardpoints, type Hardpoint } from './hardpoint.js'

export interface Rigid {
  type: 'rigid'
  hardpoints: Hardpoint[]
  part?: MultiLevel | VMeshPart
}

export const readRigid = (parent: Directory): Rigid => {
  const hardpoints = [...readHardpoints(parent)]
  const part = readMultiLevel(parent) ?? readVMeshPart(parent)

  return { type: 'rigid', hardpoints, part }
}

export const writeRigid = ({ part, hardpoints }: Rigid): Directory => {
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

export type RigidModel = Model<Rigid | Camera> | Rigid

export function readPart(directory: Directory) {
  // TODO: Check for camera properties, otherwise read as rigid

  return readRigid(directory)
}

export function writePart(part: Rigid | Camera) {
  switch (part.type) {
    case 'rigid':
      return writeRigid(part)
    case 'camera':
      return new Directory('camera-pl')
  }
}

export function readRigidModel(directory: Directory): RigidModel {
  try {
    return readModel(directory, readPart)
  } catch (cause) {
    return readRigid(directory)
  }
}

export function writeRigidModel(model: RigidModel): Directory {
  switch (model.type) {
    case 'rigid':
      return writeRigid(model)
    case 'compound':
      return writeModel(model, writePart)
  }
}
