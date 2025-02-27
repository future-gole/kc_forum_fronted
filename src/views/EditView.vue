<template>
  <div class="edit-container">
    <div class="edit-card">
      <h1 class="edit-title">创建新文章</h1>

      <div class="board-info">
        <div class="board-badge">
          <i class="fas fa-clipboard"></i>
          <span>{{ boardTitle }}</span>
        </div>
      </div>

      <div class="editor-wrapper">
        <!-- 标题输入框 -->
        <div class="title-input">
          <input
              v-model="title"
              placeholder="请输入标题..."
              class="title-field"
              maxlength="100"
          />
          <span class="title-counter" :class="{ 'title-warning': title.length > 80 }">
            {{ title.length }}/100
          </span>
        </div>

        <!-- 工具栏 -->
        <div class="editor-toolbar" v-if="editor">
          <div class="toolbar-group">
            <button
                @click="editor.chain().focus().toggleBold().run()"
                :class="{ 'is-active': editor.isActive('bold') }"
                title="粗体"
            >
              <i class="fas fa-bold"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleItalic().run()"
                :class="{ 'is-active': editor.isActive('italic') }"
                title="斜体"
            >
              <i class="fas fa-italic"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleStrike().run()"
                :class="{ 'is-active': editor.isActive('strike') }"
                title="删除线"
            >
              <i class="fas fa-strikethrough"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleCode().run()"
                :class="{ 'is-active': editor.isActive('code') }"
                title="代码"
            >
              <i class="fas fa-code"></i>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <div class="toolbar-group">
            <button
                @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
                title="标题"
            >
              <i class="fas fa-heading"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleBulletList().run()"
                :class="{ 'is-active': editor.isActive('bulletList') }"
                title="无序列表"
            >
              <i class="fas fa-list-ul"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleOrderedList().run()"
                :class="{ 'is-active': editor.isActive('orderedList') }"
                title="有序列表"
            >
              <i class="fas fa-list-ol"></i>
            </button>
            <button
                @click="editor.chain().focus().toggleBlockquote().run()"
                :class="{ 'is-active': editor.isActive('blockquote') }"
                title="引用"
            >
              <i class="fas fa-quote-right"></i>
            </button>
          </div>

          <div class="toolbar-divider"></div>

          <div class="toolbar-group">
            <button
                @click="editor.chain().focus().setHorizontalRule().run()"
                title="分割线"
            >
              <i class="fas fa-minus"></i>
            </button>
            <button
                @click="addImage"
                title="插入图片"
            >
              <i class="fas fa-image"></i>
            </button>
            <button
                @click="addLink"
                :class="{ 'is-active': editor.isActive('link') }"
                title="插入链接"
            >
              <i class="fas fa-link"></i>
            </button>
            <button
                @click="editor.chain().focus().undo().run()"
                :disabled="!editor.can().undo()"
                title="撤销"
            >
              <i class="fas fa-undo"></i>
            </button>
            <button
                @click="editor.chain().focus().redo().run()"
                :disabled="!editor.can().redo()"
                title="重做"
            >
              <i class="fas fa-redo"></i>
            </button>
          </div>
        </div>

        <!-- 编辑器内容区 -->
        <div class="editor-content-wrapper">
          <editor-content :editor="editor" class="editor-content" />
        </div>

        <!-- 字数统计 -->
        <div class="word-counter" :class="{ 'word-warning': contentLength > 8000 }">
          {{ contentLength }}/10000 字符
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="goBack" class="cancel-button">
          <i class="fas fa-times"></i> 取消
        </button>
        <button
            @click="submitArticle"
            class="submit-button"
            :disabled="isSubmitting || !canSubmit"
        >
          <i class="fas fa-paper-plane"></i>
          {{ isSubmitting ? '发布中...' : '发布文章' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter,useRoute } from 'vue-router'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { ElMessage } from 'element-plus';
import request from "@/utils/request.js";


// 接收路由传递的 boardId 参数
const props = defineProps({
  boardId: {
    type: String,
    required: true
  }
})

const title = ref('')
const editor = ref(null)
const boardName = ref('')
const isSubmitting = ref(false)
const contentLength = ref(0)

// Route and router
const route = useRoute();
const router = useRouter()

// 从 URL 查询参数获取板块标题
const boardTitle = computed(() => {
  return route.query.title || '板块';
});


// 计算属性：是否可以提交
const canSubmit = computed(() => {
  return title.value.trim() &&
      contentLength.value > 0 &&
      contentLength.value <= 10000 &&
      title.value.length <= 100
})

// 初始化编辑器
onMounted(() => {
  // 创建编辑器实例
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      }),
      Placeholder.configure({
        placeholder: '开始编写精彩内容...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // 计算内容长度
      const text = editor.getText()
      contentLength.value = text.length
    },
    editorProps: {
      attributes: {
        class: 'prose prose-blue focus:outline-none',
      },
    },
  })

  // 获取板块信息
  fetchBoardInfo()

  // 自动聚焦标题
  setTimeout(() => {
    document.querySelector('.title-field')?.focus()
  }, 100)
})

