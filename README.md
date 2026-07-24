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

### 6. 📁 Workspace Directory Sanitization
* **Remove Empty Files**: Safely deletes 0-byte or whitespace-only files.
* **Remove Empty Folders**: Recursively traverses directory structures and removes empty folders from the deepest subdirectory upward, ensuring nested empty structures are fully cleared.

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

---

## Available Commands

Open the **Command Palette** (`Ctrl+Shift+P` on Windows/Linux or `Cmd+Shift+P` on macOS) and search for the following commands:

### Active File Commands
* `Clean Code: Remove Comments from Current File`
* `Clean Code: Remove Dead Code from Current File`
* `Clean Code: Remove Empty Lines from Current File`
* `Clean Code: Remove Trailing Spaces from Current File`
* `Clean Code: Remove Console Logs from Current File`

### Workspace-Wide Commands
* `Clean Code: Remove Comments from Workspace`
* `Clean Code: Remove Dead Code from Workspace`
* `Clean Code: Remove Empty Lines from Workspace`
* `Clean Code: Remove Trailing Spaces from Workspace`
* `Clean Code: Remove Console Logs from Workspace`
* `Clean Code: Remove Empty Files from Workspace`
* `Clean Code: Remove Empty Folders from Workspace`

---

## Extension Architecture

Universal Code Cleaner employs the **Strategy Pattern** to ensure high extensibility and robust operation:
* **`IProcessor`**: The unified scanning interface representing each modular cleaning task.
* **`cleanerEngine`**: The central driver orchestration module that applies edits directly in VS Code's editor stack or implements file-system fallbacks for workspace files to avoid `Document has been closed` memory reclaiming errors.
* **Safe Preview System**: Shows you exactly how many items and files will be modified beforehand, keeping you in full control of code refactoring.

---

## License

Created by **Dimar Tarmizi**. Released under the MIT License.
