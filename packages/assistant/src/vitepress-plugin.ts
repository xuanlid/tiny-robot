import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { extname, relative, resolve } from 'node:path'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { VITEPRESS_ASSISTANT_DOCUMENT_INDEX } from './constants'
import { createSearchTerms } from './searchTokens'

export interface VitePressAssistantPluginOptions {
  sourceDir?: string
  output?: string
  rawDir?: string
  pageDir?: string
}

interface DocumentRecord {
  id: string
  path: string
  title: string
  content: string
  sources: ReferencedSource[]
}

interface ReferencedSource {
  id: string
  path: string
  extension: string
  content: string
  searchText?: string
}

const sourceExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.json',
  '.less',
  '.md',
  '.mdx',
  '.scss',
  '.ts',
  '.tsx',
  '.vue',
])

export function createVitePressAssistantPlugin(options: VitePressAssistantPluginOptions = {}): Plugin {
  const output = options.output ?? VITEPRESS_ASSISTANT_DOCUMENT_INDEX
  const rawDir = options.rawDir ?? 'tiny-robot-assistant-raw'
  const pageDir = options.pageDir ?? 'tiny-robot-assistant-pages'
  let config: ResolvedConfig
  let documentsPromise: Promise<DocumentRecord[]> | undefined

  async function collectDocuments(): Promise<DocumentRecord[]> {
    // VitePress sets Vite's root to its configured srcDir, so the default
    // source directory is the current root rather than root/src.
    if (!documentsPromise) {
      documentsPromise = collectDocumentsNow()
    }
    return documentsPromise
  }

  async function collectDocumentsNow(): Promise<DocumentRecord[]> {
    const sourceDir = resolve(config.root, options.sourceDir ?? '.')
    const files = await collectMarkdownFiles(sourceDir)
    const documents = await Promise.all(files.map((file) => readDocument(file, sourceDir, config.base)))
    return documents.filter((document): document is DocumentRecord => document !== undefined)
  }

  async function serveIndex(
    server: ViteDevServer,
    requestUrl: string,
    response: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void },
    next: () => void,
  ) {
    const base = config.base.replace(/\/$/, '')
    const pathname = new URL(requestUrl, 'http://localhost').pathname
    const indexPath = `${base}/${output}`.replace(/\/+/g, '/')
    const isIndexRequest = pathname === indexPath || pathname === `/${output}`
    const rawPrefix = `${base}/${rawDir}/`.replace(/\/+/g, '/')
    const pagePrefix = `${base}/${pageDir}/`.replace(/\/+/g, '/')
    const isRawRequest = pathname.startsWith(rawPrefix)
    const isPageRequest = pathname.startsWith(pagePrefix)

    if (!isIndexRequest && !isRawRequest && !isPageRequest) {
      next()
      return
    }

    try {
      const documents = await collectDocuments()
      response.statusCode = 200
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      if (isIndexRequest) {
        response.end(JSON.stringify(createStaticManifest(documents, rawDir, pageDir)))
        return
      }

      if (isPageRequest) {
        const id = pathname.slice(pagePrefix.length).replace(/\.txt$/, '')
        const document = documents.find((item) => item.id === id)
        if (!document) {
          response.statusCode = 404
          response.end(JSON.stringify({ error: 'Document page not found' }))
          return
        }
        response.setHeader('Content-Type', 'text/plain; charset=utf-8')
        response.end(document.content)
        return
      }

      if (isRawRequest) {
        const id = pathname.slice(rawPrefix.length).replace(/\.txt$/, '')
        const source = documents.flatMap((document) => document.sources).find((item) => item.id === id)
        if (!source) {
          response.statusCode = 404
          response.end(JSON.stringify({ error: 'Referenced source not found' }))
          return
        }
        response.setHeader('Content-Type', 'text/plain; charset=utf-8')
        response.end(source.content)
        return
      }
    } catch (error) {
      server.config.logger.error(`Failed to build TinyRobot document index: ${String(error)}`)
      response.statusCode = 500
      response.end(JSON.stringify({ error: 'Failed to build document index' }))
    }
  }

  return {
    name: 'tiny-robot-assistant-documents',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url) {
          next()
          return
        }
        void serveIndex(server, request.url, response, next)
      })
    },
    async generateBundle() {
      const documents = await collectDocuments()
      this.emitFile({
        type: 'asset',
        fileName: output,
        source: JSON.stringify(createStaticManifest(documents, rawDir, pageDir)),
      })
      const emitted = new Set<string>()
      for (const source of documents.flatMap((document) => document.sources)) {
        if (emitted.has(source.id)) continue
        emitted.add(source.id)
        this.emitFile({
          type: 'asset',
          fileName: `${rawDir}/${source.id}.txt`,
          source: source.content,
        })
      }
    },
    handleHotUpdate({ file }) {
      if (sourceExtensions.has(extname(file).toLowerCase())) {
        documentsPromise = undefined
      }
    },
  }
}

