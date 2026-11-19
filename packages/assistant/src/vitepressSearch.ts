import type { AssistantDocumentSearchOptions } from './types'
import { VITEPRESS_ASSISTANT_DOCUMENT_INDEX } from './constants'
import { tokenize } from './searchTokens'

export { VITEPRESS_ASSISTANT_DOCUMENT_INDEX }

export interface VitePressDocumentSearchOptions {
  endpoint?: string
  maxResults?: number
  maxExcerptLength?: number
}

interface VitePressStaticSource {
  id: string
  path: string
  terms: string[]
  url: string
}

interface VitePressStaticManifest {
  documents: Array<{
    id: string
    path: string
    title: string
    terms: string[]
    page?: string
    sources: VitePressStaticSource[]
  }>
}

interface ContentHit {
  start: number
  end: number
  score: number
}

interface ContentCluster {
  hits: ContentHit[]
  start: number
  end: number
  score: number
}

/**
 * Returns a focused excerpt instead of taking the first N characters around a
 * single match. Keeping this helper pure makes the selection behavior easy to
 * verify without a browser or a VitePress dev server.
 */
export function createRelevantExcerpt(
  content: string,
  query: string,
  terms: readonly string[],
  maxLength: number,
): string {
  const source = normalizeContent(content)
  if (!source || maxLength <= 0) return ''
  if (source.length <= maxLength) return source

  const hits = findContentHits(source, query, terms)
  if (hits.length === 0) return `${source.slice(0, Math.max(0, maxLength - 4)).trimEnd()} ...`

  const clusters = clusterContentHits(hits, maxLength)
  const selectedClusters = clusters
    .sort((left, right) => right.score - left.score || left.start - right.start)
    .slice(0, Math.min(2, clusters.length))
    .sort((left, right) => left.start - right.start)
  const rangeLength = Math.min(
    maxLength,
    Math.max(220, Math.floor((maxLength - (selectedClusters.length - 1) * 8) / selectedClusters.length)),
  )

  const excerpts = selectedClusters.map((cluster) => {
    const range = createExcerptRange(cluster, source.length, rangeLength)
    const value = source.slice(range.start, range.end).trim()
    return `${range.start > 0 ? '... ' : ''}${value}${range.end < source.length ? ' ...' : ''}`
  })

  return trimExcerpt(excerpts.join('\n\n'), maxLength)
}

function normalizeContent(content: string): string {
  return content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function findContentHits(source: string, query: string, terms: readonly string[]): ContentHit[] {
  const candidates = [...new Set([query, ...terms])]
    .map((value) => value.replace(/\s+/g, ' ').trim().toLowerCase())
    .filter((value) => value.length > 1)
    .sort((left, right) => right.length - left.length)
  const lowerSource = source.toLowerCase()
  const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase()
  const hits: ContentHit[] = []

  for (const candidate of candidates) {
    let fromIndex = 0
    while (fromIndex < lowerSource.length) {
      const start = lowerSource.indexOf(candidate, fromIndex)
      if (start < 0) break
      hits.push({
        start,
        end: start + candidate.length,
        score: candidate === normalizedQuery ? candidate.length * 4 : candidate.length,
      })
      fromIndex = start + Math.max(candidate.length, 1)
    }
  }

  return hits
}

function clusterContentHits(hits: readonly ContentHit[], maxLength: number): ContentCluster[] {
  const distance = Math.max(100, Math.floor(maxLength * 0.35))
  const clusters: ContentCluster[] = []

  for (const hit of [...hits].sort((left, right) => left.start - right.start)) {
    const current = clusters[clusters.length - 1]
    if (!current || hit.start - current.end > distance) {
      clusters.push({ hits: [hit], start: hit.start, end: hit.end, score: hit.score })
      continue
    }
    current.hits.push(hit)
    current.end = Math.max(current.end, hit.end)
    current.score += hit.score
  }

  return clusters
}

function createExcerptRange(
  cluster: ContentCluster,
  sourceLength: number,
  maxLength: number,
): { start: number; end: number } {
  const hitStart = cluster.hits[0]?.start ?? cluster.start
  const hitEnd = cluster.hits[cluster.hits.length - 1]?.end ?? cluster.end
  let start = Math.max(0, hitStart - Math.floor(maxLength * 0.3))
  let end = Math.min(sourceLength, start + maxLength)

  if (hitEnd > end) {
    end = Math.min(sourceLength, hitEnd + Math.floor(maxLength * 0.2))
    start = Math.max(0, end - maxLength)
  }

  return { start, end }
}

function trimExcerpt(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 4)).trimEnd()} ...`
}

function scoreContent(content: string, query: string, terms: readonly string[]): number {
  const source = normalizeContent(content).toLowerCase()
  if (!source) return 0
  const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase()
  let score = normalizedQuery && source.includes(normalizedQuery) ? 12 : 0

  for (const term of terms) {
    const normalizedTerm = term.trim().toLowerCase()
    if (normalizedTerm.length > 1 && source.includes(normalizedTerm)) score += 2
  }

  return score
}

export function createVitePressDocumentSearch(
  options: VitePressDocumentSearchOptions = {},
): AssistantDocumentSearchOptions {
  const endpoint = options.endpoint ?? `${import.meta.env.BASE_URL || '/'}${VITEPRESS_ASSISTANT_DOCUMENT_INDEX}`
  const maxExcerptLength = options.maxExcerptLength ?? 1600
  let documentsPromise: Promise<VitePressStaticManifest> | undefined

  async function loadIndex(): Promise<VitePressStaticManifest> {
    if (!documentsPromise) {
      documentsPromise = fetch(endpoint)
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load VitePress document index: ${response.status}`)
          return response.json() as Promise<unknown>
        })
        .then((value) => {
          if (!isStaticManifest(value)) throw new Error('Invalid VitePress document index')
          return value
        })
    }

    return documentsPromise
  }

  async function loadRaw(path: string): Promise<string | undefined> {
    const rawEndpoint = new URL(path, new URL(endpoint, window.location.href)).toString()
    const response = await fetch(rawEndpoint)
    if (!response.ok) return undefined
    return (await response.text()).trim() || undefined
  }

  async function loadStaticPage(path: string, fallbackPage?: string): Promise<string | undefined> {
    const pageEndpoint = new URL(path, window.location.href).toString()
    const response = await fetch(pageEndpoint)
    if (response.ok) {
      const html = await response.text()
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      const content = parsed.querySelector('.vp-doc')
      const text = content?.textContent?.trim()
      if (text) return text
    }

    if (!fallbackPage) return undefined
    const fallbackEndpoint = new URL(fallbackPage, new URL(endpoint, window.location.href)).toString()
    const fallbackResponse = await fetch(fallbackEndpoint)
    if (!fallbackResponse.ok) return undefined
    return (await fallbackResponse.text()).trim() || undefined
  }

  return {
    maxResults: options.maxResults ?? 5,
    async search(query) {
      if (typeof window === 'undefined') return []

      const index = await loadIndex()
      const terms = tokenize(query)
      const matches = index.documents
        .map((document) => ({ document, score: scoreStaticDocument(document, query, terms) }))
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, options.maxResults ?? 3)

      const loaded = await Promise.all(
        matches.map(async ({ document }) => {
          const page = await loadStaticPage(document.path, document.page)
          const sourceMatches = document.sources
            .map((source) => ({ source, score: scoreStaticSource(source, query, terms) }))
            .filter((item) => item.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, 3)
          const sources = await Promise.all(
            sourceMatches.map(async ({ source, score }) => {
              const value = await loadRaw(source.url)
              return value
                ? {
                    path: source.path,
                    content: value,
                    score: Math.max(scoreContent(value, query, terms), score),
                  }
                : undefined
            }),
          )
          return createDocumentExcerpt(
            page,
            sources.filter((source): source is { path: string; content: string; score: number } => Boolean(source)),
            query,
            terms,
            maxExcerptLength,
          )
        }),
      )

      return matches.flatMap(({ document, score }, index) => {
        const content = loaded[index]
        return content ? [{ path: document.path, title: document.title, content, score }] : []
      })
    },
  }
}

