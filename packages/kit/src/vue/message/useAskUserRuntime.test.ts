import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { TOOL_RESUME_COMMAND } from '../../message/plugins/toolPlugin'
import type { ChatMessage } from '../../types'
import { useAskUserRuntime } from './useAskUserRuntime'

const createMessage = (answers: Record<string, unknown>) => {
  return {
    role: 'assistant',
    content: '',
    tool_calls: [
      {
        index: 0,
        id: 'call-ask-user',
        type: 'function' as const,
        function: {
          name: 'ask_user',
          arguments: JSON.stringify({
            id: 'profile',
            steps: [
              {
                id: 'name',
                title: '姓名',
                summary: '姓名',
                type: 'text',
                required: true,
              },
            ],
          }),
        },
      },
    ],
    state: {
      askUser: {
        status: 'submitted' as const,
        currentStep: 0,
        answers,
        completedStepIds: ['name'],
      },
      askUserRuntime: {
        interactionId: 'profile',
        toolCallId: 'call-ask-user',
      },
    },
  } satisfies ChatMessage
}

describe('useAskUserRuntime', () => {
  it('persists state changes and resumes the matching tool call', async () => {
    const messages = ref<ChatMessage[]>([createMessage({ name: 'Ada' })])
    const dispatchCommand = vi.fn().mockResolvedValue({ status: 'resumed', toolCallId: 'call-ask-user' })
    const runtime = useAskUserRuntime({ messages, dispatchCommand })

    runtime.handleStateChange({
      key: 'askUser',
      value: {
        status: 'submitted',
        currentStep: 0,
        answers: { name: 'Ada Lovelace' },
        completedStepIds: ['name'],
      },
      messageIndex: 0,
      contentIndex: 0,
    })
    await runtime.handleBubbleEvent({ name: 'ask-user:submit', messageIndex: 0, contentIndex: 0 })

    expect(messages.value[0]?.state?.askUserRuntime).toEqual({
      interactionId: 'profile',
      toolCallId: 'call-ask-user',
    })
    expect(messages.value[0]?.state?.askUser).toMatchObject({ answers: { name: 'Ada Lovelace' } })
    expect(dispatchCommand).toHaveBeenCalledWith(TOOL_RESUME_COMMAND, { toolCallId: 'call-ask-user' })
  })

  it('resumes the tool call when a required answer is empty', async () => {
    const messages = ref<ChatMessage[]>([createMessage({ name: '' })])
    const dispatchCommand = vi.fn().mockResolvedValue({ status: 'resumed', toolCallId: 'call-ask-user' })
    const runtime = useAskUserRuntime({ messages, dispatchCommand })

    await runtime.handleBubbleEvent({ name: 'ask-user:submit', messageIndex: 0, contentIndex: 0 })

    expect(dispatchCommand).toHaveBeenCalledWith(TOOL_RESUME_COMMAND, { toolCallId: 'call-ask-user' })
    expect(messages.value[0]?.state?.askUser).toMatchObject({
      status: 'submitted',
      answers: { name: '' },
    })
  })
})
