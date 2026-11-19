import { describe, expect, it, vi } from 'vitest'
import { createAssistantDocumentSearchPlugin } from './documentSearch'

describe('assistant document search', () => {
  it('injects matching documentation before the model request', async () => {
    const plugin = createAssistantDocumentSearchPlugin({
      search: vi
        .fn()
        .mockResolvedValue([{ path: '/guide/start.html', title: '快速开始', content: '安装并配置助手。' }]),
    })
    const requestBody = { messages: [{ role: 'user', content: '如何安装助手？' }] }

    await plugin.onBeforeRequest?.({ requestBody } as never)

    expect(requestBody.messages[0]).toEqual(
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('安装并配置助手'),
      }),
    )
    expect(requestBody.messages[0].content).toContain('focused sections')
  })

  it('does not fail the request when the index is unavailable', async () => {
    const plugin = createAssistantDocumentSearchPlugin({
      search: vi.fn().mockRejectedValue(new Error('index unavailable')),
    })
    const requestBody = { messages: [{ role: 'user', content: 'help' }] }

    await expect(plugin.onBeforeRequest?.({ requestBody } as never)).resolves.toBeUndefined()
    expect(requestBody.messages).toEqual([{ role: 'user', content: 'help' }])
  })
})
