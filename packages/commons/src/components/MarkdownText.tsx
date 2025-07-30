import { css } from '@emotion/react'
import bash from 'highlight.js/lib/languages/bash'
import cssLang from 'highlight.js/lib/languages/css'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import scala from 'highlight.js/lib/languages/scala'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/github.css'
import React, { useContext } from 'react'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { ThemeContext } from '../themes'

const useStyles = () => {
  const theme = useContext(ThemeContext)

  return {
    content: css`
      font-family: ${theme.typography.regularFontFamily};
      color: ${theme.colors.textPrimary};
      font-size: ${theme.typography.regularFontSize}px;

      /* Enable word wrapping for long content */
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;

      /* Reduce default margins to avoid large gaps between headings and text */
      & h1,
      & h2,
      & h3,
      & h4,
      & h5,
      & h6 {
        margin: ${theme.spacing.sm} 0; /* small bottom spacing only */
      }

      & p {
        margin: 0; /* reset paragraph margins */
      }

      & pre {
        white-space: pre-wrap; /* Allow wrapping in code blocks */
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      & pre code.hljs {
        margin: 0 !important;
        padding: 0 !important;
        background-color: ${theme.colors.backgroundPrimary} !important;
        padding: 0; /* let the parent pre own the padding */
        border-radius: ${theme.spacing.sm};
        font-size: ${theme.typography.codeFontSize}px !important;
        white-space: pre-wrap; /* Allow wrapping in highlighted code */
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      /* Blockquote styling */
      & blockquote {
        display: flex;
        margin: ${theme.spacing.md} 0 !important;
        padding: ${theme.spacing.xs} 0 ${theme.spacing.sm} ${theme.spacing.sm};
        border-left: 4px solid ${theme.colors.border};
      }

      & blockquote p {
        margin: 0 !important; /* reset paragraph margins inside blockquote */
      }
    `,
  }
}

interface MarkdownTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The markdown text to display */
  children: string
}

/**
 * A component that displays markdown text with syntax highlighting.
 *
 * TODO
 * ----
 *
 * - having to hardcode the languages is not ideal.
 * - we should find a better way to handle language highlighting in markdown.
 *
 * @param children - The markdown text to display
 * @param rest     - Additional props to pass to the div element
 * @returns          A div element with the markdown text displayed
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ children, ...rest }) => {
  const styles = useStyles()

  const highlightOptions = {
    ignoreMissing: true,
    plainText: ['txt'],
    languages: {
      scala,
      python,
      javascript,
      typescript,
      java,
      css: cssLang,
      xml,
      json,
      bash,
    },
  }

  return (
    <div css={styles.content} {...rest}>
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeHighlight, highlightOptions]]}>
        {children}
      </Markdown>
    </div>
  )
}
