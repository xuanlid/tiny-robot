import { describe, expect, it } from 'vitest'
import { createAssistantContextPlugin, createContextResolver } from './contextPlugin'

describe('assistant context', () => {
  it('merges host and pending context for a request', async () => {
    const resolve = createContextResolver(
      () => ({ page: '/guide/start' }),
      () => ({ selection: 'selected text' }),
    )

    await expect(resolve()).resolves.toEqual({
      page: '/guide/start',
      selection: 'selected text',
    })
  })

  it('adds formatted context as a non-persisted system request message', async () => {
    const plugin = createAssistantContextPlugin({
      getContext: () => ({ page: '/guide/start' }),
      formatContext: (context) => `page=${context.page}`,
    })
    const requestBody = { messages: [{ role: 'user', content: 'help' }] }

    await plugin.onBeforeRequest?.({ requestBody } as never)

    expect(requestBody.messages).toEqual([
      { role: 'system', content: 'page=/guide/start' },
      { role: 'user', content: 'help' },
    ])
  })
})
