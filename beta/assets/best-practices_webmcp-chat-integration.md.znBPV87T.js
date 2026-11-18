const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/combined.DtLAF188.js","assets/chunks/index.27pCcBjB.js","assets/chunks/framework.BF16Smws.js","assets/chunks/theme.C4auyOdU.js","assets/chunks/index.B4zsSb74.js","assets/chunks/page-tools.yJINRCt3.js","assets/chunks/modelProviders.BGj_MpID.js","assets/chunks/basic.DhPJbWkS.js"])))=>i.map(i=>d[i]);
import{aD as C,bQ as c,aZ as D,aL as B,v as b,H as l,bL as p,bB as h,J as t,bk as n,bJ as s,G as m,b7 as E,aU as g}from"./chunks/framework.BF16Smws.js";import{L as A,N as u}from"./chunks/index.CQT52exF.js";const y=`<script setup lang="ts">
import { TrChat, createWebMcpAdapter, useChatRuntime, type ChatMcpServers } from '@opentiny/tiny-robot-chat'
import '@opentiny/tiny-robot-chat/dist/style.css'
import { createDemoPageTools } from './page-tools'
import { modelProviders } from '../../chat/shared/modelProviders'

const pageTools = createDemoPageTools()
const webmcpAdapter = createWebMcpAdapter({
  getContext: () => pageTools.context,
  server: { id: 'page-webmcp', name: '页面工具' },
})

const externalMcpServers: ChatMcpServers = [
  {
    id: 'project-knowledge',
    name: '项目知识库',
    description: '外部 MCP 项目知识库。',
    baseUrl: \`\${import.meta.env.BASE_URL}api/mcp/project-knowledge\`,
    installed: false,
  },
]

const runtime = useChatRuntime({
  modelProviders,
  mcp: {
    servers: externalMcpServers,
    adapters: [webmcpAdapter],
  },
})
<\/script>

<template>
  <section class="webmcp-demo">
    <div class="webmcp-demo__hint">页面 WebMCP 与外部 MCP 位于同一个 MCP 面板中。</div>
    <div class="webmcp-demo__chat">
      <TrChat :runtime="runtime" />
    </div>
  </section>
</template>

<style scoped>
.webmcp-demo {
  --tr-layout-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.webmcp-demo__hint {
  color: var(--tr-text-secondary, #575d6c);
  font-size: 13px;
}

.webmcp-demo__chat {
  width: 100%;
  height: clamp(420px, 58vh, 520px);
}

.webmcp-demo__chat :deep(.tr-chat-ui) {
  height: 100%;
  min-height: 0;
}
</style>
`,v=`<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  TrChat,
  createWebMcpAdapter,
  useChatRuntime,
  type ChatRuntimeActionErrorPayload,
} from '@opentiny/tiny-robot-chat'
import '@opentiny/tiny-robot-chat/dist/style.css'
import { createDemoPageTools } from './page-tools'
import { modelProviders } from '../../chat/shared/modelProviders'

const pageTools = createDemoPageTools()
const webmcpAdapter = createWebMcpAdapter({
  getContext: () => pageTools.context,
  server: {
    id: 'page-webmcp',
    name: '页面工具',
    description: '当前 Demo 提供的页面 WebMCP 工具',
  },
})

const runtime = useChatRuntime({
  modelProviders,
  mcp: { adapters: [webmcpAdapter] },
})

const actionStatus = ref('页面工具已接入，等待 Chat 调用。')
const statusToolAdded = pageTools.statusToolAdded
const pageToolsInChat = computed(() => runtime.composer.mcp?.tools.value['page-webmcp'] ?? [])

function handleRuntimeActionError(payload: ChatRuntimeActionErrorPayload) {
  actionStatus.value = \`运行时操作失败：\${payload.action}\`
}
<\/script>

<template>
  <section class="webmcp-demo">
    <div class="webmcp-demo__toolbar">
      <span>当前页面区域：{{ pageTools.section }}</span>
      <button type="button" @click="statusToolAdded ? pageTools.resetTools() : pageTools.addStatusTool()">
        {{ statusToolAdded ? '重置页面工具' : '注册一个新页面工具' }}
      </button>
    </div>
    <div class="webmcp-demo__status">
      <span>{{ actionStatus }}</span>
      <span>已发现 {{ pageToolsInChat.length }} 个工具</span>
    </div>
    <ul class="webmcp-demo__tools">
      <li v-for="tool in pageToolsInChat" :key="tool.id">
        <code>{{ tool.name }}</code>
        <span>{{ tool.description || '暂无描述' }}</span>
      </li>
    </ul>
    <div class="webmcp-demo__chat">
      <TrChat :runtime="runtime" @runtime-action-error="handleRuntimeActionError" />
    </div>
  </section>
</template>

<style scoped>
.webmcp-demo {
  --tr-layout-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.webmcp-demo__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--tr-text-secondary, #575d6c);
  font-size: 13px;
}

.webmcp-demo__toolbar button {
  border: 1px solid var(--tr-border-color-default, #d9d9d9);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--tr-text-primary, #191919);
  background: var(--tr-container-bg-default, #fff);
  cursor: pointer;
}

.webmcp-demo__status {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  color: var(--tr-text-secondary, #575d6c);
  font-size: 12px;
}

.webmcp-demo__tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.webmcp-demo__tools li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--tr-border-color-default, #d9d9d9);
  border-radius: 6px;
  color: var(--tr-text-secondary, #575d6c);
  font-size: 12px;
}

.webmcp-demo__tools code {
  color: var(--tr-text-primary, #191919);
}

.webmcp-demo__chat {
  width: 100%;
  height: clamp(420px, 58vh, 520px);
}

.webmcp-demo__chat :deep(.tr-chat-ui) {
  height: 100%;
  min-height: 0;
}
</style>
`,_=JSON.parse('{"title":"WebMCP 页面工具接入 TrChat","description":"","frontmatter":{"outline":[1,3],"pageClass":"demo-container-page-bg"},"headers":[],"relativePath":"best-practices/webmcp-chat-integration.md","filePath":"best-practices/webmcp-chat-integration.md"}'),k={name:"best-practices/webmcp-chat-integration.md"},w=Object.assign(k,{setup(f){const i=E();C(async()=>{i.value=(await c(async()=>{const{default:a}=await import("./chunks/combined.DtLAF188.js");return{default:a}},__vite__mapDeps([0,1,2,3,4,5,6]))).default});const o=g(!0),r=E();return C(async()=>{r.value=(await c(async()=>{const{default:a}=await import("./chunks/basic.DhPJbWkS.js");return{default:a}},__vite__mapDeps([7,1,2,3,4,5,6]))).default}),(a,e)=>{const d=D("ClientOnly");return B(),b("div",null,[e[2]||(e[2]=l('<h1 id="webmcp-页面工具接入-trchat" tabindex="-1">WebMCP 页面工具接入 TrChat <a class="header-anchor" href="#webmcp-页面工具接入-trchat" aria-label="Permalink to &quot;WebMCP 页面工具接入 TrChat&quot;">​</a></h1><p>WebMCP 适合把当前页面中的业务能力提供给 Chat 使用，例如读取当前页面状态、切换页面区域、查询当前用户可见的数据，或触发经过确认的页面操作。</p><p>本实践约定：应用负责注册页面工具、实现工具逻辑和控制权限；TinyRobot 负责把页面工具转换为 Chat Runtime 可以识别的 MCP Server/Tool，发现工具变化，并把调用结果返回给 Chat。</p><div class="important custom-block github-alert"><p class="custom-block-title">IMPORTANT</p><p><code>createWebMcpAdapter</code> 不负责初始化 WebMCP Polyfill，也不负责注册页面工具。接入前，应用需要确保 <code>document.modelContext</code> 已经可用；如果使用自定义 WebMCP Context，则通过 <code>getContext</code> 注入。</p></div><h2 id="适用场景" tabindex="-1">适用场景 <a class="header-anchor" href="#适用场景" aria-label="Permalink to &quot;适用场景&quot;">​</a></h2><p>选择 WebMCP 接入时，工具通常满足以下特征：</p><ul><li>工具依赖当前页面、当前路由或当前用户会话；</li><li>工具执行需要浏览器环境中的状态或页面能力；</li><li>工具不需要单独部署为外部 MCP 服务；</li><li>工具的权限确认和业务副作用可以由页面应用控制。</li></ul><p>如果工具主要访问服务端数据、需要跨页面复用，或者需要独立的鉴权和部署边界，应优先使用外部 MCP Server。WebMCP 和外部 MCP 可以同时接入同一个 Chat Runtime。</p><h2 id="接入边界" tabindex="-1">接入边界 <a class="header-anchor" href="#接入边界" aria-label="Permalink to &quot;接入边界&quot;">​</a></h2><table tabindex="0"><thead><tr><th>能力</th><th>应用侧负责</th><th>TinyRobot 负责</th></tr></thead><tbody><tr><td>页面工具</td><td>注册工具、实现工具逻辑和返回结果</td><td>不负责注册页面工具</td></tr><tr><td>权限与副作用</td><td>登录态、权限校验、用户确认和业务操作</td><td>不替代业务鉴权</td></tr><tr><td>WebMCP Context</td><td>初始化 <code>document.modelContext</code> 或提供自定义 Context</td><td>通过 <code>getContext</code> 接入 Context</td></tr><tr><td>工具变化</td><td>工具增删或更新后触发 <code>toolchange</code></td><td>刷新工具列表并更新 Chat 状态</td></tr><tr><td>Server 信息</td><td>提供稳定的 <code>id</code>、<code>name</code> 和描述</td><td>在 MCP 面板中展示 Server 和 Tool 状态</td></tr><tr><td>Chat 接入</td><td>将 Adapter 传入 <code>useChatRuntime</code></td><td>完成工具适配、路由和调用结果处理</td></tr></tbody></table><p>业务不需要在标准接入中直接实现 <code>ChatMcpAdapter</code>、工具路由或 Chat 面板状态管理。</p><h2 id="完整接入示例" tabindex="-1">完整接入示例 <a class="header-anchor" href="#完整接入示例" aria-label="Permalink to &quot;完整接入示例&quot;">​</a></h2><p>本节包含两个可独立运行的接入场景：基础 WebMCP 接入，以及 WebMCP 与外部 MCP 共存。</p><h3 id="示例一-基础-webmcp-接入" tabindex="-1">示例一：基础 WebMCP 接入 <a class="header-anchor" href="#示例一-基础-webmcp-接入" aria-label="Permalink to &quot;示例一：基础 WebMCP 接入&quot;">​</a></h3><p>第一个示例模拟一个页面工具 Context，展示页面 WebMCP 的基础接入链路：</p><ol><li>页面提供 <code>get-page-info</code> 和 <code>set-page-section</code> 两个工具；</li><li>点击按钮后动态注册 <code>get-demo-status</code>；</li><li>再次点击后移除动态工具，恢复初始工具列表；</li><li>每次工具变化都触发 <code>toolchange</code>，Chat 中的工具列表同步更新；</li><li>页面展示当前已发现的工具和 Runtime 操作状态。</li></ol>',16)),p(t(n(A),null,null,512),[[h,o.value]]),t(d,null,{default:s(()=>[t(n(u),{title:"基础 WebMCP 接入",description:"模拟页面 Context，演示工具发现、动态注册、重置和 toolchange 同步。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%22basic.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fbasic.vue%22%2C%22code%22%3A%22%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20computed%2C%20ref%20%7D%20from%20'vue'%5Cnimport%20%7B%5Cn%20%20TrChat%2C%5Cn%20%20createWebMcpAdapter%2C%5Cn%20%20useChatRuntime%2C%5Cn%20%20type%20ChatRuntimeActionErrorPayload%2C%5Cn%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cnimport%20'%40opentiny%2Ftiny-robot-chat%2Fdist%2Fstyle.css'%5Cnimport%20%7B%20createDemoPageTools%20%7D%20from%20'.%2Fpage-tools'%5Cnimport%20%7B%20modelProviders%20%7D%20from%20'..%2F..%2Fchat%2Fshared%2FmodelProviders'%5Cn%5Cnconst%20pageTools%20%3D%20createDemoPageTools()%5Cnconst%20webmcpAdapter%20%3D%20createWebMcpAdapter(%7B%5Cn%20%20getContext%3A%20()%20%3D%3E%20pageTools.context%2C%5Cn%20%20server%3A%20%7B%5Cn%20%20%20%20id%3A%20'page-webmcp'%2C%5Cn%20%20%20%20name%3A%20'%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%2C%5Cn%20%20%20%20description%3A%20'%E5%BD%93%E5%89%8D%20Demo%20%E6%8F%90%E4%BE%9B%E7%9A%84%E9%A1%B5%E9%9D%A2%20WebMCP%20%E5%B7%A5%E5%85%B7'%2C%5Cn%20%20%7D%2C%5Cn%7D)%5Cn%5Cnconst%20runtime%20%3D%20useChatRuntime(%7B%5Cn%20%20modelProviders%2C%5Cn%20%20mcp%3A%20%7B%20adapters%3A%20%5BwebmcpAdapter%5D%20%7D%2C%5Cn%7D)%5Cn%5Cnconst%20actionStatus%20%3D%20ref('%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7%E5%B7%B2%E6%8E%A5%E5%85%A5%EF%BC%8C%E7%AD%89%E5%BE%85%20Chat%20%E8%B0%83%E7%94%A8%E3%80%82')%5Cnconst%20statusToolAdded%20%3D%20pageTools.statusToolAdded%5Cnconst%20pageToolsInChat%20%3D%20computed(()%20%3D%3E%20runtime.composer.mcp%3F.tools.value%5B'page-webmcp'%5D%20%3F%3F%20%5B%5D)%5Cn%5Cnfunction%20handleRuntimeActionError(payload%3A%20ChatRuntimeActionErrorPayload)%20%7B%5Cn%20%20actionStatus.value%20%3D%20%60%E8%BF%90%E8%A1%8C%E6%97%B6%E6%93%8D%E4%BD%9C%E5%A4%B1%E8%B4%A5%EF%BC%9A%24%7Bpayload.action%7D%60%5Cn%7D%5Cn%3C%2Fscript%3E%5Cn%5Cn%3Ctemplate%3E%5Cn%20%20%3Csection%20class%3D%5C%22webmcp-demo%5C%22%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__toolbar%5C%22%3E%5Cn%20%20%20%20%20%20%3Cspan%3E%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%EF%BC%9A%7B%7B%20pageTools.section%20%7D%7D%3C%2Fspan%3E%5Cn%20%20%20%20%20%20%3Cbutton%20type%3D%5C%22button%5C%22%20%40click%3D%5C%22statusToolAdded%20%3F%20pageTools.resetTools()%20%3A%20pageTools.addStatusTool()%5C%22%3E%5Cn%20%20%20%20%20%20%20%20%7B%7B%20statusToolAdded%20%3F%20'%E9%87%8D%E7%BD%AE%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%20%3A%20'%E6%B3%A8%E5%86%8C%E4%B8%80%E4%B8%AA%E6%96%B0%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%20%7D%7D%5Cn%20%20%20%20%20%20%3C%2Fbutton%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__status%5C%22%3E%5Cn%20%20%20%20%20%20%3Cspan%3E%7B%7B%20actionStatus%20%7D%7D%3C%2Fspan%3E%5Cn%20%20%20%20%20%20%3Cspan%3E%E5%B7%B2%E5%8F%91%E7%8E%B0%20%7B%7B%20pageToolsInChat.length%20%7D%7D%20%E4%B8%AA%E5%B7%A5%E5%85%B7%3C%2Fspan%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%20%20%3Cul%20class%3D%5C%22webmcp-demo__tools%5C%22%3E%5Cn%20%20%20%20%20%20%3Cli%20v-for%3D%5C%22tool%20in%20pageToolsInChat%5C%22%20%3Akey%3D%5C%22tool.id%5C%22%3E%5Cn%20%20%20%20%20%20%20%20%3Ccode%3E%7B%7B%20tool.name%20%7D%7D%3C%2Fcode%3E%5Cn%20%20%20%20%20%20%20%20%3Cspan%3E%7B%7B%20tool.description%20%7C%7C%20'%E6%9A%82%E6%97%A0%E6%8F%8F%E8%BF%B0'%20%7D%7D%3C%2Fspan%3E%5Cn%20%20%20%20%20%20%3C%2Fli%3E%5Cn%20%20%20%20%3C%2Ful%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__chat%5C%22%3E%5Cn%20%20%20%20%20%20%3CTrChat%20%3Aruntime%3D%5C%22runtime%5C%22%20%40runtime-action-error%3D%5C%22handleRuntimeActionError%5C%22%20%2F%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%3C%2Fsection%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cstyle%20scoped%3E%5Cn.webmcp-demo%20%7B%5Cn%20%20--tr-layout-height%3A%20100%25%3B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-direction%3A%20column%3B%5Cn%20%20gap%3A%2012px%3B%5Cn%20%20min-width%3A%200%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__toolbar%20%7B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-wrap%3A%20wrap%3B%5Cn%20%20align-items%3A%20center%3B%5Cn%20%20justify-content%3A%20space-between%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2013px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__toolbar%20button%20%7B%5Cn%20%20border%3A%201px%20solid%20var(--tr-border-color-default%2C%20%23d9d9d9)%3B%5Cn%20%20border-radius%3A%206px%3B%5Cn%20%20padding%3A%206px%2010px%3B%5Cn%20%20color%3A%20var(--tr-text-primary%2C%20%23191919)%3B%5Cn%20%20background%3A%20var(--tr-container-bg-default%2C%20%23fff)%3B%5Cn%20%20cursor%3A%20pointer%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__status%20%7B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-wrap%3A%20wrap%3B%5Cn%20%20justify-content%3A%20space-between%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2012px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__tools%20%7B%5Cn%20%20display%3A%20grid%3B%5Cn%20%20grid-template-columns%3A%20repeat(auto-fit%2C%20minmax(220px%2C%201fr))%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20margin%3A%200%3B%5Cn%20%20padding%3A%200%3B%5Cn%20%20list-style%3A%20none%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__tools%20li%20%7B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-direction%3A%20column%3B%5Cn%20%20gap%3A%204px%3B%5Cn%20%20min-width%3A%200%3B%5Cn%20%20padding%3A%208px%2010px%3B%5Cn%20%20border%3A%201px%20solid%20var(--tr-border-color-default%2C%20%23d9d9d9)%3B%5Cn%20%20border-radius%3A%206px%3B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2012px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__tools%20code%20%7B%5Cn%20%20color%3A%20var(--tr-text-primary%2C%20%23191919)%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%7B%5Cn%20%20width%3A%20100%25%3B%5Cn%20%20height%3A%20clamp(420px%2C%2058vh%2C%20520px)%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%3Adeep(.tr-chat-ui)%20%7B%5Cn%20%20height%3A%20100%25%3B%5Cn%20%20min-height%3A%200%3B%5Cn%7D%5Cn%3C%2Fstyle%3E%5Cn%22%7D%2C%22page-tools.ts%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fpage-tools.ts%22%2C%22code%22%3A%22import%20%7B%20ref%20%7D%20from%20'vue'%5Cnimport%20type%20%7B%20WebMcpContext%2C%20WebMcpToolDescriptor%20%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cn%5Cnexport%20function%20createDemoPageTools()%20%7B%5Cn%20%20const%20section%20%3D%20ref('overview')%5Cn%20%20const%20statusToolAdded%20%3D%20ref(false)%5Cn%20%20const%20listeners%20%3D%20new%20Set%3C()%20%3D%3E%20void%3E()%5Cn%20%20const%20tools%3A%20WebMcpToolDescriptor%5B%5D%20%3D%20%5B%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'get-page-info'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E7%9A%84%E6%A0%87%E9%A2%98%E5%92%8C%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'set-page-section'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E5%88%87%E6%8D%A2%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%B1%95%E7%A4%BA%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%5Cn%20%20%20%20%20%20%20%20type%3A%20'object'%2C%5Cn%20%20%20%20%20%20%20%20properties%3A%20%7B%20section%3A%20%7B%20type%3A%20'string'%20%7D%20%7D%2C%5Cn%20%20%20%20%20%20%20%20required%3A%20%5B'section'%5D%2C%5Cn%20%20%20%20%20%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%5D%5Cn%5Cn%20%20const%20context%3A%20WebMcpContext%20%3D%20%7B%5Cn%20%20%20%20getTools%3A%20async%20()%20%3D%3E%20tools%2C%5Cn%20%20%20%20executeTool%3A%20async%20(tool%2C%20args)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-page-info')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20JSON.stringify(%7B%20title%3A%20'WebMCP%20Demo'%2C%20section%3A%20section.value%20%7D)%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'set-page-section')%20%7B%5Cn%20%20%20%20%20%20%20%20section.value%20%3D%20typeof%20args.section%20%3D%3D%3D%20'string'%20%3F%20args.section%20%3A%20section.value%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E5%B7%B2%E5%88%87%E6%8D%A2%E4%B8%BA%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-demo-status')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20throw%20new%20Error(%60%E6%9C%AA%E7%9F%A5%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7%EF%BC%9A%24%7Btool.name%7D%60)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20addEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.add(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20removeEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.delete(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%5Cn%20%20return%20%7B%5Cn%20%20%20%20context%2C%5Cn%20%20%20%20section%2C%5Cn%20%20%20%20statusToolAdded%2C%5Cn%20%20%20%20addStatusTool()%20%7B%5Cn%20%20%20%20%20%20if%20(tools.some((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status'))%20return%5Cn%20%20%20%20%20%20tools.push(%7B%5Cn%20%20%20%20%20%20%20%20name%3A%20'get-demo-status'%2C%5Cn%20%20%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%20Demo%20%E7%8A%B6%E6%80%81%E3%80%82'%2C%5Cn%20%20%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%20%20%7D)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20true%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20resetTools()%20%7B%5Cn%20%20%20%20%20%20const%20index%20%3D%20tools.findIndex((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status')%5Cn%20%20%20%20%20%20if%20(index%20%3D%3D%3D%20-1)%20return%5Cn%20%20%20%20%20%20tools.splice(index%2C%201)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20false%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%7D%5Cn%22%7D%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:e[0]||(e[0]=()=>{o.value=!1}),vueCode:n(v)},m({_:2},[r.value?{name:"vue",fn:s(()=>[t(n(r))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),e[3]||(e[3]=l(`<h4 id="实际接入配置" tabindex="-1">实际接入配置 <a class="header-anchor" href="#实际接入配置" aria-label="Permalink to &quot;实际接入配置&quot;">​</a></h4><p>实际接入通常只需要创建 WebMCP Adapter，并将它放入 <code>useChatRuntime</code> 的 <code>mcp.adapters</code>：</p><div class="language-ts vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> webmcpAdapter</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> createWebMcpAdapter</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">({</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">  getContext</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">: () </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> document.modelContext,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  server: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    id: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;page-webmcp&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    name: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;页面工具&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    description: </span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&#39;当前页面提供的 WebMCP 工具&#39;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">})</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> runtime</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> useChatRuntime</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">({</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  modelProviders,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  mcp: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    adapters: [webmcpAdapter],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">})</span></span></code></pre></div><p>应用侧需要关注的只有三件事：</p><ul><li>在创建 Runtime 前确保 <code>document.modelContext</code> 已完成初始化；</li><li>为页面工具配置稳定且唯一的 Server ID；</li><li>工具注册、权限确认和业务副作用仍由页面应用自己管理。</li></ul><p>示例中的 <code>page-tools.ts</code> 只是为了让文档 Demo 不依赖浏览器 Polyfill。实际项目可以保留相同的 Adapter 写法，只把 <code>getContext</code> 指向项目实际使用的 <code>document.modelContext</code>。</p><h3 id="示例二-webmcp-与外部-mcp-共存" tabindex="-1">示例二：WebMCP 与外部 MCP 共存 <a class="header-anchor" href="#示例二-webmcp-与外部-mcp-共存" aria-label="Permalink to &quot;示例二：WebMCP 与外部 MCP 共存&quot;">​</a></h3><p>当页面工具和外部 MCP 都需要提供给同一个 Chat 时，使用统一的 <code>mcp</code> 配置：</p>`,8)),p(t(n(A),null,null,512),[[h,o.value]]),t(d,null,{default:s(()=>[t(n(u),{title:"WebMCP 与外部 MCP 共存",description:"页面工具通过 adapters 接入，外部 MCP Server 通过 servers 接入。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%22combined.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fcombined.vue%22%2C%22code%22%3A%22%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20TrChat%2C%20createWebMcpAdapter%2C%20useChatRuntime%2C%20type%20ChatMcpServers%20%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cnimport%20'%40opentiny%2Ftiny-robot-chat%2Fdist%2Fstyle.css'%5Cnimport%20%7B%20createDemoPageTools%20%7D%20from%20'.%2Fpage-tools'%5Cnimport%20%7B%20modelProviders%20%7D%20from%20'..%2F..%2Fchat%2Fshared%2FmodelProviders'%5Cn%5Cnconst%20pageTools%20%3D%20createDemoPageTools()%5Cnconst%20webmcpAdapter%20%3D%20createWebMcpAdapter(%7B%5Cn%20%20getContext%3A%20()%20%3D%3E%20pageTools.context%2C%5Cn%20%20server%3A%20%7B%20id%3A%20'page-webmcp'%2C%20name%3A%20'%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%20%7D%2C%5Cn%7D)%5Cn%5Cnconst%20externalMcpServers%3A%20ChatMcpServers%20%3D%20%5B%5Cn%20%20%7B%5Cn%20%20%20%20id%3A%20'project-knowledge'%2C%5Cn%20%20%20%20name%3A%20'%E9%A1%B9%E7%9B%AE%E7%9F%A5%E8%AF%86%E5%BA%93'%2C%5Cn%20%20%20%20description%3A%20'%E5%A4%96%E9%83%A8%20MCP%20%E9%A1%B9%E7%9B%AE%E7%9F%A5%E8%AF%86%E5%BA%93%E3%80%82'%2C%5Cn%20%20%20%20baseUrl%3A%20%60%24%7B'%2Ftiny-robot%2Fbeta%2F'%7Dapi%2Fmcp%2Fproject-knowledge%60%2C%5Cn%20%20%20%20installed%3A%20false%2C%5Cn%20%20%7D%2C%5Cn%5D%5Cn%5Cnconst%20runtime%20%3D%20useChatRuntime(%7B%5Cn%20%20modelProviders%2C%5Cn%20%20mcp%3A%20%7B%5Cn%20%20%20%20servers%3A%20externalMcpServers%2C%5Cn%20%20%20%20adapters%3A%20%5BwebmcpAdapter%5D%2C%5Cn%20%20%7D%2C%5Cn%7D)%5Cn%3C%2Fscript%3E%5Cn%5Cn%3Ctemplate%3E%5Cn%20%20%3Csection%20class%3D%5C%22webmcp-demo%5C%22%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__hint%5C%22%3E%E9%A1%B5%E9%9D%A2%20WebMCP%20%E4%B8%8E%E5%A4%96%E9%83%A8%20MCP%20%E4%BD%8D%E4%BA%8E%E5%90%8C%E4%B8%80%E4%B8%AA%20MCP%20%E9%9D%A2%E6%9D%BF%E4%B8%AD%E3%80%82%3C%2Fdiv%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__chat%5C%22%3E%5Cn%20%20%20%20%20%20%3CTrChat%20%3Aruntime%3D%5C%22runtime%5C%22%20%2F%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%3C%2Fsection%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cstyle%20scoped%3E%5Cn.webmcp-demo%20%7B%5Cn%20%20--tr-layout-height%3A%20100%25%3B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-direction%3A%20column%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20min-width%3A%200%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__hint%20%7B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2013px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%7B%5Cn%20%20width%3A%20100%25%3B%5Cn%20%20height%3A%20clamp(420px%2C%2058vh%2C%20520px)%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%3Adeep(.tr-chat-ui)%20%7B%5Cn%20%20height%3A%20100%25%3B%5Cn%20%20min-height%3A%200%3B%5Cn%7D%5Cn%3C%2Fstyle%3E%5Cn%22%7D%2C%22page-tools.ts%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fpage-tools.ts%22%2C%22code%22%3A%22import%20%7B%20ref%20%7D%20from%20'vue'%5Cnimport%20type%20%7B%20WebMcpContext%2C%20WebMcpToolDescriptor%20%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cn%5Cnexport%20function%20createDemoPageTools()%20%7B%5Cn%20%20const%20section%20%3D%20ref('overview')%5Cn%20%20const%20statusToolAdded%20%3D%20ref(false)%5Cn%20%20const%20listeners%20%3D%20new%20Set%3C()%20%3D%3E%20void%3E()%5Cn%20%20const%20tools%3A%20WebMcpToolDescriptor%5B%5D%20%3D%20%5B%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'get-page-info'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E7%9A%84%E6%A0%87%E9%A2%98%E5%92%8C%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'set-page-section'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E5%88%87%E6%8D%A2%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%B1%95%E7%A4%BA%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%5Cn%20%20%20%20%20%20%20%20type%3A%20'object'%2C%5Cn%20%20%20%20%20%20%20%20properties%3A%20%7B%20section%3A%20%7B%20type%3A%20'string'%20%7D%20%7D%2C%5Cn%20%20%20%20%20%20%20%20required%3A%20%5B'section'%5D%2C%5Cn%20%20%20%20%20%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%5D%5Cn%5Cn%20%20const%20context%3A%20WebMcpContext%20%3D%20%7B%5Cn%20%20%20%20getTools%3A%20async%20()%20%3D%3E%20tools%2C%5Cn%20%20%20%20executeTool%3A%20async%20(tool%2C%20args)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-page-info')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20JSON.stringify(%7B%20title%3A%20'WebMCP%20Demo'%2C%20section%3A%20section.value%20%7D)%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'set-page-section')%20%7B%5Cn%20%20%20%20%20%20%20%20section.value%20%3D%20typeof%20args.section%20%3D%3D%3D%20'string'%20%3F%20args.section%20%3A%20section.value%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E5%B7%B2%E5%88%87%E6%8D%A2%E4%B8%BA%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-demo-status')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20throw%20new%20Error(%60%E6%9C%AA%E7%9F%A5%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7%EF%BC%9A%24%7Btool.name%7D%60)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20addEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.add(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20removeEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.delete(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%5Cn%20%20return%20%7B%5Cn%20%20%20%20context%2C%5Cn%20%20%20%20section%2C%5Cn%20%20%20%20statusToolAdded%2C%5Cn%20%20%20%20addStatusTool()%20%7B%5Cn%20%20%20%20%20%20if%20(tools.some((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status'))%20return%5Cn%20%20%20%20%20%20tools.push(%7B%5Cn%20%20%20%20%20%20%20%20name%3A%20'get-demo-status'%2C%5Cn%20%20%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%20Demo%20%E7%8A%B6%E6%80%81%E3%80%82'%2C%5Cn%20%20%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%20%20%7D)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20true%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20resetTools()%20%7B%5Cn%20%20%20%20%20%20const%20index%20%3D%20tools.findIndex((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status')%5Cn%20%20%20%20%20%20if%20(index%20%3D%3D%3D%20-1)%20return%5Cn%20%20%20%20%20%20tools.splice(index%2C%201)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20false%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%7D%5Cn%22%7D%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:e[1]||(e[1]=()=>{o.value=!1}),vueCode:n(y)},m({_:2},[i.value?{name:"vue",fn:s(()=>[t(n(i))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),e[4]||(e[4]=l(`<div class="language-ts vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">const</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> runtime</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> =</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> useChatRuntime</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">({</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  modelProviders,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  mcp: {</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    servers: externalMcpServers,</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    adapters: [webmcpAdapter],</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">  },</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">})</span></span></code></pre></div><p>其中：</p><ul><li><code>mcp.servers</code> 用于配置外部 MCP Server；</li><li><code>mcp.adapters</code> 用于接入 WebMCP、业务 Adapter 或 SDK Adapter；</li><li>TinyRobot 会把它们合并到同一个 MCP Runtime 和 MCP 面板；</li><li>WebMCP 工具在模型侧使用 <code>\${serverId}__\${toolName}</code> 命名空间，避免与其他 MCP 工具重名。</li></ul><h2 id="接入流程" tabindex="-1">接入流程 <a class="header-anchor" href="#接入流程" aria-label="Permalink to &quot;接入流程&quot;">​</a></h2><p>两个示例都遵循以下接入流程：</p><table tabindex="0"><thead><tr><th>步骤</th><th>接入操作</th></tr></thead><tbody><tr><td>1. 初始化</td><td>注册页面工具，并确保 <code>document.modelContext</code> 或自定义 Context 已可用。</td></tr><tr><td>2. 创建 Adapter</td><td>使用 <code>createWebMcpAdapter</code> 配置 Server 的 <code>id</code>、<code>name</code> 和 Context。</td></tr><tr><td>3. 创建 Runtime</td><td>将 Adapter 放入 <code>useChatRuntime</code> 的 <code>mcp.adapters</code>。</td></tr><tr><td>4. 发现工具</td><td>TinyRobot 读取页面工具列表，并在 MCP 面板中展示。</td></tr><tr><td>5. 同步变化</td><td>工具增删或更新后触发 <code>toolchange</code>，让 Chat 刷新工具列表。</td></tr><tr><td>6. 执行调用</td><td>Chat 调用工具后，由工具实现完成权限校验和具体逻辑。</td></tr></tbody></table><p>工具发现发生在 Adapter 初始化和后续刷新阶段。业务只需要维护工具注册和 <code>toolchange</code> 通知，不需要自行实现 Chat 侧的工具路由。</p><h2 id="页面工具实现建议" tabindex="-1">页面工具实现建议 <a class="header-anchor" href="#页面工具实现建议" aria-label="Permalink to &quot;页面工具实现建议&quot;">​</a></h2><p>页面工具会被模型根据名称、描述和 Schema 选择，因此建议在注册工具时遵循以下约定：</p><table tabindex="0"><thead><tr><th>设计项</th><th>建议</th></tr></thead><tbody><tr><td>工具名称</td><td>使用稳定、能表达动作的英文名称，例如 <code>get-page-info</code>、<code>set-page-section</code>；不要把临时 ID 或用户数据放入名称</td></tr><tr><td>工具描述</td><td>说明工具能做什么、作用范围和重要限制，避免只写“执行操作”</td></tr><tr><td>输入 Schema</td><td>提供 <code>object</code> 类型和明确的 <code>properties</code>、<code>required</code>；字段含义应与业务校验一致</td></tr><tr><td>权限和副作用</td><td>读取工具尽量保持无副作用；修改页面或提交数据前，由应用侧完成权限校验和必要的用户确认</td></tr><tr><td>返回结果</td><td>返回可序列化、能解释执行结果的内容；失败时返回明确错误，不要静默吞掉异常</td></tr><tr><td>动态工具同步</td><td>工具增删或 Schema 变化后触发 <code>toolchange</code>，让 Chat 重新发现工具</td></tr></tbody></table><h2 id="接入注意事项" tabindex="-1">接入注意事项 <a class="header-anchor" href="#接入注意事项" aria-label="Permalink to &quot;接入注意事项&quot;">​</a></h2><p>接入时，重点关注工具初始化、权限控制、生命周期和动态状态同步。</p><h3 id="初始化顺序" tabindex="-1">初始化顺序 <a class="header-anchor" href="#初始化顺序" aria-label="Permalink to &quot;初始化顺序&quot;">​</a></h3><p>建议先完成 WebMCP Context 或 Polyfill 初始化，再创建 Adapter 和 Chat Runtime。这样首次工具发现可以拿到完整列表，避免 Runtime 初始化时工具为空。</p><p>如果 Context 的初始化依赖异步业务数据，应在初始化完成后再挂载 Chat；如果工具列表是在 Runtime 创建后变化，则必须触发 <code>toolchange</code>。</p><h3 id="权限与敏感操作" tabindex="-1">权限与敏感操作 <a class="header-anchor" href="#权限与敏感操作" aria-label="Permalink to &quot;权限与敏感操作&quot;">​</a></h3><p>TinyRobot 只负责转发工具调用，不判断当前用户是否有权执行具体操作。以下逻辑应在工具实现内部处理：</p><ul><li>登录态和资源权限校验；</li><li>删除、提交、发送等敏感操作的用户确认；</li><li>请求参数校验和数据范围限制；</li><li>相关 API 的错误处理和审计记录。</li></ul><p>不要把长期有效的 API Key、Cookie 或 Authorization 直接写入页面工具配置。需要访问受保护资源时，应通过业务已有的服务端鉴权或受控的 API 代理完成。</p><h3 id="生命周期和状态" tabindex="-1">生命周期和状态 <a class="header-anchor" href="#生命周期和状态" aria-label="Permalink to &quot;生命周期和状态&quot;">​</a></h3><p><code>removeServer</code> 只会把 Server 从当前 Chat Runtime 中移除，并不会注销应用侧的页面工具。页面工具的注册和注销仍由应用代码负责。</p><p>如果业务允许用户切换页面、账号或工作区，需要同步更新工具列表和工具执行上下文，并在变化后触发 <code>toolchange</code>，避免 Chat 继续看到旧工具或使用旧业务状态。</p><h3 id="何时使用自定义-tool-source" tabindex="-1">何时使用自定义 Tool Source <a class="header-anchor" href="#何时使用自定义-tool-source" aria-label="Permalink to &quot;何时使用自定义 Tool Source&quot;">​</a></h3><p>只要业务使用 <code>document.modelContext</code>，通常不需要实现 <code>WebMcpToolSource</code>。以下情况才考虑传入自定义 <code>source</code>：</p><ul><li>项目没有 <code>document.modelContext</code>，但已经有一套兼容的工具目录和调用接口；</li><li>需要把多个非浏览器工具源组合成一个 WebMCP Server；</li><li>需要自定义工具发现、调用结果或订阅变化的实现方式。</li></ul><p>自定义 Source 至少需要实现 <code>listTools</code> 和 <code>callTool</code>；如果工具列表会变化，还应实现 <code>subscribe</code>。</p><h2 id="接入检查清单" tabindex="-1">接入检查清单 <a class="header-anchor" href="#接入检查清单" aria-label="Permalink to &quot;接入检查清单&quot;">​</a></h2><ul><li>创建 Chat Runtime 前，确保 <code>document.modelContext</code> 或自定义 Context 已可用；</li><li>WebMCP Server 使用稳定且唯一的 <code>id</code>；</li><li>工具名称、描述和输入 Schema 足够明确；</li><li>工具执行函数包含业务权限校验和错误处理；</li><li>工具列表动态变化后触发 <code>toolchange</code>；</li><li>页面工具与外部 MCP 同时接入时，统一使用 <code>mcp: { servers, adapters }</code>；</li><li>未把长期凭证直接暴露在浏览器配置或工具参数中；</li><li>确认 <code>removeServer</code> 只影响 Chat Runtime，不代替页面工具注销。</li></ul>`,28))])}}});export{_ as __pageData,w as default};
