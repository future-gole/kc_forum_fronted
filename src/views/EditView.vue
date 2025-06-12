<template>
  <div class="edit-container">
    <div class="edit-card">
      <h1 class="edit-title">{{ isEditMode ? '编辑文章' : '创建新文章' }}</h1>

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
              placeholder="请输入标题 (最多 50 字)"
              class="title-field"
              @input="handleTitleInput"
              maxlength="50"
          />
          <span class="title-counter" :class="{ 'title-warning': title.length >= 50 }">
            {{ title.length }}/50
          </span>
        </div>

        <!-- 分割线 -->
        <hr class="divider" />

        <!-- 编辑器区域 -->
        <div class="editor-area"> 
          <!-- 桌面端工具栏 -->
          <div class="editor-toolbar desktop-toolbar" v-if="editor && !isMobile">
            <!-- 格式化 -->
            <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" title="粗体"><i class="fas fa-bold"></i></button>
            <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" title="斜体"><i class="fas fa-italic"></i></button>
            <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }" title="删除线"><i class="fas fa-strikethrough"></i></button>
            <button @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }" title="行内代码"><i class="fas fa-code"></i></button>
            <button @click="editor.chain().focus().toggleHighlight().run()" :class="{ 'is-active': editor.isActive('highlight') }" title="高亮"><i class="fas fa-highlighter"></i></button>
            <div class="toolbar-divider"></div>
            <!-- 标题 -->
            <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" title="H1"><i class="fas fa-heading"></i>1</button>
            <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" title="H2"><i class="fas fa-heading"></i>2</button>
            <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" title="H3"><i class="fas fa-heading"></i>3</button>
            <div class="toolbar-divider"></div>
            <!-- 列表 -->
            <button @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" title="无序列表"><i class="fas fa-list-ul"></i></button>
            <button @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" title="有序列表"><i class="fas fa-list-ol"></i></button>
            <div class="toolbar-divider"></div>
            <!-- 块级元素 -->
            <button @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }" title="引用"><i class="fas fa-quote-right"></i></button>
            <button @click="editor.chain().focus().toggleCodeBlock().run()" :class="{ 'is-active': editor.isActive('codeBlock') }" title="代码块"><i class="fas fa-file-code"></i></button>
            <button @click="editor.chain().focus().setHorizontalRule().run()" title="分割线"><i class="fas fa-minus"></i></button>
            <div class="toolbar-divider"></div>
            <!-- 表格 -->
            <button @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" title="插入表格"><i class="fas fa-table"></i></button>
            <button @click="editor.chain().focus().addColumnBefore().run()" :disabled="!editor.can().addColumnBefore()" title="向前插入列"><i class="fas fa-columns"></i>+</button>
            <button @click="editor.chain().focus().addColumnAfter().run()" :disabled="!editor.can().addColumnAfter()" title="向后插入列">+<i class="fas fa-columns"></i></button>
            <button @click="editor.chain().focus().deleteColumn().run()" :disabled="!editor.can().deleteColumn()" title="删除列"><i class="fas fa-trash-alt"></i><i class="fas fa-columns"></i></button>
            <button @click="editor.chain().focus().addRowBefore().run()" :disabled="!editor.can().addRowBefore()" title="向前插入行"><i class="fas fa-grip-lines"></i>+</button>
            <button @click="editor.chain().focus().addRowAfter().run()" :disabled="!editor.can().addRowAfter()" title="向后插入行">+<i class="fas fa-grip-lines"></i></button>
            <button @click="editor.chain().focus().deleteRow().run()" :disabled="!editor.can().deleteRow()" title="删除行"><i class="fas fa-trash-alt"></i><i class="fas fa-grip-lines"></i></button>
            <button @click="editor.chain().focus().deleteTable().run()" :disabled="!editor.can().deleteTable()" title="删除表格"><i class="fas fa-trash-alt"></i><i class="fas fa-table"></i></button>
            <div class="toolbar-divider"></div>
            <!-- 链接/图片 -->
            <!-- <button @click="addImage" title="插入图片"><i class="fas fa-image"></i></button> -->
            <button @click="addLink" :class="{ 'is-active': editor.isActive('link') }" title="插入链接"><i class="fas fa-link"></i></button>
            <div class="toolbar-divider"></div>
             <!-- 历史记录 -->
            <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="撤销"><i class="fas fa-undo"></i></button>
            <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="重做"><i class="fas fa-redo"></i></button>
          </div>

          <!-- 移动端工具栏 (类似电脑端置顶) -->
           <div class="mobile-actions" v-if="isMobile">
             <div class="mobile-toolbar" v-if="editor">
               <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }"><i class="fas fa-bold"></i></button>
               <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" title="斜体"><i class="fas fa-italic"></i></button>
               <button @click="editor.chain().focus().setHorizontalRule().run()" title="分割线"><i class="fas fa-minus"></i></button>
               <div class="toolbar-divider"></div>
               <button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" title="H1"><i class="fas fa-heading"></i>1</button>
               <button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" title="H2"><i class="fas fa-heading"></i>2</button>
               <button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" title="H3"><i class="fas fa-heading"></i>3</button>
               <div class="toolbar-divider"></div>
               <!-- <button @click="addImage" title="插入图片"><i class="fas fa-image"></i></button> -->
               <!-- Add more mobile-specific buttons if needed -->
               <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()"><i class="fas fa-undo"></i></button>
               <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()"><i class="fas fa-redo"></i></button>
              </div>
            </div>

          <!-- 编辑器内容区 -->
          <div class="editor-content-wrapper">
            <editor-content :editor="editor" class="editor-content" />
          </div>

          <!-- 字数统计 -->
          <div class="word-counter" :class="{ 'word-warning': contentLength > 10000 }">
            {{ contentLength }}/10000 字符
          </div>
        </div>

        <!-- 底部操作按钮 -->
        <div class="footer-actions">
          <div class="left-actions">
             <span class="board-badge" v-if="!isMobile">
               <i class="fas fa-clipboard"></i>
               发布到: {{ boardTitle }}
             </span>
             <!-- 移动端可以在这里显示存草稿等
              <button v-if="isMobile" class="draft-button"><i class="fas fa-save"></i> 存草稿</button> -->
          </div>
          <div class="right-actions">
            <button @click="goBack" class="cancel-button">
              <i class="fas fa-times" v-if="!isMobile"></i> {{ isMobile ? '取消' : '取消' }}
            </button>
            <button
                @click="submitArticle"
                class="submit-button"
                :disabled="isSubmitting || !canSubmit"
            >
              <i class="fas fa-paper-plane"></i>
              {{ isSubmitting ? '发布中...' : (isEditMode ? '更新' : '发布') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

import { ElMessage, ElMessageBox } from 'element-plus';
import request from "@/utils/request.js";

// Responsive Design Helper
const isMobile = ref(window.innerWidth < 768);
const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

// Props
const props = defineProps({
  boardId: {
    type: String,
    required: true
  },
  articleId: {
    type: String,
    default: null
  }
})

// Reactive State
const title = ref('')
const editor = ref(null)
const isSubmitting = ref(false)
const contentLength = ref(0)
const article = ref(null)
const initialTitle = ref('')
const initialContent = ref('')

// Route and router
const route = useRoute();
const router = useRouter()

// Computed Properties
const boardTitle = computed(() => route.query.title || '默认板块');
const isEditMode = computed(() => !!props.articleId);
const canSubmit = computed(() => {
  const titleChanged = title.value.trim() !== initialTitle.value;
  const contentChanged = editor.value?.getHTML() !== initialContent.value;
  const hasContent = title.value.trim() && contentLength.value > 0;
  const withinLimit = contentLength.value <= 10000 && title.value.length <= 50; // Title limit updated

  if (isEditMode.value) {
    return (titleChanged || contentChanged) && hasContent && withinLimit;
  } else {
    return hasContent && withinLimit;
  }
});

// --- Function Definitions ---

const fetchBoardInfo = async () => {
  // Keep this logic if board info is needed elsewhere or for validation
  console.log("Fetching info for board:", props.boardId);
  // Example: try/catch block to fetch board details if needed
};

const fetchArticleData = async () => {
  isSubmitting.value = true; // Indicate loading
  try {
    const response = await request.get(`/article/getArticleDetailById?articleId=${props.articleId}`);
    if (response.data.code === 200 && response.data.data) {
      article.value = response.data.data;
      title.value = article.value.title;
      const contentToSet = article.value.content || ''; // Ensure content is not null/undefined
      editor.value?.commands.setContent(contentToSet, false); // Set content without emitting update initially
      contentLength.value = editor.value?.storage.characterCount?.characters() ?? editor.value?.getText().length ?? 0; // Recalculate length

      initialTitle.value = title.value;
      initialContent.value = editor.value?.getHTML() ?? '';
      console.log("Initial content length:", contentLength.value);
      console.log("Initial content html:", initialContent.value);


    } else {
      ElMessage.error('获取文章失败: ' + (response.data.message || '未知错误'));
      router.back(); // Go back if article fetch fails
    }
  } catch (error) {
    console.error('获取文章失败:', error);
    ElMessage.error('获取文章时发生网络错误');
    router.back();
  } finally {
    isSubmitting.value = false;
  }
};

const addImage = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional: Add size check
    if (file.size > 5 * 1024 * 1024) { // 5MB limit for base64
        ElMessage.warning('图片大小不能超过 5MB');
        return;
    }


    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result;
       if (typeof src === 'string') {
         editor.value?.chain().focus().setImage({ src }).run();
       }
    };
    reader.readAsDataURL(file);
  };
  input.click();
};

const addLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href;
  const url = window.prompt('输入链接 URL', previousUrl || 'https://');

  if (url === null) return; // Cancelled

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run();
  } else {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }
};

const goBack = () => {
  const titleChanged = title.value.trim() !== initialTitle.value;
   // Use getHTML() for accurate comparison, getText() might miss formatting changes
  const contentChanged = editor.value?.getHTML() !== initialContent.value;

  if (titleChanged || contentChanged) {
    ElMessageBox.confirm(
      '内容尚未保存，确定要离开吗？',
      '提示',
      {
        confirmButtonText: '确定离开',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      router.back();
    }).catch(() => {
      // User cancelled
    });
  } else {
    router.back();
  }
};

const submitArticle = async () => {
  if (!canSubmit.value || isSubmitting.value) return;

  // Final validation checks (although button should be disabled)
  if (!title.value.trim()) {
    ElMessage.warning('请输入标题');
    return;
  }
  if (contentLength.value === 0) {
    ElMessage.warning('请输入内容');
    return;
  }
   if (contentLength.value > 10000 || title.value.length > 50) {
     ElMessage.warning('标题或内容超出长度限制');
     return;
   }


  isSubmitting.value = true;
  const content = editor.value?.getHTML() ?? ''; // Get final HTML content

  try {
    let response;
    if (isEditMode.value) {
      response = await request.post('/article/updateArticle', {
        id: props.articleId,
        title: title.value.trim(),
        content: content,
      });
    } else {
      response = await request.post('/article/create', {
        boardId: props.boardId,
        title: title.value.trim(),
        content: content,
      });
    }

    if (response.data.code === 200) {
      ElMessage.success(isEditMode.value ? '更新成功' : '发布成功');
       // Reset initial state after successful submission to prevent accidental "unsaved changes" warning
       initialTitle.value = title.value.trim();
       initialContent.value = content;
      router.push(`/home/board/${props.boardId}`);
    } else {
      ElMessage.error(response.data.message || (isEditMode.value ? '更新失败' : '发布失败'));
    }
  } catch (error) {
    console.error('提交文章失败:', error);
    ElMessage.error('提交时发生网络错误，请稍后重试');
  } finally {
    isSubmitting.value = false;
  }
};

