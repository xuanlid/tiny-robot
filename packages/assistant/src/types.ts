import type {
  ChatMcpCreateServerPayload,
  ChatRuntime,
  ChatRuntimeActionErrorPayload,
  ChatUIOptions,
  LayoutFloatingState,
  UseChatRuntimeOptions,
} from '@opentiny/tiny-robot-chat'

export type AssistantContext = Readonly<Record<string, unknown>>

export type AssistantContextProvider = () =>
  AssistantContext | null | undefined | Promise<AssistantContext | null | undefined>

export type AssistantContextFormatter = (context: AssistantContext) => string | undefined

export interface AssistantDocumentSearchResult {
  path: string
  title: string
  content: string
  score?: number
}

export interface AssistantDocumentSearchOptions {
  search: (query: string) => Promise<readonly AssistantDocumentSearchResult[]>
  maxResults?: number
  formatResults?: (results: readonly AssistantDocumentSearchResult[]) => string
}

export type AssistantSendInput =
  | string
  | {
      text: string
      context?: AssistantContext
    }

export type AssistantEvent =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'send'; text: string }
  | { type: 'runtime-action-error'; payload: ChatRuntimeActionErrorPayload }
  | { type: 'error'; error: unknown }

export interface AssistantOptions {
  /** Runtime configuration used to create the assistant's Chat Runtime. */
  runtimeOptions: UseChatRuntimeOptions
  /** Context resolved before every request and injected as a system message. */
  context?: AssistantContext | AssistantContextProvider
  /** Formats context for the model request. Returning an empty value skips injection. */
  formatContext?: AssistantContextFormatter
  /** Searches host documentation and injects matching excerpts into the model request. */
  documentSearch?: AssistantDocumentSearchOptions
  /** Chat surface configuration. The default surface is a floating window. */
  ui?: ChatUIOptions
  mode?: 'floating' | 'inline'
  open?: boolean
  defaultOpen?: boolean
  launcher?: boolean
  launcherLabel?: string
  title?: string
  floatingState?: LayoutFloatingState
  defaultFloatingState?: LayoutFloatingState
  onEvent?: (event: AssistantEvent) => void
  onRuntimeActionError?: (payload: ChatRuntimeActionErrorPayload) => void
  onMcpCreateServer?: (payload: ChatMcpCreateServerPayload) => void
}

export interface AssistantExposed {
  open: () => void
  close: () => void
  toggle: () => void
  send: (input: AssistantSendInput) => Promise<boolean>
  newConversation: () => Promise<void>
  updateContext: (context: AssistantContext) => void
  focusInput: () => Promise<boolean>
  getRuntime: () => ChatRuntime
}

export interface CreateAssistantOptions extends AssistantOptions {
  mount: string | Element
}

export interface AssistantInstance extends AssistantExposed {
  destroy: () => void
}
