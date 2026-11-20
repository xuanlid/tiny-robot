import { bindVanillaTheme } from '../../theme/service'
import { TraceStore } from './store'
import type {
  TraceEvent,
  TraceInput,
  TraceRecord,
  TraceSnapshot,
  TraceSource,
  TraceStatus,
  TrajectoryEvent,
  TrajectoryInstance,
  TrajectoryMessages,
  TrajectoryOptions,
} from '../types'

type TimelineMode = 'sequence' | 'duration' | 'actual'
type InspectorTab = 'summary' | 'payload' | 'result' | 'schema' | 'timing'
type RecordRange = { start: number; end: number }

const DEFAULT_MESSAGES: TrajectoryMessages = {
  empty: '暂无轨迹记录',
  loading: '正在加载更早记录…',
  running: '运行中',
  noResult: '暂无结果',
  loadOlder: '加载更早记录',
  selected: '已选择',
}

const STATUS_LABEL: Record<TraceStatus, string> = {
  running: 'Running',
  complete: 'Completed',
  error: 'Error',
}

const KIND_LABEL: Record<TraceRecord['kind'], string> = {
  system: 'SYSTEM',
  user: 'USER',
  context: 'CONTEXT',
  assistant: 'ASSISTANT',
  request: 'REQUEST',
  tool: 'TOOL',
  subtool: 'SUBTOOL',
  compaction: 'COMPACTION',
}

const TAB_LABEL: Record<InspectorTab, string> = {
  summary: 'Summary',
  payload: 'Payload',
  result: 'Result',
  schema: 'Schema',
  timing: 'Timing',
}

interface InternalOptions {
  root: Document
  container: HTMLElement
  source?: TraceSource
  locale?: TrajectoryOptions['locale']
  virtualize: boolean
  showReasoning: boolean
  showHeader: boolean
  renderMarkdown?: TrajectoryOptions['renderMarkdown']
  renderTool?: TrajectoryOptions['renderTool']
  messages: TrajectoryMessages
  onEvent?: TrajectoryOptions['onEvent']
}

interface TimelineProjection {
  start: number
  end: number
  spans: { record: TraceRecord; start: number; end: number; lane: number }[]
}

function rootDocument(options: TrajectoryOptions): Document {
  const root = options.root ?? (typeof document === 'undefined' ? undefined : document)
  if (!root) throw new Error('Trajectory requires a Document root')
  if (root.nodeType !== 9) throw new Error('Trajectory root must be a Document')
  if (!options.container || options.container.nodeType !== 1)
    throw new Error('Trajectory requires an HTMLElement container')
  if (options.container.ownerDocument !== root) throw new Error('Trajectory container belongs to another Document')
  return root
}

function element<K extends keyof HTMLElementTagNameMap>(
  root: Document,
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = root.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function button(root: Document, label: string, action: string, className = 'tr-trajectory__button'): HTMLButtonElement {
  const node = element(root, 'button', className, label)
  node.type = 'button'
  node.dataset.action = action
  return node
}

function formatDuration(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '—'
  if (value < 1_000) return `${Math.round(value)} ms`
  return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 2)} s`
}

function formatTime(value: number | undefined, locale?: string): string {
  if (value === undefined) return '—'
  try {
    const base = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(value)
    return `${base}.${String(Math.trunc(value) % 1_000).padStart(3, '0')}`
  } catch {
    return new Date(value).toISOString()
  }
}

function json(value: unknown): string {
  if (value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function truncate(value: string | undefined, length = 180): string {
  if (value === undefined) return ''
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`
}

