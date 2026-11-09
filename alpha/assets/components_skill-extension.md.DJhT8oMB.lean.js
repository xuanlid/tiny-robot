const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/chunks/editing.ColWowdM.js","assets/chunks/theme.CIls_nk4.js","assets/chunks/framework.a6p0je84.js","assets/chunks/basic.DSU-z3Yg.js","assets/chunks/resolver-states.CKSmdAYZ.js","assets/chunks/local-import.BXwsqfMc.js","assets/chunks/basic.DKM9OvWl.js"])))=>i.map(i=>d[i]);
import{aD as d,bQ as o,aZ as S,aL as C,v as B,H as r,bL as h,bB as p,J as t,bk as e,bJ as n,G as k,w as g,I as f,b7 as c,aU as D}from"./chunks/framework.a6p0je84.js";import{L as u,N as y}from"./chunks/index.BGwIjSAW.js";const A=`<script setup lang="ts">
import { ref } from 'vue'
import { TrSkillExtensionDetail } from '@opentiny/tiny-robot'
import type { SkillDefinition } from '@opentiny/tiny-robot'

const definition = ref<SkillDefinition>({
  name: 'release-notes',
  description: '整理版本更新内容。',
  instructions: ['# 发布说明', '', '列出本次版本的重要变更。', '', '## 输出格式', '- 新增功能', '- 修复问题'].join(
    '\\n',
  ),
  resources: [
    {
      path: 'references/style.md',
      kind: 'text',
      resourceId: 'references/style.md',
      text: '# 写作规范\\n\\n使用简洁、清晰的语言。',
    },
  ],
})

const saveMessage = ref('')

const handleSave = (nextDefinition: SkillDefinition) => {
  definition.value = nextDefinition
  saveMessage.value = '已保存到当前示例状态。'
}
<\/script>

<template>
  <div class="skill-editing-demo">
    <p class="skill-editing-demo__hint">
      当前选中 <strong>SKILL.md</strong>。点击右侧文件标题栏的
      <strong>编辑</strong>，修改后点保存；也可以先选择左侧文本资源再编辑。
    </p>
    <TrSkillExtensionDetail mode="edit" :definition="definition" @save="handleSave" />
    <p v-if="saveMessage" class="skill-editing-demo__status" role="status">{{ saveMessage }}</p>
  </div>
</template>

<style scoped>
.skill-editing-demo__hint,
.skill-editing-demo__status {
  margin: 0 0 12px;
  color: var(--tr-text-secondary, #595959);
  font-size: 13px;
}

.skill-editing-demo__status {
  margin: 12px 0 0;
}
</style>
`,x=`<script setup lang="ts">
import { TrSkillExtensionDetail } from '@opentiny/tiny-robot'
import type { SkillDefinition } from '@opentiny/tiny-robot'

const definition: SkillDefinition = {
  name: 'document-summary',
  description: '将长文档整理为摘要。',
  instructions: [
    '# 文档摘要',
    '',
    '先阅读文档，再列出三条要点和待办事项。',
    '',
    '## 输出格式',
    '- 摘要',
    '- 待办事项',
  ].join('\\n'),
  resources: [
    {
      path: 'references/style.md',
      kind: 'text',
      resourceId: 'references/style.md',
      size: 32,
      text: '# 摘要格式',
    },
    {
      path: 'assets/example.png',
      kind: 'binary',
      resourceId: 'assets/example.png',
      size: 4,
      binary: new Uint8Array([137, 80, 78, 71]),
    },
  ],
}
<\/script>

<template>
  <tr-skill-extension-detail :definition="definition" updated-at="2026-07-10" />
</template>
`,_=`<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { TrSkillImportForm } from '@opentiny/tiny-robot'
import type { SkillDefinition, SkillResolver } from '@opentiny/tiny-robot'

const exampleUrl = 'https://github.com/opentiny/tiny-robot/tree/main/skills/demo'
const example: SkillDefinition = {
  name: 'demo',
  description: '可重复演示异步解析的 Skill。',
  instructions: '总结输入文档。',
}

const formKey = ref(0)
const pending = ref(false)
const imported = ref<SkillDefinition>()
let resolvePending: ((definition: SkillDefinition) => void) | undefined
let rejectPending: ((error: Error) => void) | undefined

const resolveExample: SkillResolver = () =>
  new Promise((resolve, reject) => {
    pending.value = true
    resolvePending = resolve
    rejectPending = reject
  })

const finishSuccess = () => {
  resolvePending?.(example)
  pending.value = false
  resolvePending = undefined
  rejectPending = undefined
}

const finishError = () => {
  rejectPending?.(new Error('示例解析失败，请重试'))
  pending.value = false
  resolvePending = undefined
  rejectPending = undefined
}

const reset = () => {
  imported.value = undefined
  formKey.value += 1
}

onUnmounted(() => resolvePending?.(example))
<\/script>

<template>
  <section>
    <div class="demo-aux-controls">
      <button type="button" class="demo-aux-control" :disabled="!pending" @click="finishSuccess">让解析成功</button>
      <button type="button" class="demo-aux-control" :disabled="!pending" @click="finishError">让解析失败</button>
      <button type="button" class="demo-aux-control" :disabled="pending" @click="reset">重置示例</button>
    </div>
    <p>
      将示例地址粘贴到 URL 输入框并点击“导入”：<code>{{ exampleUrl }}</code>
    </p>
    <tr-skill-import-form
      :key="formKey"
      source="github"
      :resolve-timeout="0"
      :resolve-skill="resolveExample"
      @submit="imported = $event"
    />
    <p aria-live="polite">应用收到：{{ imported?.name ?? '尚未收到解析结果' }}</p>
  </section>
</template>
`,T=`<script setup lang="ts">
import { ref } from 'vue'
import { TrSkillImportForm } from '@opentiny/tiny-robot'
import type { SkillDefinition } from '@opentiny/tiny-robot'

const formKey = ref(0)
const imported = ref<SkillDefinition>()
const cancelled = ref(false)

const handleSubmit = (definition: SkillDefinition) => {
  imported.value = definition
  cancelled.value = false
}

const reset = () => {
  imported.value = undefined
  cancelled.value = false
  formKey.value += 1
}
<\/script>

<template>
  <section>
    <div class="demo-aux-controls">
      <button type="button" class="demo-aux-control" @click="reset">重置示例</button>
    </div>
    <tr-skill-import-form :key="formKey" source="local" @submit="handleSubmit" @cancel="cancelled = true" />
    <p aria-live="polite">
      {{ imported ? \`应用收到 \${imported.name}\` : cancelled ? '应用收到取消意图' : '请选择包含 SKILL.md 的文件夹' }}
    </p>
  </section>
</template>
`,q=`<script setup lang="ts">
import { ref } from 'vue'
import { TrSkillExtensionDetail, TrSkillImportForm } from '@opentiny/tiny-robot'
import type { SkillDefinition } from '@opentiny/tiny-robot'

const exampleUrl = 'https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling'
const formKey = ref(0)
const imported = ref<SkillDefinition>()

const reset = () => {
  imported.value = undefined
  formKey.value += 1
}
<\/script>

<template>
  <section>
    <div class="demo-aux-controls">
      <button type="button" class="demo-aux-control" @click="reset">重置示例</button>
    </div>
    <p>将这个真实 Skill 的目录地址复制到下方 URL 输入框：</p>
    <p class="example-url">
      <a :href="exampleUrl" target="_blank" rel="noopener noreferrer">{{ exampleUrl }}</a>
    </p>
    <tr-skill-import-form :key="formKey" source="github" @submit="imported = $event" />
    <p aria-live="polite">应用收到：{{ imported?.name ?? '尚未导入' }}</p>
    <tr-skill-extension-detail v-if="imported" :definition="imported" />
  </section>
</template>

<style scoped>
.example-url {
  overflow-wrap: anywhere;
}
</style>
`,Z=JSON.parse('{"title":"Skill 扩展导入与详情","description":"","frontmatter":{"outline":[1,3]},"headers":[],"relativePath":"components/skill-extension.md","filePath":"components/skill-extension.md"}'),P={name:"components/skill-extension.md"},R=Object.assign(P,{setup(w){const m=c();d(async()=>{m.value=(await o(async()=>{const{default:a}=await import("./chunks/editing.ColWowdM.js");return{default:a}},__vite__mapDeps([0,1,2]))).default});const b=c();d(async()=>{b.value=(await o(async()=>{const{default:a}=await import("./chunks/basic.DSU-z3Yg.js");return{default:a}},__vite__mapDeps([3,1,2]))).default});const E=c();d(async()=>{E.value=(await o(async()=>{const{default:a}=await import("./chunks/resolver-states.CKSmdAYZ.js");return{default:a}},__vite__mapDeps([4,1,2]))).default});const F=c();d(async()=>{F.value=(await o(async()=>{const{default:a}=await import("./chunks/local-import.BXwsqfMc.js");return{default:a}},__vite__mapDeps([5,1,2]))).default});const s=D(!0),v=c();return d(async()=>{v.value=(await o(async()=>{const{default:a}=await import("./chunks/basic.DKM9OvWl.js");return{default:a}},__vite__mapDeps([6,1,2]))).default}),(a,i)=>{const l=S("ClientOnly");return C(),B("div",null,[i[5]||(i[5]=r("",11)),h(t(e(u),null,null,512),[[p,s.value]]),t(l,null,{default:n(()=>[t(e(y),{title:"从 GitHub 地址导入",description:"使用 kit 默认解析器导入真实 Skill，并查看应用收到的定义。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:i[0]||(i[0]=()=>{s.value=!1}),vueCode:e(q)},k({_:2},[v.value?{name:"vue",fn:n(()=>[t(e(v))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),i[6]||(i[6]=r("",6)),h(t(e(u),null,null,512),[[p,s.value]]),t(l,null,{default:n(()=>[t(e(y),{title:"本地文件夹与默认解析器",description:"选择包含 SKILL.md 的文件夹，确认后查看应用收到的定义。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:i[1]||(i[1]=()=>{s.value=!1}),vueCode:e(T)},k({_:2},[F.value?{name:"vue",fn:n(()=>[t(e(F))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),i[7]||(i[7]=r("",2)),h(t(e(u),null,null,512),[[p,s.value]]),t(l,null,{default:n(()=>[t(e(y),{title:"解析状态与重试",description:"控制本地解析结果，观察加载、错误、成功以及重试路径。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:i[2]||(i[2]=()=>{s.value=!1}),vueCode:e(_)},k({_:2},[E.value?{name:"vue",fn:n(()=>[t(e(E))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),i[8]||(i[8]=r("",3)),h(t(e(u),null,null,512),[[p,s.value]]),t(l,null,{default:n(()=>[t(e(y),{title:"查看 Skill 详情",description:"浏览 Skill 文件树并查看说明正文和资源文件。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:i[3]||(i[3]=()=>{s.value=!1}),vueCode:e(x)},k({_:2},[b.value?{name:"vue",fn:n(()=>[t(e(b))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),i[9]||(i[9]=g("h3",{id:"skill-编辑与文件管理",tabindex:"-1"},[f("Skill 编辑与文件管理 "),g("a",{class:"header-anchor",href:"#skill-编辑与文件管理","aria-label":'Permalink to "Skill 编辑与文件管理"'},"​")],-1)),i[10]||(i[10]=g("p",null,[f("下面的示例单独展示编辑流程。示例默认选中 "),g("code",null,"SKILL.md"),f("，可以直接点击右侧文件标题栏的“编辑”进入编辑态；保存后，示例会更新传入的定义并显示保存提示。")],-1)),h(t(e(u),null,null,512),[[p,s.value]]),t(l,null,{default:n(()=>[t(e(y),{title:"编辑 Skill 正文",description:"点击右侧文件标题栏的“编辑”，切换可视化或源码模式并保存；也可以选择文本资源编辑。",locale:"",select:"vue",order:"vue,react,html",github:"",gitlab:"",theme:"",lightTheme:"",darkTheme:"",stackblitz:"%7B%22show%22%3Afalse%7D",codesandbox:"%7B%22show%22%3Afalse%7D",codeplayer:"%7B%22show%22%3Afalse%7D",playground:"%7B%22show%22%3Atrue%7D",files:"%7B%22vue%22%3A%7B%7D%2C%22react%22%3A%7B%7D%2C%22html%22%3A%7B%7D%7D",scope:"",htmlWriteWay:"write",background:"undefined",visible:!0,onMount:i[4]||(i[4]=()=>{s.value=!1}),vueCode:e(A)},k({_:2},[m.value?{name:"vue",fn:n(()=>[t(e(m))]),key:"0"}:void 0]),1032,["vueCode"])]),_:1}),i[11]||(i[11]=r("",48))])}}});export{Z as __pageData,R as default};
