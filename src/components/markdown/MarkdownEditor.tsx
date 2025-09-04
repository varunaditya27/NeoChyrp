"use client";
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { MathJaxLoader } from '@/src/components/math/MathJaxLoader';
import { renderMarkdown } from '@/src/lib/markdown';

// Lightweight in-house markdown editor (avoids heavy external editors to keep bundle lean)
// Features:
// - Controlled textarea with live preview toggle
// - Toolbar: heading levels, bold, italic, code, link, list, quote, hr
// - Keyboard shortcuts (Ctrl/Cmd + B/I/K)
// - Accessible labels & description
// - Tailwind utility styling

export interface MarkdownEditorProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label?: string;
  description?: string;
  preview?: boolean; // initial preview state
  onChange?: (value: string) => void;
  value?: string;
  heightClass?: string; // override default height
}

interface ToolbarButton {
  label: string;
  title: string;
  action: (current: string, selection: SelectionRange) => TransformResult;
  icon?: React.ReactNode;
}

interface SelectionRange { start: number; end: number; }
interface TransformResult { value: string; cursor?: number; }

function getSelection(textarea: HTMLTextAreaElement | null): SelectionRange {
  if (!textarea) return { start: 0, end: 0 };
  return { start: textarea.selectionStart, end: textarea.selectionEnd };
}

function applyWrap(wrapperL: string, wrapperR: string = wrapperL): ToolbarButton['action'] {
  return (current, sel) => {
    const before = current.slice(0, sel.start);
    const selected = current.slice(sel.start, sel.end);
    const after = current.slice(sel.end);
    const inserted = `${wrapperL}${selected || 'text'}${wrapperR}`;
    const next = before + inserted + after;
    const cursor = before.length + wrapperL.length + (selected ? selected.length : 4);
    return { value: next, cursor };
  };
}

function applyPrefix(prefix: string): ToolbarButton['action'] {
  return (current, sel) => {
    const before = current.slice(0, sel.start);
    const selected = current.slice(sel.start, sel.end) || 'text';
    const after = current.slice(sel.end);
    const lines = selected.split(/\n/).map(l => l ? (prefix + (prefix.endsWith(' ') ? '' : ' ') + l).replace(/\s+$/, '') : prefix.trim());
    const block = lines.join('\n');
    const next = before + block + after;
    const cursor = before.length + block.length;
    return { value: next, cursor };
  };
}

