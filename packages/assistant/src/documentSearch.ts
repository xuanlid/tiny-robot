import type { UseMessagePlugin } from '@opentiny/tiny-robot-kit'
import type { AssistantDocumentSearchOptions, AssistantDocumentSearchResult } from './types'

const defaultFormatResults = (results: readonly AssistantDocumentSearchResult[]): string => {
  const sections = results.map((result) => `### ${result.title}\nSource: ${result.path}\n${result.content}`)
  return [
    'The following documentation excerpts were retrieved for the user question.',
    'Use these excerpts as the primary source for the answer and distinguish documented facts from your own general knowledge.',
    'The excerpts are focused sections rather than complete files. Do not describe them as incomplete merely because they are excerpts. If a required detail is genuinely absent, state exactly which detail is missing. Do not output <tool_call>, read_file, or other tool-call markup.',
    '',
    sections.join('\n\n'),
  ].join('\n')
}

function getText(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (!part || typeof part !== 'object') return ''
      const text = (part as { text?: unknown }).text
      return typeof text === 'string' ? text : ''
    })
    .join(' ')
}

export function createAssistantDocumentSearchPlugin(options: AssistantDocumentSearchOptions): UseMessagePlugin {
  return {
    name: 'tiny-robot-assistant-document-search',
    async onBeforeRequest({ requestBody }) {
      const lastMessage = [...requestBody.messages].reverse().find((message) => message.role === 'user')
      const query = getText(lastMessage?.content).trim()
      if (!query) return

      let results: readonly AssistantDocumentSearchResult[]
      try {
        results = await options.search(query)
      } catch {
        // Documentation retrieval must not make the assistant unavailable when
        // the optional index is missing or temporarily unreachable.
        return
      }
      const limited = results.slice(0, options.maxResults ?? 5)
      if (limited.length === 0) return

      const content = (options.formatResults ?? defaultFormatResults)(limited)
      if (!content.trim()) return

      requestBody.messages = [{ role: 'system', content }, ...requestBody.messages]
    },
  }
}