// Limit title length
const handleTitleInput = () => {
  if (title.value.length > 50) {
    title.value = title.value.slice(0, 50);
  }
};

// --- Lifecycle Hooks ---

// Tiptap Editor Setup
onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // Keep disabled as we removed CodeBlockLowlight
      }),
      Image.configure({
        inline: false, // Allow images as block elements
        allowBase64: true, // Keep base64 for now
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `标题 ${node.attrs.level}`;
          }
          return '开始你的创作吧...';
        },
         emptyEditorClass: 'is-editor-empty',
      }),
      Highlight, // Keep Highlight if needed
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      contentLength.value = editor.storage.characterCount?.characters() ?? editor.getText().length; // More reliable count
    },
     editorProps: {
       attributes: {
         class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none', // Use Tailwind Prose classes if available, or define your own
       },
     },
  });

  // Fetch initial data
  fetchBoardInfo(); // NOW this function is defined before being called
  if (isEditMode.value) {
    fetchArticleData();
  }

  // Add resize listener
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial check

  // Autofocus title (consider if needed for mobile)
   if (!isMobile.value) {
      setTimeout(() => {
          document.querySelector('.title-field')?.focus()
       }, 100);
    }
});

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
  window.removeEventListener('resize', handleResize);
});

// Watchers
watch(() => props.boardId, fetchBoardInfo); // Refetch if boardId changes (e.g., navigation)

