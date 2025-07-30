# @commons

Shared utilities, components, and theming for the Diff Viewer monorepo. Centralizes reusable logic and UI for consistency across internal packages. Not for external use.

## Overview

- Shared React components (buttons, icons, tooltips, markdown, progress bar)
- Theming and design tokens (theme context, providers)
- Utility functions (string, time, color, language, storage)
- Used by other monorepo packages (e.g., `@diff-viewer`, `@github`)

## Usage

```tsx
import { AddButton, MarkdownText, Themes, useTheme, readStorageValue } from '@commons'

<ThemeProvider theme={Themes.light}>
  <AddButton onClick={...} />
</ThemeProvider>
```

## Exports

- **Components:** Buttons, icons, markdown, tooltips, progress bar
- **Themes:** Theme objects, context, provider, design tokens
- **Utils:** String, time, highlight, color, language, storage helpers

## Testing

Run unit tests with [Vitest](https://vitest.dev/):

```sh
pnpm test -F @commons
```

or:

```sh
cd packages/commons
pnpm test
```
