import { expandToFullLineIfIsolated } from '../core/rangeUtils';
import { getSettings } from '../core/config';
import { CodeCleanerProcessor } from './types';
import * as vscode from 'vscode';

export class ConsoleLogProcessor implements CodeCleanerProcessor {
	readonly name = 'ConsoleLog';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const text = document.getText();
		const ranges: vscode.Range[] = [];
		const settings = getSettings();

		const methods = ['log', 'debug', 'info', 'trace', 'dir'];
		if (!settings.consoleLogs.keepWarn) {
			methods.push('warn');
		}
		if (!settings.consoleLogs.keepError) {
			methods.push('error');
		}

		const consolePattern = new RegExp(`\\bconsole\\s*\\.\\s*(${methods.join('|')})\\s*\\(`, 'g');

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

				ranges.push(expandToFullLineIfIsolated(document, startOffset, endOffset));
			}
		}

		return ranges;
	}
}
