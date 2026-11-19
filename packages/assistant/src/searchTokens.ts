export function tokenize(value: string): string[] {
  const segmenter = getSegmenter()
  if (segmenter) {
    return [
      ...new Set(
        [...segmenter.segment(value.toLowerCase())]
          .filter((part) => part.isWordLike)
          .map((part) => part.segment)
          .filter((part) => part.length > 0),
      ),
    ].slice(0, 2000)
  }

  return [...new Set(value.toLowerCase().match(/[a-z0-9_]+|[\u4e00-\u9fff]/g) ?? [])].slice(0, 2000)
}

export function createSearchTerms(value: string, limit = 120): string[] {
  return tokenize(value)
    .filter((term) => term.length >= 2)
    .filter((term) => !/^\d[\d._-]*$/.test(term))
    .filter((term) => !/^[a-f\d]{6,}$/i.test(term))
    .slice(0, limit)
}

interface TokenSegmenter {
  segment(value: string): Iterable<{ segment: string; isWordLike?: boolean }>
}

function getSegmenter(): TokenSegmenter | undefined {
  if (typeof Intl === 'undefined') return undefined
  const IntlWithSegmenter = Intl as typeof Intl & {
    Segmenter?: new (locale: string, options: { granularity: 'word' }) => TokenSegmenter
  }
  return IntlWithSegmenter.Segmenter ? new IntlWithSegmenter.Segmenter('zh', { granularity: 'word' }) : undefined
}