async function collectMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map(async (entry) => {
        const file = resolve(directory, entry.name)
        return entry.isDirectory() ? collectMarkdownFiles(file) : extname(entry.name) === '.md' ? [file] : []
      }),
  )
  return files.flat().sort()
}

async function readDocument(file: string, sourceDir: string, base: string): Promise<DocumentRecord | undefined> {
  const raw = await fs.readFile(file, 'utf8')
  const frontmatter = raw.match(/^---\s*\n([\s\S]*?)\n---\s*/)?.[1] ?? ''
  if (/^\s*search:\s*false\s*$/m.test(frontmatter)) return undefined

  const content = raw.replace(/^---[\s\S]*?---\s*/, '').trim()
  if (!content) return undefined

  const relativePath = relative(sourceDir, file).replace(/\\/g, '/')
  const route = relativePath.replace(/index\.md$/, '').replace(/\.md$/, '.html')
  const path = `${base.replace(/\/$/, '')}/${route}`.replace(/\/+/g, '/') || '/'
  const frontmatterTitle = frontmatter.match(/^\s*title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim()
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const title = frontmatterTitle || heading || relativePath.replace(/\.md$/, '')

  const referencedContent = await collectReferencedContent(file, content)
  const sources = await collectReferencedSources(file, content)
  return {
    id: createDocumentId(relativePath),
    path,
    title,
    content: referencedContent ? `${content}\n\n${referencedContent}` : content,
    sources,
  }
}

function createDocumentId(relativePath: string): string {
  return createHash('sha1').update(relativePath).digest('hex').slice(0, 16)
}

function createStaticManifest(documents: readonly DocumentRecord[], rawDir: string, pageDir: string) {
  return {
    documents: documents.map((document) => ({
      id: document.id,
      path: document.path,
      title: document.title,
      terms: createSearchTerms(document.content, 80),
      page: `${pageDir}/${document.id}.txt`,
      sources: document.sources.map((source) => ({
        id: source.id,
        path: source.path,
        terms: createSearchTerms(`${source.path} ${source.searchText ?? ''} ${source.content}`, 24),
        url: `${rawDir}/${source.id}.txt`,
      })),
    })),
  }
}

async function collectReferencedSources(entryFile: string, entryContent: string): Promise<ReferencedSource[]> {
  const visited = new Set<string>([resolve(entryFile)])
  const sources: ReferencedSource[] = []
  const initialMetadata = extractReferenceMetadata(entryContent)
  const pending = extractReferences(entryContent).map((reference) => ({
    importer: entryFile,
    reference,
    searchText: initialMetadata.get(reference),
  }))

  while (pending.length) {
    const { importer, reference, searchText } = pending.shift()!
    const file = await resolveReference(importer, reference)
    if (!file || visited.has(file)) continue
    visited.add(file)
    const content = await fs.readFile(file, 'utf8').catch(() => '')
    if (!content) continue
    sources.push({
      id: createDocumentId(file),
      path: reference,
      extension: extname(file),
      content,
      searchText,
    })
    const metadata = extractReferenceMetadata(content)
    pending.push(
      ...extractReferences(content).map((child) => ({
        importer: file,
        reference: child,
        searchText: metadata.get(child),
      })),
    )
  }

  return sources
}

function extractReferenceMetadata(content: string): Map<string, string> {
  const metadata = new Map<string, string>()

  for (const match of content.matchAll(/<demo\b([\s\S]*?)\/>/g)) {
    const attributes = match[1]
    const title = attributes.match(/\btitle\s*=\s*["']([^"']+)["']/)?.[1] ?? ''
    const description = attributes.match(/\bdescription\s*=\s*["']([^"']+)["']/)?.[1] ?? ''
    const searchText = `${title} ${description}`.trim()
    if (!searchText) continue

    const references = new Set<string>()
    const source = attributes.match(/\b(?:vue|html|src)\s*=\s*["']([^"']+)["']/)?.[1]
    if (source) references.add(stripReferenceQuery(source))

    const fileList = attributes.match(/(?:vueFiles|htmlFiles|tsFiles|tsxFiles|jsFiles)\s*=\s*["']([\s\S]*?)["']/)?.[1]
    for (const file of fileList?.matchAll(/['"]([^'"]+)['"]/g) ?? []) {
      references.add(stripReferenceQuery(file[1]))
    }

    for (const reference of references) {
      metadata.set(reference, `${metadata.get(reference) ?? ''} ${searchText}`.trim())
    }
  }

  return metadata
}

async function collectReferencedContent(entryFile: string, entryContent: string): Promise<string> {
  const visited = new Set<string>([resolve(entryFile)])
  const references = extractReferences(entryContent)
  const sections: string[] = []

  for (const reference of references) {
    const file = await resolveReference(entryFile, reference)
    if (!file || visited.has(file)) continue

    const content = await readReferencedFile(file, visited)
    if (content) {
      sections.push(`\n--- Referenced file: ${reference} ---\n${content}`)
    }
  }

  return sections.join('\n')
}

function extractReferences(content: string): string[] {
  const references = new Set<string>()
  const add = (value: string | undefined) => {
    if (!value || !isRelativeReference(value)) return
    references.add(stripReferenceQuery(value))
  }

  // VitePress include syntax: <!--@include: ./file.md-->
  for (const match of content.matchAll(/<!--\s*@include:\s*([^\s]+)\s*-->/g)) add(match[1])

  // Demo props used by the documentation site, for example :vueFiles="[...]".
  for (const match of content.matchAll(/(?:vueFiles|htmlFiles|tsFiles|tsxFiles|jsFiles)\s*=\s*["']([\s\S]*?)["']/g)) {
    for (const file of match[1].matchAll(/['"]([^'"]+)['"]/g)) add(file[1])
  }

  // Demo source attributes, for example <demo vue="../../demos/example.vue" />.
  for (const match of content.matchAll(/\b(?:vue|html|src)\s*=\s*["']([^"']+)["']/g)) add(match[1])

  // Static and dynamic relative imports in Markdown or referenced source files.
  for (const match of content.matchAll(/(?:from\s*|import\s*\(\s*|import\s*)["']([^"']+)["']/g)) add(match[1])

  // CSS imports in style blocks and imported stylesheet files.
  for (const match of content.matchAll(/@import\s+["']([^"']+)["']/g)) add(match[1])

  return [...references]
}

async function resolveReference(importer: string, reference: string): Promise<string | undefined> {
  const candidate = resolve(resolve(importer, '..'), stripReferenceQuery(reference))
  try {
    const stat = await fs.stat(candidate)
    if (stat.isFile() && sourceExtensions.has(extname(candidate).toLowerCase())) return candidate
  } catch {
    // A documentation reference can point to a generated or optional file.
    // Missing references should not prevent the rest of the index from building.
  }

  return undefined
}

async function readReferencedFile(file: string, visited: Set<string>): Promise<string> {
  if (visited.has(file)) return ''
  visited.add(file)

  let content: string
  try {
    content = await fs.readFile(file, 'utf8')
  } catch {
    return ''
  }

  const sections = [`${content.trim()}`]
  for (const reference of extractReferences(content)) {
    const child = await resolveReference(file, reference)
    if (!child || visited.has(child)) continue
    const childContent = await readReferencedFile(child, visited)
    if (childContent) sections.push(`\n--- Referenced file: ${reference} ---\n${childContent}`)
  }

  return sections.filter(Boolean).join('\n')
}

function isRelativeReference(reference: string): boolean {
  return reference.startsWith('./') || reference.startsWith('../') || reference.startsWith('/')
}

function stripReferenceQuery(reference: string): string {
  return reference.split(/[?#]/, 1)[0] ?? reference
}
