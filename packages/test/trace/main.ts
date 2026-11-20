import '@opentiny/tiny-robot/vanilla/style.css'
import { createTrace, type TraceEvent, type TrajectoryInstance } from '@opentiny/tiny-robot/vanilla'

const events: TraceEvent[] = [
  {
    sessionId: 'trajectory-test',
    seq: 1,
    type: 'request.start',
    timestamp: 1_000,
    requestId: 'request-1',
    turn: 1,
    step: 1,
    data: { provider: 'deepseek', model: 'deepseek-reasoner', options: { temperature: 0.2 } },
  },
  {
    sessionId: 'trajectory-test',
    seq: 2,
    type: 'assistant.delta',
    timestamp: 1_100,
    requestId: 'request-1',
    turn: 1,
    step: 1,
    data: { text: 'I will inspect the workspace.' },
  },
  {
    sessionId: 'trajectory-test',
    seq: 3,
    type: 'tool.start',
    timestamp: 1_300,
    requestId: 'request-1',
    turn: 1,
    step: 1,
    callId: 'call-search',
    data: { name: 'search', argsRaw: '{"query":"trajectory"}' },
  },
  {
    sessionId: 'trajectory-test',
    seq: 4,
    type: 'tool.result',
    timestamp: 1_642,
    requestId: 'request-1',
    turn: 1,
    step: 1,
    callId: 'call-search',
    data: { result: { matches: 3 }, resultText: 'Found 3 matching files.' },
  },
  {
    sessionId: 'trajectory-test',
    seq: 5,
    type: 'assistant.end',
    timestamp: 1_900,
    requestId: 'request-1',
    turn: 1,
    step: 1,
    data: { text: 'Workspace inspection completed.' },
  },
  {
    sessionId: 'trajectory-test',
    seq: 6,
    type: 'request.end',
    timestamp: 1_900,
    requestId: 'request-1',
    turn: 1,
    step: 1,
    data: { usage: { inputTokens: 420, outputTokens: 82 } },
  },
]

const host = document.querySelector<HTMLElement>('#app')!
host.style.height = '720px'
host.style.padding = '12px'
document.body.style.margin = '0'
document.body.style.background = '#fff'

const instance = createTrace({
  container: host,
  events,
  onEvent: (event) => {
    window.dispatchEvent(new CustomEvent('trajectory-event', { detail: event }))
  },
})

declare global {
  interface Window {
    trajectoryDemo: TrajectoryInstance
  }
}

window.trajectoryDemo = instance
