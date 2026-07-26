import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';

interface ImportBlock {
	startLine: number;
	endLine: number;
	sortedText: string;
}

interface ImportEntry {
	text: string;
	sortKey: string;
}

export class SortImportsProcessor implements CodeCleanerProcessor {
	readonly name = 'SortImports';
	private cachedBlocks = new Map<string, ImportBlock[]>();

	private readonly importPattern = /^\s*(import\b|from\b|using\b|use\b|#include\b|@import\b|require\b)/;

	private countBrackets(line: string, open: { [key: string]: number }): void {
		let inSingle = false;
		let inDouble = false;
		let inBacktick = false;
		let escape = false;

		for (const ch of line) {
			if (escape) {
				escape = false;
				continue;
			}
			if (ch === '\\') {
				escape = true;
				continue;
			}
			if (ch === "'" && !inDouble && !inBacktick) {
				inSingle = !inSingle;
				continue;
			}
			if (ch === '"' && !inSingle && !inBacktick) {
				inDouble = !inDouble;
				continue;
			}
			if (ch === '`' && !inSingle && !inDouble) {
				inBacktick = !inBacktick;
				continue;
			}
			if (inSingle || inDouble || inBacktick) {
				continue;
			}
			if (ch === '{' || ch === '(' || ch === '[') {
				open[ch] = (open[ch] || 0) + 1;
			}
			if (ch === '}' || ch === ')' || ch === ']') {
				const openCh = ch === '}' ? '{' : ch === ')' ? '(' : '[';
				open[openCh] = Math.max(0, (open[openCh] || 0) - 1);
			}
		}
	}

	private isOpenBalanced(open: { [key: string]: number }): boolean {
		return (open['{'] || 0) === 0 && (open['('] || 0) === 0 && (open['['] || 0) === 0;
	}

	private readImportStatement(lines: string[], startIdx: number): { endLine: number; statement: string; sortKey: string } | null {
		const firstLine = lines[startIdx];
		if (!this.importPattern.test(firstLine)) {
			return null;
		}

		const open: { [key: string]: number } = {};
		let current = firstLine;
		this.countBrackets(current, open);
		let endLine = startIdx;

		const endsWithSemicolon = (s: string) => s.trimEnd().endsWith(';');

		if (this.isOpenBalanced(open) && endsWithSemicolon(current)) {
			return {
				endLine: startIdx,
				statement: current.trim(),
				sortKey: this.extractSortKey(current.trim())
			};
		}

		for (let i = startIdx + 1; i < lines.length && i < startIdx + 20; i++) {
			current += '\n' + lines[i];
			this.countBrackets(lines[i], open);
			endLine = i;

			if (this.isOpenBalanced(open) && endsWithSemicolon(lines[i])) {
				const stmt = current.trim();
				return {
					endLine,
					statement: stmt,
					sortKey: this.extractSortKey(stmt)
				};
			}
		}

		const stmt = current.trim();
		return {
			endLine,
			statement: stmt,
			sortKey: this.extractSortKey(stmt)
		};
	}

	private extractSortKey(stmt: string): string {
		const cleaned = stmt.replace(/\s+/g, ' ').trim();

		const fromMatch = cleaned.match(/\bfrom\s+['"](.*?)['"]/);
		if (fromMatch) return fromMatch[1].toLowerCase();

		const sideEffectMatch = cleaned.match(/^import\s+['"](.*?)['"]/);
		if (sideEffectMatch) return sideEffectMatch[1].toLowerCase();

		const pyFromMatch = cleaned.match(/^from\s+(\S+)/);
		if (pyFromMatch) return pyFromMatch[1].toLowerCase();

		const useMatch = cleaned.match(/^use\s+(\S+)/);
		if (useMatch) return useMatch[1].toLowerCase();

		const includeMatch = cleaned.match(/^#include\s+[<"](.*?)[>"]/);
		if (includeMatch) return includeMatch[1].toLowerCase();

		const cssImportMatch = cleaned.match(/^@import\s+['"](.*?)['"]/);
		if (cssImportMatch) return cssImportMatch[1].toLowerCase();

		return cleaned.toLowerCase();
	}

	private scanSync(document: vscode.TextDocument): ImportBlock[] {
		const docUri = document.uri.toString();
		const text = document.getText();
		const lines = text.split(/\r?\n/);
		const blocks: ImportBlock[] = [];

		let scanning = false;
		let blockStartIdx = -1;
		let blockEndIdx = -1;
		const collectedImports: ImportEntry[] = [];

		const flushBlock = () => {
			if (collectedImports.length <= 1) {
				collectedImports.length = 0;
				scanning = false;
				return;
			}

			const sortedImports = [...collectedImports].sort((a, b) =>
				a.sortKey.localeCompare(b.sortKey, undefined, { sensitivity: 'base', numeric: true })
			);

			const sortedText = sortedImports.map(e => e.text).join('\n');
			const originalText = collectedImports.map(e => e.text).join('\n');

			if (sortedText !== originalText) {
				blocks.push({
					startLine: blockStartIdx,
					endLine: blockEndIdx,
					sortedText
				});
			}

			collectedImports.length = 0;
			scanning = false;
		};

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const isImport = this.importPattern.test(line);

			if (isImport) {
				if (!scanning) {
					scanning = true;
					blockStartIdx = i;
				}

				const result = this.readImportStatement(lines, i);
				if (result) {
					collectedImports.push({
						text: result.statement,
						sortKey: result.sortKey
					});
					blockEndIdx = result.endLine;
					i = result.endLine;
				}
			} else {
				if (scanning) {
					flushBlock();
				}
			}
		}

		if (scanning) {
			flushBlock();
		}

		this.cachedBlocks.set(docUri, blocks);
		return blocks;
	}

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const blocks = this.scanSync(document);
		const lines = document.getText().split(/\r?\n/);
		return blocks.map(b => new vscode.Range(
			new vscode.Position(b.startLine, 0),
			new vscode.Position(b.endLine, lines[b.endLine].length)
		));
	}

	applyCustomEdit(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument): void {
		const docUri = document.uri.toString();
		let blocks = this.cachedBlocks.get(docUri);
		if (!blocks) {
			blocks = this.scanSync(document);
		}

		for (const block of blocks) {
			const range = new vscode.Range(
				new vscode.Position(block.startLine, 0),
				new vscode.Position(block.endLine, document.lineAt(block.endLine).text.length)
			);
			editBuilder.replace(range, block.sortedText);
		}
	}

	applyCustomWorkspaceEdit(edit: vscode.WorkspaceEdit, document: vscode.TextDocument): void {
		const docUri = document.uri.toString();
		let blocks = this.cachedBlocks.get(docUri);
		if (!blocks) {
			blocks = this.scanSync(document);
		}

		for (const block of blocks) {
			const range = new vscode.Range(
				new vscode.Position(block.startLine, 0),
				new vscode.Position(block.endLine, document.lineAt(block.endLine).text.length)
			);
			edit.replace(document.uri, range, block.sortedText);
		}
	}
}
