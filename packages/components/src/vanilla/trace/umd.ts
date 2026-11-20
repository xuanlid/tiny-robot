import { createTrace as create } from './index'
import type { TrajectoryInstance, TrajectoryOptions } from './types'
import { installVanillaStyle } from '../styles/install'

/** UMD entry with reference-counted, document-local automatic styles. */
export function createTrace(options: TrajectoryOptions): TrajectoryInstance {
  const root = options.root ?? (typeof document === 'undefined' ? undefined : document)
  if (!root) throw new Error('Trajectory requires a Document root')
  const release = installVanillaStyle(root)
  let released = false
  let instance: TrajectoryInstance
  try {
    instance = create({ ...options, root })
  } catch (error) {
    release()
    throw error
  }
  const destroy = instance.destroy
  return {
    ...instance,
    destroy: () => {
      if (released) return
      released = true
      try {
        destroy()
      } finally {
        release()
      }
    },
  }
}