// 组件卸载前销毁编辑器
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// 监听 boardId 变化，重新获取板块信息
watch(() => props.boardId, () => {
  fetchBoardInfo()
})

// 获取板块信息的函数
const fetchBoardInfo = async () => {
  try {
    // 这里应该调用获取板块详情的 API
    // 示例: const response = await axios.get(`http://127.0.0.1:58080/board/${props.boardId}`)
    // boardName.value = response.data.data.name

    // 由于没有提供获取板块详情的 API，这里暂时使用 boardId 作为板块名称
    boardName.value = `板块 ${props.boardId}`
  } catch (error) {
    console.error('获取板块信息失败:', error)
    boardName.value = '未知板块'
  }
}

// 添加图片功能
const addImage = () => {
  // 创建文件选择器
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      // 使用 FileReader 读取文件为 base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target.result
        // 插入图片
        editor.value.chain().focus().setImage({ src: result }).run()
      }
      reader.readAsDataURL(file)
    }
  }

  input.click()
}

// 添加链接功能
const addLink = () => {
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('输入链接URL', previousUrl)

  // 取消或为空时删除链接
  if (url === null) {
    return
  }

  // 为空时删除链接
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  // 更新链接
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

// 返回上一页
const goBack = () => {
  if (contentLength.value > 0 || title.value.trim()) {
    if (confirm('您有未保存的内容，确定要离开吗？')) {
      router.back()
    }
  } else {
    router.back()
  }
}

// 提交文章
const submitArticle = async () => {
  // 表单验证
  if (!title.value.trim()) {
    alert('请输入标题')
    return
  }

  if (contentLength.value === 0) {
    alert('请输入内容')
    return
  }

  if (contentLength.value > 10000) {
    alert('内容超出字数限制')
    return
  }

  // 防止重复提交
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    // 获取编辑器内容
    const content = editor.value.getHTML()

    // 调用创建文章 API
    const response = await request.post('/article/create', {
      title: title.value,
      content: content,
      boardId: props.boardId
    })

    // 处理响应
    if (response.data.code === 200) {
          // 使用更友好的提示
          ElMessage.success("发布成功~");
          // 发布成功后返回板块页面
          router.push(`/home/board/${props.boardId}`)
        }
    } catch (error) {
    console.error('提交失败:', error)
    alert('发布失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}
</script>


<style scoped>
/* 主容器样式 */
.edit-container {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0fd 100%);
}

/* 编辑卡片样式 */
.edit-card {
  width: 100%;
  max-width: 900px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 56, 146, 0.08);
  padding: 2rem;
  transition: all 0.3s ease;
}

/* 标题样式 */
.edit-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a365d;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
}

.edit-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3182ce, #63b3ed);
  border-radius: 3px;
}

/* 板块信息样式 */
.board-info {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-start;
}

.board-badge {
  display: inline-flex;
  align-items: center;
  background-color: #ebf8ff;
  color: #2b6cb0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(66, 153, 225, 0.15);
}

.board-badge i {
  margin-right: 0.5rem;
  font-size: 0.85rem;
}

/* 编辑器包装器 */
.editor-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.editor-wrapper:focus-within {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

/* 标题输入框 */
.title-input {
  position: relative;
  border-bottom: 1px solid #e2e8f0;
}

.title-field {
  width: 100%;
  padding: 1.25rem 1rem;
  font-size: 1.25rem;
  font-weight: 500;
  color: #2d3748;
  border: none;
  outline: none;
  background-color: #f8fafc;
  transition: background-color 0.2s ease;
}

.title-field:focus {
  background-color: #fff;
}

.title-field::placeholder {
  color: #a0aec0;
}

.title-counter {
  position: absolute;
  right: 1rem;
  bottom: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
  transition: color 0.2s ease;
}

.title-warning {
  color: #ed8936;
}

/* 工具栏样式 */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  gap: 0.25rem;
}

