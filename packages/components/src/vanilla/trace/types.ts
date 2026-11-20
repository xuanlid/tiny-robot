/** Framework-free trajectory / trace contracts. */

export type TraceEventType =
  | 'turn.start'
  | 'turn.end'
  | 'step.start'
  | 'step.end'
  | 'request.start'
  | 'request.delta'
  | 'request.end'
  | 'assistant.delta'
  | 'assistant.end'
  | 'user.message'
  | 'tool.start'
  | 'tool.result'
  | 'context.update'
  | 'system.update'
  | 'compaction.start'
  | 'compaction.end'
  | 'error'

export interface TraceEvent {
  readonly sessionId: string
  readonly seq: number
  readonly type: TraceEventType
  readonly timestamp: number
  readonly turn?: number
  readonly step?: number
  readonly requestId?: string
  readonly callId?: string
  readonly parentCallId?: string
  readonly data: unknown
}

/** Business message input projected into Trace records. */
export type TraceMessageRole = 'system' | 'user' | 'context' | 'assistant'

export type TraceMessageBlock =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'reasoning'; readonly text: string }
  | {
      readonly type: 'tool-call'
      readonly callId: string
      readonly name: string
      readonly argsRaw: string
      readonly parentCallId?: string
    }
  | { readonly type: 'json'; readonly value: unknown }

export interface TraceMessage {
  readonly id?: string
  readonly seq: number
  readonly timestamp: number
  readonly role: TraceMessageRole
  readonly turn?: number
  readonly step?: number
  readonly content: readonly TraceMessageBlock[]
  readonly source?: string
  readonly metadata?: Record<string, unknown>
}

export interface TraceRequestInput {
  readonly requestId: string
  readonly seq: number
  readonly timestamp: number
  readonly turn: number
  readonly step: number
  readonly purpose?: 'assistant' | 'compaction'
  readonly provider?: string
  readonly model?: string
  readonly systemPrompt?: string
  readonly prompt?: unknown
  readonly tools?: readonly TraceToolSchema[]
  readonly options?: Record<string, unknown>
  readonly status?: TraceStatus
  readonly completedAt?: number
  readonly retry?: number
  readonly maxRetries?: number
  readonly usage?: TraceUsage
  readonly error?: TraceError
}

export interface TraceToolCallInput {
  readonly callId: string
  readonly seq: number
  readonly timestamp: number
  readonly turn?: number
  readonly step?: number
  readonly parentCallId?: string
  readonly name: string
  readonly argsRaw: string
  readonly schema?: TraceToolSchema
}

export interface TraceToolResultInput {
  readonly callId: string
  readonly seq: number
  readonly timestamp: number
  readonly turn?: number
  readonly step?: number
  readonly result?: unknown
  readonly resultText?: string
  readonly status?: TraceStatus
  readonly error?: TraceError
}

/** Existing business data accepted by the Trace projection layer. */
export interface TraceInput {
  readonly sessionId: string
  readonly messages?: readonly TraceMessage[]
  readonly requests?: readonly TraceRequestInput[]
  readonly toolCalls?: readonly TraceToolCallInput[]
  readonly toolResults?: readonly TraceToolResultInput[]
  readonly events?: readonly TraceEvent[]
}

export type TraceStatus = 'running' | 'complete' | 'error'

export interface TraceError {
  readonly code?: string
  readonly message: string
}

export interface TraceUsage {
  readonly inputTokens?: number
  readonly outputTokens?: number
  readonly reasoningTokens?: number
  readonly cacheReadTokens?: number
  readonly cacheWriteTokens?: number
}

export interface TraceToolSchema {
  readonly name: string
  readonly description?: string
  readonly inputSchema?: unknown
}

export interface TraceRequest {
  readonly requestId: string
  readonly seq: number
  readonly turn: number
  readonly step: number
  readonly purpose: 'assistant' | 'compaction'
  readonly provider?: string
  readonly model?: string
  readonly systemPrompt?: string
  readonly prompt?: unknown
  readonly tools?: readonly TraceToolSchema[]
  readonly options?: Record<string, unknown>
  readonly status: TraceStatus
  readonly startedAt: number
  readonly completedAt?: number
  readonly retry?: number
  readonly maxRetries?: number
  readonly error?: TraceError
  readonly usage?: TraceUsage
}