interface LoadedSource {
  path: string
  content: string
  score: number
}

function createDocumentExcerpt(
  page: string | undefined,
  sources: readonly LoadedSource[],
  query: string,
  terms: readonly string[],
  maxLength: number,
): string {
  const pageScore = page ? scoreContent(page, query, terms) : 0
  const relevantSources = [...sources].sort((left, right) => right.score - left.score)
  const hasPage = Boolean(page && pageScore > 0)
  const pageBudget = hasPage && relevantSources.length > 0 ? Math.floor(maxLength * 0.62) : hasPage ? maxLength : 0
  const sourceBudget = Math.max(0, maxLength - pageBudget)
  const sections: string[] = []

  if (hasPage && page) {
    const excerpt = createRelevantExcerpt(page, query, terms, Math.max(220, pageBudget - 8))
    if (excerpt) sections.push(`页面相关内容：\n${excerpt}`)
  }

  if (relevantSources.length > 0 && sourceBudget > 0) {
    const sourceCount = Math.min(3, Math.max(1, Math.floor(sourceBudget / 260)))
    const selectedSources = relevantSources.slice(0, sourceCount)
    const perSourceBudget = Math.max(220, Math.floor(sourceBudget / selectedSources.length))
    for (const source of selectedSources) {
      const excerpt = createRelevantExcerpt(
        source.content,
        query,
        terms,
        Math.max(220, perSourceBudget - source.path.length - 12),
      )
      if (excerpt) sections.push(`引用源码 ${source.path}：\n${excerpt}`)
    }
  }

  if (sections.length === 0 && page) return createRelevantExcerpt(page, query, terms, maxLength)
  return trimExcerpt(sections.join('\n\n'), maxLength)
}

function scoreStaticDocument(
  document: VitePressStaticManifest['documents'][number],
  query: string,
  terms: readonly string[],
): number {
  const title = document.title.toLowerCase()
  const availableTerms = new Set([...document.terms, ...document.sources.flatMap((source) => source.terms)])
  let score = title.includes(query.toLowerCase()) ? 12 : 0

  for (const term of terms) {
    if (title.includes(term)) score += 4
    if (availableTerms.has(term)) score += 1
  }

  return score
}

function scoreStaticSource(source: VitePressStaticSource, query: string, terms: readonly string[]): number {
  const path = source.path.toLowerCase()
  const availableTerms = new Set(source.terms)
  let score = path.includes(query.toLowerCase()) ? 8 : 0

  for (const term of terms) {
    if (path.includes(term)) score += 5
    if (availableTerms.has(term)) score += 2
  }

  return score
}

function isStaticManifest(value: unknown): value is VitePressStaticManifest {
  if (!value || typeof value !== 'object') return false
  const manifest = value as Partial<VitePressStaticManifest>
  return Array.isArray(manifest.documents)
}