.toolbar-group {
  display: flex;
  gap: 0.25rem;
}

.toolbar-divider {
  width: 1px;
  background-color: #e2e8f0;
  margin: 0 0.5rem;
}

.editor-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background-color: transparent;
  border-radius: 4px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
}

.editor-toolbar button:hover {
  background-color: #edf2f7;
  color: #2b6cb0;
}

.editor-toolbar button.is-active {
  background-color: #ebf8ff;
  color: #3182ce;
}

.editor-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-toolbar button i {
  font-size: 1rem;
}

/* 编辑器内容区域 */
.editor-content-wrapper {
  position: relative;
  background-color: #fff;
}

.editor-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
  color: #2d3748;
  line-height: 1.6;
}

/* 字数统计 */
.word-counter {
  padding: 0.5rem 1rem;
  text-align: right;
  font-size: 0.8rem;
  color: #718096;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.word-warning {
  color: #e53e3e;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  background-color: #edf2f7;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button:hover {
  background-color: #e2e8f0;
}

.submit-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 6px rgba(66, 153, 225, 0.15);
}

.submit-button:hover {
  background: linear-gradient(135deg, #2c5282 0%, #3182ce 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(66, 153, 225, 0.2);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-card {
    padding: 1.5rem;
  }

  .edit-title {
    font-size: 1.5rem;
  }

  .title-field {
    padding: 1rem;
    font-size: 1.1rem;
  }

  .editor-toolbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .toolbar-divider {
    display: none;
  }

  .action-buttons {
    flex-direction: column-reverse;
  }

  .cancel-button, .submit-button {
    width: 100%;
    justify-content: center;
  }
}

/* 成功通知样式 */
.success-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #48bb78;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slide-in 0.3s ease-out forwards;
}

.success-notification i {
  font-size: 1.25rem;
}

.success-notification.fade-out {
  animation: fade-out 0.5s ease-out forwards;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* 编辑器内容样式补充 */
.editor-content .ProseMirror {
  min-height: 300px;
  padding: 1.25rem;
  outline: none;
}

.editor-content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #a0aec0;
  pointer-events: none;
  height: 0;
}

.editor-content .ProseMirror p {
  margin: 0.75rem 0;
}

.editor-content .ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.editor-content .ProseMirror img:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.editor-content .ProseMirror blockquote {
  border-left: 4px solid #4299e1;
  padding: 0.5rem 0 0.5rem 1rem;
  color: #4a5568;
  font-style: italic;
  margin: 1.25rem 0;
  background-color: #f7fafc;
  border-radius: 0 4px 4px 0;
}

.editor-content .ProseMirror hr {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 1.5rem 0;
}

.editor-content .ProseMirror h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #1a365d;
  margin: 1.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.editor-content .ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2a4365;
  margin: 1.5rem 0 1rem;
}

.editor-content .ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c5282;
  margin: 1.5rem 0 1rem;
}

.editor-content .ProseMirror a {
  color: #3182ce;
  text-decoration: none;
  border-bottom: 1px solid #90cdf4;
  transition: all 0.2s ease;
}

.editor-content .ProseMirror a:hover {
  color: #2b6cb0;
  border-bottom-color: #3182ce;
}

.editor-content .ProseMirror ul,
.editor-content .ProseMirror ol {
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.editor-content .ProseMirror li {
  margin: 0.25rem 0;
}

.editor-content .ProseMirror code {
  background-color: #f7fafc;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  color: #2d3748;
  border: 1px solid #edf2f7;
}

/* 自定义滚动条 */
.editor-content .ProseMirror::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.editor-content .ProseMirror::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.editor-content .ProseMirror::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

.editor-content .ProseMirror::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* 编辑器焦点样式 */
.editor-content .ProseMirror:focus {
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.1) inset;
}

/* 编辑器选中文本样式 */
.editor-content .ProseMirror ::selection {
  background-color: rgba(66, 153, 225, 0.2);
}
</style>