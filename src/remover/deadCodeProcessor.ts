import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';
import { getUnusedCodeRanges } from './deadCodeRemover';

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