</script>


<style scoped>
/* 基本布局 */
.edit-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  min-height: 100vh;
  background-color: #f4f6f8;
}

.edit-card {
  width: 100%;
  max-width: 900px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 2rem); /* 为卡片保持固定高度 */
  overflow: hidden; /* 卡片本身不滚动，其内部内容将滚动 */
}

/* NEW: editor-wrapper 现在是主要的滚动区域 */
.editor-wrapper {
  flex-grow: 1; /* 允许它占据 .edit-card 中剩余的垂直空间 */
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* *** 这使得主编辑器内容 + 底部滚动 *** */
}

.divider {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 0.75rem 0;
}

/* 标题区域 */
.title-section {
  position: relative;
  padding-bottom: 0.5rem;
}

.title-input { /* 标题输入框的容器 */
  position: relative;
}

.title-field {
  width: 100%;
  padding: 0.75rem 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a202c;
  border: none;
  outline: none;
  background-color: transparent;
}

.title-field::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.title-counter {
  position: absolute;
  right: 0.5rem;
  bottom: 0;
  font-size: 0.75rem;
  color: #718096;
}

.title-warning {
  color: #ed8936;
}

/* 编辑器区域 */
.editor-area {
  flex-grow: 1; /* 占据 .editor-wrapper 中剩余空间，将字数统计/移动端操作/底部推到底部 */
  display: flex;
  flex-direction: column;
  /* overflow: hidden; */ /* 已移除：这可能是多余且有问题的 */
}

/* 编辑器内容包装器 (tiptap 内容的父元素) */
.editor-content-wrapper {
  flex-grow: 1; /* 允许它占据 editor-area 中剩余空间 */
  display: flex; /* 使其成为 flex 容器，允许 editor-content 增长 */
  flex-direction: column;
}

/* 编辑器内容 (Tiptap 的可编辑区域) */
.editor-content {
  flex-grow: 1; /* 这将确保编辑器内容填充 editor-content-wrapper 中的剩余空间 */
  overflow-y: auto; /* 允许内容在内部滚动 */
  padding: 0.5rem;
  line-height: 1.6;
  color: #2d3748;
}

/* 直接应用于 Tiptap 的可编辑元素 */
:deep(.ProseMirror) {
  min-height: 100px; /* 确保最小高度 */
  outline: none;
  word-wrap: break-word;
  white-space: pre-wrap;
}
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #a0aec0;
  pointer-events: none;
  height: 0;
}
:deep(.ProseMirror table) {
  border-collapse: collapse;
  margin: 1rem 0;
  width: 100%;
}
:deep(.ProseMirror th), :deep(.ProseMirror td) {
  border: 1px solid #dfe2e5;
  padding: 0.5em 0.75em;
  vertical-align: top;
}
:deep(.ProseMirror th) {
  font-weight: bold;
  text-align: left;
  background-color: #f6f8fa;
}
:deep(.ProseMirror .tableWrapper) {
  overflow-x: auto;
}
:deep(.ProseMirror code) {
  background-color: rgba(99, 110, 123, 0.15);
  padding: .1em .3em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}
