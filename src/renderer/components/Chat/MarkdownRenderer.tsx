import React, { useMemo } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({
  gfm: true,
  breaks: false,
} as any);

function highlightCode(code: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value;
  }
  return hljs.highlightAuto(code).value;
}

interface Props {
  content: string;
}

const renderer = {
  code({ text, lang }: { text: string; lang?: string }) {
    const highlighted = highlightCode(text, lang || '');
    return `<pre><code class="hljs ${lang ? `language-${lang}` : ''}">${highlighted}</code></pre>`;
  },
};

marked.use({ renderer });

export function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      return marked.parse(content) as string;
    } catch {
      return escapeHtml(content);
    }
  }, [content]);

  return (
    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
