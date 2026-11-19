import { describe, expect, it } from 'vitest'
import { createRelevantExcerpt } from './vitepressSearch'

describe('VitePress document excerpts', () => {
  it('keeps the matching source section instead of the beginning of the file', () => {
    const content = [
      'This is an unrelated introduction that is intentionally much longer than the requested excerpt.',
      'It contains setup details but nothing about speech input.',
      '',
      'export function createSpeechHandler() {',
      "  return customHandler({ lang: 'zh-CN' })",
      '}',
      '',
      'The handler receives the final voice transcript and inserts it into Sender.',
    ].join('\n')

    const excerpt = createRelevantExcerpt(
      content,
      'Sender 语音输入如何自定义？',
      ['语音输入', 'customHandler', 'voice'],
      220,
    )

    expect(excerpt.length).toBeLessThanOrEqual(220)
    expect(excerpt).toContain('customHandler')
    expect(excerpt).toContain('voice transcript')
  })

  it('returns the complete content when it fits within the limit', () => {
    const content = 'VoiceButton supports a customHandler for speech input.'

    expect(createRelevantExcerpt(content, 'speech input', ['customHandler'], 200)).toBe(content)
  })
})
