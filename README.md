# Git Diff Viewer Library

This project is a high-performance, extensible Git diff renderer built with React and TypeScript. It is designed to power interactive code review experiences like those found on GitHub or GitLab, but with more control and customization.

## Why This Exists

Most open source diff viewers either:

- Lack interactive features (e.g., line-level callbacks, comments)
- Don’t scale well with large diffs
- Are difficult to style, theme, or extend
- Rely heavily on DOM-heavy rendering without optimization

Projects like `diff2html` or `react-diff-viewer` are good starting points but fall short for:

- Side-by-side rendering with metadata injection
- Syntax highlighting with language support
- Modern frontend performance needs (e.g., virtualization)
- Clean architectural separation between parser, model, and renderer

This library aims to fill that gap with a modern, performant, and developer-friendly toolkit.

## Architecture Overview

            +--------------------------+
            |      React Renderer      |
            |--------------------------|
            |  Virtualized Diff View   |
            |  Unified / Side-by-side  |
            |  Syntax Highlighting     |
            |  Interaction Hooks       |
            +-------------▲------------+
                          |
                +---------+--------+
                |  Intermediate IR |
                +---------▲--------+
                          |
       +------------------+------------------+
       |     Parser Adapter (diffparser)     |
       |  → Normalization and Whitespace     |
       +------------------+------------------+
                          |
                   Raw Git Diff Text

- **Parser Adapter**: Converts raw `git diff` into a normalized structure using a pluggable interface (`IDiffParser`). Initially powered by `diffparser`.
- **Intermediate Representation (IR)**: Clean, consistent object model optimized for rendering and enrichment (comments, coverage, etc.).
- **React Renderer**: Efficiently renders the IR using virtualization, highlights code, manages interaction callbacks, and supports both unified and side-by-side views.

## Build System

This project uses a **dual build setup**, optimized for monorepos and DX:

### Tooling Choices

- **pnpm**: Fast, disk-efficient package manager with built-in workspace support. Chosen over `npm` and `yarn` for performance and clean monorepo management.
- **tsup**: Fast TypeScript bundler for libraries. Built on `esbuild`, it handles ESM/CJS output and declaration files with minimal config.
- **vite**: Modern frontend dev server used to power the demo app. Instant reloads and optimized for React + TypeScript.

### Common Commands

Run from the root directory:

| Command        | Description                                  |
| -------------- | -------------------------------------------- |
| `pnpm install` | Installs all workspace dependencies          |
| `pnpm build`   | Builds the `@diff-viewer` library via `tsup` |
| `pnpm demo`    | Starts the Vite dev server for the demo app  |

> Note: `pnpm --filter <name>` is used internally to target specific workspace packages.

## TODO (By Layer)

### Parsing Layer

- [ ] Implement adapter for `diffparser` to conform to `IDiffParser`
- [ ] Normalize `diffparser` output to internal IR model
- [ ] Add toggle to strip or ignore whitespace-only changes
- [ ] Write unit tests for parsing edge cases
- [ ] Add fallback for diff headers and metadata like file names, modes, renames

### Intermediate Representation

- [ ] Define core types: `ParsedDiff`, `FileDiff`, `Hunk`, `DiffLine`
- [ ] Add utilities to detect line types (added, deleted, unchanged)
- [ ] Create optional diff-enrichment pipeline (e.g., mark lines for coverage or linting)
- [ ] (Optional) Add support for inline character/word diffs

### Rendering Layer

- [ ] Base React component: `<DiffViewer />`
- [ ] Accept props: `mode`, `onLineClick`, `highlightSyntax`, `ignoreWhitespace`, `metadata`
- [ ] Implement virtualized line rendering (using React Virtual or React Window)
- [ ] Render syntax-highlighted lines with Shiki or fallback highlighter
- [ ] Style additions, deletions, unchanged lines with scoped classes
- [ ] Implement both unified and side-by-side layouts

### Interactivity Layer

- [ ] Register line click and hover events
- [ ] Add ability to attach comments or metadata to lines
- [ ] Enable external metadata injection (e.g., coverage, review notes)
- [ ] Add line/column coordinate tracking for integrations

### Utilities and Styling

- [ ] Define CSS tokens for themes (light/dark)
- [ ] Expose custom class hooks for user theming
- [ ] Add basic layout tokens (gutter width, line number width)
- [ ] Provide utility to format diff metadata (file headers, file status)

## Future Considerations

- Support WASM-based parser (Rust, etc.) behind same interface
- Support inline commenting components
- Add file folding and hunk collapsing
- Add support for blame and annotations
- Export raw IR for other use cases (e.g., custom renderers or analyzers)

## License

MIT
