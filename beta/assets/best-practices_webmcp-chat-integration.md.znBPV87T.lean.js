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
`,_=JSON.parse('{"title":"WebMCP 页面工具接入 TrChat","description":"","frontmatter":{"outline":[1,3],"pageClass":"demo-container-page-bg"},"headers":[],"relativePath":"best-practices/webmcp-chat-integration.md","filePath":"best-practices/webmcp-chat-integration.md"}'),k={name:"best-practices/webmcp-chat-integration.md"},w=Object.assign(k,{setup(f){const i=E();C(async()=>{i.value=(await c(async()=>{const{default:a}=await import("./chunks/combined.DtLAF188.js");return{default:a}},__vite__mapDeps([0,1,2,3,4,5,6]))).default});const o=g(!0),r=E();return C(async()=>{r.value=(await c(async()=>{const{default:a}=await import("./chunks/basic.DhPJbWkS.js");return{default:a}},__vite__mapDeps([7,1,2,3,4,5,6]))).default}),(a,e)=>{const d=D("ClientOnly");return B(),b("div",null,[e[2]||(e[2]=l("",16)),p(t(n(A),null,null,512),[[h,o.value]]),t(d,null,{default:s(()=>[t(n(u),{title:"基础 WebMCP 接入",description:"模拟页面 Context，演示工具发现、动态注册、重置和 toolchange 同步。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%22basic.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fbasic.vue%22%2C%22code%22%3A%22%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20computed%2C%20ref%20%7D%20from%20'vue'%5Cnimport%20%7B%5Cn%20%20TrChat%2C%5Cn%20%20createWebMcpAdapter%2C%5Cn%20%20useChatRuntime%2C%5Cn%20%20type%20ChatRuntimeActionErrorPayload%2C%5Cn%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cnimport%20'%40opentiny%2Ftiny-robot-chat%2Fdist%2Fstyle.css'%5Cnimport%20%7B%20createDemoPageTools%20%7D%20from%20'.%2Fpage-tools'%5Cnimport%20%7B%20modelProviders%20%7D%20from%20'..%2F..%2Fchat%2Fshared%2FmodelProviders'%5Cn%5Cnconst%20pageTools%20%3D%20createDemoPageTools()%5Cnconst%20webmcpAdapter%20%3D%20createWebMcpAdapter(%7B%5Cn%20%20getContext%3A%20()%20%3D%3E%20pageTools.context%2C%5Cn%20%20server%3A%20%7B%5Cn%20%20%20%20id%3A%20'page-webmcp'%2C%5Cn%20%20%20%20name%3A%20'%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%2C%5Cn%20%20%20%20description%3A%20'%E5%BD%93%E5%89%8D%20Demo%20%E6%8F%90%E4%BE%9B%E7%9A%84%E9%A1%B5%E9%9D%A2%20WebMCP%20%E5%B7%A5%E5%85%B7'%2C%5Cn%20%20%7D%2C%5Cn%7D)%5Cn%5Cnconst%20runtime%20%3D%20useChatRuntime(%7B%5Cn%20%20modelProviders%2C%5Cn%20%20mcp%3A%20%7B%20adapters%3A%20%5BwebmcpAdapter%5D%20%7D%2C%5Cn%7D)%5Cn%5Cnconst%20actionStatus%20%3D%20ref('%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7%E5%B7%B2%E6%8E%A5%E5%85%A5%EF%BC%8C%E7%AD%89%E5%BE%85%20Chat%20%E8%B0%83%E7%94%A8%E3%80%82')%5Cnconst%20statusToolAdded%20%3D%20pageTools.statusToolAdded%5Cnconst%20pageToolsInChat%20%3D%20computed(()%20%3D%3E%20runtime.composer.mcp%3F.tools.value%5B'page-webmcp'%5D%20%3F%3F%20%5B%5D)%5Cn%5Cnfunction%20handleRuntimeActionError(payload%3A%20ChatRuntimeActionErrorPayload)%20%7B%5Cn%20%20actionStatus.value%20%3D%20%60%E8%BF%90%E8%A1%8C%E6%97%B6%E6%93%8D%E4%BD%9C%E5%A4%B1%E8%B4%A5%EF%BC%9A%24%7Bpayload.action%7D%60%5Cn%7D%5Cn%3C%2Fscript%3E%5Cn%5Cn%3Ctemplate%3E%5Cn%20%20%3Csection%20class%3D%5C%22webmcp-demo%5C%22%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__toolbar%5C%22%3E%5Cn%20%20%20%20%20%20%3Cspan%3E%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%EF%BC%9A%7B%7B%20pageTools.section%20%7D%7D%3C%2Fspan%3E%5Cn%20%20%20%20%20%20%3Cbutton%20type%3D%5C%22button%5C%22%20%40click%3D%5C%22statusToolAdded%20%3F%20pageTools.resetTools()%20%3A%20pageTools.addStatusTool()%5C%22%3E%5Cn%20%20%20%20%20%20%20%20%7B%7B%20statusToolAdded%20%3F%20'%E9%87%8D%E7%BD%AE%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%20%3A%20'%E6%B3%A8%E5%86%8C%E4%B8%80%E4%B8%AA%E6%96%B0%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%20%7D%7D%5Cn%20%20%20%20%20%20%3C%2Fbutton%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__status%5C%22%3E%5Cn%20%20%20%20%20%20%3Cspan%3E%7B%7B%20actionStatus%20%7D%7D%3C%2Fspan%3E%5Cn%20%20%20%20%20%20%3Cspan%3E%E5%B7%B2%E5%8F%91%E7%8E%B0%20%7B%7B%20pageToolsInChat.length%20%7D%7D%20%E4%B8%AA%E5%B7%A5%E5%85%B7%3C%2Fspan%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%20%20%3Cul%20class%3D%5C%22webmcp-demo__tools%5C%22%3E%5Cn%20%20%20%20%20%20%3Cli%20v-for%3D%5C%22tool%20in%20pageToolsInChat%5C%22%20%3Akey%3D%5C%22tool.id%5C%22%3E%5Cn%20%20%20%20%20%20%20%20%3Ccode%3E%7B%7B%20tool.name%20%7D%7D%3C%2Fcode%3E%5Cn%20%20%20%20%20%20%20%20%3Cspan%3E%7B%7B%20tool.description%20%7C%7C%20'%E6%9A%82%E6%97%A0%E6%8F%8F%E8%BF%B0'%20%7D%7D%3C%2Fspan%3E%5Cn%20%20%20%20%20%20%3C%2Fli%3E%5Cn%20%20%20%20%3C%2Ful%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__chat%5C%22%3E%5Cn%20%20%20%20%20%20%3CTrChat%20%3Aruntime%3D%5C%22runtime%5C%22%20%40runtime-action-error%3D%5C%22handleRuntimeActionError%5C%22%20%2F%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%3C%2Fsection%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cstyle%20scoped%3E%5Cn.webmcp-demo%20%7B%5Cn%20%20--tr-layout-height%3A%20100%25%3B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-direction%3A%20column%3B%5Cn%20%20gap%3A%2012px%3B%5Cn%20%20min-width%3A%200%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__toolbar%20%7B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-wrap%3A%20wrap%3B%5Cn%20%20align-items%3A%20center%3B%5Cn%20%20justify-content%3A%20space-between%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2013px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__toolbar%20button%20%7B%5Cn%20%20border%3A%201px%20solid%20var(--tr-border-color-default%2C%20%23d9d9d9)%3B%5Cn%20%20border-radius%3A%206px%3B%5Cn%20%20padding%3A%206px%2010px%3B%5Cn%20%20color%3A%20var(--tr-text-primary%2C%20%23191919)%3B%5Cn%20%20background%3A%20var(--tr-container-bg-default%2C%20%23fff)%3B%5Cn%20%20cursor%3A%20pointer%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__status%20%7B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-wrap%3A%20wrap%3B%5Cn%20%20justify-content%3A%20space-between%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2012px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__tools%20%7B%5Cn%20%20display%3A%20grid%3B%5Cn%20%20grid-template-columns%3A%20repeat(auto-fit%2C%20minmax(220px%2C%201fr))%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20margin%3A%200%3B%5Cn%20%20padding%3A%200%3B%5Cn%20%20list-style%3A%20none%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__tools%20li%20%7B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-direction%3A%20column%3B%5Cn%20%20gap%3A%204px%3B%5Cn%20%20min-width%3A%200%3B%5Cn%20%20padding%3A%208px%2010px%3B%5Cn%20%20border%3A%201px%20solid%20var(--tr-border-color-default%2C%20%23d9d9d9)%3B%5Cn%20%20border-radius%3A%206px%3B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2012px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__tools%20code%20%7B%5Cn%20%20color%3A%20var(--tr-text-primary%2C%20%23191919)%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%7B%5Cn%20%20width%3A%20100%25%3B%5Cn%20%20height%3A%20clamp(420px%2C%2058vh%2C%20520px)%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%3Adeep(.tr-chat-ui)%20%7B%5Cn%20%20height%3A%20100%25%3B%5Cn%20%20min-height%3A%200%3B%5Cn%7D%5Cn%3C%2Fstyle%3E%5Cn%22%7D%2C%22page-tools.ts%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fpage-tools.ts%22%2C%22code%22%3A%22import%20%7B%20ref%20%7D%20from%20'vue'%5Cnimport%20type%20%7B%20WebMcpContext%2C%20WebMcpToolDescriptor%20%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cn%5Cnexport%20function%20createDemoPageTools()%20%7B%5Cn%20%20const%20section%20%3D%20ref('overview')%5Cn%20%20const%20statusToolAdded%20%3D%20ref(false)%5Cn%20%20const%20listeners%20%3D%20new%20Set%3C()%20%3D%3E%20void%3E()%5Cn%20%20const%20tools%3A%20WebMcpToolDescriptor%5B%5D%20%3D%20%5B%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'get-page-info'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E7%9A%84%E6%A0%87%E9%A2%98%E5%92%8C%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'set-page-section'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E5%88%87%E6%8D%A2%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%B1%95%E7%A4%BA%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%5Cn%20%20%20%20%20%20%20%20type%3A%20'object'%2C%5Cn%20%20%20%20%20%20%20%20properties%3A%20%7B%20section%3A%20%7B%20type%3A%20'string'%20%7D%20%7D%2C%5Cn%20%20%20%20%20%20%20%20required%3A%20%5B'section'%5D%2C%5Cn%20%20%20%20%20%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%5D%5Cn%5Cn%20%20const%20context%3A%20WebMcpContext%20%3D%20%7B%5Cn%20%20%20%20getTools%3A%20async%20()%20%3D%3E%20tools%2C%5Cn%20%20%20%20executeTool%3A%20async%20(tool%2C%20args)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-page-info')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20JSON.stringify(%7B%20title%3A%20'WebMCP%20Demo'%2C%20section%3A%20section.value%20%7D)%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'set-page-section')%20%7B%5Cn%20%20%20%20%20%20%20%20section.value%20%3D%20typeof%20args.section%20%3D%3D%3D%20'string'%20%3F%20args.section%20%3A%20section.value%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E5%B7%B2%E5%88%87%E6%8D%A2%E4%B8%BA%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-demo-status')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20throw%20new%20Error(%60%E6%9C%AA%E7%9F%A5%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7%EF%BC%9A%24%7Btool.name%7D%60)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20addEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.add(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20removeEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.delete(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%5Cn%20%20return%20%7B%5Cn%20%20%20%20context%2C%5Cn%20%20%20%20section%2C%5Cn%20%20%20%20statusToolAdded%2C%5Cn%20%20%20%20addStatusTool()%20%7B%5Cn%20%20%20%20%20%20if%20(tools.some((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status'))%20return%5Cn%20%20%20%20%20%20tools.push(%7B%5Cn%20%20%20%20%20%20%20%20name%3A%20'get-demo-status'%2C%5Cn%20%20%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%20Demo%20%E7%8A%B6%E6%80%81%E3%80%82'%2C%5Cn%20%20%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%20%20%7D)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20true%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20resetTools()%20%7B%5Cn%20%20%20%20%20%20const%20index%20%3D%20tools.findIndex((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status')%5Cn%20%20%20%20%20%20if%20(index%20%3D%3D%3D%20-1)%20return%5Cn%20%20%20%20%20%20tools.splice(index%2C%201)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20false%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%7D%5Cn%22%7D%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:e[0]||(e[0]=()=>{o.value=!1}),vueCode:n(v)},m({_:2},[r.value?{name:"vue",fn:s(()=>[t(n(r))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),e[3]||(e[3]=l("",8)),p(t(n(A),null,null,512),[[h,o.value]]),t(d,null,{default:s(()=>[t(n(u),{title:"WebMCP 与外部 MCP 共存",description:"页面工具通过 adapters 接入，外部 MCP Server 通过 servers 接入。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%22combined.vue%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fcombined.vue%22%2C%22code%22%3A%22%3Cscript%20setup%20lang%3D%5C%22ts%5C%22%3E%5Cnimport%20%7B%20TrChat%2C%20createWebMcpAdapter%2C%20useChatRuntime%2C%20type%20ChatMcpServers%20%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cnimport%20'%40opentiny%2Ftiny-robot-chat%2Fdist%2Fstyle.css'%5Cnimport%20%7B%20createDemoPageTools%20%7D%20from%20'.%2Fpage-tools'%5Cnimport%20%7B%20modelProviders%20%7D%20from%20'..%2F..%2Fchat%2Fshared%2FmodelProviders'%5Cn%5Cnconst%20pageTools%20%3D%20createDemoPageTools()%5Cnconst%20webmcpAdapter%20%3D%20createWebMcpAdapter(%7B%5Cn%20%20getContext%3A%20()%20%3D%3E%20pageTools.context%2C%5Cn%20%20server%3A%20%7B%20id%3A%20'page-webmcp'%2C%20name%3A%20'%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7'%20%7D%2C%5Cn%7D)%5Cn%5Cnconst%20externalMcpServers%3A%20ChatMcpServers%20%3D%20%5B%5Cn%20%20%7B%5Cn%20%20%20%20id%3A%20'project-knowledge'%2C%5Cn%20%20%20%20name%3A%20'%E9%A1%B9%E7%9B%AE%E7%9F%A5%E8%AF%86%E5%BA%93'%2C%5Cn%20%20%20%20description%3A%20'%E5%A4%96%E9%83%A8%20MCP%20%E9%A1%B9%E7%9B%AE%E7%9F%A5%E8%AF%86%E5%BA%93%E3%80%82'%2C%5Cn%20%20%20%20baseUrl%3A%20%60%24%7B'%2Ftiny-robot%2Fbeta%2F'%7Dapi%2Fmcp%2Fproject-knowledge%60%2C%5Cn%20%20%20%20installed%3A%20false%2C%5Cn%20%20%7D%2C%5Cn%5D%5Cn%5Cnconst%20runtime%20%3D%20useChatRuntime(%7B%5Cn%20%20modelProviders%2C%5Cn%20%20mcp%3A%20%7B%5Cn%20%20%20%20servers%3A%20externalMcpServers%2C%5Cn%20%20%20%20adapters%3A%20%5BwebmcpAdapter%5D%2C%5Cn%20%20%7D%2C%5Cn%7D)%5Cn%3C%2Fscript%3E%5Cn%5Cn%3Ctemplate%3E%5Cn%20%20%3Csection%20class%3D%5C%22webmcp-demo%5C%22%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__hint%5C%22%3E%E9%A1%B5%E9%9D%A2%20WebMCP%20%E4%B8%8E%E5%A4%96%E9%83%A8%20MCP%20%E4%BD%8D%E4%BA%8E%E5%90%8C%E4%B8%80%E4%B8%AA%20MCP%20%E9%9D%A2%E6%9D%BF%E4%B8%AD%E3%80%82%3C%2Fdiv%3E%5Cn%20%20%20%20%3Cdiv%20class%3D%5C%22webmcp-demo__chat%5C%22%3E%5Cn%20%20%20%20%20%20%3CTrChat%20%3Aruntime%3D%5C%22runtime%5C%22%20%2F%3E%5Cn%20%20%20%20%3C%2Fdiv%3E%5Cn%20%20%3C%2Fsection%3E%5Cn%3C%2Ftemplate%3E%5Cn%5Cn%3Cstyle%20scoped%3E%5Cn.webmcp-demo%20%7B%5Cn%20%20--tr-layout-height%3A%20100%25%3B%5Cn%20%20display%3A%20flex%3B%5Cn%20%20flex-direction%3A%20column%3B%5Cn%20%20gap%3A%208px%3B%5Cn%20%20min-width%3A%200%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__hint%20%7B%5Cn%20%20color%3A%20var(--tr-text-secondary%2C%20%23575d6c)%3B%5Cn%20%20font-size%3A%2013px%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%7B%5Cn%20%20width%3A%20100%25%3B%5Cn%20%20height%3A%20clamp(420px%2C%2058vh%2C%20520px)%3B%5Cn%7D%5Cn%5Cn.webmcp-demo__chat%20%3Adeep(.tr-chat-ui)%20%7B%5Cn%20%20height%3A%20100%25%3B%5Cn%20%20min-height%3A%200%3B%5Cn%7D%5Cn%3C%2Fstyle%3E%5Cn%22%7D%2C%22page-tools.ts%22%3A%7B%22filename%22%3A%22..%2F..%2Fdemos%2Fbest-practices%2Fwebmcp-chat-integration%2Fpage-tools.ts%22%2C%22code%22%3A%22import%20%7B%20ref%20%7D%20from%20'vue'%5Cnimport%20type%20%7B%20WebMcpContext%2C%20WebMcpToolDescriptor%20%7D%20from%20'%40opentiny%2Ftiny-robot-chat'%5Cn%5Cnexport%20function%20createDemoPageTools()%20%7B%5Cn%20%20const%20section%20%3D%20ref('overview')%5Cn%20%20const%20statusToolAdded%20%3D%20ref(false)%5Cn%20%20const%20listeners%20%3D%20new%20Set%3C()%20%3D%3E%20void%3E()%5Cn%20%20const%20tools%3A%20WebMcpToolDescriptor%5B%5D%20%3D%20%5B%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'get-page-info'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E7%9A%84%E6%A0%87%E9%A2%98%E5%92%8C%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20%7B%5Cn%20%20%20%20%20%20name%3A%20'set-page-section'%2C%5Cn%20%20%20%20%20%20description%3A%20'%E5%88%87%E6%8D%A2%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%B1%95%E7%A4%BA%E5%8C%BA%E5%9F%9F%E3%80%82'%2C%5Cn%20%20%20%20%20%20inputSchema%3A%20%7B%5Cn%20%20%20%20%20%20%20%20type%3A%20'object'%2C%5Cn%20%20%20%20%20%20%20%20properties%3A%20%7B%20section%3A%20%7B%20type%3A%20'string'%20%7D%20%7D%2C%5Cn%20%20%20%20%20%20%20%20required%3A%20%5B'section'%5D%2C%5Cn%20%20%20%20%20%20%7D%2C%5Cn%20%20%20%20%7D%2C%5Cn%20%20%5D%5Cn%5Cn%20%20const%20context%3A%20WebMcpContext%20%3D%20%7B%5Cn%20%20%20%20getTools%3A%20async%20()%20%3D%3E%20tools%2C%5Cn%20%20%20%20executeTool%3A%20async%20(tool%2C%20args)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-page-info')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20JSON.stringify(%7B%20title%3A%20'WebMCP%20Demo'%2C%20section%3A%20section.value%20%7D)%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'set-page-section')%20%7B%5Cn%20%20%20%20%20%20%20%20section.value%20%3D%20typeof%20args.section%20%3D%3D%3D%20'string'%20%3F%20args.section%20%3A%20section.value%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%E5%B7%B2%E5%88%87%E6%8D%A2%E4%B8%BA%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20if%20(tool.name%20%3D%3D%3D%20'get-demo-status')%20%7B%5Cn%20%20%20%20%20%20%20%20return%20%7B%5Cn%20%20%20%20%20%20%20%20%20%20content%3A%20%5B%7B%20type%3A%20'text'%2C%20text%3A%20%60%E5%BD%93%E5%89%8D%E9%A1%B5%E9%9D%A2%E5%8C%BA%E5%9F%9F%EF%BC%9A%24%7Bsection.value%7D%60%20%7D%5D%2C%5Cn%20%20%20%20%20%20%20%20%7D%5Cn%20%20%20%20%20%20%7D%5Cn%5Cn%20%20%20%20%20%20throw%20new%20Error(%60%E6%9C%AA%E7%9F%A5%E9%A1%B5%E9%9D%A2%E5%B7%A5%E5%85%B7%EF%BC%9A%24%7Btool.name%7D%60)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20addEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.add(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20removeEventListener%3A%20(type%2C%20listener)%20%3D%3E%20%7B%5Cn%20%20%20%20%20%20if%20(type%20%3D%3D%3D%20'toolchange')%20listeners.delete(listener)%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%5Cn%20%20return%20%7B%5Cn%20%20%20%20context%2C%5Cn%20%20%20%20section%2C%5Cn%20%20%20%20statusToolAdded%2C%5Cn%20%20%20%20addStatusTool()%20%7B%5Cn%20%20%20%20%20%20if%20(tools.some((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status'))%20return%5Cn%20%20%20%20%20%20tools.push(%7B%5Cn%20%20%20%20%20%20%20%20name%3A%20'get-demo-status'%2C%5Cn%20%20%20%20%20%20%20%20description%3A%20'%E8%AF%BB%E5%8F%96%E5%BD%93%E5%89%8D%20Demo%20%E7%8A%B6%E6%80%81%E3%80%82'%2C%5Cn%20%20%20%20%20%20%20%20inputSchema%3A%20%7B%20type%3A%20'object'%2C%20properties%3A%20%7B%7D%20%7D%2C%5Cn%20%20%20%20%20%20%7D)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20true%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%20%20resetTools()%20%7B%5Cn%20%20%20%20%20%20const%20index%20%3D%20tools.findIndex((tool)%20%3D%3E%20tool.name%20%3D%3D%3D%20'get-demo-status')%5Cn%20%20%20%20%20%20if%20(index%20%3D%3D%3D%20-1)%20return%5Cn%20%20%20%20%20%20tools.splice(index%2C%201)%5Cn%20%20%20%20%20%20statusToolAdded.value%20%3D%20false%5Cn%20%20%20%20%20%20listeners.forEach((listener)%20%3D%3E%20listener())%5Cn%20%20%20%20%7D%2C%5Cn%20%20%7D%5Cn%7D%5Cn%22%7D%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:e[1]||(e[1]=()=>{o.value=!1}),vueCode:n(y)},m({_:2},[i.value?{name:"vue",fn:s(()=>[t(n(i))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),e[4]||(e[4]=l("",28))])}}});export{_ as __pageData,w as default};