:deep(.ProseMirror pre) {
  background: #2d2d2d; /* 代码块的深色背景 */
  color: #f8f8f2; /* 浅色文本 */
  font-family: 'JetBrainsMono', 'Fira Code', monospace;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  overflow-x: auto; /* 允许水平滚动 */
}

:deep(.ProseMirror pre code) {
  color: inherit;
  padding: 0;
  background: none;
  font-size: 0.85em;
}
:deep(.ProseMirror blockquote) {
  border-left: 3px solid #cbd5e0;
  margin: 1rem 0;
  padding-left: 1rem;
  color: #4a5568;
  font-style: italic;
}
:deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 1.5rem 0;
}
:deep(.ProseMirror img) {
    max-width: 100%;
    height: auto;
    display: block; /* 或 inline-block，取决于偏好 */
    margin: 1rem auto; /* 图片居中 */
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
 }
:deep(.ProseMirror a) {
  color: #3182ce;
  text-decoration: underline;
  cursor: pointer;
}
:deep(.ProseMirror ul), :deep(.ProseMirror ol) {
    padding-left: 1.5rem;
}


/* 工具栏 */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  gap: 0.25rem; /* 按钮之间的间距 */
}

.editor-toolbar button {
  display: inline-flex; /* 使用 inline-flex 以获得更好的对齐 */
  align-items: center;
  justify-content: center;
  width: 32px; /* 较小的按钮 */
  height: 32px;
  border: none;
  background-color: transparent;
  border-radius: 4px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem; /* 略小的图标 */
}

.editor-toolbar button:hover {
  background-color: #e2e8f0;
  color: #1a202c;
}

.editor-toolbar button.is-active {
  background-color: #ebf8ff;
  color: #2b6cb0;
}

.editor-toolbar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  background-color: #e2e8f0;
  margin: 0.25rem 0.5rem; /* 调整边距 */
  align-self: stretch; /* 使分隔线占据完整高度 */
}


/* 移动端特定样式 */
.mobile-actions {
    border-top: 1px solid #e2e8f0;
    padding-top: 0.5rem;
    background-color: #fff;
}

.mobile-toolbar {
    display: flex;
    justify-content: space-around; /* 分布项目 */
    padding: 0.5rem 0;
    background-color: #f8fafc;
}

.mobile-toolbar button {
    width: 40px; /* 稍大的触摸目标 */
    height: 40px;
    font-size: 1rem;
}

.mobile-options {
    display: flex;
    flex-wrap: wrap;
    padding: 0.5rem 0.5rem;
    gap: 0.5rem;
}

.option-button {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background-color: #edf2f7;
    color: #4a5568;
    border: none;
    border-radius: 15px; /* 药丸形状 */
    padding: 0.3rem 0.8rem;
    font-size: 0.8rem;
    cursor: pointer;
}
.option-button i {
    font-size: 0.8rem;
}


/* 字数统计 */
.word-counter {
  padding: 0.25rem 0.5rem; /* 较小的内边距 */
  text-align: right;
  font-size: 0.75rem; /* 较小的文本 */
  color: #718096;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  margin-top: auto; /* 在 editor-area 内部推到底部 */
}

.word-warning {
  color: #e53e3e;
}

/* 底部操作按钮 */
.footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.left-actions, .right-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 按钮之间的间距 */
}

.board-badge {
  display: inline-flex;
  align-items: center;
  background-color: #ebf8ff;
  color: #2b6cb0;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.board-badge i {
  margin-right: 0.4rem;
}

.draft-button, .cancel-button, .submit-button {
  padding: 0.6rem 1.2rem; /* 调整按钮内边距 */
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex; /* 使用 inline-flex */
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem; /* 调整字体大小 */
}
.draft-button {
   background-color: #f0f0f0;
   color: #555;
}
.draft-button:hover {
   background-color: #e0e0e0;
}


