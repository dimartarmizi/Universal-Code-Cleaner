import * as vscode from 'vscode';
import { expandToFullLineIfIsolated } from '../core/rangeUtils';
import { CodeCleanerProcessor } from './types';

interface DeclaredSymbol {
	name: string;
	startOffset: number;
	endOffset: number;
}

function maskStringsAndComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*|#[^\r\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|<!--[\s\S]*?-->|\{\{--[\s\S]*?--\}\}/g, match => {
		return ' '.repeat(match.length);
	});
}

function findPythonBlockEnd(document: vscode.TextDocument, lines: string[], startLineIdx: number): number {
	const firstLine = lines[startLineIdx];
	const baseIndent = firstLine.match(/^\s*/)?.[0].length ?? 0;
	let lastLineIdx = startLineIdx;

	for (let i = startLineIdx + 1; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}
		const indent = line.match(/^\s*/)?.[0].length ?? 0;
		if (indent > baseIndent) {
			lastLineIdx = i;
		} else {
			break;
		}
	}
	return document.offsetAt(new vscode.Position(lastLineIdx, lines[lastLineIdx].length));
}

function findClosingBrace(text: string, startOffset: number): number {
	const braceStart = text.indexOf('{', startOffset);
	if (braceStart === -1 || braceStart - startOffset > 400) {
		return -1;
	}
	let depth = 1;
	let curr = braceStart + 1;
	let inString: string | null = null;
	let inComment: 'line' | 'block' | null = null;

	while (curr < text.length && depth > 0) {
		const char = text[curr];
		const nextChar = text[curr + 1];

		if (inComment === 'line') {
			if (char === '\n') inComment = null;
		} else if (inComment === 'block') {
			if (char === '*' && nextChar === '/') {
				inComment = null;
				curr++;
			}
		} else if (inString) {
			if (char === '\\') {
				curr++;
			} else if (char === inString) {
				inString = null;
			}
		} else {
			if (char === '/' && nextChar === '/') {
				inComment = 'line';
				curr++;
			} else if (char === '/' && nextChar === '*') {
				inComment = 'block';
				curr++;
			} else if (char === '"' || char === "'" || char === '`') {
				inString = char;
			} else if (char === '{') {
				depth++;
			} else if (char === '}') {
				depth--;
			}
		}
		curr++;
	}

	if (depth === 0) {
		// Include trailing semicolon if present
		while (curr < text.length && (text[curr] === ' ' || text[curr] === '\t')) {
			curr++;
		}
		if (curr < text.length && text[curr] === ';') {
			curr++;
		}
		return curr;
	}
	return -1;
}

export class DeadCodeProcessor implements CodeCleanerProcessor {
	name = 'DeadCode';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const text = document.getText();
		const maskedText = maskStringsAndComments(text);
		const lines = text.split(/\r?\n/);
		const deadRanges: vscode.Range[] = [];
		const lineHandled = new Set<number>();

