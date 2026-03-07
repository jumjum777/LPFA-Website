'use client';

import { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Navy', value: '#0B1F3A' },
  { label: 'Blue', value: '#1B8BEB' },
  { label: 'Gold', value: '#D97706' },
  { label: 'Red', value: '#DC2626' },
  { label: 'Green', value: '#059669' },
  { label: 'Gray', value: '#64748B' },
];

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const lastContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastContentRef.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && content !== lastContentRef.current) {
      lastContentRef.current = content;
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  if (!editor) return null;

  function addLink() {
    const url = prompt('Enter URL:');
    if (url) {
      editor!.chain().focus().setLink({ href: url }).run();
    }
  }

  function addYoutube() {
    const url = prompt('Paste a YouTube video URL:');
    if (url) {
      editor!.commands.setYoutubeVideo({ src: url });
    }
  }

  function insertTable() {
    editor!.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar">
        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="Bold"
        >
          <i className="fas fa-bold"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="Italic"
        >
          <i className="fas fa-italic"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'active' : ''}
          title="Underline"
        >
          <i className="fas fa-underline"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'active' : ''}
          title="Strikethrough"
        >
          <i className="fas fa-strikethrough"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'active' : ''}
          title="Highlight"
        >
          <i className="fas fa-highlighter"></i>
        </button>

        {/* Text color */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Text Color"
          >
            <i className="fas fa-palette"></i>
          </button>
          {showColorPicker && (
            <div className="rich-editor-color-picker">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  title={c.label}
                  onClick={() => {
                    if (c.value) {
                      editor.chain().focus().setColor(c.value).run();
                    } else {
                      editor.chain().focus().unsetColor().run();
                    }
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: '2px solid #e2e8f0',
                    background: c.value || '#fff',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <span className="toolbar-divider"></span>

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
          title="Heading 3"
        >
          H3
        </button>

        <span className="toolbar-divider"></span>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}
          title="Align Left"
        >
          <i className="fas fa-align-left"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}
          title="Align Center"
        >
          <i className="fas fa-align-center"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}
          title="Align Right"
        >
          <i className="fas fa-align-right"></i>
        </button>

        <span className="toolbar-divider"></span>

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="Bullet List"
        >
          <i className="fas fa-list-ul"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'active' : ''}
          title="Numbered List"
        >
          <i className="fas fa-list-ol"></i>
        </button>

        <span className="toolbar-divider"></span>

        {/* Block elements */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'active' : ''}
          title="Blockquote"
        >
          <i className="fas fa-quote-right"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Line"
        >
          <i className="fas fa-minus"></i>
        </button>

        <span className="toolbar-divider"></span>

        {/* Link */}
        <button
          type="button"
          onClick={addLink}
          className={editor.isActive('link') ? 'active' : ''}
          title="Add Link"
        >
          <i className="fas fa-link"></i>
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
          >
            <i className="fas fa-unlink"></i>
          </button>
        )}

        <span className="toolbar-divider"></span>

        {/* Table */}
        <button
          type="button"
          onClick={insertTable}
          title="Insert Table"
        >
          <i className="fas fa-table"></i>
        </button>
        {editor.isActive('table') && (
          <>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column"
            >
              <i className="fas fa-columns"></i>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row"
            >
              <i className="fas fa-plus"></i>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
              style={{ color: '#ef4444' }}
            >
              <i className="fas fa-trash"></i>
            </button>
          </>
        )}

        {/* YouTube */}
        <button
          type="button"
          onClick={addYoutube}
          title="Embed YouTube Video"
        >
          <i className="fab fa-youtube"></i>
        </button>

        <span className="toolbar-divider"></span>

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <i className="fas fa-undo"></i>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <i className="fas fa-redo"></i>
        </button>
      </div>
      <EditorContent editor={editor} className="rich-editor-content" />
    </div>
  );
}
