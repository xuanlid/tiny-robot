import type {
  TraceEvent,
  TraceInput,
  TraceMessage,
  TraceMessageBlock,
  TraceRequestInput,
  TraceToolCallInput,
  TraceToolResultInput,
} from '../types'

interface DraftEvent extends Omit<TraceEvent, 'seq'> {
  sourceSeq: number
  priority: number
}

function textBlocks(message: TraceMessage, type: 'text' | 'reasoning'): string {
  return message.content
    .filter((block): block is Extract<TraceMessageBlock, { type: 'text' | 'reasoning' }> => block.type === type)
    .map((block) => block.text)
    .filter(Boolean)
    .join('\n\n')
}

function sourceData(message: TraceMessage): Record<string, unknown> {
  return {
    content: message.content,
    ...(message.id === undefined ? {} : { messageId: message.id }),
    ...(message.source === undefined ? {} : { source: message.source }),
    ...(message.metadata === undefined ? {} : { metadata: message.metadata }),
  }
}

function messageEvent(sessionId: string, message: TraceMessage): DraftEvent {
  const text = textBlocks(message, 'text')
  const reasoning = textBlocks(message, 'reasoning')
  const data = sourceData(message)
  if (message.role === 'assistant') {
    return {
      sessionId,
      type: 'assistant.end',
      timestamp: message.timestamp,
      ...(message.turn === undefined ? {} : { turn: message.turn }),
      ...(message.step === undefined ? {} : { step: message.step }),
      ...(typeof message.metadata?.requestId === 'string' ? { requestId: message.metadata.requestId } : {}),
      data: {
        ...data,
        ...(text === '' ? {} : { text }),
        ...(reasoning === '' ? {} : { reasoning }),
        toolCalls: message.content.filter((block) => block.type === 'tool-call'),
      },
      sourceSeq: message.seq,
      priority: 20,
    }
  }
  const type = message.role === 'user' ? 'user.message' : message.role === 'system' ? 'system.update' : 'context.update'
  return {
    sessionId,
    type,
    timestamp: message.timestamp,
    ...(message.turn === undefined ? {} : { turn: message.turn }),
    ...(message.step === undefined ? {} : { step: message.step }),
    data: { ...data, text },
    sourceSeq: message.seq,
    priority: message.role === 'system' ? 0 : message.role === 'user' ? 5 : 10,
  }
}

function requestEvents(sessionId: string, request: TraceRequestInput): DraftEvent {
  return {
    sessionId,
    type: 'request.start',
    timestamp: request.timestamp,
    turn: request.turn,
    step: request.step,
    requestId: request.requestId,
    data: {
      purpose: request.purpose,
      provider: request.provider,
      model: request.model,
      systemPrompt: request.systemPrompt,
      prompt: request.prompt,
      tools: request.tools,
      options: request.options,
      status: request.status,
      completedAt: request.completedAt,
      retry: request.retry,
      maxRetries: request.maxRetries,
      usage: request.usage,
      error: request.error,
    },
    sourceSeq: request.seq,
    priority: 1,
  }
}

function toolCallEvent(sessionId: string, call: TraceToolCallInput): DraftEvent {
  return {
    sessionId,
    type: 'tool.start',
    timestamp: call.timestamp,
    ...(call.turn === undefined ? {} : { turn: call.turn }),
    ...(call.step === undefined ? {} : { step: call.step }),
    callId: call.callId,
    ...(call.parentCallId === undefined ? {} : { parentCallId: call.parentCallId }),
    data: {
      name: call.name,
      argsRaw: call.argsRaw,
      schema: call.schema,
    },
    sourceSeq: call.seq,
    priority: 30,
  }
}

function toolResultEvent(sessionId: string, result: TraceToolResultInput): DraftEvent {
  return {
    sessionId,
    type: 'tool.result',
    timestamp: result.timestamp,
    ...(result.turn === undefined ? {} : { turn: result.turn }),
    ...(result.step === undefined ? {} : { step: result.step }),
    callId: result.callId,
    data: {
      result: result.result,
      resultText: result.resultText,
      status: result.status,
      error: result.error,
    },
    sourceSeq: result.seq,
    priority: 40,
  }
}

/** Convert existing business messages and runtime facts into normalized Trace events. */
export function projectTraceInput(input: TraceInput): readonly TraceEvent[] {
  const drafts: DraftEvent[] = [
    ...(input.events ?? []).map((event) => ({ ...event, sourceSeq: event.seq, priority: 50 })),
    ...(input.messages ?? []).map((message) => messageEvent(input.sessionId, message)),
    ...(input.requests ?? []).map((request) => requestEvents(input.sessionId, request)),
    ...(input.toolCalls ?? []).map((call) => toolCallEvent(input.sessionId, call)),
    ...(input.toolResults ?? []).map((result) => toolResultEvent(input.sessionId, result)),
  ]
  drafts.sort((left, right) => left.sourceSeq - right.sourceSeq || left.priority - right.priority)
  return drafts.map((draft, index) => {
    const { sourceSeq, priority: _priority, ...event } = draft
    return {
      ...event,
      seq: index + 1,
      data: {
        ...(event.data !== null && typeof event.data === 'object' && !Array.isArray(event.data)
          ? (event.data as Record<string, unknown>)
          : { value: event.data }),
        sourceSeq,
      },
    }
  })
}
