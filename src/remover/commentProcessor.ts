import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';
import { getLanguageByExtension } from '../language/languageRegistry';
import { parseComments } from '../parser/parserManager';
import { filterComments } from './commentRemover';
import { getSettings } from '../settings/config';

export class CommentProcessor implements CodeCleanerProcessor {
	name = 'Comments';

	async scan(document: vscode.TextDocument): Promise<vscode.Range[]> {
		const fileName = document.fileName;
		const langConfig = getLanguageByExtension(fileName);
		if (!langConfig) {
			return [];
		}

		const text = document.getText();
		const rawComments = parseComments(text, langConfig.commentType);
		const settings = getSettings();
		const commentsToRemove = filterComments(rawComments, settings.keep);

		const ranges: vscode.Range[] = [];
		for (const comment of commentsToRemove) {
			let startOffset = comment.start;
			let endOffset = comment.end;

			// Bersihkan whitespace sebelum komentar
			while (startOffset > 0 && (text[startOffset - 1] === ' ' || text[startOffset - 1] === '\t')) {
				startOffset--;
			}

			// Jika di baris tersendiri, bersihkan newline sesudahnya
			if ((startOffset === 0 || text[startOffset - 1] === '\n' || text[startOffset - 1] === '\r') &&
				(endOffset === text.length || text[endOffset] === '\n' || text[endOffset] === '\r')) {
				if (endOffset < text.length) {
					if (text[endOffset] === '\r' && text[endOffset + 1] === '\n') {
						endOffset += 2;
					} else {
						endOffset += 1;
					}
				}
			}

			ranges.push(new vscode.Range(
				document.positionAt(startOffset),
				document.positionAt(endOffset)
			));
		}

		return ranges;
	}
}
