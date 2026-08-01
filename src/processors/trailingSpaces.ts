import { CodeCleanerProcessor } from './types';
import * as vscode from 'vscode';

export class TrailingSpacesProcessor implements CodeCleanerProcessor {
	name = 'TrailingSpaces';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const ranges: vscode.Range[] = [];
		const lineCount = document.lineCount;

		for (let i = 0; i < lineCount; i++) {
			const lineText = document.lineAt(i).text;
			const match = lineText.match(/[ \t]+$/);
			if (match && match.index !== undefined) {
				const startPos = new vscode.Position(i, match.index);
				const endPos = new vscode.Position(i, lineText.length);
				ranges.push(new vscode.Range(startPos, endPos));
			}
		}

		return ranges;
	}
}
