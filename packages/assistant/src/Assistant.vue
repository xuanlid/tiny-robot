<script setup lang="ts">
import type { HistoryMenuItem, PromptProps } from '@opentiny/tiny-robot'
import { TrHistory, TrIconButton } from '@opentiny/tiny-robot'
import { IconAi, IconClose, IconHistory, IconNewSession } from '@opentiny/tiny-robot-svgs'
import {
  TrChat,
  useChatRuntime,
  type ChatMcpCreateServerPayload,
  type ChatPromptClickPayload,
  type ChatRuntimeActionErrorPayload,
  type ChatUIOptions,
  type LayoutFloatingState,
} from '@opentiny/tiny-robot-chat'
import { computed, onBeforeUnmount, ref, shallowRef } from 'vue'
import { createAssistantContextPlugin, createContextResolver } from './contextPlugin'
import { createAssistantDocumentSearchPlugin } from './documentSearch'
import type { AssistantExposed, AssistantOptions, AssistantSendInput } from './types'
import { createAssistantDefaultUi } from './uiDefaults'

interface ChatRef {
  send: (input: { text: string }) => Promise<boolean>
  focusInput: () => Promise<boolean>
}

const props = withDefaults(defineProps<AssistantOptions>(), {
  mode: undefined,
  open: undefined,
  defaultOpen: false,
  launcher: true,
  launcherLabel: 'Open TinyRobot assistant',
  title: 'TinyRobot assistant',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:floating-state': [value: LayoutFloatingState]
  'runtime-action-error': [payload: ChatRuntimeActionErrorPayload]
  'mcp-create-server': [payload: ChatMcpCreateServerPayload]
}>()

const internalOpen = ref(props.defaultOpen)
const internalFloatingState = shallowRef<LayoutFloatingState>(
  props.defaultFloatingState ?? {
    placement: 'center',
    offsetX: 24,
    offsetY: 24,
    width: 640,
    height: 760,
  },
)
const persistentContext = shallowRef<Record<string, unknown>>({})
const pendingContext = shallowRef<Record<string, unknown> | undefined>()
const chatRef = ref<ChatRef | null>(null)

const resolveContext = createContextResolver(props.context, () => ({
  ...persistentContext.value,
  ...(pendingContext.value ?? {}),
}))
const contextPlugin = createAssistantContextPlugin({
  getContext: resolveContext,
  formatContext: props.formatContext,
})

function createRuntimeOptions() {
  const options = props.runtimeOptions
  const conversation = options.conversation ?? {}
  const useMessageOptions = conversation.useMessageOptions ?? {}

  return {
    ...options,
    conversation: {
      ...conversation,
      useMessageOptions: {
        ...useMessageOptions,
        plugins: [
          contextPlugin,
          ...(props.documentSearch ? [createAssistantDocumentSearchPlugin(props.documentSearch)] : []),
          ...(useMessageOptions.plugins ?? []),
        ],
      },
    },
  }
}

const runtime = useChatRuntime(createRuntimeOptions())
const showHistory = ref(false)
const historyItems = computed(() => runtime.conversations.value.map((conversation) => ({ ...conversation })))
const activeConversationId = computed(() => runtime.activeConversation.value?.id)

const resolvedMode = computed<'floating' | 'inline'>(() => {
  if (props.mode) return props.mode
  const configuredMode = props.ui?.layout?.surface?.mode
  return configuredMode === undefined || configuredMode === 'floating' ? 'floating' : 'inline'
})

const isOpen = computed(
  () => resolvedMode.value === 'inline' || props.open === true || (props.open === undefined && internalOpen.value),
)

const resolvedUi = computed<ChatUIOptions>(() => {
  const defaults = createAssistantDefaultUi(resolvedMode.value)
  const userUi = props.ui ?? {}
  const layout = props.ui?.layout ?? {}
  const surface = layout.surface ?? {}
  const mode = resolvedMode.value

  return {
    ...defaults,
    ...userUi,
    layout: {
      ...defaults.layout,
      ...userUi.layout,
      leftAside: layout.leftAside ?? false,
      surface: {
        ...defaults.layout?.surface,
        ...surface,
        mode: mode === 'floating' ? 'floating' : 'normal',
        ...(mode === 'floating'
          ? {
              floatingOptions: {
                ...defaults.layout?.surface?.floatingOptions,
                draggable: true,
                ...surface.floatingOptions,
              },
            }
          : {}),
      },
    },
  }
})

const effectiveFloatingState = computed(() => props.floatingState ?? internalFloatingState.value)

function emitEvent(event: Parameters<NonNullable<AssistantOptions['onEvent']>>[0]): void {
  props.onEvent?.(event)
}

function setOpen(value: boolean): void {
  if (resolvedMode.value === 'inline') return
  if (props.open === undefined) internalOpen.value = value
  emit('update:open', value)
  emitEvent({ type: value ? 'open' : 'close' })
}

function handleFloatingState(value: LayoutFloatingState): void {
  if (props.floatingState === undefined) internalFloatingState.value = value
  emit('update:floating-state', value)
}

function handleRuntimeActionError(payload: ChatRuntimeActionErrorPayload): void {
  props.onRuntimeActionError?.(payload)
  emit('runtime-action-error', payload)
  emitEvent({ type: 'runtime-action-error', payload })
}

function handleMcpCreateServer(payload: ChatMcpCreateServerPayload): void {
  props.onMcpCreateServer?.(payload)
  emit('mcp-create-server', payload)
}

function handlePromptClick(payload: ChatPromptClickPayload): void {
  const item: PromptProps = payload.item
  if (item.description) void send(item.description)
}

async function send(input: AssistantSendInput): Promise<boolean> {
  const value = typeof input === 'string' ? { text: input } : input
  const text = value.text.trim()
  if (!text) return false

  pendingContext.value = value.context ? { ...value.context } : undefined
  setOpen(true)
  await Promise.resolve()

  try {
    const result = await chatRef.value?.send({ text })
    emitEvent({ type: 'send', text })
    return result ?? false
  } catch (error) {
    emitEvent({ type: 'error', error })
    throw error
  } finally {
    pendingContext.value = undefined
  }
}

async function newConversation(): Promise<void> {
  await runtime.actions.clearActiveConversation()
  showHistory.value = false
}

function toggleHistory(): void {
  showHistory.value = !showHistory.value
}

async function switchHistory(item: { id: string }): Promise<void> {
  await runtime.actions.switchConversation(item.id)
  showHistory.value = false
}

async function renameHistory(title: string, item: { id: string }): Promise<void> {
  await runtime.actions.renameConversation(item.id, title)
}

async function handleHistoryAction(action: HistoryMenuItem, item: { id: string }): Promise<void> {
  if (action.id === 'delete') {
    await runtime.actions.deleteConversation(item.id)
  }
}

function updateContext(context: Record<string, unknown>): void {
  persistentContext.value = { ...context }
}

function focusInput(): Promise<boolean> {
  return chatRef.value?.focusInput() ?? Promise.resolve(false)
}

function open(): void {
  setOpen(true)
}

function close(): void {
  setOpen(false)
}

function toggle(): void {
  setOpen(!isOpen.value)
}

defineExpose<AssistantExposed>({
  open,
  close,
  toggle,
  send,
  newConversation,
  updateContext,
  focusInput,
  getRuntime: () => runtime,
})

onBeforeUnmount(() => {
  void runtime.actions.abort?.()
})
</script>

<template>
  <div class="tr-assistant">
    <button
      v-if="props.launcher && resolvedMode === 'floating' && !isOpen"
      class="tr-assistant__launcher"
      type="button"
      :aria-label="props.launcherLabel"
      :title="props.launcherLabel"
      :aria-expanded="isOpen"
      @click="open"
    >
      <IconAi class="tr-assistant__launcher-icon" />
    </button>

    <TrChat
      v-if="isOpen"
      ref="chatRef"
      class="tr-assistant__chat"
      :runtime="runtime"
      :title="props.title"
      :ui="resolvedUi"
      :floating-state="effectiveFloatingState"
      @update:floating-state="handleFloatingState"
      @runtime-action-error="handleRuntimeActionError"
      @mcp-create-server="handleMcpCreateServer"
      @prompt-click="handlePromptClick"
    >
      <template #layout-header="header">
        <header class="tr-assistant__header">
          <h3 class="tr-assistant__title">{{ header.title }}</h3>
          <div class="tr-assistant__actions">
            <span class="tr-assistant__history-trigger">
              <TrIconButton
                :icon="IconHistory"
                size="32"
                svg-size="20"
                type="button"
                aria-label="History conversations"
                title="History conversations"
                :aria-expanded="showHistory"
                @click="toggleHistory"
              />
              <div
                v-if="showHistory"
                class="tr-assistant__history-panel"
                role="dialog"
                aria-label="历史会话"
                @click.stop
              >
                <div class="tr-assistant__history-head">
                  <h4 class="tr-assistant__history-title">历史会话</h4>
                  <TrIconButton
                    :icon="IconClose"
                    size="28"
                    svg-size="18"
                    type="button"
                    aria-label="Close history conversations"
                    title="Close history conversations"
                    @click="showHistory = false"
                  />
                </div>
                <TrHistory
                  class="tr-assistant__history"
                  :data="historyItems"
                  :selected="activeConversationId"
                  @item-click="switchHistory"
                  @item-title-change="renameHistory"
                  @item-action="handleHistoryAction"
                />
              </div>
            </span>
            <TrIconButton
              v-if="!header.isEmpty"
              :icon="IconNewSession"
              size="32"
              svg-size="20"
              type="button"
              aria-label="New conversation"
              title="New conversation"
              @click="header.createConversation"
            />
            <TrIconButton
              v-if="resolvedMode === 'floating'"
              :icon="IconClose"
              size="32"
              svg-size="20"
              type="button"
              aria-label="Close assistant"
              title="Close assistant"
              @click="close"
            />
          </div>
        </header>
      </template>
    </TrChat>
  </div>
</template>
