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

### Rendering Layer

- [ ] P0 - Add a ReviewToolbar in demo
- [ ] P0 - Add a hide drawer button
- [ ] P0 - Implement proper highlighting for partial changes in a line
- [ ] P0 - Add support for ignoring whitespaces
- [ ] P0 - Add support for rendering inline comments
- [ ] P2 - (Optimization) support virtual rows
- [ ] P2 - (Optimization) do not load very large diffs

## Future Considerations

- Add support for expanding hunks with more context
- Add support for blame and annotations

## License

MIT
