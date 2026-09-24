import type { ChatCompletionMessageFunctionToolCall } from 'openai/resources'
import type { ChatMessage } from '../../types'
import {
  parseAskUserToolCallArguments,
  validateAndNormalizeAnswers,
  type AskUserMessageState,
  type AskUserRuntimeMeta,
  type AskUserState,
} from '../../message/tools/askUser'
import { TOOL_RESUME_COMMAND } from '../../message/plugins/toolPlugin'
import type { UseMessageReturn } from './types'

export interface AskUserStateChangeEvent {
  key: string
  value: unknown
  messageIndex: number
  contentIndex: number
}

export interface AskUserBubbleEvent {
  name: string
  payload?: unknown
  messageIndex: number
  contentIndex: number
}

type AskUserMessage = ChatMessage & {
  state?: Record<string, unknown>
}

const getAskUserMessageState = (message: AskUserMessage): AskUserMessageState => {
  return (message.state ?? {}) as AskUserMessageState
}

export const useAskUserRuntime = (message: Pick<UseMessageReturn, 'messages' | 'dispatchCommand'>) => {
  const setAskUserError = (target: AskUserMessage, state: AskUserState, error: unknown) => {
    target.state = {
      ...target.state,
      askUser: {
        ...state,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        updatedAt: Date.now(),
      },
    }
  }

  const handleStateChange = ({ messageIndex, key, value }: AskUserStateChangeEvent) => {
    const target = message.messages.value[messageIndex] as AskUserMessage | undefined
    if (!target) {
      return
    }

    target.state = {
      ...target.state,
      [key]: value,
    }
  }

  const handleBubbleEvent = async (event: AskUserBubbleEvent) => {
    if (event.name !== 'ask-user:submit') {
      return
    }

    const target = message.messages.value[event.messageIndex] as AskUserMessage | undefined
    if (!target) {
      return
    }

    const messageState = getAskUserMessageState(target)
    const state = messageState.askUser
    const runtime = messageState.askUserRuntime as AskUserRuntimeMeta | undefined
    if (!state || state.status !== 'submitted' || !runtime?.toolCallId) {
      return
    }

    try {
      const toolCall = target.tool_calls?.find((call) => call.id === runtime.toolCallId)
      if (!toolCall || toolCall.type !== 'function') {
        throw new Error('ask_user tool call not found')
      }

      const args = parseAskUserToolCallArguments(toolCall as unknown as ChatCompletionMessageFunctionToolCall)
      const answers = validateAndNormalizeAnswers(args.steps, state.answers)

      target.state = {
        ...target.state,
        askUser: {
          ...state,
          answers,
          status: 'submitted',
          updatedAt: Date.now(),
        },
      }

      await message.dispatchCommand(TOOL_RESUME_COMMAND, {
        toolCallId: runtime.toolCallId,
      })
    } catch (error) {
      setAskUserError(target, state, error)
    }
  }

  return {
    handleStateChange,
    handleBubbleEvent,
  }
}
