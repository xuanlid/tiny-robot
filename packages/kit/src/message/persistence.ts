import type { CreateMessageEngineOptions, MessagePersistenceState, RequestState } from './types'
import { resolveRestoredRequestState } from './toolCallState'

const requestStates = new Set<RequestState>(['idle', 'processing', 'completed', 'paused', 'aborted', 'error'])

const isRequestState = (value: unknown): value is RequestState => {
  return typeof value === 'string' && requestStates.has(value as RequestState)
}

export const normalizeRestoredRequestState = (
  requestState: RequestState | undefined,
  messages = [] as MessagePersistenceState['messages'],
): RequestState => {
  return resolveRestoredRequestState(messages, requestState)
}

export type PersistedMessageState = MessagePersistenceState
export type SerializableMessageState = Omit<MessagePersistenceState, 'version'> & {
  version?: 1
}

export const sanitizeRestoredMessages = (
  messages: MessagePersistenceState['messages'] = [],
): MessagePersistenceState['messages'] =>
  messages.map((message) => {
    const restoredMessage = { ...message }
    delete restoredMessage.loading
    return restoredMessage
  })

export const serializeMessageState = ({ messages, requestState, customContext }: SerializableMessageState): string => {
  return JSON.stringify({
    version: 1,
    messages: sanitizeRestoredMessages(messages),
    requestState,
    customContext,
  } satisfies PersistedMessageState)
}

export const parseMessageState = (value: string | null | undefined): PersistedMessageState | undefined => {
  if (!value) {
    return undefined
  }

  let parsed: Partial<PersistedMessageState>

  try {
    parsed = JSON.parse(value) as Partial<PersistedMessageState>
  } catch {
    return undefined
  }

  if (parsed.version !== 1 || !Array.isArray(parsed.messages)) {
    return undefined
  }

  const customContext =
    parsed.customContext && typeof parsed.customContext === 'object' && !Array.isArray(parsed.customContext)
      ? parsed.customContext
      : undefined

  return {
    version: 1,
    messages: sanitizeRestoredMessages(parsed.messages),
    requestState: isRequestState(parsed.requestState) ? parsed.requestState : undefined,
    customContext,
  }
}

export const createMessageRestoreOptions = (
  state: PersistedMessageState | undefined,
): Pick<CreateMessageEngineOptions, 'initialMessages' | 'initialRequestState' | 'initialCustomContext'> => {
  const messages = sanitizeRestoredMessages(state?.messages ?? [])

  return {
    initialMessages: messages,
    initialRequestState: normalizeRestoredRequestState(state?.requestState, messages),
    initialCustomContext: state?.customContext,
  }
}