const toolbar: ToolbarButton[] = [
  { label: 'H1', title: 'Heading 1', action: applyPrefix('#') },
  { label: 'H2', title: 'Heading 2', action: applyPrefix('##') },
  { label: 'B', title: 'Bold', action: applyWrap('**') },
  { label: 'I', title: 'Italic', action: applyWrap('*') },
  { label: 'Code', title: 'Inline Code', action: applyWrap('`') },
  { label: 'Block', title: 'Code Block', action: (cur, sel) => {
      const before = cur.slice(0, sel.start);
      const selected = cur.slice(sel.start, sel.end) || 'console.log("hello")';
      const after = cur.slice(sel.end);
      const fenced = `${before && !before.endsWith('\n') ? '\n' : ''}\n\n\`\`\`ts\n${selected}\n\`\`\`\n\n`;
      return { value: before + fenced + after, cursor: before.length + fenced.length }; }
  },
  { label: 'Link', title: 'Link', action: (cur, sel) => {
      const before = cur.slice(0, sel.start);
      const selected = cur.slice(sel.start, sel.end) || 'text';
      const after = cur.slice(sel.end);
      const inserted = `[${selected}](https://)`;
      return { value: before + inserted + after, cursor: before.length + inserted.length - 1 };
    }
  },
  { label: 'UL', title: 'Bulleted List', action: applyPrefix('-') },
  { label: 'OL', title: 'Numbered List', action: applyPrefix('1.') },
  { label: 'Quote', title: 'Blockquote', action: applyPrefix('>') },
  { label: 'HR', title: 'Horizontal Rule', action: (cur, sel) => {
      const before = cur.slice(0, sel.start);
      const after = cur.slice(sel.end);
      const inserted = `${before && !before.endsWith('\n') ? '\n' : ''}---\n`;
      return { value: before + inserted + after, cursor: before.length + inserted.length };
    }
  },
  { label: 'Math', title: 'Inline Math', action: (cur, sel) => {
      const before = cur.slice(0, sel.start);
      const selected = cur.slice(sel.start, sel.end) || 'a^2 + b^2 = c^2';
      const after = cur.slice(sel.end);
      const inserted = `$${selected}$`;
      return { value: before + inserted + after, cursor: before.length + inserted.length }; }
  },
  { label: 'Block ℳ', title: 'Math Block', action: (cur, sel) => {
      const before = cur.slice(0, sel.start);
      const selected = cur.slice(sel.start, sel.end) || '\n\\int_0^1 x^2 dx';
      const after = cur.slice(sel.end);
      const block = `${before && !before.endsWith('\n') ? '\n' : ''}$$${selected}$$\n`;
      return { value: before + block + after, cursor: before.length + block.length }; }
  },
  { label: 'Embed', title: 'Video Embed', action: (cur, sel) => {
      const before = cur.slice(0, sel.start);
      const after = cur.slice(sel.end);
      const sample = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const inserted = `${before && !before.endsWith('\n') ? '\n' : ''}${sample}\n`;
      return { value: before + inserted + after, cursor: before.length + inserted.length }; }
  }
];

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  label = 'Markdown',
  description,
  preview = false,
  value = '',
  onChange,
  heightClass = 'h-64',
  className,
  ...rest
}) => {
  const id = useId();
  const [text, setText] = useState<string>(value);
  const [showPreview, setShowPreview] = useState<boolean>(preview);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { setText(value); }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onChange?.(e.target.value);
  }, [onChange]);

  const runAction = (btn: ToolbarButton) => {
    const sel = getSelection(taRef.current);
    const result = btn.action(text, sel);
    setText(result.value);
    onChange?.(result.value);
    // restore cursor
    requestAnimationFrame(() => {
      if (taRef.current && typeof result.cursor === 'number') {
        taRef.current.focus();
        taRef.current.selectionStart = taRef.current.selectionEnd = result.cursor;
      }
    });
  };

  const html = useMemo(() => renderMarkdown(text), [text]);

  // Keyboard shortcuts
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.metaKey && !e.ctrlKey) return;
    const key = e.key.toLowerCase();
    // Bold
    if (key === 'b') { e.preventDefault(); const btn = toolbar.find(t => t.label === 'B'); if (btn) runAction(btn); }
    // Italic
    if (key === 'i') { e.preventDefault(); const btn = toolbar.find(t => t.label === 'I'); if (btn) runAction(btn); }
    // Link
    if (key === 'k') { e.preventDefault(); const btn = toolbar.find(t => t.label === 'Link'); if (btn) runAction(btn); }
    // Code block (Ctrl/Cmd + Shift + C)
    if (e.shiftKey && key === 'c') { e.preventDefault(); const btn = toolbar.find(t => t.label === 'Block'); if (btn) runAction(btn); }
  };

  return (
    <div className={clsx('rounded border border-gray-300 bg-white shadow-sm', className)}>
      <div className="flex items-center justify-between border-b bg-gray-50 px-2 py-1">
        <div className="flex flex-wrap gap-1">
          {toolbar.map(btn => (
            <button
              type="button"
              key={btn.label}
              title={btn.title}
              onClick={() => runAction(btn)}
              className="rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-100"
            >{btn.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(p => !p)}
            className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >{showPreview ? 'Edit' : 'Preview'}</button>
        </div>
      </div>
      {label && <label htmlFor={id} className="sr-only">{label}</label>}
      {!showPreview && (
        <textarea
          ref={taRef}
          id={id}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKey}
          className={clsx('w-full resize-y border-0 bg-white p-3 font-mono text-sm focus:outline-none focus:ring-0', heightClass)}
          {...rest}
        />
      )}
      {showPreview && (
        <div className={clsx('prose max-w-none p-3 text-sm', heightClass, 'overflow-auto')} dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {showPreview && <MathJaxLoader rootSelector=".prose" />}
      {description && (
        <p className="border-t bg-gray-50 px-3 py-1 text-[11px] text-gray-500">{description}</p>
      )}
    </div>
  );
};

export default MarkdownEditor;
