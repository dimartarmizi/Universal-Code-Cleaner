# Universal Code Cleaner

A powerful, highly modular, and safe Visual Studio Code extension to sanitize, clean, and optimize your codebase. Instantly remove comments, dead code, excessive empty lines, trailing whitespaces, console logs, and empty structural elements either from your current active file or across the entire workspace.

---

## Features

### 1. 🧹 Remove Comments
Identify and strip single-line and multi-line comments across C/C++/JavaScript/TypeScript, Python, HTML, and CSS files.
* **Keep Directives**: Respects important statements like `eslint-disable`, `ts-ignore`, `prettier-ignore`, and standard software licenses.
* **Configure Keywords**: Easily add custom ignore keywords via extension settings.

### 2. 🚫 Remove Dead Code (Unused Code)
Leverages VS Code's active linter diagnostic tags (`vscode.DiagnosticTag.Unnecessary`) to clean unused imports, variables, functions, and symbols.
* **Non-Destructive Same-Line Removal**: Targets and removes only the specific unused tokens along with their keyword prefixes (like `const`, `let`, `import`, `use`) and semicolons, instead of wiping out the entire line.

### 3. 📄 Smart Empty Line Removal
Reduces consecutive blank lines to standard code formatting rules.
* Keeps at most **1 empty line** to maintain readability.
* **Block Aware**: Automatically deletes *any* empty lines immediately adjacent to block openers (`{`, `[`, `(`, `:`) and block closers (`}`, `]`, `)`, `:`).

### 4. ✏️ Remove Trailing Spaces
Instantly deletes whitespaces, tabs, and trailing indentations lingering at the end of code lines.

### 5. 🖥️ Remove Console Logs (Safe Mode)
Performs safe cleanup of browser/Node console commands:
* **Removes**: `console.log`, `console.debug`, `console.warn`, `console.info`, `console.trace`, and `console.dir`.
* **Retains**: `console.error` is kept intact as it is vital for production error logging and telemetry.

### 6. 🗂️ Sort Imports (Universal)
Organizes and sorts your imports alphabetically, removing duplicates and cleaning empty lines inside the import block.
* **Universal Language Support**: Detects and sorts imports across JavaScript, TypeScript, Python (`import` & `from`), Go (`import`), Rust (`use`), PHP (`use`), CSS/SCSS (`@import`), and C/C++ (`#include`).

### 7. 📁 Workspace Directory Sanitization
* **Remove Empty Files**: Safely deletes 0-byte or whitespace-only files.
* **Remove Empty Folders**: Recursively traverses directory structures and removes empty folders from the deepest subdirectory upward, ensuring nested empty structures are fully cleared.

### 8. ⌨️ Convert Indentation
Converts leading line indentation between tabs and spaces.
* **Tab-Centered Defaults**: Standardizes tabs as the default target style.
* **Customizable Sizes**: Allows mapping custom space-equivalent counts when converting to/from tabs.

---

## Configuration Settings

You can customize the extension behavior in your `settings.json`:

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `codeCleaner.ignore` | `array` | `["**/node_modules/**", "**/dist/**", "**/vendor/**", "**/build/**", "**/.git/**"]` | Glob patterns to ignore during workspace cleanup tasks. (Supports Settings UI) |
| `codeCleaner.keep` | `array` | `["license", "ts-ignore", "eslint-disable", "prettier-ignore"]` | Case-insensitive keywords inside comments to preserve. (Supports Settings UI) |
| `codeCleaner.preview` | `boolean` | `true` | Show a confirmation dialog detailing the number of files and edits before applying changes. |
| `codeCleaner.autoSave` | `boolean` | `true` | Automatically save files after performing cleanup actions. |
| `codeCleaner.consoleLogs.keepError` | `boolean` | `true` | Preserve `console.error` statements when cleaning console logs. |
| `codeCleaner.consoleLogs.keepWarn` | `boolean` | `false` | Preserve `console.warn` statements when cleaning console logs. |
| `codeCleaner.emptyLines.maxConsecutive` | `integer` | `1` | Maximum consecutive empty lines allowed in a document. |
| `codeCleaner.indent.style` | `string` | `"tab"` | Target indentation style (`"tab"` or `"space"`). |
| `codeCleaner.indent.size` | `integer` | `4` | Number of spaces equivalent to one tab for conversion. |

---

## Available Commands

Open the **Command Palette** (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS) and search for the following commands:

* `Clean Code: Remove Comments` - Cleans single-line and multi-line comments.
* `Clean Code: Remove Dead Code` - Cleans unused variables, imports, and symbols.
* `Clean Code: Remove Empty Lines` - Cleans consecutive or invalid empty lines.
* `Clean Code: Remove Trailing Spaces` - Cleans trailing whitespaces at the end of lines.
* `Clean Code: Remove Console Logs` - Cleans debug console logs while preserving errors.
* `Clean Code: Sort Imports` - Alphabetizes and optimizes block imports.
* `Clean Code: Convert Indentation` - Standardizes line indentations between tabs and spaces.
* `Clean Code: Remove Empty Files` - Removes 0-byte or empty files from the workspace.
* `Clean Code: Remove Empty Folders` - Recursively cleans empty directory structures.

*Note: For the content cleaning commands, a selection prompt will ask whether you want to apply the operation to the **Current File** or across the **Workspace**.*

---

## Extension Architecture

Universal Code Cleaner employs the **Strategy Pattern** to ensure high extensibility and robust operation:
* **`IProcessor`**: The unified scanning interface representing each modular cleaning task.
* **`cleanerEngine`**: The central driver orchestration module that applies edits directly in VS Code's editor stack or implements file-system fallbacks for workspace files to avoid `Document has been closed` memory reclaiming errors.
* **Safe Preview System**: Shows you exactly how many items and files will be modified beforehand, keeping you in full control of code refactoring.

---

## License

Created by **Dimar Tarmizi**. Released under the MIT License.
