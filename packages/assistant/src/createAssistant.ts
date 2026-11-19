import { createApp } from 'vue'
import TinyRobotAssistant from './Assistant.vue'
import type { AssistantExposed, AssistantInstance, CreateAssistantOptions } from './types'

function resolveMountTarget(mount: string | Element): Element {
  if (typeof mount !== 'string') return mount

  const target = document.querySelector(mount)
  if (!target) throw new Error(`TinyRobotAssistant mount target was not found: ${mount}`)
  return target
}

/** Mounts the Vue assistant into an existing application-owned element. */
export function createAssistant(options: CreateAssistantOptions): AssistantInstance {
  if (typeof document === 'undefined') {
    throw new Error('createAssistant must be called in a browser environment')
  }

  const target = resolveMountTarget(options.mount)
  const host = document.createElement('div')
  host.className = 'tr-assistant-host'
  target.append(host)

  const componentOptions = { ...options } as Record<string, unknown>
  delete componentOptions.mount
  const app = createApp(TinyRobotAssistant, componentOptions)
  const component = app.mount(host) as unknown as AssistantExposed
  let destroyed = false

  return {
    ...component,
    destroy: () => {
      if (destroyed) return
      destroyed = true
      component.close()
      app.unmount()
      host.remove()
    },
  }
}
