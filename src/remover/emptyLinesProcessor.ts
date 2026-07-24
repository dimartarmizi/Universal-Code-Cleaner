import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';
import { getSettings } from '../settings/config';

export class EmptyLinesProcessor implements CodeCleanerProcessor {
	name = 'EmptyLines';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const ranges: vscode.Range[] = [];
		const lineCount = document.lineCount;
		const settings = getSettings();
		const maxAllowed = settings.emptyLines.maxConsecutive;
		let consecutiveEmptyCount = 0;

		for (let i = 0; i < lineCount; i++) {
			const lineText = document.lineAt(i).text;
			const isLineEmpty = lineText.trim() === '';

			if (isLineEmpty) {
				consecutiveEmptyCount++;

				let isAfterBlockOpen = false;
				if (i > 0) {
					const prevLineText = document.lineAt(i - 1).text.trim();
					if (/[{\[(\:]$/.test(prevLineText)) {
						isAfterBlockOpen = true;
					}
				}

				let isBeforeBlockClose = false;
				if (i < lineCount - 1) {
					let nextLineIdx = i + 1;
					while (nextLineIdx < lineCount - 1 && document.lineAt(nextLineIdx).text.trim() === '') {
						nextLineIdx++;
					}
					const nextLineText = document.lineAt(nextLineIdx).text.trim();
					if (/^[}\])\:]/.test(nextLineText)) {
						isBeforeBlockClose = true;
					}
				}

				if (consecutiveEmptyCount > maxAllowed || isAfterBlockOpen || isBeforeBlockClose) {
					const startPos = new vscode.Position(i, 0);
					const endPos = i < lineCount - 1
						? new vscode.Position(i + 1, 0)
						: new vscode.Position(i, lineText.length);
					ranges.push(new vscode.Range(startPos, endPos));
				}
			} else {
				consecutiveEmptyCount = 0;
			}
		}

		return ranges;
	}
}
