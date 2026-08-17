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
