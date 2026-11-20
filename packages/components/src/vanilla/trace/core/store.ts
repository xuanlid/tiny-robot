import type {
  TraceError,
  TraceEvent,
  TraceInput,
  TraceRecord,
  TraceRequest,
  TraceSnapshot,
  TraceStatus,
  TraceTimelineModel,
  TraceTimelineSpan,
  TraceToolCall,
  TraceToolSchema,
  TraceUsage,
} from '../types'
import { projectTraceInput } from './adapter'

interface UnknownRecord {
  [key: string]: unknown
}

interface MutableRequest {
  requestId: string
  seq: number
  turn: number
  step: number
  purpose: 'assistant' | 'compaction'
  provider?: string
  model?: string
  systemPrompt?: string
  prompt?: unknown
  tools?: readonly TraceToolSchema[]
  options?: Record<string, unknown>
  status: TraceStatus
  startedAt: number
  completedAt?: number
  retry?: number
  maxRetries?: number
  error?: TraceError
  usage?: TraceUsage
}

interface MutableTool {
  callId: string
  parentCallId?: string
  name: string
  argsRaw: string
  seq: number
  startedAt: number
  completedAt?: number
  status: TraceStatus
  result?: unknown
  resultText?: string
  error?: TraceError
  schema?: TraceToolSchema
  level: number
}

interface MutableRecord {
  id: string
  seq: number
  kind: TraceRecord['kind']
  turn?: number
  step?: number
  status: TraceStatus
  startedAt?: number
  firstTokenAt?: number
  completedAt?: number
  title: string
  preview?: string
  source?: string
  metadata?: Record<string, unknown>
  input?: unknown
  output?: unknown
  reasoning?: string
  requestId?: string
  toolName?: string
  callId?: string
  parentCallId?: string
  schema?: TraceToolSchema
  usage?: TraceUsage
  error?: TraceError
  level: number
}

const EMPTY_SNAPSHOT: TraceSnapshot = {
  events: [],
  requests: [],
  records: [],
  timeline: null,
}

function object(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {}
}

function string(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function nonEmptyString(value: unknown): string | undefined {
  const result = string(value)
  return result === undefined || result.length === 0 ? undefined : result
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function dataString(data: UnknownRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const result = nonEmptyString(data[key])
    if (result !== undefined) return result
  }
  return undefined
}

function dataNumber(data: UnknownRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const result = number(data[key])
    if (result !== undefined) return result
  }
  return undefined
}

function status(value: unknown, fallback: TraceStatus): TraceStatus {
  return value === 'running' || value === 'complete' || value === 'error' ? value : fallback
}

function errorValue(value: unknown): TraceError | undefined {
  if (typeof value === 'string' && value.length > 0) return { message: value }
  const data = object(value)
  const message = dataString(data, 'message', 'reason', 'detail')
  if (message === undefined) return undefined
  const code = dataString(data, 'code', 'name')
  return code === undefined ? { message } : { code, message }
}

function usageValue(value: unknown): TraceUsage | undefined {
  const data = object(value)
  const inputTokens = dataNumber(data, 'inputTokens', 'input')
  const outputTokens = dataNumber(data, 'outputTokens', 'output')
  const reasoningTokens = dataNumber(data, 'reasoningTokens', 'reasoning', 'think')
  const cacheReadTokens = dataNumber(data, 'cacheReadTokens', 'cacheRead')
  const cacheWriteTokens = dataNumber(data, 'cacheWriteTokens', 'cacheWrite')
  if (
    inputTokens === undefined &&
    outputTokens === undefined &&
    reasoningTokens === undefined &&
    cacheReadTokens === undefined &&
    cacheWriteTokens === undefined
  )
    return undefined
  return {
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    ...(cacheReadTokens === undefined ? {} : { cacheReadTokens }),
    ...(cacheWriteTokens === undefined ? {} : { cacheWriteTokens }),
  }
}

function schemaValue(value: unknown, fallbackName?: string): TraceToolSchema | undefined {
  const data = object(value)
  const name = dataString(data, 'name', 'toolName') ?? fallbackName
  if (name === undefined) return undefined
  const description = dataString(data, 'description')
  const inputSchema = data.inputSchema ?? data.parameters ?? data.schema
  return {
    name,
    ...(description === undefined ? {} : { description }),
    ...(inputSchema === undefined ? {} : { inputSchema }),
  }
}