export interface TraceToolCall {
  readonly callId: string
  readonly parentCallId?: string
  readonly name: string
  readonly argsRaw: string
  readonly seq: number
  readonly startedAt: number
  readonly completedAt?: number
  readonly status: TraceStatus
  readonly result?: unknown
  readonly resultText?: string
  readonly error?: TraceError
  readonly schema?: TraceToolSchema
  readonly children?: readonly TraceToolCall[]
}

export type TraceRecordKind =
  'system' | 'user' | 'context' | 'assistant' | 'request' | 'tool' | 'subtool' | 'compaction'

export interface TraceRecord {
  readonly id: string
  readonly seq: number
  readonly kind: TraceRecordKind
  readonly turn?: number
  readonly step?: number
  readonly status: TraceStatus
  readonly startedAt?: number
  readonly firstTokenAt?: number
  readonly completedAt?: number
  readonly durationMs?: number
  readonly title: string
  readonly preview?: string
  readonly source?: string
  readonly metadata?: Record<string, unknown>
  readonly input?: unknown
  readonly output?: unknown
  readonly reasoning?: string
  readonly requestId?: string
  readonly request?: TraceRequest
  readonly toolName?: string
  readonly callId?: string
  readonly parentCallId?: string
  readonly tool?: TraceToolCall
  readonly schema?: TraceToolSchema
  readonly usage?: TraceUsage
  readonly error?: TraceError
  readonly level: number
}

export interface TraceTimelineSpan {
  readonly recordId: string
  readonly start: number
  readonly end: number
  readonly lane: number
  readonly kind: TraceRecordKind
  readonly status: TraceStatus
}

export interface TraceTimelineModel {
  readonly start: number
  readonly end: number
  readonly spans: readonly TraceTimelineSpan[]
}

export interface TraceSnapshot {
  readonly events: readonly TraceEvent[]
  readonly requests: readonly TraceRequest[]
  readonly records: readonly TraceRecord[]
  readonly timeline: TraceTimelineModel | null
}

export interface TracePage {
  readonly events?: readonly TraceEvent[]
  readonly input?: TraceInput
  readonly cursor: string | null
  readonly hasMore: boolean
}

export interface TraceSource {
  readonly loadInitial?: () => Promise<TracePage>
  readonly loadOlder?: (cursor: string | null) => Promise<TracePage>
  readonly subscribe?: (listener: (event: TraceEvent) => void) => () => void
}

export interface TrajectoryLocale {
  readonly locale?: string
  readonly translate?: (key: string, params?: Record<string, unknown>) => string
}

export interface MarkdownRenderContext {
  readonly recordId: string
  readonly kind: TraceRecordKind
}

export interface ToolRenderContext {
  readonly record: TraceRecord
  readonly document: Document
}

export interface TrajectoryMessages {
  readonly empty: string
  readonly loading: string
  readonly running: string
  readonly noResult: string
  readonly loadOlder: string
  readonly selected: string
}

export interface TrajectoryOptions {
  readonly root?: Document
  readonly container: HTMLElement
  readonly events?: readonly TraceEvent[]
  readonly input?: TraceInput
  readonly source?: TraceSource
  readonly locale?: TrajectoryLocale
  readonly theme?: 'inherit' | 'light' | 'dark'
  readonly virtualize?: boolean
  readonly showReasoning?: boolean
  readonly showHeader?: boolean
  readonly renderMarkdown?: (text: string, context: MarkdownRenderContext) => Node
  readonly renderTool?: (context: ToolRenderContext) => Node | null
  readonly messages?: Partial<TrajectoryMessages>
  readonly onEvent?: (event: TrajectoryEvent) => void
}

export type TrajectoryEvent =
  | { readonly type: 'record_select'; readonly recordId: string | null }
  | { readonly type: 'timeline_select'; readonly range: { readonly start: number; readonly end: number } | null }
  | { readonly type: 'load_older_start' }
  | { readonly type: 'load_older_end'; readonly loaded: boolean }
  | {
      readonly type: 'collapse_change'
      readonly scope: 'turn' | 'assistant' | 'tool'
      readonly id: string
      readonly collapsed: boolean
    }
  | { readonly type: 'error'; readonly stage: string; readonly error: Error }

export interface TrajectoryInstance {
  append: (input: TraceInput | TraceEvent | readonly TraceEvent[]) => void
  replace: (input: TraceInput | readonly TraceEvent[]) => void
  loadOlder: () => Promise<boolean>
  select: (recordId: string | null) => void
  clearSelection: () => void
  updateOptions: (options: Partial<TrajectoryOptions>) => void
  getSnapshot: () => Readonly<TraceSnapshot>
  destroy: () => void
}
