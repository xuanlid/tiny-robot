import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../../../types'
import type { SkillDefinition } from '../../../skills/types'
import { parseMessageState, serializeMessageState } from '../../../message/persistence'
import { mockResponseProvider, mockSequentialResponseProvider } from './helpers'
import { lengthPlugin } from '../plugins/lengthPlugin'
import { getSkillRequestContext, skillPlugin } from '../plugins/skillPlugin'
import { findPendingToolCalls, toolPlugin } from '../plugins/toolPlugin'
import type { ChatCompletion, Tool, ResponseProvider } from '../types'
import { useMessage } from '../useMessage'

const functionToolNames = (tools: Tool[] = []) => tools.map((tool) => tool.function.name)

describe('useMessage', () => {
  it('uses the core vue adapter while keeping the original return shape', async () => {
    const engine = useMessage({
      initialMessages: [{ role: 'system', content: 'hello' }],
      responseProvider: mockResponseProvider(['foo', 'bar']),
    })

    expect(engine.requestState.value).toBe('idle')
    expect(engine.processingState.value).toBeUndefined()
    expect(engine.messages.value).toHaveLength(1)
    expect(engine.isProcessing.value).toBe(false)
    expect(typeof engine.sendMessage).toBe('function')
    expect(typeof engine.abortRequest).toBe('function')

    await engine.sendMessage('ping')

    expect(engine.requestState.value).toBe('completed')
    expect(engine.messages.value).toHaveLength(3)
    expect(engine.messages.value[1]).toMatchObject({ role: 'user', content: 'ping' })
    expect(engine.messages.value[2]).toMatchObject({ role: 'assistant', content: 'foobar', loading: undefined })
  })

  it('keeps responseProvider as a writable ref', async () => {
    const engine = useMessage({
      responseProvider: mockResponseProvider('first'),
    })

    engine.responseProvider.value = mockResponseProvider('second')
    await engine.sendMessage('ping')

    expect(engine.messages.value[1]).toMatchObject({ role: 'assistant', content: 'second' })
  })

  it('uses vue lengthPlugin to continue when finish_reason is length', async () => {
    const continueContent = 'Continue please.'
    let requestCount = 0

    const responseProvider = mockSequentialResponseProvider([
      {
        content: 'partial answer',
        finish_reason: 'length',
        onRequest() {
          requestCount += 1
        },
      },
      {
        content: 'final answer',
        onRequest(requestBody) {
          requestCount += 1
          expect(requestBody.messages.at(-1)).toMatchObject({
            role: 'user',
            content: continueContent,
          })
        },
      },
    ])

    const engine = useMessage({
      responseProvider,
      plugins: [lengthPlugin({ continueContent })],
    })

    await engine.sendMessage('ping')

    expect(requestCount).toBe(2)
    expect(engine.messages.value).toHaveLength(4)
    expect(engine.messages.value[0]).toMatchObject({ role: 'user', content: 'ping' })
    expect(engine.messages.value[1]).toMatchObject({ role: 'assistant', content: 'partial answer' })
    expect(engine.messages.value[2]).toMatchObject({ role: 'user', content: continueContent })
    expect(engine.messages.value[3]).toMatchObject({ role: 'assistant', content: 'final answer' })
  })

  it('lets vue toolPlugin callbacks mutate reactive messages while core handles tool flow', async () => {
    let capturedAssistantMessage: Record<string, unknown> | undefined
    let capturedMessages: ChatMessage[] | undefined

    const responseProvider: ResponseProvider = async (requestBody) => {
      const hasToolResult = requestBody.messages.some((message) => message.role === 'tool')

      if (!hasToolResult) {
        return {
          id: 'tool-call',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'mock',
          system_fingerprint: null,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: '',
                tool_calls: [
                  {
                    index: 0,
                    id: 'call-1',
                    type: 'function',
                    function: {
                      name: 'lookup',
                      arguments: '{}',
                    },
                  },
                ],
              },
              delta: undefined,
              logprobs: null,
              finish_reason: 'tool_calls',
            },
          ],
        }
      }

      return {
        id: 'tool-answer',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'mock',
        system_fingerprint: null,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'done',
            },
            delta: undefined,
            logprobs: null,
            finish_reason: 'stop',
          },
        ],
      }
    }

    const engine = useMessage({
      responseProvider,
      plugins: [
        toolPlugin({
          async getTools() {
            return [
              {
                type: 'function',
                function: {
                  name: 'lookup',
                },
              },
            ]
          },
          async beforeCallTools(_toolCalls, context) {
            capturedAssistantMessage = context.assistantMessage
            capturedMessages = context.messages
            context.assistantMessage.state = { fromVueWrapper: true }
          },
          async *callTool(_toolCall, context) {
            expect(context.messages[context.messages.length - 1].role).toBe('tool')
            expect(context.assistantMessage).toBe(capturedAssistantMessage)
            expect(context.currentMessage).toBe(capturedAssistantMessage)

            context.messages[context.messages.length - 1].content = 'prefix '
            yield 'result'
          },
        }),
      ],
    })

    await engine.sendMessage('ping')

    expect(Array.isArray(capturedMessages)).toBe(true)
    expect(capturedMessages?.[1]).toBe(capturedAssistantMessage)
    expect(capturedMessages?.some((message) => message.role === 'tool')).toBe(true)
    expect(capturedAssistantMessage).toBe(engine.messages.value[1])
    expect(engine.messages.value).toHaveLength(4)
    expect(engine.messages.value[1]).toMatchObject({
      role: 'assistant',
      state: { fromVueWrapper: true, toolCall: { 'call-1': { status: 'success' } } },
    })
    expect(engine.messages.value[2]).toMatchObject({
      role: 'tool',
      tool_call_id: 'call-1',
      content: 'prefix result',
    })
    expect(engine.messages.value[3]).toMatchObject({
      role: 'assistant',
      content: 'done',
    })
  })

  it('lets vue toolPlugin pause and resume tool calls', async () => {
    let requestCount = 0
    let capturedAssistantMessage: ChatMessage | undefined
    const responseProvider: ResponseProvider = async (requestBody) => {
      requestCount += 1
      const hasToolResult = requestBody.messages.some((message) => message.role === 'tool' && message.content)

      if (!hasToolResult) {
        return {
          id: 'tool-call',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'mock',
          system_fingerprint: null,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: '',
                tool_calls: [
                  {
                    index: 0,
                    id: 'call-pause',
                    type: 'function',
                    function: {
                      name: 'lookup',
                      arguments: '{}',
                    },
                  },
                ],
              },
              delta: undefined,
              logprobs: null,
              finish_reason: 'tool_calls',
            },
          ],
        }
      }

      expect(requestBody.messages.at(-1)).toMatchObject({
        role: 'tool',
        tool_call_id: 'call-pause',
        content: 'approved result',
      })

      return {
        id: 'tool-answer',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'mock',
        system_fingerprint: null,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'done',
            },
            delta: undefined,
            logprobs: null,
            finish_reason: 'stop',
          },
        ],
      }
    }

    const engine = useMessage({
      responseProvider,
      plugins: [
        toolPlugin({
          async getTools() {
            return [
              {
                type: 'function',
                function: {
                  name: 'lookup',
                },
              },
            ]
          },
          async shouldPauseToolCall(_toolCall, context) {
            capturedAssistantMessage = context.assistantMessage
            expect(context.messages.at(-1)?.role).toBe('tool')
            return true
          },
          async callTool(_toolCall, context) {
            expect(context.assistantMessage).toMatchObject({
              role: 'assistant',
              tool_calls: [expect.objectContaining({ id: 'call-pause' })],
            })
            expect(capturedAssistantMessage).toMatchObject({
              role: 'assistant',
              tool_calls: [expect.objectContaining({ id: 'call-pause' })],
            })
            return 'approved result'
          },
        }),
      ],
    })

    await engine.sendMessage('ping')

    expect(requestCount).toBe(1)
    expect(engine.requestState.value).toBe('paused')
    expect(engine.messages.value[1]).toMatchObject({
      state: { toolCall: { 'call-pause': { status: 'awaiting-approval' } } },
    })

    const commandResult = await engine.runPluginCommand('tool', 'resumeToolCall', { toolCallId: 'call-pause' })

    expect(commandResult.success).toBe(true)
    expect(requestCount).toBe(2)
    expect(engine.requestState.value).toBe('completed')
    expect(engine.messages.value[2]).toMatchObject({
      role: 'tool',
      tool_call_id: 'call-pause',
      content: 'approved result',
    })
    expect(engine.messages.value.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'done',
    })
  })

  it('does not send new messages while vue tool calls are paused', async () => {
    const callTool = vi.fn(async () => 'approved result')
    const responseProvider: ResponseProvider = vi.fn(async (): Promise<ChatCompletion> => ({
      id: 'tool-call',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'mock',
      system_fingerprint: null,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                index: 0,
                id: 'call-pause',
                type: 'function',
                function: {
                  name: 'lookup',
                  arguments: '{}',
                },
              },
            ],
          },
          delta: undefined,
          logprobs: null,
          finish_reason: 'tool_calls',
        },
      ],
    }))

    const engine = useMessage({
      responseProvider,
      plugins: [
        toolPlugin({
          getTools: async () => [
            {
              type: 'function',
              function: {
                name: 'lookup',
              },
            },
          ],
          shouldPauseToolCall: async () => true,
          callTool,
        }),
      ],
    })

    await engine.sendMessage('ping')
    expect(engine.requestState.value).toBe('paused')

    const snapshotMessages = () => JSON.parse(JSON.stringify(engine.messages.value)) as ChatMessage[]
    const messagesBefore = snapshotMessages()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      await engine.sendMessage('new request')
      await engine.send({ role: 'user', content: 'another request' })

      expect(responseProvider).toHaveBeenCalledTimes(1)
      expect(callTool).not.toHaveBeenCalled()
      expect(snapshotMessages()).toEqual(messagesBefore)
      expect(warnSpy).toHaveBeenCalledTimes(2)
      expect(warnSpy).toHaveBeenCalledWith('Cannot send message while tool call approval is pending')
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('lets vue persist pending tool calls and deny them', async () => {
    const callTool = vi.fn(async () => 'unexpected result')
    const responseProvider: ResponseProvider = vi.fn(async (requestBody): Promise<ChatCompletion> => {
      const hasToolResult = requestBody.messages.some(
        (message: ChatMessage) => message.role === 'tool' && message.content,
      )

      if (!hasToolResult) {
        return {
          id: 'tool-call',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'mock',
          system_fingerprint: null,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: '',
                tool_calls: [
                  {
                    index: 0,
                    id: 'call-deny',
                    type: 'function',
                    function: {
                      name: 'lookup',
                      arguments: '{}',
                    },
                  },
                ],
              },
              delta: undefined,
              logprobs: null,
              finish_reason: 'tool_calls',
            },
          ],
        }
      }

      expect(requestBody.messages.at(-1)).toMatchObject({
        role: 'tool',
        tool_call_id: 'call-deny',
        content: 'Denied in Vue.',
      })

      return {
        id: 'tool-answer',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'mock',
        system_fingerprint: null,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'done after denial',
            },
            delta: undefined,
            logprobs: null,
            finish_reason: 'stop',
          },
        ],
      }
    })

    const engine = useMessage({
      responseProvider,
      plugins: [
        toolPlugin({
          async getTools() {
            return [
              {
                type: 'function',
                function: {
                  name: 'lookup',
                },
              },
            ]
          },
          shouldPauseToolCall: async () => true,
          toolCallDeniedContent: 'Denied in Vue.',
          callTool,
        }),
      ],
    })

    await engine.sendMessage('ping')

    const restoredState = parseMessageState(serializeMessageState(engine.getPersistenceState()))

    expect(restoredState?.requestState).toBe('paused')
    expect(findPendingToolCalls(restoredState?.messages ?? [])).toHaveLength(1)

    const commandResult = await engine.runPluginCommand('tool', 'denyToolCall', { toolCallId: 'call-deny' })

    expect(commandResult.success).toBe(true)
    expect(callTool).not.toHaveBeenCalled()
    expect(engine.requestState.value).toBe('completed')
    expect(engine.messages.value[2]).toMatchObject({
      role: 'tool',
      tool_call_id: 'call-deny',
      content: 'Denied in Vue.',
    })
    expect(engine.messages.value.at(-1)).toMatchObject({
      role: 'assistant',
      content: 'done after denial',
    })
  })

  it('restores vue request state to paused when initial messages contain pending tool calls', () => {
    const engine = useMessage({
      initialRequestState: 'idle',
      initialMessages: [
        { role: 'user', content: 'lookup' },
        {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              index: 0,
              id: 'call-pending',
              type: 'function',
              function: {
                name: 'lookup',
                arguments: '{}',
              },
            },
          ],
          state: { toolCall: { 'call-pending': { status: 'awaiting-approval' } } },
        },
        { role: 'tool', tool_call_id: 'call-pending', content: '' },
      ],
      responseProvider: mockResponseProvider('noop'),
    })

    expect(engine.requestState.value).toBe('paused')
    expect(findPendingToolCalls(engine.messages.value)).toHaveLength(1)
  })

  it('does not inject vue skill instructions by default', async () => {
    const skills = ref<SkillDefinition[]>([
      {
        name: 'docs',
        description: 'Docs skill',
        instructions: 'Use docs references.',
        resources: [
          {
            path: 'guide.md',
            kind: 'text',
            resourceId: 'guide.md',
            text: '# Guide',
          },
        ],
      },
    ])
    const responseProvider = vi.fn(mockResponseProvider('ok'))

    const engine = useMessage({
      responseProvider,
      plugins: [
        skillPlugin({ skills }),
        toolPlugin({
          getTools: async () => [],
          callTool: async () => 'fallback',
        }),
      ],
    })

    await engine.sendMessage('read docs')

    const requestBody = responseProvider.mock.calls[0]?.[0]
    expect(requestBody.messages).toEqual([expect.objectContaining({ role: 'user', content: 'read docs' })])
    expect(functionToolNames(requestBody.tools)).toEqual(['list_skill_files', 'read_skill_file'])
  })

  it('calls vue onInstructionsResolved immediately without a request body', async () => {
    const events: string[] = []
    const responseProvider = vi.fn(mockResponseProvider('ok'))

    const engine = useMessage({
      responseProvider: (...args) => {
        events.push('request')
        return responseProvider(...args)
      },
      plugins: [
        skillPlugin({
          skills: [
            {
              name: 'docs',
              description: 'Docs skill',
              instructions: 'Use docs references.',
            },
          ],
          onInstructionsResolved: (skillContext, context) => {
            events.push('instructions')
            expect(skillContext.instructions).toEqual([expect.stringContaining('Use docs references.')])
            expect(context).not.toHaveProperty('requestBody')
          },
        }),
      ],
    })

    await engine.sendMessage('read docs')

    expect(events).toEqual(['instructions', 'request'])
  })

  it('uses reactive manual vue skillPlugin skillNames', async () => {
    const mode = ref<'manual'>('manual')
    const skillNames = ref(['stale'])
    const skills: SkillDefinition[] = [
      {
        name: 'docs',
        description: 'Docs skill',
        instructions: 'Use docs references.',
      },
    ]
    const responseProvider = vi.fn(mockResponseProvider('ok'))

    const engine = useMessage({
      responseProvider,
      plugins: [
        skillPlugin({
          mode,
          skillNames,
          onBeforeRequest: (context) => {
            const instructions = getSkillRequestContext(context)?.instructions ?? []
            context.requestBody.messages.unshift({
              role: 'system',
              content: instructions.join('\n\n'),
            })
          },
          getSkillByName: async (name) => skills.find((skill) => skill.name === name),
        }),
      ],
    })

    skillNames.value = ['docs']
    await engine.sendMessage('read docs')

    expect(responseProvider.mock.calls[0]?.[0].messages[0]).toMatchObject({
      role: 'system',
      content: expect.stringContaining('Use docs references.'),
    })
  })

  it('uses core-compatible vue skillPlugin selection with inline skills', async () => {
    const responseProvider = vi.fn(mockResponseProvider('ok'))

    const engine = useMessage({
      responseProvider,
      plugins: [
        skillPlugin({
          onBeforeRequest: (context) => {
            const instructions = getSkillRequestContext(context)?.instructions ?? []
            context.requestBody.messages.unshift({
              role: 'system',
              content: instructions.join('\n\n'),
            })
          },
          selection: {
            mode: 'manual',
            skills: [
              {
                name: 'docs',
                description: 'Docs skill',
                instructions: 'Use docs references.',
              },
            ],
          },
        }),
      ],
    })

    await engine.sendMessage('read docs')

    expect(responseProvider.mock.calls[0]?.[0].messages[0]).toMatchObject({
      role: 'system',
      content: expect.stringContaining('Use docs references.'),
    })
  })

  it('uses reactive preferred skill names in auto mode', async () => {
    const preferredSkillNames = ref(['stale'])
    const responseProvider = vi.fn((requestBody, abortSignal) => {
      expect(requestBody.messages[0]).toMatchObject({
        role: 'system',
        content: expect.stringContaining('Preferred skill names: docs'),
      })
      return mockResponseProvider('ok')(requestBody, abortSignal)
    })

    const engine = useMessage({
      responseProvider,
      plugins: [
        skillPlugin({
          mode: 'auto',
          onBeforeRequest: (context) => {
            const instructions = getSkillRequestContext(context)?.instructions ?? []
            context.requestBody.messages.unshift({
              role: 'system',
              content: instructions.join('\n\n'),
            })
          },
          preferredSkillNames,
          skills: [
            {
              name: 'docs',
              description: 'Docs skill',
              instructions: 'Use docs references.',
            },
          ],
        }),
        toolPlugin({
          getTools: async () => [],
          callTool: async () => 'fallback',
        }),
      ],
    })

    preferredSkillNames.value = ['docs']
    await engine.sendMessage('read docs')
  })

  it('rejects vue auto skillPlugin without an enabled toolPlugin', async () => {
    const responseProvider = vi.fn(mockResponseProvider('unexpected'))
    const engine = useMessage({
      responseProvider,
      plugins: [
        skillPlugin({
          mode: 'auto',
          skills: [
            {
              name: 'docs',
              description: 'Docs skill',
              instructions: 'Use docs references.',
            },
          ],
        }),
      ],
    })

    await expect(engine.sendMessage('read docs')).rejects.toThrow(
      'skillPlugin auto mode requires an enabled toolPlugin',
    )
    expect(responseProvider).not.toHaveBeenCalled()
  })

  it('rejects vue manual skillNames without a skill resolver', async () => {
    const responseProvider = vi.fn(mockResponseProvider('unexpected'))
    const engine = useMessage({
      responseProvider,
      plugins: [
        skillPlugin({
          mode: 'manual',
          skillNames: ['docs'],
        }),
      ],
    })

    await expect(engine.sendMessage('read docs')).rejects.toThrow(
      'getSkillByName is required when manual mode uses skillNames',
    )
    expect(responseProvider).not.toHaveBeenCalled()
  })

  it('rejects vue auto skillPlugin without a candidate source', async () => {
    const responseProvider = vi.fn(mockResponseProvider('unexpected'))
    const engine = useMessage({
      responseProvider,
      plugins: [
        skillPlugin({
          mode: 'auto',
        }),
        toolPlugin({
          getTools: async () => [],
          callTool: async () => 'fallback',
        }),
      ],
    })

    await expect(engine.sendMessage('read docs')).rejects.toThrow(
      'getSkillCandidates is required when auto mode is enabled',
    )
    expect(responseProvider).not.toHaveBeenCalled()
  })
})