function recordText(record: TraceRecord): string {
  return [
    record.title,
    record.preview,
    record.reasoning,
    record.toolName,
    record.request?.provider,
    record.request?.model,
    record.request?.systemPrompt,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
}

function timelineFor(snapshot: TraceSnapshot, mode: TimelineMode): TimelineProjection | null {
  const records = snapshot.records.filter((record) => record.startedAt !== undefined)
  if (records.length === 0) return null
  if (mode === 'sequence') {
    const spans = records.map((record, index) => ({
      record,
      start: index,
      end: index + 1,
      lane:
        record.kind === 'tool' || record.kind === 'subtool'
          ? 2
          : record.kind === 'assistant' || record.kind === 'request'
            ? 1
            : 0,
    }))
    return { start: 0, end: records.length, spans }
  }
  if (mode === 'duration') {
    let cursor = 0
    const spans = records.map((record) => {
      const duration = Math.max(1, record.durationMs ?? 1)
      const span = {
        record,
        start: cursor,
        end: cursor + duration,
        lane:
          record.kind === 'tool' || record.kind === 'subtool'
            ? 2
            : record.kind === 'assistant' || record.kind === 'request'
              ? 1
              : 0,
      }
      cursor += duration
      return span
    })
    return { start: 0, end: cursor, spans }
  }
  const start = Math.min(...records.map((record) => record.startedAt as number))
  const end = Math.max(...records.map((record) => record.completedAt ?? (record.startedAt as number)))
  return {
    start,
    end: Math.max(start + 1, end),
    spans: records.map((record) => ({
      record,
      start: record.startedAt as number,
      end: Math.max(record.startedAt as number, record.completedAt ?? (record.startedAt as number)),
      lane:
        record.kind === 'tool' || record.kind === 'subtool'
          ? 2
          : record.kind === 'assistant' || record.kind === 'request'
            ? 1
            : 0,
    })),
  }
}

function rangeContains(span: { start: number; end: number }, range: RecordRange | null): boolean {
  return range === null || (span.start <= range.end && span.end >= range.start)
}

function appendField(root: Document, parent: HTMLElement, label: string, value: unknown): void {
  const row = element(root, 'div', 'tr-trajectory__field')
  row.append(
    element(root, 'dt', undefined, label),
    element(root, 'dd', undefined, value === undefined ? '—' : String(value)),
  )
  parent.append(row)
}

function appendPre(root: Document, parent: HTMLElement, value: unknown, className = 'tr-trajectory__pre'): void {
  const pre = element(root, 'pre', className, value === undefined ? '' : json(value))
  parent.append(pre)
}

function appendJsonTree(root: Document, parent: HTMLElement, value: unknown, label = 'value', depth = 0): void {
  if (depth > 5 || value === null || typeof value !== 'object') {
    const row = element(root, 'div', 'tr-trajectory__json-leaf')
    row.append(
      element(root, 'span', 'tr-trajectory__json-key', label),
      element(
        root,
        'code',
        `tr-trajectory__json-value is-${value === null ? 'null' : typeof value}`,
        value === null ? 'null' : String(value),
      ),
    )
    parent.append(row)
    return
  }
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value)
  const details = element(root, 'details', 'tr-trajectory__json-node')
  details.open = depth < 1
  const summary = element(
    root,
    'summary',
    undefined,
    `${label} · ${Array.isArray(value) ? 'array' : 'object'} (${entries.length})`,
  )
  details.append(summary)
  const children = element(root, 'div', 'tr-trajectory__json-children')
  for (const [key, child] of entries) appendJsonTree(root, children, child, key, depth + 1)
  details.append(children)
  parent.append(details)
}

function safeEmit(options: InternalOptions, event: TrajectoryEvent): void {
  try {
    options.onEvent?.(event)
  } catch {
    // Host telemetry and Angular output callbacks must not break cleanup.
  }
}

function errorEvent(options: InternalOptions, stage: string, value: unknown): void {
  const error = value instanceof Error ? value : new Error(String(value))
  safeEmit(options, { type: 'error', stage, error })
}

