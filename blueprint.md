# Blueprint: Universal Comment Remover (VS Code Extension)

## 1. Konsep

**Nama sementara:**

* Universal Comment Remover
* Strip Comments
* Comment Sweeper

**Tagline:**

> Remove comments safely from an entire workspace with preview, backup, and multi-language support.

---

# 2. MVP

Versi pertama cukup memiliki fitur berikut:

```
Command Palette

> Remove Comments from Workspace
```

Flow:

```
User
 │
 ▼
Klik Command
 │
 ▼
Scan Workspace
 │
 ▼
Cari semua file
 │
 ▼
Filter ignore
 │
 ▼
Detect language
 │
 ▼
Parse
 │
 ▼
Cari node comment
 │
 ▼
Preview
 │
 ▼
Confirm
 │
 ▼
WorkspaceEdit
 │
 ▼
Save
```

---

# 3. Arsitektur

```
src/

 extension.ts

 commands/
    removeWorkspace.ts
    removeCurrentFile.ts
    preview.ts

 scanner/
    workspaceScanner.ts
    fileScanner.ts

 parser/
    parserManager.ts
    treeSitterLoader.ts

 remover/
    commentFinder.ts
    commentRemover.ts

 language/
    languageDetector.ts
    languageRegistry.ts

 settings/
    config.ts

 preview/
    diffPreview.ts
    statistics.ts

 utils/
    logger.ts
    progress.ts
```

---

# 4. Pipeline

```
Workspace

↓

Find Files

↓

Ignore Files

↓

Load Parser

↓

Parse AST

↓

Find Comment Nodes

↓

Build TextEdit

↓

Preview

↓

Apply WorkspaceEdit

↓

Save
```

---

# 5. Scanner

Menggunakan API VSCode

```
findFiles()

↓

exclude

↓

node_modules
dist
build
vendor
.git
coverage
```

Configurable.

---

# 6. Language Detection

Misal:

```
.js

↓

javascript
```

```
.ts

↓

typescript
```

```
.py

↓

python
```

Registry:

```
extension

↓

language

↓

tree-sitter parser
```

Contoh:

```
.ts

↓

tree-sitter-typescript

↓

Parser
```

---

# 7. Parser Manager

Interface:

```
IParser

load()

parse()

findComments()

removeComments()
```

Implementasi:

```
TreeSitterParser

↓

load grammar

↓

parse

↓

return AST
```

---

# 8. Comment Finder

Output:

```
[
   {
      start: 120,
      end: 140,
      text: "// hello"
   },
   {
      start: 310,
      end: 450,
      text: "/* block */"
   }
]
```

Semua comment node dikumpulkan.

---

# 9. Comment Remover

Sort descending.

Kenapa?

Misal:

```
hapus index 500

↓

hapus index 100
```

Supaya offset tidak berubah.

---

# 10. WorkspaceEdit

```
WorkspaceEdit

↓

replace(range,"")

↓

applyEdit()

↓

save()
```

---

# 11. Preview

Sebelum menghapus:

```
━━━━━━━━━━━━━━━━━━━

Files

☑ app.ts

☑ auth.ts

☑ login.vue

☑ index.php

━━━━━━━━━━━━━━━━━━━

Comments Found

JS      123

TS      54

PHP     92

HTML    32

CSS     11

━━━━━━━━━━━━━━━━━━━

Total

312 comments

━━━━━━━━━━━━━━━━━━━

[Remove]

[Cancel]
```

---

# 12. Progress

```
Removing comments...

████████░░░░░

37 / 125 files
```

---

# 13. Statistics

Setelah selesai:

```
Finished

Files modified

91

Comments removed

532

Elapsed

2.3 seconds
```

---

# 14. Settings

```
{
  "commentRemover.ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/vendor/**"
  ],

  "commentRemover.keep": [
    "license",
    "ts-ignore",
    "eslint-disable",
    "prettier-ignore"
  ],

  "commentRemover.preview": true,

  "commentRemover.autoSave": true
}
```

---

# 15. Command

```
Remove Comments

↓

Current File
```

```
Remove Comments

↓

Workspace
```

```
Preview Comments
```

```
Show Statistics
```

---

# 16. Error Handling

Jika parser tidak tersedia:

```
Python parser missing

↓

Skip file
```

Tidak boleh menghentikan seluruh proses.

---

# 17. Performance

Gunakan queue.

Misal:

```
CPU

↓

8 Core

↓

Worker 1

Worker 2

Worker 3

Worker 4

Worker 5

Worker 6

Worker 7

Worker 8
```

File diproses paralel.

---

# 18. Roadmap

### v1.0

* Remove comments
* Preview
* Workspace
* Current file
* Settings
* Progress

---

### v1.1

* Keep License
* Keep eslint-disable
* Keep ts-ignore
* Keep prettier-ignore

---

### v1.2

* Backup before remove
* Undo session
* Report

---

### v1.3

* Export statistics JSON

```
{
  "files":128,
  "commentsRemoved":932,
  "elapsed":1.9
}
```

---

### v2.0

* Tree View panel
* File-by-file preview
* Diff Viewer
* AI detection untuk membedakan komentar dokumentasi dan komentar biasa (opsional)

---

## Struktur Dependensi

```
VS Code Extension
        │
        ├── vscode API
        ├── fast-glob (scan file)
        ├── tree-sitter
        ├── tree-sitter-javascript
        ├── tree-sitter-typescript
        ├── tree-sitter-python
        ├── tree-sitter-php
        ├── tree-sitter-go
        ├── tree-sitter-rust
        ├── tree-sitter-java
        ├── tree-sitter-c-sharp
        ├── tree-sitter-html
        ├── tree-sitter-css
        └── tree-sitter-json (opsional, untuk validasi)
```

## Nilai jual utama

Agar ekstensi menonjol dibanding yang sudah ada, fokus pada tiga prinsip:

1. **Aman** — berbasis parser (AST), bukan regex, sehingga tidak menghapus teks yang menyerupai komentar di dalam string.
2. **Universal** — mendukung banyak bahasa melalui sistem plugin parser yang dapat diperluas.
3. **Transparan** — selalu menyediakan preview, statistik, dan kontrol penuh sebelum perubahan diterapkan.