function payloadText(data: UnknownRecord, ...keys: string[]): string | undefined {
  const direct = dataString(data, ...keys)
  if (direct !== undefined) return direct
  const value = data.output ?? data.result ?? data.content ?? data.payload
  if (typeof value === 'string') return value
  if (value === undefined) return undefined
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function recordDuration(startedAt: number | undefined, completedAt: number | undefined): number | undefined {
  if (startedAt === undefined || completedAt === undefined) return undefined
  return Math.max(0, completedAt - startedAt)
}

function requestFromMutable(request: MutableRequest): TraceRequest {
  return { ...request }
}

function toolFromMutable(tool: MutableTool): TraceToolCall {
  return {
    callId: tool.callId,
    ...(tool.parentCallId === undefined ? {} : { parentCallId: tool.parentCallId }),
    name: tool.name,
    argsRaw: tool.argsRaw,
    seq: tool.seq,
    startedAt: tool.startedAt,
    ...(tool.completedAt === undefined ? {} : { completedAt: tool.completedAt }),
    status: tool.status,
    ...(tool.result === undefined ? {} : { result: tool.result }),
    ...(tool.resultText === undefined ? {} : { resultText: tool.resultText }),
    ...(tool.error === undefined ? {} : { error: tool.error }),
    ...(tool.schema === undefined ? {} : { schema: tool.schema }),
  }
}

function timelineFor(records: readonly TraceRecord[]): TraceTimelineModel | null {
  const timed = records.filter((record) => record.startedAt !== undefined)
  if (timed.length === 0) return null
  const start = Math.min(...timed.map((record) => record.startedAt as number))
  const end = Math.max(...timed.map((record) => (record.completedAt ?? record.startedAt) as number))
  const spans: TraceTimelineSpan[] = timed.map((record) => ({
    recordId: record.id,
    start: record.startedAt as number,
    end: Math.max(record.startedAt as number, record.completedAt ?? (record.startedAt as number)),
    lane:
      record.kind === 'tool' || record.kind === 'subtool'
        ? 2
        : record.kind === 'assistant' || record.kind === 'request'
          ? 1
          : 0,
    kind: record.kind,
    status: record.status,
  }))
  return { start, end: Math.max(start, end), spans }
}

function levelFor(callId: string | undefined, tools: ReadonlyMap<string, MutableTool>): number {
  if (callId === undefined) return 0
  const parent = tools.get(callId)
  return parent === undefined ? 0 : parent.level + 1
}

/** Incremental event reducer used by the DOM renderer and Angular adapter. */
export class TraceStore {
  private readonly eventMap = new Map<number, TraceEvent>()
  private snapshotValue: TraceSnapshot = EMPTY_SNAPSHOT

  constructor(input: TraceInput | readonly TraceEvent[] = []) {
    this.replace(input)
  }

  append(input: TraceInput | TraceEvent | readonly TraceEvent[]): void {
    const list = this.normalize(input, true)
    for (const event of list) this.eventMap.set(event.seq, event)
    this.rebuild()
  }

  replace(input: TraceInput | readonly TraceEvent[]): void {
    const events = this.normalize(input)
    this.eventMap.clear()
    for (const event of events) this.eventMap.set(event.seq, event)
    this.rebuild()
  }

  private normalize(input: TraceInput | TraceEvent | readonly TraceEvent[], append = false): readonly TraceEvent[] {
    if (Array.isArray(input)) return input as readonly TraceEvent[]
    if ('type' in input) return [input as TraceEvent]
    const projected = projectTraceInput(input as TraceInput)
    if (!append || projected.length === 0) return projected
    const offset = Math.max(0, ...this.eventMap.keys()) + 1
    return projected.map((event, index) => ({ ...event, seq: offset + index }))
  }

  getSnapshot(): Readonly<TraceSnapshot> {
    return this.snapshotValue
  }

  private rebuild(): void {
    const events = [...this.eventMap.values()].sort((left, right) => left.seq - right.seq)
    const requests = new Map<string, MutableRequest>()
    const tools = new Map<string, MutableTool>()
    const records = new Map<string, MutableRecord>()
    const assistantKeys = new Map<string, string>()

    const requestKey = (event: TraceEvent, data: UnknownRecord): string =>
      event.requestId ?? dataString(data, 'requestId', 'id') ?? `request:${event.seq}`

    const turnOf = (event: TraceEvent, data: UnknownRecord): number => event.turn ?? dataNumber(data, 'turn') ?? 0

    const stepOf = (event: TraceEvent, data: UnknownRecord): number => event.step ?? dataNumber(data, 'step') ?? 0

    const ensureRequest = (
      event: TraceEvent,
      data: UnknownRecord,
      purpose: MutableRequest['purpose'] = 'assistant',
    ): MutableRequest => {
      const id = requestKey(event, data)
      const existing = requests.get(id)
      if (existing !== undefined) return existing
      const created: MutableRequest = {
        requestId: id,
        seq: event.seq,
        turn: turnOf(event, data),
        step: stepOf(event, data),
        purpose,
        status: 'running',
        startedAt: event.timestamp,
      }
      requests.set(id, created)
      return created
    }

    const ensureRecord = (id: string, input: Omit<MutableRecord, 'id'>): MutableRecord => {
      const existing = records.get(id)
      if (existing !== undefined) return existing
      const created = { id, ...input }
      records.set(id, created)
      return created
    }

    const updateRequestRecord = (request: MutableRequest): void => {
      const id = `request:${request.requestId}`
      const record = ensureRecord(id, {
        seq: request.seq,
        kind: 'request',
        turn: request.turn,
        step: request.step,
        status: request.status,
        startedAt: request.startedAt,
        completedAt: request.completedAt,
        title: `Request #${request.seq}`,
        preview: request.model ?? request.provider ?? request.purpose,
        requestId: request.requestId,
        level: 0,
      })
      record.status = request.status
      record.startedAt = request.startedAt
      record.completedAt = request.completedAt
      record.preview = [request.provider, request.model].filter(Boolean).join(' · ') || request.purpose
      record.requestId = request.requestId
      record.input = request.prompt
      record.usage = request.usage
      record.error = request.error
    }

    for (const event of events) {
      const data = object(event.data)
      if (event.type === 'request.start' || event.type === 'request.delta' || event.type === 'request.end') {
        const request = ensureRequest(
          event,
          data,
          dataString(data, 'purpose') === 'compaction' ? 'compaction' : 'assistant',
        )
        const provider = dataString(data, 'provider') ?? dataString(object(data.config), 'provider')
        const model = dataString(data, 'model') ?? dataString(object(data.config), 'model')
        const systemPrompt = dataString(data, 'systemPrompt', 'system')
        const prompt = data.prompt ?? data.input ?? data.messages
        const toolsValue = Array.isArray(data.tools)
          ? data.tools.flatMap((item) => {
              const schema = schemaValue(item)
              return schema === undefined ? [] : [schema]
            })
          : undefined
        const options = object(data.options ?? data.config)
        if (provider !== undefined) request.provider = provider
        if (model !== undefined) request.model = model
        if (systemPrompt !== undefined) request.systemPrompt = systemPrompt
        if (prompt !== undefined) request.prompt = prompt
        if (toolsValue !== undefined) request.tools = toolsValue
        if (Object.keys(options).length > 0) request.options = options
        const retry = dataNumber(data, 'retry')
        const maxRetries = dataNumber(data, 'maxRetries')
        const usage = usageValue(data.usage)
        if (retry !== undefined) request.retry = retry
        if (maxRetries !== undefined) request.maxRetries = maxRetries
        if (usage !== undefined) request.usage = usage
        const completedAt = dataNumber(data, 'completedAt')
        const requestError = errorValue(data.error)
        if (completedAt !== undefined || data.status !== undefined || requestError !== undefined) {
          request.completedAt = completedAt ?? event.timestamp
          request.status = status(data.status, requestError ? 'error' : 'complete')
          request.error = requestError
        }
        updateRequestRecord(request)
        continue
      }

      if (event.type === 'assistant.delta' || event.type === 'assistant.end') {
        const request = ensureRequest(event, data)
        const assistantKey = event.requestId ?? `${request.turn}:${request.step}`
        const recordId = assistantKeys.get(assistantKey) ?? `assistant:${assistantKey}`
        assistantKeys.set(assistantKey, recordId)
        const existing = records.get(recordId)
        const text = dataString(data, 'text', 'content', 'delta')
        const reasoning = dataString(data, 'reasoning', 'thinking', 'think')
        const startedAt = existing?.startedAt ?? request.startedAt
        const firstTokenAt =
          existing?.firstTokenAt ?? (text !== undefined || reasoning !== undefined ? event.timestamp : undefined)
        const complete = event.type === 'assistant.end'
        const record = ensureRecord(recordId, {
          seq: event.seq,
          kind: 'assistant',
          turn: request.turn,
          step: request.step,
          status: complete ? 'complete' : 'running',
          startedAt,
          firstTokenAt,
          completedAt: complete ? event.timestamp : undefined,
          title: 'Assistant',
          preview: existing?.preview,
          output: existing?.output,
          reasoning: existing?.reasoning,
          requestId: request.requestId,
          usage: usageValue(data.usage),
          level: 0,
        })
        if (text !== undefined) {
          record.preview = complete ? text : `${record.preview ?? ''}${text}`
          record.output = complete ? text : `${typeof record.output === 'string' ? record.output : ''}${text}`
        }
        if (reasoning !== undefined) record.reasoning = complete ? reasoning : `${record.reasoning ?? ''}${reasoning}`
        record.status = complete ? 'complete' : 'running'
        record.startedAt = startedAt
        record.firstTokenAt = firstTokenAt
        if (complete) record.completedAt = event.timestamp
        const usage = usageValue(data.usage)
        if (usage !== undefined) record.usage = usage
        if (complete && request.status === 'running') {
          request.status = 'complete'
          request.completedAt = event.timestamp
        }
        updateRequestRecord(request)
        const toolCalls = Array.isArray(data.toolCalls) ? data.toolCalls : []
        for (const [index, rawCall] of toolCalls.entries()) {
          const callData = object(rawCall)
          const callId = dataString(callData, 'callId', 'id')
          const name = dataString(callData, 'name', 'toolName')
          if (callId === undefined || name === undefined) continue
          const parentCallId = dataString(callData, 'parentCallId', 'parentId')
          const tool: MutableTool = {
            callId,
            ...(parentCallId === undefined ? {} : { parentCallId }),
            name,
            argsRaw: dataString(callData, 'argsRaw', 'arguments', 'args', 'input') ?? '',
            seq: event.seq + index / 1000,
            startedAt: dataNumber(callData, 'startedAt', 'callTime') ?? event.timestamp,
            status: 'running',
            schema: schemaValue(callData.schema, name),
            level: levelFor(parentCallId, tools),
          }
          tools.set(callId, tool)
          records.set(`tool:${callId}`, {
            id: `tool:${callId}`,
            seq: tool.seq,
            kind: tool.level > 0 ? 'subtool' : 'tool',
            turn: request.turn,
            step: request.step,
            status: 'running',
            startedAt: tool.startedAt,
            title: name,
            preview: tool.argsRaw,
            input: tool.argsRaw,
            toolName: name,
            callId,
            ...(parentCallId === undefined ? {} : { parentCallId }),
            schema: tool.schema,
            level: tool.level,
          })
        }
        continue
      }

      if (event.type === 'user.message') {
        const text = payloadText(data, 'text', 'content', 'message') ?? ''
        const source = dataString(data, 'source', 'author', 'sender')
        const recordId = `user:${event.seq}`
        records.set(recordId, {
          id: recordId,
          seq: event.seq,
          kind: 'user',
          turn: turnOf(event, data),
          step: stepOf(event, data),
          status: 'complete',
          startedAt: event.timestamp,
          completedAt: event.timestamp,
          title: dataString(data, 'title') ?? 'User',
          preview: text,
          input: data.content ?? data.text ?? text,
          ...(source === undefined ? {} : { source }),
          metadata: Object.keys(data).length > 0 ? data : undefined,
          level: 0,
        })
        continue
      }

      if (event.type === 'tool.start') {
        const callId = event.callId ?? dataString(data, 'callId', 'id') ?? `call:${event.seq}`
        const parentCallId = event.parentCallId ?? dataString(data, 'parentCallId', 'parentId')
        const name = dataString(data, 'name', 'toolName') ?? 'Tool'
        const argsRaw = dataString(data, 'argsRaw', 'arguments', 'args', 'input') ?? ''
        const schema = schemaValue(data.schema, name)
        const tool: MutableTool = {
          callId,
          ...(parentCallId === undefined ? {} : { parentCallId }),
          name,
          argsRaw,
          seq: event.seq,
          startedAt: event.timestamp,
          status: 'running',
          ...(schema === undefined ? {} : { schema }),
          level: levelFor(parentCallId, tools),
        }
        tools.set(callId, tool)
        records.set(`tool:${callId}`, {
          id: `tool:${callId}`,
          seq: event.seq,
          kind: tool.level > 0 ? 'subtool' : 'tool',
          turn: turnOf(event, data),
          step: stepOf(event, data),
          status: 'running',
          startedAt: event.timestamp,
          title: name,
          preview: argsRaw,
          input: argsRaw,
          toolName: name,
          callId,
          ...(parentCallId === undefined ? {} : { parentCallId }),
          schema,
          level: tool.level,
        })
        continue
      }

      if (event.type === 'tool.result') {
        const callId = event.callId ?? dataString(data, 'callId', 'id') ?? `call:${event.seq}`
        const parentCallId = event.parentCallId ?? dataString(data, 'parentCallId', 'parentId')
        const previous = tools.get(callId)
        const name = previous?.name ?? dataString(data, 'name', 'toolName') ?? 'Tool'
        const tool: MutableTool = previous ?? {
          callId,
          ...(parentCallId === undefined ? {} : { parentCallId }),
          name,
          argsRaw: dataString(data, 'argsRaw', 'arguments', 'args', 'input') ?? '',
          seq: event.seq,
          startedAt: dataNumber(data, 'startedAt', 'callTime') ?? event.timestamp,
          status: 'running',
          level: levelFor(parentCallId, tools),
        }
        const error = errorValue(data.error)
        const output = data.output ?? data.result ?? data.content ?? data.payload
        const resultText = payloadText(data, 'resultText', 'text', 'message')
        tool.completedAt = event.timestamp
        tool.status = status(data.status, error || data.isError === true ? 'error' : 'complete')
        tool.result = output
        tool.resultText = resultText
        tool.error = error
        tools.set(callId, tool)
        const record = records.get(`tool:${callId}`) ?? {
          id: `tool:${callId}`,
          seq: tool.seq,
          kind: tool.level > 0 ? ('subtool' as const) : ('tool' as const),
          turn: turnOf(event, data),
          step: stepOf(event, data),
          status: tool.status,
          startedAt: tool.startedAt,
          title: name,
          toolName: name,
          callId,
          level: tool.level,
        }
        record.status = tool.status
        record.completedAt = event.timestamp
        record.output = output
        record.preview = resultText ?? record.preview
        record.error = error
        record.toolName = name
        record.input = tool.argsRaw
        records.set(record.id, record)
        continue
      }

      if (event.type === 'system.update' || event.type === 'context.update') {
        const text = payloadText(data, 'text', 'content', 'message') ?? ''
        records.set(`${event.type}:${event.seq}`, {
          id: `${event.type}:${event.seq}`,
          seq: event.seq,
          kind: event.type === 'system.update' ? 'system' : 'context',
          turn: turnOf(event, data),
          step: stepOf(event, data),
          status: 'complete',
          startedAt: event.timestamp,
          completedAt: event.timestamp,
          title:
            dataString(data, 'title', 'label') ?? (event.type === 'system.update' ? 'System update' : 'Context update'),
          preview: text,
          input: data,
          level: 0,
        })
        continue
      }

      if (event.type === 'compaction.start' || event.type === 'compaction.end') {
        const request = ensureRequest(event, data, 'compaction')
        const recordId = `compaction:${request.requestId}`
        const complete = event.type === 'compaction.end'
        const text = payloadText(data, 'summary', 'text', 'content')
        const record = ensureRecord(recordId, {
          seq: event.seq,
          kind: 'compaction',
          turn: request.turn,
          step: request.step,
          status: complete ? 'complete' : 'running',
          startedAt: request.startedAt,
          title: 'Compaction',
          preview: text,
          output: text,
          requestId: request.requestId,
          level: 0,
        })
        record.status = complete ? 'complete' : 'running'
        record.preview = text ?? record.preview
        record.output = text ?? record.output
        if (complete) record.completedAt = event.timestamp
        updateRequestRecord(request)
        continue
      }

      if (event.type === 'error') {
        const error = errorValue(data.error ?? data)
        const requestId = event.requestId ?? dataString(data, 'requestId')
        const callId = event.callId ?? dataString(data, 'callId')
        if (requestId !== undefined) {
          const request = requests.get(requestId)
          if (request !== undefined) {
            request.status = 'error'
            request.completedAt = event.timestamp
            request.error = error
            updateRequestRecord(request)
          }
        }
        if (callId !== undefined) {
          const record = records.get(`tool:${callId}`)
          if (record !== undefined) {
            record.status = 'error'
            record.completedAt = event.timestamp
            record.error = error
          }
        }
      }
    }

    const requestValues = [...requests.values()].sort((left, right) => left.seq - right.seq)
    const requestLookup = new Map(requestValues.map((request) => [request.requestId, requestFromMutable(request)]))
    const recordsValue: TraceRecord[] = [...records.values()]
      .map((record) => {
        const request = record.requestId === undefined ? undefined : requestLookup.get(record.requestId)
        const tool = record.callId === undefined ? undefined : tools.get(record.callId)
        return {
          ...record,
          ...(request === undefined ? {} : { request }),
          ...(tool === undefined ? {} : { tool: toolFromMutable(tool) }),
          ...(record.completedAt === undefined
            ? {}
            : { durationMs: recordDuration(record.startedAt, record.completedAt) }),
        }
      })
      .sort((left, right) => left.seq - right.seq || left.id.localeCompare(right.id))

    this.snapshotValue = {
      events,
      requests: requestValues.map(requestFromMutable),
      records: recordsValue,
      timeline: timelineFor(recordsValue),
    }
  }
}

export { EMPTY_SNAPSHOT }
