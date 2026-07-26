import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';
import { getSettings } from '../settings/config';

export class IndentProcessor implements CodeCleanerProcessor {
	name = 'Indent';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const ranges: vscode.Range[] = [];
		const settings = getSettings();
		const targetIndent = settings.indent?.style || 'tab';

		const lineCount = document.lineCount;
		for (let i = 0; i < lineCount; i++) {
			const line = document.lineAt(i);
			if (line.isEmptyOrWhitespace) {
				continue;
			}
			const text = line.text;
			const leadingWhitespaceMatch = text.match(/^[ \t]+/);
			if (!leadingWhitespaceMatch) {
				continue;
			}
			const leadingWhitespace = leadingWhitespaceMatch[0];

			let needsChange = false;
			if (targetIndent === 'tab') {
				if (leadingWhitespace.includes(' ')) {
					needsChange = true;
				}
			} else {
				if (leadingWhitespace.includes('\t')) {
					needsChange = true;
				}
			}

			if (needsChange) {
				const startPos = new vscode.Position(i, 0);
				const endPos = new vscode.Position(i, leadingWhitespace.length);
				ranges.push(new vscode.Range(startPos, endPos));
			}
		}
		return ranges;
	}

	applyCustomEdit(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument): void {
		const settings = getSettings();
		const targetIndent = settings.indent?.style || 'tab';
		const size = settings.indent?.size || 4;

		const lineCount = document.lineCount;
		for (let i = 0; i < lineCount; i++) {
			const line = document.lineAt(i);
			if (line.isEmptyOrWhitespace) {
				continue;
			}
			const text = line.text;
			const leadingWhitespaceMatch = text.match(/^[ \t]+/);
			if (!leadingWhitespaceMatch) {
				continue;
			}
			const leadingWhitespace = leadingWhitespaceMatch[0];
			const newWhitespace = this.convertWhitespace(leadingWhitespace, targetIndent, size);
			if (newWhitespace !== leadingWhitespace) {
				const range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, leadingWhitespace.length));
				editBuilder.replace(range, newWhitespace);
			}
		}
	}

	applyCustomWorkspaceEdit(edit: vscode.WorkspaceEdit, document: vscode.TextDocument): void {
		const settings = getSettings();
		const targetIndent = settings.indent?.style || 'tab';
		const size = settings.indent?.size || 4;

		const lineCount = document.lineCount;
		for (let i = 0; i < lineCount; i++) {
			const line = document.lineAt(i);
			if (line.isEmptyOrWhitespace) {
				continue;
			}
			const text = line.text;
			const leadingWhitespaceMatch = text.match(/^[ \t]+/);
			if (!leadingWhitespaceMatch) {
				continue;
			}
			const leadingWhitespace = leadingWhitespaceMatch[0];
			const newWhitespace = this.convertWhitespace(leadingWhitespace, targetIndent, size);
			if (newWhitespace !== leadingWhitespace) {
				const range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, leadingWhitespace.length));
				edit.replace(document.uri, range, newWhitespace);
			}
		}
	}

	private convertWhitespace(whitespace: string, targetIndent: 'tab' | 'space', size: number): string {
		let totalSpaces = 0;
		for (const char of whitespace) {
			if (char === '\t') {
				totalSpaces += size;
			} else {
				totalSpaces += 1;
			}
		}

		if (targetIndent === 'tab') {
			const tabs = Math.floor(totalSpaces / size);
			const remainingSpaces = totalSpaces % size;
			return '\t'.repeat(tabs) + ' '.repeat(remainingSpaces);
		} else {
			return ' '.repeat(totalSpaces);
		}
	}
}
