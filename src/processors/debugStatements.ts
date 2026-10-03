import { expandToFullLineIfIsolated } from '../core/rangeUtils';
import { getSettings } from '../core/config';
import { CodeCleanerProcessor } from './types';
import * as vscode from 'vscode';

export class DebugStatementsProcessor implements CodeCleanerProcessor {
	readonly name = 'DebugStatements';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const text = document.getText();
		const ranges: vscode.Range[] = [];
		const len = text.length;
		const settings = getSettings();

		const bareKeywordPattern = /\b(debugger|breakpoint\s*\(\s*\))\s*;?/g;
		let bareMatch: RegExpExecArray | null;
		while ((bareMatch = bareKeywordPattern.exec(text)) !== null) {
			const startOffset = bareMatch.index;
			const endOffset = bareKeywordPattern.lastIndex;
			ranges.push(expandToFullLineIfIsolated(document, startOffset, endOffset));
		}

		const consoleMethods = ['log', 'debug', 'info', 'trace', 'dir'];
		if (!settings.debugStatements.keepConsoleWarn) {
			consoleMethods.push('warn');
		}
		if (!settings.debugStatements.keepConsoleError) {
			consoleMethods.push('error');
		}

		const dumpFunctionPattern = new RegExp(
			`\\b(var_dump|dump|dd|print_r|pdb\\.set_trace|ipdb\\.set_trace|dbg!|console\\s*\\.\\s*(?:${consoleMethods.join('|')}))\\s*\\(`,
			'g'
		);
		let match: RegExpExecArray | null;
		while ((match = dumpFunctionPattern.exec(text)) !== null) {
			const startOffset = match.index;
			let parenCount = 1;
			let endOffset = dumpFunctionPattern.lastIndex;
			let inString: string | null = null;
			let escape = false;

			while (endOffset < len && parenCount > 0) {
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
				while (trailingOffset < len && /[\t ]/.test(text[trailingOffset])) {
					trailingOffset++;
				}
				if (trailingOffset < len && text[trailingOffset] === ';') {
					endOffset = trailingOffset + 1;
				}

				ranges.push(expandToFullLineIfIsolated(document, startOffset, endOffset));
			}
		}

		return ranges;
	}
}
