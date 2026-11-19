import type { PromptProps } from '@opentiny/tiny-robot'
import type { ChatUIOptions } from '@opentiny/tiny-robot-chat'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
import { h } from 'vue'

export const defaultAssistantPrompts: PromptProps[] = [
  {
    id: 'daily-assistant',
    label: '日常助理场景',
    description: '今天需要我帮你安排日程、规划旅行，还是起草一封邮件？',
    icon: h('span', { style: { fontSize: '18px' } }, '🧠'),
    badge: 'NEW',
  },
  {
    id: 'learning',
    label: '学习/知识型场景',
    description: '有什么想了解的吗？可以是 Vue3 和 React 的区别。',
    icon: h('span', { style: { fontSize: '18px' } }, '🤔'),
  },
  {
    id: 'creative',
    label: '创意生成场景',
    description: '想写段文案、起个名字，还是来点灵感？',
    icon: h('span', { style: { fontSize: '18px' } }, '✨'),
  },
  {
    id: 'mcp',
    label: 'MCP 工具调用',
    description: '查询信息、调用工具并给出行动建议。',
    icon: h('span', { style: { fontSize: '18px' } }, '🔧'),
  },
]

export function createAssistantDefaultUi(mode: 'floating' | 'inline'): ChatUIOptions {
  return {
    history: false,
    welcome: {
      title: 'TinyRobot',
      description: '您好，我是TinyRobot，您专属的 AI 智能专家',
      icon: h(IconAi, { style: { fontSize: '48px' } }) as never,
    },
    prompts: {
      items: defaultAssistantPrompts,
      wrap: true,
      itemClass: 'tr-assistant__prompt-item',
    },
    bubble: {
      autoScroll: true,
      bubbleList: {
        roleConfigs: {
          assistant: { placement: 'start', avatar: h(IconAi, { style: { fontSize: '32px' } }) as never },
          user: { placement: 'end', avatar: h(IconUser, { style: { fontSize: '32px' } }) as never },
          system: { hidden: true },
        },
      },
    },
    layout: {
      surface: {
        mode: mode === 'floating' ? 'floating' : 'normal',
        floatingOptions: {
          draggable: true,
          resizable: true,
          minWidth: 360,
          minHeight: 480,
        },
      },
      leftAside: false,
      rightAside: {
        mode: 'drawer',
        width: 400,
      },
      emptyState: 'center',
      composer: { welcome: 'footer' },
      contentMaxWidth: 1280,
      panelPadding: 0,
      panelGap: 0,
    },
    sender: {
      mode: 'multiple',
      clearable: true,
      showWordLimit: true,
      maxLength: 2000,
    },
    model: { appendTo: '.tr-assistant__chat' },
  }
}
