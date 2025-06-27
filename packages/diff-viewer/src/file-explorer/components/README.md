# File Explorer Components

This directory contains the React components that make up the file explorer functionality in the diff viewer.

## Components Overview

### DirectoryRow

The `DirectoryRow` component is responsible for rendering individual directory entries in the file explorer tree structure.

**Key Features:**

- **Expand/Collapse Functionality**: Displays an expand/collapse button that allows users to toggle directory visibility
- **Visual Hierarchy**: Shows proper indentation based on nesting level and visual connectors for tree structure
- **Selection State**: Handles and displays selection state with appropriate styling
- **Interactive Behavior**: Responds to click events to toggle directory expansion

**Props:**

- `currentPath`: The full path of the directory
- `collapsed`: Boolean indicating if the directory is collapsed
- `level`: Nesting level for proper indentation
- `isLast`: Whether this is the last item in its parent directory
- `displayName`: The name to display for the directory
- `config`: File explorer configuration options
- `isSelected`: Whether this directory is currently selected
- `onDirectoryToggle`: Callback function for expand/collapse events

**Usage:**

```tsx
<DirectoryRow
  currentPath="/src/components"
  collapsed={false}
  level={2}
  isLast={false}
  displayName="components"
  config={fileExplorerConfig}
  isSelected={false}
  onDirectoryToggle={(path, collapsed) => {
    // Handle directory toggle
  }}
/>
```

### Other Components

- **DirNode**: Manages the rendering of directory nodes and their children
- **FileNode**: Renders individual file entries in the explorer
- **FSNode**: Base component providing common file system node styling and behavior

## Architecture

The file explorer uses a tree structure where:

- `DirNode` handles the recursive rendering of directory hierarchies
- `DirectoryRow` provides the visual representation of each directory entry
- `FileNode` handles individual file entries
- `FSNode` provides the foundational styling and behavior for all file system nodes

This modular approach allows for easy customization and maintenance of the file explorer interface.