.cancel-button {
  background-color: #edf2f7;
  color: #4a5568;
}

.cancel-button:hover {
  background-color: #e2e8f0;
}

.submit-button {
  background: linear-gradient(135deg, #3182ce 0%, #4299e1 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(66, 153, 225, 0.15);
}

.submit-button:hover {
  background: linear-gradient(135deg, #2c5282 0%, #3182ce 100%);
  box-shadow: 0 4px 6px rgba(66, 153, 225, 0.2);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* 响应式覆盖 */

/* 在移动端隐藏桌面工具栏 */
.desktop-toolbar {
  display: flex; /* 默认显示 */
}
.mobile-actions {
  display: none; /* 默认隐藏 */
}


@media (max-width: 767px) {
  .edit-container {
    padding: 0;
    background-color: #ffffff;
  }
  .edit-card {
    border-radius: 0;
    box-shadow: none;
    padding: 0.75rem;
    height: 100vh; /* 移动端全视口高度 */
  }

  .desktop-toolbar {
    display: none;
  }

  /* 移动端工具栏样式和定位 */
  .mobile-actions {
    display: block;
    /* margin-top: auto; 已移除：不再需要将其推到底部 */
    border-top: none; /* 移除顶部边框 */
    border-bottom: 1px solid #e2e8f0; /* 添加底部边框作为分隔 */
    padding: 0.5rem; /* 统一内边距 */
    background-color: #f8fafc; /* 匹配桌面工具栏背景 */
    position: sticky; /* 使其粘滞 */
    top: 0; /* 粘滞在其滚动父元素 (.editor-area 的有效滚动视图) 的顶部 */
    z-index: 10; /* 确保它在内容之上 */
  }

  .mobile-toolbar {
    display: flex;
    flex-wrap: wrap; /* 允许按钮换行 */
    gap: 0.25rem; /* 按钮之间的间距，匹配桌面 */
    padding: 0; /* 内边距现在在 .mobile-actions 上 */
    background-color: transparent; /* 背景色由 .mobile-actions 提供 */
    justify-content: flex-start; /* 按钮左对齐 */
  }

  .mobile-toolbar button {
    /* 继承桌面按钮样式以保持一致性 */
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px; /* 匹配桌面按钮大小 */
    height: 32px;
    border: none;
    background-color: transparent;
    border-radius: 4px;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem; /* 匹配桌面图标大小 */
  }

  .mobile-toolbar button:hover {
    background-color: #e2e8f0;
    color: #1a202c;
  }

  .mobile-toolbar button.is-active {
    background-color: #ebf8ff;
    color: #2b6cb0;
  }

  /* 隐藏 mobile-actions 内部的 hr.divider，因为 mobile-actions 上的 border-bottom 提供了分隔线效果 */
  .mobile-actions .divider {
    display: none;
  }

  .title-field {
     font-size: 1.1rem;
     padding: 0.5rem;
  }
   .title-counter {
     bottom: 0.2rem;
   }

  /* 确保 editor-wrapper 在移动端也能滚动 */
   .editor-wrapper {
     overflow-y: auto;
   }

  /* 缩小内容输入宽度并添加内边距 */
  .editor-content {
    padding: 0.5rem 1rem; /* 为内容区域添加水平内边距 */
  }
   :deep(.ProseMirror) {
     min-height: calc(100vh - 1200px); /* 根据其他元素高度调整 */
     max-width: 600px; /* 设置文本内容的最大宽度 */
     margin-left: auto; /* 内容居中 */
     margin-right: auto; /* 内容居中 */
     box-sizing: border-box; /* 确保内边距/边框不增加最大宽度 */
   }

  .footer-actions {
    padding: 0.75rem;
     background-color: #fff;
      border-top: 1px solid #e2e8f0;
       position: static; /* 移动端不再粘滞，随 editor-wrapper 滚动 */
       bottom: unset;
  }

  .cancel-button i {
     display: none;
  }
   .submit-button, .cancel-button, .draft-button {
     padding: 0.5rem 1rem;
     font-size: 0.85rem;
   }

   .board-badge {
       display: none;
   }
}
</style>