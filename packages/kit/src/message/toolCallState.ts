import type { ChatCompletionMessageToolCall } from 'openai/resources'
import type { ChatMessage, RequestState } from './types'

type ToolMessage = Extract<ChatMessage, { role: 'tool' }>

export interface PendingToolCall {
  assistantMessage: ChatMessage
  toolCall: ChatCompletionMessageToolCall
  toolMessage?: ChatMessage
  status: 'awaiting-approval'
}

const findLatestToolCallGroup = (messages: ChatMessage[]) => {
  let i = messages.length - 1
  const toolMessages: ChatMessage[] = []

  while (i >= 0 && messages[i].role === 'tool') {
    toolMessages.unshift(messages[i])
    i--
  }

  const assistantMessage = messages[i]
  if (!assistantMessage || assistantMessage.role !== 'assistant') {
    return null
  }

  if (!Array.isArray(assistantMessage.tool_calls) || assistantMessage.tool_calls.length === 0) {
    return null
  }

  return {
    assistantMessage,
    toolMessages: toolMessages as ToolMessage[],
  }
}

export const findPendingToolCalls = (messages: ChatMessage[]): PendingToolCall[] => {
  const group = findLatestToolCallGroup(messages)
  if (!group) {
    return []
  }

  const toolMessageMap = new Map(group.toolMessages.map((message) => [message.tool_call_id, message]))
  const toolCallState = group.assistantMessage.state?.toolCall as Record<string, { status?: string }> | undefined
  const toolCalls = group.assistantMessage.tool_calls ?? []

  return toolCalls
    .filter((toolCall) => toolCallState?.[toolCall.id]?.status === 'awaiting-approval')
    .map((toolCall) => ({
      assistantMessage: group.assistantMessage,
      toolCall,
      toolMessage: toolMessageMap.get(toolCall.id),
      status: 'awaiting-approval',
    }))
}

export const hasPendingToolCalls = (messages: ChatMessage[]): boolean => {
  return findPendingToolCalls(messages).length > 0
}

export const cancelPendingToolCalls = ({
  messages,
  createMessage,
  cancelledContent = 'Tool call cancelled.',
}: {
  messages: ChatMessage[]
  createMessage: <T extends ChatMessage>(message: T) => T
  cancelledContent?: string
}): boolean => {
  const pendingToolCalls = findPendingToolCalls(messages)

  if (!pendingToolCalls.length) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)

  pendingToolCalls.forEach(({ assistantMessage, toolCall, toolMessage }) => {
    assistantMessage.state ??= {}
    const state = assistantMessage.state as { toolCall?: Record<string, Record<string, unknown>> }
    state.toolCall ??= {}
    state.toolCall[toolCall.id] ??= {}
    state.toolCall[toolCall.id].status = 'cancelled'
    state.toolCall[toolCall.id].cancelledAt = now

    if (toolMessage) {
      if (!toolMessage.content) {
        toolMessage.content = cancelledContent
      }
      toolMessage.metadata ??= {}
      toolMessage.metadata.updatedAt = now
      return
    }

    messages.push(
      createMessage({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: cancelledContent,
        metadata: {
          createdAt: now,
          updatedAt: now,
        },
      }),
    )
  })

  return true
}

export const resolveRestoredRequestState = (
  messages: ChatMessage[],
  requestState: RequestState | undefined,
): RequestState => {
  if (hasPendingToolCalls(messages)) {
    return 'paused'
  }

  if (requestState === 'processing') {
    return 'idle'
  }

  return requestState ?? 'idle'
}