		// 1. Multi-line and Single-line JS/TS Imports: import ... { ... } from '...';
		const importBlockRegex = /import\s+(?:type\s+)?(?:([a-zA-Z0-9_$]+)\s*,\s*)?\{([\s\S]*?)\}\s*from\s*['"][^'"]+['"];?/g;
		let impMatch: RegExpExecArray | null;
		while ((impMatch = importBlockRegex.exec(text)) !== null) {
			const fullMatch = impMatch[0];
			const defaultImport = impMatch[1];
			const innerItems = impMatch[2];
			const startOffset = impMatch.index;
			const endOffset = startOffset + fullMatch.length;

			const items: { name: string; rawItem: string; offset: number }[] = [];

			if (defaultImport) {
				const defOffset = startOffset + fullMatch.indexOf(defaultImport);
				items.push({
					name: defaultImport.trim(),
					rawItem: defaultImport,
					offset: defOffset
				});
			}

			innerItems
				.split(',')
				.forEach(item => {
					const trimmed = item.trim();
					if (!trimmed) return;
					const parts = trimmed.split(/\s+as\s+/);
					const importedName = parts[parts.length - 1].trim();
					const itemOffset = startOffset + fullMatch.indexOf(item);
					items.push({
						name: importedName,
						rawItem: item,
						offset: itemOffset
					});
				});

			const unusedItems = items.filter(it => {
				const regex = new RegExp(`(?<![a-zA-Z0-9_$])${it.name.replace(/[$]/g, '\\$')}(?![a-zA-Z0-9_$])`, 'g');
				const matches = maskedText.match(regex);
				return matches && matches.length === 1;
			});

			if (unusedItems.length === items.length && items.length > 0) {
				deadRanges.push(expandToFullLineIfIsolated(document, startOffset, endOffset));
				const startLine = document.positionAt(startOffset).line;
				const endLine = document.positionAt(endOffset).line;
				for (let l = startLine; l <= endLine; l++) lineHandled.add(l);
			} else if (unusedItems.length > 0) {
				const braceOpen = fullMatch.indexOf('{');
				const braceClose = fullMatch.lastIndexOf('}');
				if (braceOpen !== -1 && braceClose !== -1 && braceClose > braceOpen) {
					const unusedNames = new Set(unusedItems.map(u => u.name));
					const keptItems = items.filter(it => !unusedNames.has(it.name));

					const innerStart = startOffset + braceOpen + 1;
					const innerEnd = startOffset + braceClose;

					if (keptItems.length > 0) {
						// Sort unused items from right to left
						const sortedUnused = [...unusedItems].sort((a, b) => b.offset - a.offset);
						for (const unused of sortedUnused) {
							// Determine deletion bounds inside fullMatch
							const itemIdx = fullMatch.indexOf(unused.rawItem);
							let itemStart = startOffset + itemIdx;
							let itemEnd = itemStart + unused.rawItem.length;

							// Check if there is a following comma
							let after = itemEnd;
							while (after < innerEnd && (text[after] === ' ' || text[after] === '\t')) {
								after++;
							}

							if (after < innerEnd && text[after] === ',') {
								// First / middle item: delete from itemStart up to after comma + space
								itemEnd = after + 1;
								// Leave exactly one space if before next item
								while (itemEnd < innerEnd && (text[itemEnd] === ' ' || text[itemEnd] === '\t')) {
									itemEnd++;
								}
								// But we want a space before next item: keep 1 space
								if (itemEnd < innerEnd && text[itemEnd] !== '}') {
									// keep 1 space between items
									itemEnd--;
								}
							} else {
								// Last item before }: delete from comma before this item up to itemEnd
								let before = itemStart - 1;
								while (before > innerStart && (text[before] === ' ' || text[before] === '\t')) {
									before--;
								}
								if (before >= innerStart && text[before] === ',') {
									itemStart = before;
								}
								// Keep 1 space before '}' if present
								if (text[itemEnd - 1] === ' ') {
									itemEnd--;
								}
							}

							deadRanges.push(new vscode.Range(document.positionAt(itemStart), document.positionAt(itemEnd)));
						}
					}
				}
			}
		}

		// 2. Scan remaining line-by-line items (Single imports, functions, variables)
		const detected: DeclaredSymbol[] = [];

		for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
			if (lineHandled.has(lineIdx)) continue;

			const rawLine = lines[lineIdx];
			const trimmed = rawLine.trim();

