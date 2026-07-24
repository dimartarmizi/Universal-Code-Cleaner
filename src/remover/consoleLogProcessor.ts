import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';

export class ConsoleLogProcessor implements CodeCleanerProcessor {
	readonly name = 'ConsoleLog';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const text = document.getText();
		const ranges: vscode.Range[] = [];

		const consolePattern = /\bconsole\s*\.\s*(log|debug|warn|info|trace|dir)\s*\(/g;

		let match;
		while ((match = consolePattern.exec(text)) !== null) {
			const startOffset = match.index;
			let parenCount = 1;
			let endOffset = consolePattern.lastIndex;
			let inString: string | null = null;
			let escape = false;

			while (endOffset < text.length && parenCount > 0) {
				const char = text[endOffset];

				if (escape) {
					escape = false;
					endOffset++;
					continue;
				}

				if (char === '\\') {
					escape = true;
					endOffset++;
					continue;
				}

				if (inString) {
					if (char === inString) {
						inString = null;
					}
				} else {
					if (char === '"' || char === "'" || char === '`') {
						inString = char;
					} else if (char === '(') {
						parenCount++;
					} else if (char === ')') {
						parenCount--;
					}
				}
				endOffset++;
			}

			if (parenCount === 0) {
				let trailingOffset = endOffset;
				while (trailingOffset < text.length && /\s/.test(text[trailingOffset])) {
					trailingOffset++;
				}
				if (trailingOffset < text.length && text[trailingOffset] === ';') {
					endOffset = trailingOffset + 1;
				}

				let rangeStart = document.positionAt(startOffset);
				let rangeEnd = document.positionAt(endOffset);

				const lineText = document.lineAt(rangeStart.line).text;
				const beforeMatch = lineText.substring(0, rangeStart.character).trim();
				const afterMatch = lineText.substring(rangeEnd.character).trim();

				if (beforeMatch === '' && afterMatch === '') {
					if (rangeStart.line > 0) {
						const prevLine = document.lineAt(rangeStart.line - 1);
						rangeStart = new vscode.Position(rangeStart.line - 1, prevLine.text.length);
					} else if (rangeStart.line < document.lineCount - 1) {
						rangeEnd = new vscode.Position(rangeStart.line + 1, 0);
					}
				}

				ranges.push(new vscode.Range(rangeStart, rangeEnd));
			}
		}

		return ranges;
	}
}
