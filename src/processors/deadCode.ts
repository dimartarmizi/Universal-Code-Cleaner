import { CodeCleanerProcessor } from './types';
import * as vscode from 'vscode';

export function getUnusedCodeRanges(document: vscode.TextDocument): vscode.Range[] {
	const diagnostics = vscode.languages.getDiagnostics(document.uri);
	const unusedRanges: vscode.Range[] = [];

	for (const diag of diagnostics) {
		if (diag.tags && diag.tags.includes(vscode.DiagnosticTag.Unnecessary)) {
			unusedRanges.push(diag.range);
		}
	}

	return unusedRanges;
}

export function cleanUnusedCodeFromText(text: string, document: vscode.TextDocument, unusedRanges: vscode.Range[]): string {
	const sorted = [...unusedRanges].sort((a, b) => {
		const aStart = document.offsetAt(a.start);
		const bStart = document.offsetAt(b.start);
		return bStart - aStart;
	});

	let result = text;
	for (const range of sorted) {
		const startOffset = document.offsetAt(range.start);
		const endOffset = document.offsetAt(range.end);

		let start = startOffset;
		let end = endOffset;

		const startPos = range.start;

		const lineText = document.lineAt(startPos.line).text;
		const trimmedLine = lineText.trim();
		const tokenText = text.substring(startOffset, endOffset).trim();

		if (trimmedLine === tokenText || trimmedLine === tokenText + ';' || trimmedLine === 'const ' + tokenText || trimmedLine === 'let ' + tokenText || trimmedLine === 'var ' + tokenText) {
			const lineStartOffset = document.offsetAt(new vscode.Position(startPos.line, 0));
			const nextLineStartOffset = startPos.line < document.lineCount - 1
				? document.offsetAt(new vscode.Position(startPos.line + 1, 0))
				: document.offsetAt(new vscode.Position(startPos.line, lineText.length));

			start = lineStartOffset;
			end = nextLineStartOffset;
		}

		result = result.substring(0, start) + result.substring(end);
	}
	return result;
}

export class DeadCodeProcessor implements CodeCleanerProcessor {
	name = 'DeadCode';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const unusedRanges = getUnusedCodeRanges(document);
		const ranges: vscode.Range[] = [];

		for (const range of unusedRanges) {
			const lineText = document.lineAt(range.start.line).text;
			const trimmedLine = lineText.trim();
			const tokenText = document.getText(range).trim();

			const patternCleanSingle = new RegExp(`^[a-zA-Z\\s]*\\$?${this.escapeRegExp(tokenText)}\\s*;?$`);

			if (patternCleanSingle.test(trimmedLine)) {
				const startPos = new vscode.Position(range.start.line, 0);
				const endPos = range.start.line < document.lineCount - 1
					? new vscode.Position(range.start.line + 1, 0)
					: new vscode.Position(range.start.line, lineText.length);
				ranges.push(new vscode.Range(startPos, endPos));
			} else {
				let startOffset = document.offsetAt(range.start);
				let endOffset = document.offsetAt(range.end);
				const fullText = document.getText();

				const prefixText = fullText.substring(Math.max(0, startOffset - 20), startOffset);
				const useMatch = prefixText.match(/[a-zA-Z]+\s+\$?$/);
				if (useMatch) {
					startOffset -= useMatch[0].length;
				}

				while (endOffset < fullText.length && (fullText[endOffset] === ' ' || fullText[endOffset] === ';' || fullText[endOffset] === '\t')) {
					endOffset++;
				}

				ranges.push(new vscode.Range(
					document.positionAt(startOffset),
					document.positionAt(endOffset)
				));
			}
		}

		return ranges;
	}

	private escapeRegExp(string: string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