			if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
				continue;
			}

			if (trimmed.startsWith('export ') || trimmed.startsWith('public ')) {
				continue;
			}

			const singleImportMatch = rawLine.match(/^\s*(?:import\s+(?:type\s+)?(?:\*\s+as\s+)?([a-zA-Z0-9_$]+)\s+from\s+['"][^'"]+['"];?|use\s+[\\a-zA-Z0-9_]+\\([a-zA-Z0-9_]+)\s*;|from\s+[a-zA-Z0-9_.]+\s+import\s+([a-zA-Z0-9_]+)|import\s+([a-zA-Z0-9_]+)\s*;?)(?:\s*\/\/.*)?$/);
			if (singleImportMatch) {
				const symName = singleImportMatch[1] || singleImportMatch[2] || singleImportMatch[3] || singleImportMatch[4];
				if (symName) {
					const startOffset = document.offsetAt(new vscode.Position(lineIdx, 0));
					const endOffset = document.offsetAt(new vscode.Position(lineIdx, rawLine.length));
					detected.push({
						name: symName,
						startOffset,
						endOffset
					});
					continue;
				}
			}

			const funcMatch = rawLine.match(/^\s*(?:(?:async|private|protected|static)\s+)*function\s+([a-zA-Z0-9_$]+)\s*\(/)
				|| rawLine.match(/^\s*(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/)
				|| rawLine.match(/^\s*func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(/)
				|| rawLine.match(/^\s*def\s+([a-zA-Z0-9_]+)\s*\(/);

			if (funcMatch) {
				const funcName = funcMatch[1];
				// Only consider internal / non-exported functions if private/underscore or standard function
				const isPython = document.languageId === 'python' || document.fileName.endsWith('.py');
				if (isPython) {
					// In python, only clean functions prefixed with _ (private) or explicitly non-public
					if (funcName.startsWith('_') && !funcName.startsWith('__')) {
						const startOffset = document.offsetAt(new vscode.Position(lineIdx, 0));
						const endOffset = findPythonBlockEnd(document, lines, lineIdx);
						detected.push({
							name: funcName,
							startOffset,
							endOffset
						});
					}
					continue;
				}

				if (!funcName.startsWith('__')) {
					const startOffset = document.offsetAt(new vscode.Position(lineIdx, 0));
					let endOffset = document.offsetAt(new vscode.Position(lineIdx, rawLine.length));

					const braceEnd = findClosingBrace(text, startOffset);
					if (braceEnd !== -1) {
						endOffset = braceEnd;
					}

					detected.push({
						name: funcName,
						startOffset,
						endOffset
					});
					continue;
				}
			}

			const varMatch = rawLine.match(/^\s*(?:(?:private|protected|public|static|local|my|let|const|var)\s+)+(\$?[a-zA-Z_][a-zA-Z0-9_]*)\s*(?::\s*[^=;]+)?\s*=\s*[^;\r\n]+;?(?:\s*\/\/.*)?$/)
				|| rawLine.match(/^\s*(\$[a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*[^;\r\n]+;?(?:\s*\/\/.*)?$/)
				|| rawLine.match(/^\s*([a-zA-Z0-9_]+)\s*:=\s*[^;\r\n]+(?:\s*\/\/.*)?$/);

			if (varMatch) {
				const symName = varMatch[1];
				if (!symName.startsWith('__') && symName !== '$this') {
					const startOffset = document.offsetAt(new vscode.Position(lineIdx, 0));
					const endOffset = document.offsetAt(new vscode.Position(lineIdx, rawLine.length));
					detected.push({
						name: symName,
						startOffset,
						endOffset
					});
					continue;
				}
			}
		}

		for (const sym of detected) {
			const escaped = sym.name.replace(/[$]/g, '\\$');
			const regex = new RegExp(`(?<![a-zA-Z0-9_$])${escaped}(?![a-zA-Z0-9_$])`, 'g');
			const matches = maskedText.match(regex);

			if (matches && matches.length === 1) {
				deadRanges.push(expandToFullLineIfIsolated(document, sym.startOffset, sym.endOffset));
			}
		}

		if (deadRanges.length > 1) {
			const filtered: vscode.Range[] = [];
			for (let i = 0; i < deadRanges.length; i++) {
				const rA = deadRanges[i];
				let enclosed = false;
				for (let j = 0; j < deadRanges.length; j++) {
					if (i === j) continue;
					const rB = deadRanges[j];
					if (
						(rB.start.isBeforeOrEqual(rA.start) && rB.end.isAfter(rA.end)) ||
						(rB.start.isBefore(rA.start) && rB.end.isAfterOrEqual(rA.end))
					) {
						enclosed = true;
						break;
					}
				}
				if (!enclosed) {
					filtered.push(rA);
				}
			}
			return filtered;
		}

		return deadRanges;
	}
}