/** DOM-only Trajectory implementation. It owns no framework runtime. */
export function createTrace(input: TrajectoryOptions): TrajectoryInstance {
  const root = rootDocument(input)
  const container = input.container
  const options: InternalOptions = {
    root,
    container,
    source: input.source,
    locale: input.locale,
    virtualize: input.virtualize ?? true,
    showReasoning: input.showReasoning ?? true,
    showHeader: input.showHeader ?? true,
    renderMarkdown: input.renderMarkdown,
    renderTool: input.renderTool,
    messages: { ...DEFAULT_MESSAGES, ...(input.messages ?? {}) },
    onEvent: input.onEvent,
  }
  const initialInput: TraceInput | readonly TraceEvent[] = input.input ?? input.events ?? []
  const store = new TraceStore(initialInput)
  const host = element(root, 'div', 'tr-trajectory')
  host.dataset.trTrajectory = ''
  if (input.theme === 'light' || input.theme === 'dark') host.dataset.trTrajectoryTheme = input.theme
  container.append(host)
  const releaseTheme = bindVanillaTheme(host, root)
  const header = element(root, 'div', 'tr-trajectory__header')
  const toolbar = element(root, 'div', 'tr-trajectory__toolbar')
  const timeline = element(root, 'section', 'tr-trajectory__timeline')
  timeline.setAttribute('aria-label', 'Trajectory timeline')
  const content = element(root, 'div', 'tr-trajectory__content')
  const ledger = element(root, 'section', 'tr-trajectory__ledger')
  ledger.setAttribute('aria-label', 'Trajectory records')
  const inspector = element(root, 'aside', 'tr-trajectory__inspector')
  inspector.setAttribute('aria-label', 'Event details')
  content.append(ledger, inspector)
  if (options.showHeader) host.append(header)
  host.append(toolbar, timeline, content)

  let currentOptions = options
  let selectedId: string | null = null
  let inspectorTab: InspectorTab = 'summary'
  let timelineMode: TimelineMode = 'sequence'
  let timelineRange: RecordRange | null = null
  let searchQuery = ''
  let loadingOlder = false
  let hasMore = false
  let cursor: string | null = null
  let destroyed = false
  let renderedOnce = false
  let frame: number | undefined
  let sourceUnsubscribe: (() => void) | undefined
  let initialLoading = Boolean(
    currentOptions.source?.loadInitial && (input.events?.length ?? 0) === 0 && input.input === undefined,
  )
  const pendingLiveEvents: TraceEvent[] = []
  let timelinePointerStart: number | null = null
  let timelinePointerCleanup: (() => void) | undefined
  const collapsedTurns = new Set<number>()
  const collapsedAssistants = new Set<string>()
  const collapsedTools = new Set<string>()
  const listeners: (() => void)[] = []

  const requestFrame = (): void => {
    if (destroyed || frame !== undefined) return
    const view = root.defaultView
    if (view?.requestAnimationFrame) {
      frame = view.requestAnimationFrame(() => {
        frame = undefined
        render()
      })
    } else {
      frame = Number(
        setTimeout(() => {
          frame = undefined
          render()
        }, 16),
      )
    }
  }

  const recordById = (id: string | null): TraceRecord | undefined =>
    id === null ? undefined : store.getSnapshot().records.find((record) => record.id === id)

  const select = (id: string | null): void => {
    selectedId = id
    safeEmit(currentOptions, { type: 'record_select', recordId: id })
    requestFrame()
  }

  const renderHeader = (): void => {
    header.replaceChildren()
    const title = element(root, 'div', 'tr-trajectory__header-title')
    title.append(element(root, 'span', 'tr-trajectory__brand-mark', '⌁'), element(root, 'strong', undefined, 'Trace'))
    const tabs = element(root, 'div', 'tr-trajectory__header-tabs')
    const chat = button(root, '对话', 'header-chat', 'tr-trajectory__header-tab')
    chat.disabled = true
    const trace = button(root, '轨迹', 'header-trace', 'tr-trajectory__header-tab')
    trace.classList.add('is-active')
    tabs.append(chat, trace)
    const snapshot = store.getSnapshot()
    const completed = snapshot.records.filter((record) => record.status === 'complete').length
    const status = element(
      root,
      'span',
      'tr-trajectory__header-status',
      `${snapshot.records.length} 条记录 · ${completed} 已完成`,
    )
    header.append(title, tabs, status)
  }

  const renderToolbar = (): void => {
    toolbar.replaceChildren()
    const modes = element(root, 'div', 'tr-trajectory__toolbar-group tr-trajectory__mode-group')
    for (const mode of ['sequence', 'duration', 'actual'] as const) {
      const label = mode === 'sequence' ? 'Sequence' : mode === 'duration' ? 'Duration' : 'Actual time'
      const item = button(root, label, `mode:${mode}`)
      item.setAttribute('aria-pressed', String(timelineMode === mode))
      if (timelineMode === mode) item.classList.add('is-active')
      modes.append(item)
    }
    const actions = element(root, 'div', 'tr-trajectory__toolbar-group tr-trajectory__fold-group')
    const collapseTurns = button(root, 'Collapse turns', 'collapse-turns')
    const collapseCalls = button(root, 'Collapse calls', 'collapse-calls')
    const collapseTools = button(root, 'Collapse subcalls', 'collapse-tools')
    actions.append(collapseTurns, collapseCalls, collapseTools)
    const search = element(root, 'input', 'tr-trajectory__search')
    search.type = 'search'
    search.placeholder = 'Search trajectory'
    search.setAttribute('aria-label', 'Search trajectory')
    search.value = searchQuery
    toolbar.append(modes, actions, search)
    if (hasMore) toolbar.append(button(root, loadingOlder ? 'Loading…' : 'Load older', 'load-older'))
  }

  const renderTimeline = (): void => {
    timeline.replaceChildren()
    const heading = element(root, 'div', 'tr-trajectory__timeline-header')
    heading.append(element(root, 'strong', undefined, 'Overview'))
    const modeLabel =
      timelineMode === 'sequence' ? 'Sequence' : timelineMode === 'duration' ? 'Own duration' : 'Recorded time'
    heading.append(element(root, 'span', undefined, modeLabel))
    timeline.append(heading)
    const projection = timelineFor(store.getSnapshot(), timelineMode)
    if (projection === null) {
      timeline.append(element(root, 'div', 'tr-trajectory__timeline-empty', 'No timing data'))
      return
    }
    const domain = element(root, 'div', 'tr-trajectory__timeline-domain')
    domain.tabIndex = 0
    domain.setAttribute('role', 'listbox')
    domain.setAttribute('aria-label', 'Trajectory timeline records')
    for (let lane = 0; lane < 3; lane++) {
      const label = element(
        root,
        'span',
        'tr-trajectory__timeline-lane-label',
        lane === 0 ? 'Context' : lane === 1 ? 'Assistant' : 'Tools',
      )
      label.style.top = `${lane * 22}px`
      domain.append(label)
    }
    const usable = Math.max(1, projection.end - projection.start)
    for (const span of projection.spans) {
      const node = element(root, 'button', 'tr-trajectory__timeline-span')
      node.type = 'button'
      node.dataset.recordId = span.record.id
      node.style.left = `${((span.start - projection.start) / usable) * 100}%`
      node.style.width = `${Math.max(0.35, ((span.end - span.start) / usable) * 100)}%`
      node.style.top = `${span.lane * 22 + 2}px`
      node.dataset.kind = span.record.kind
      node.dataset.status = span.record.status
      node.title = `${KIND_LABEL[span.record.kind]} · ${span.record.title} · ${formatDuration(span.record.durationMs)}`
      if (span.record.id === selectedId) node.classList.add('is-selected')
      if (!rangeContains(span, timelineRange)) node.classList.add('is-muted')
      domain.append(node)
    }
    if (timelineRange !== null) {
      const selection = element(root, 'div', 'tr-trajectory__timeline-selection')
      selection.style.left = `${((timelineRange.start - projection.start) / usable) * 100}%`
      selection.style.width = `${((timelineRange.end - timelineRange.start) / usable) * 100}%`
      domain.append(selection)
    }
    timeline.append(domain)
  }

  const renderRecordRow = (record: TraceRecord, projection: TimelineProjection | null): HTMLElement => {
    const row = element(root, 'div', 'tr-trajectory__record')
    row.dataset.recordId = record.id
    row.dataset.kind = record.kind
    row.dataset.status = record.status
    row.tabIndex = 0
    row.setAttribute('role', 'button')
    row.setAttribute('aria-pressed', String(selectedId === record.id))
    row.style.paddingLeft = `${8 + record.level * 18}px`
    if (selectedId === record.id) row.classList.add('is-selected')
    const assistantCollapsed = record.kind === 'assistant' && collapsedAssistants.has(record.id)
    if (assistantCollapsed) row.classList.add('is-collapsed')
    const ordinal = element(root, 'span', 'tr-trajectory__record-ordinal', `#${record.seq}`)
    const tag = element(root, 'span', `tr-trajectory__record-kind is-${record.kind}`, KIND_LABEL[record.kind])
    const body = element(root, 'div', 'tr-trajectory__record-body')
    const content =
      record.kind === 'tool' || record.kind === 'subtool'
        ? [record.title, record.preview].filter(Boolean).join(' · ')
        : (record.preview ?? '')
    const preview = assistantCollapsed ? '内容已折叠，点击记录查看完整输出' : truncate(content.replace(/\s+/g, ' '))
    const description = element(root, 'div', 'tr-trajectory__record-preview', preview)
    body.append(description)
    const meta = element(root, 'div', 'tr-trajectory__record-meta')
    meta.append(
      element(root, 'span', `tr-trajectory__status is-${record.status}`, STATUS_LABEL[record.status]),
      element(root, 'span', undefined, formatDuration(record.durationMs)),
    )
    if (record.turn !== undefined)
      meta.append(element(root, 'span', undefined, `T${record.turn}${record.step ? ` · S${record.step}` : ''}`))
    if (projection) {
      const span = projection.spans.find((item) => item.record.id === record.id)
      if (span && !rangeContains(span, timelineRange)) row.classList.add('is-outside-range')
    }
    row.append(ordinal, tag, body, meta)
    return row
  }

  const isSearchMatch = (record: TraceRecord): boolean =>
    searchQuery.trim() === '' || recordText(record).toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase())

  const isHiddenByTool = (record: TraceRecord): boolean => {
    if (record.kind !== 'subtool' || record.parentCallId === undefined) return false
    return collapsedTools.has(`tool:${record.parentCallId}`)
  }

  const renderLedger = (): void => {
    const previousScrollTop = ledger.scrollTop
    const previousHeight = ledger.scrollHeight
    ledger.replaceChildren()
    const snapshot = store.getSnapshot()
    const projection = timelineFor(snapshot, timelineMode)
    if (snapshot.records.length === 0) {
      ledger.append(element(root, 'div', 'tr-trajectory__empty', currentOptions.messages.empty))
      return
    }
    const groups = new Map<number, TraceRecord[]>()
    for (const record of snapshot.records) {
      if (!isSearchMatch(record) || isHiddenByTool(record)) continue
      if (projection) {
        const span = projection.spans.find((item) => item.record.id === record.id)
        if (span && !rangeContains(span, timelineRange)) continue
      }
      const turn = record.turn ?? 0
      const group = groups.get(turn) ?? []
      group.push(record)
      groups.set(turn, group)
    }
    for (const [turn, records] of groups) {
      const turnHeader = element(root, 'div', 'tr-trajectory__turn')
      const turnButton = button(
        root,
        collapsedTurns.has(turn) ? `Turn ${turn} ▸` : `Turn ${turn} ▾`,
        `toggle-turn:${turn}`,
        'tr-trajectory__turn-button',
      )
      turnHeader.append(turnButton)
      ledger.append(turnHeader)
      if (collapsedTurns.has(turn)) {
        ledger.append(element(root, 'div', 'tr-trajectory__collapsed', `${records.length} records collapsed`))
        continue
      }
      let step: number | undefined
      for (const record of records) {
        if (record.step !== undefined && record.step !== step) {
          step = record.step
          ledger.append(element(root, 'div', 'tr-trajectory__step', `Step ${step}`))
        }
        ledger.append(renderRecordRow(record, projection))
      }
    }
    if (groups.size === 0) ledger.append(element(root, 'div', 'tr-trajectory__empty', 'No matching records'))
    if (previousScrollTop > 0 && previousHeight > 0) ledger.scrollTop = previousScrollTop
  }

  const renderInspector = (): void => {
    inspector.replaceChildren()
    const record = recordById(selectedId)
    if (record === undefined) {
      inspector.hidden = true
      return
    }
    inspector.hidden = false
    const header = element(root, 'div', 'tr-trajectory__inspector-header')
    header.append(
      element(root, 'div', 'tr-trajectory__inspector-title', `${KIND_LABEL[record.kind]} · ${record.title}`),
      button(root, '×', 'clear-selection', 'tr-trajectory__close'),
    )
    const tabs = element(root, 'div', 'tr-trajectory__tabs')
    for (const tab of Object.keys(TAB_LABEL) as InspectorTab[]) {
      const item = button(root, TAB_LABEL[tab], `tab:${tab}`, 'tr-trajectory__tab')
      item.setAttribute('aria-selected', String(inspectorTab === tab))
      if (inspectorTab === tab) item.classList.add('is-active')
      tabs.append(item)
    }
    const panel = element(root, 'div', 'tr-trajectory__panel')
    if (inspectorTab === 'summary') {
      const fields = element(root, 'dl', 'tr-trajectory__fields')
      appendField(root, fields, 'Status', STATUS_LABEL[record.status])
      appendField(root, fields, 'Turn', record.turn)
      appendField(root, fields, 'Step', record.step)
      appendField(root, fields, 'Request', record.requestId)
      appendField(root, fields, 'Tool', record.toolName)
      appendField(root, fields, 'Call ID', record.callId)
      if (record.request) {
        appendField(root, fields, 'Provider', record.request.provider)
        appendField(root, fields, 'Model', record.request.model)
        appendField(root, fields, 'Purpose', record.request.purpose)
      }
      panel.append(fields)
      if (record.preview) {
        panel.append(element(root, 'h4', undefined, 'Preview'))
        if (currentOptions.renderMarkdown) {
          panel.append(currentOptions.renderMarkdown(record.preview, { recordId: record.id, kind: record.kind }))
        } else {
          panel.append(element(root, 'p', 'tr-trajectory__text', record.preview))
        }
      }
      if (record.request?.systemPrompt) {
        panel.append(element(root, 'h4', undefined, 'System prompt'))
        appendPre(root, panel, record.request.systemPrompt)
      }
      if (record.request?.prompt !== undefined) {
        panel.append(element(root, 'h4', undefined, 'Request prompt'))
        if (typeof record.request.prompt === 'object' && record.request.prompt !== null) {
          appendJsonTree(root, panel, record.request.prompt, 'prompt')
        } else {
          appendPre(root, panel, record.request.prompt)
        }
      }
      if (currentOptions.showReasoning && record.reasoning) {
        panel.append(element(root, 'h4', undefined, 'Reasoning'))
        appendPre(root, panel, record.reasoning)
      }
      if (record.error) {
        panel.append(element(root, 'h4', undefined, 'Error'))
        appendPre(root, panel, record.error, 'tr-trajectory__pre is-error')
      }
      if (record.kind === 'tool' || record.kind === 'subtool') {
        const custom = currentOptions.renderTool?.({ record, document: root })
        if (custom) panel.append(custom)
      }
    } else if (inspectorTab === 'payload') {
      panel.append(element(root, 'h4', undefined, 'Input / Payload'))
      const payload = record.input ?? record.request?.prompt ?? record.request?.options ?? record.request?.systemPrompt
      if (payload !== null && typeof payload === 'object') appendJsonTree(root, panel, payload, 'payload')
      else appendPre(root, panel, payload, 'tr-trajectory__pre')
    } else if (inspectorTab === 'result') {
      panel.append(element(root, 'h4', undefined, 'Result'))
      const result = record.tool?.resultText ?? record.output ?? record.tool?.result
      if (result !== null && typeof result === 'object') appendJsonTree(root, panel, result, 'result')
      else
        appendPre(root, panel, result === undefined ? currentOptions.messages.noResult : result, 'tr-trajectory__pre')
    } else if (inspectorTab === 'schema') {
      panel.append(element(root, 'h4', undefined, 'Schema'))
      const schema = record.schema ?? record.tool?.schema ?? record.request?.tools
      if (schema !== null && typeof schema === 'object') appendJsonTree(root, panel, schema, 'schema')
      else appendPre(root, panel, schema, 'tr-trajectory__pre')
    } else {
      const fields = element(root, 'dl', 'tr-trajectory__fields')
      appendField(root, fields, 'Started', formatTime(record.startedAt, currentOptions.locale?.locale))
      appendField(root, fields, 'First token', formatTime(record.firstTokenAt, currentOptions.locale?.locale))
      appendField(root, fields, 'Completed', formatTime(record.completedAt, currentOptions.locale?.locale))
      appendField(root, fields, 'Duration', formatDuration(record.durationMs))
      if (record.firstTokenAt !== undefined && record.startedAt !== undefined) {
        appendField(root, fields, 'TTFT', formatDuration(record.firstTokenAt - record.startedAt))
      }
      if (record.usage) {
        appendField(root, fields, 'Input tokens', record.usage.inputTokens)
        appendField(root, fields, 'Output tokens', record.usage.outputTokens)
        appendField(root, fields, 'Reasoning tokens', record.usage.reasoningTokens)
      }
      panel.append(fields)
    }
    inspector.append(header, tabs, panel)
  }

  const render = (): void => {
    if (destroyed) return
    if (currentOptions.showHeader) renderHeader()
    renderToolbar()
    renderTimeline()
    renderLedger()
    renderInspector()
    content.classList.toggle('has-inspector', selectedId !== null && recordById(selectedId) !== undefined)
    if (!renderedOnce) {
      renderedOnce = true
      ledger.scrollTop = ledger.scrollHeight
    }
  }

  const loadOlder = async (): Promise<boolean> => {
    const loader = currentOptions.source?.loadOlder
    if (!loader || loadingOlder || !hasMore) return false
    loadingOlder = true
    safeEmit(currentOptions, { type: 'load_older_start' })
    try {
      const page = await loader(cursor)
      const beforeHeight = ledger.scrollHeight
      const beforeTop = ledger.scrollTop
      if (page.input !== undefined) {
        store.append({
          ...page.input,
          ...(page.events === undefined
            ? {}
            : {
                events: [...(page.input.events ?? []), ...page.events],
              }),
        })
      } else if (page.events !== undefined) {
        store.append({
          sessionId: page.events[0]?.sessionId ?? 'trace-session',
          events: page.events,
        })
      }
      cursor = page.cursor
      hasMore = page.hasMore
      render()
      ledger.scrollTop = beforeTop + (ledger.scrollHeight - beforeHeight)
      const loaded = Boolean((page.events?.length ?? 0) > 0 || page.input !== undefined)
      safeEmit(currentOptions, { type: 'load_older_end', loaded })
      return loaded
    } catch (error) {
      errorEvent(currentOptions, 'load_older', error)
      safeEmit(currentOptions, { type: 'load_older_end', loaded: false })
      return false
    } finally {
      loadingOlder = false
    }
  }

  const onClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action
    if (action?.startsWith('mode:')) {
      timelineMode = action.slice(5) as TimelineMode
      timelineRange = null
      requestFrame()
      return
    }
    if (action === 'clear-selection') {
      select(null)
      return
    }
    if (action === 'load-older') {
      void loadOlder()
      return
    }
    if (action === 'collapse-tools') {
      const toolIds = store
        .getSnapshot()
        .records.filter((record) => record.kind === 'tool')
        .map((record) => record.id)
      const collapse = toolIds.some((id) => !collapsedTools.has(id))
      for (const id of toolIds) {
        if (collapse) collapsedTools.add(id)
        else collapsedTools.delete(id)
      }
      requestFrame()
      return
    }
    if (action === 'collapse-calls') {
      const assistantIds = store
        .getSnapshot()
        .records.filter((record) => record.kind === 'assistant')
        .map((record) => record.id)
      const collapse = assistantIds.some((id) => !collapsedAssistants.has(id))
      for (const id of assistantIds) {
        if (collapse) collapsedAssistants.add(id)
        else collapsedAssistants.delete(id)
      }
      requestFrame()
      return
    }
    if (action === 'collapse-turns') {
      const turns = [...new Set(store.getSnapshot().records.map((record) => record.turn ?? 0))]
      const collapse = turns.some((turn) => !collapsedTurns.has(turn))
      for (const turn of turns) {
        if (collapse) collapsedTurns.add(turn)
        else collapsedTurns.delete(turn)
      }
      requestFrame()
      return
    }
    if (action?.startsWith('toggle-turn:')) {
      const turn = Number(action.slice('toggle-turn:'.length))
      if (collapsedTurns.has(turn)) collapsedTurns.delete(turn)
      else collapsedTurns.add(turn)
      safeEmit(currentOptions, {
        type: 'collapse_change',
        scope: 'turn',
        id: String(turn),
        collapsed: collapsedTurns.has(turn),
      })
      requestFrame()
      return
    }
    if (action?.startsWith('tab:')) {
      inspectorTab = action.slice(4) as InspectorTab
      requestFrame()
      return
    }
    const recordId = target.closest<HTMLElement>('[data-record-id]')?.dataset.recordId
    if (recordId !== undefined) select(recordId)
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const target = event.target instanceof HTMLElement ? event.target : null
    const recordId = target?.dataset.recordId
    if (recordId === undefined) return
    event.preventDefault()
    select(recordId)
  }

  const onInput = (event: Event): void => {
    const target = event.target
    if (!(target instanceof HTMLInputElement) || !target.classList.contains('tr-trajectory__search')) return
    searchQuery = target.value
    requestFrame()
  }

  const onScroll = (): void => {
    if (ledger.scrollTop < 48) void loadOlder()
  }

  const onContextMenu = (event: MouseEvent): void => {
    if (!(event.target instanceof Element) || !event.target.closest('.tr-trajectory__timeline-domain')) return
    event.preventDefault()
    timelineRange = null
    safeEmit(currentOptions, { type: 'timeline_select', range: null })
    requestFrame()
  }

  const onTimelinePointerDown = (event: PointerEvent): void => {
    const target = event.target instanceof Element ? event.target : null
    const domain = target?.closest<HTMLElement>('.tr-trajectory__timeline-domain')
    if (!domain || target?.closest('.tr-trajectory__timeline-span')) return
    const projection = timelineFor(store.getSnapshot(), timelineMode)
    if (!projection) return
    const rect = domain.getBoundingClientRect()
    if (rect.width <= 0) return
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    timelinePointerStart = projection.start + fraction * Math.max(1, projection.end - projection.start)
    domain.setPointerCapture?.(event.pointerId)
    const move = (moveEvent: PointerEvent): void => {
      if (timelinePointerStart === null) return
      const currentFraction = Math.min(1, Math.max(0, (moveEvent.clientX - rect.left) / rect.width))
      const current = projection.start + currentFraction * Math.max(1, projection.end - projection.start)
      timelineRange = {
        start: Math.min(timelinePointerStart, current),
        end: Math.max(timelinePointerStart, current),
      }
      requestFrame()
    }
    const end = (): void => {
      if (timelinePointerStart !== null && timelineRange !== null) {
        const range =
          timelineRange.end - timelineRange.start < Math.max(1, (projection.end - projection.start) / 200)
            ? null
            : timelineRange
        timelineRange = range
        safeEmit(currentOptions, { type: 'timeline_select', range })
      }
      timelinePointerStart = null
      timelinePointerCleanup?.()
      timelinePointerCleanup = undefined
      requestFrame()
    }
    timelinePointerCleanup = () => {
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerup', end)
      root.removeEventListener('pointercancel', end)
    }
    root.addEventListener('pointermove', move)
    root.addEventListener('pointerup', end)
    root.addEventListener('pointercancel', end)
    event.preventDefault()
  }

  host.addEventListener('click', onClick)
  host.addEventListener('keydown', onKeyDown)
  host.addEventListener('input', onInput)
  host.addEventListener('contextmenu', onContextMenu)
  host.addEventListener('pointerdown', onTimelinePointerDown)
  ledger.addEventListener('scroll', onScroll)
  listeners.push(
    () => host.removeEventListener('click', onClick),
    () => host.removeEventListener('keydown', onKeyDown),
    () => host.removeEventListener('input', onInput),
    () => host.removeEventListener('contextmenu', onContextMenu),
    () => host.removeEventListener('pointerdown', onTimelinePointerDown),
    () => ledger.removeEventListener('scroll', onScroll),
  )

  const instance: TrajectoryInstance = {
    append(events): void {
      if (destroyed) return
      store.append(events)
      requestFrame()
    },
    replace(events): void {
      if (destroyed) return
      store.replace(events)
      selectedId = null
      requestFrame()
    },
    async loadOlder(): Promise<boolean> {
      return loadOlder()
    },
    select,
    clearSelection(): void {
      select(null)
    },
    updateOptions(next): void {
      if (destroyed) return
      currentOptions = {
        ...currentOptions,
        ...next,
        messages: { ...currentOptions.messages, ...(next.messages ?? {}) },
      }
      requestFrame()
    },
    getSnapshot(): Readonly<TraceSnapshot> {
      return store.getSnapshot()
    },
    destroy(): void {
      if (destroyed) return
      destroyed = true
      if (frame !== undefined) {
        root.defaultView?.cancelAnimationFrame(frame)
        clearTimeout(frame)
      }
      sourceUnsubscribe?.()
      sourceUnsubscribe = undefined
      timelinePointerCleanup?.()
      timelinePointerCleanup = undefined
      for (const cleanup of listeners) cleanup()
      releaseTheme()
      host.remove()
    },
  }

  const source = currentOptions.source
  if (source?.subscribe) {
    sourceUnsubscribe = source.subscribe((event) => {
      if (initialLoading) pendingLiveEvents.push(event)
      else instance.append(event)
    })
  }
  if (source?.loadInitial && initialLoading) {
    void source
      .loadInitial()
      .then((page) => {
        if (destroyed) return
        initialLoading = false
        const loadedInput: TraceInput =
          page.input === undefined
            ? {
                sessionId: input.input?.sessionId ?? input.events?.[0]?.sessionId ?? 'trace-session',
                ...(page.events === undefined ? {} : { events: page.events }),
              }
            : {
                ...page.input,
                ...(page.events === undefined
                  ? {}
                  : {
                      events: [...(page.input.events ?? []), ...page.events],
                    }),
              }
        store.replace(loadedInput)
        if (pendingLiveEvents.length > 0) store.append(pendingLiveEvents)
        cursor = page.cursor
        hasMore = page.hasMore
        requestFrame()
      })
      .catch((error) => {
        initialLoading = false
        if (pendingLiveEvents.length > 0) store.append(pendingLiveEvents)
        errorEvent(currentOptions, 'load_initial', error)
      })
  }
  render()
  return instance
}
