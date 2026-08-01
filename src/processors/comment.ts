import { getSettings } from '../core/config';
import { parseComments, CommentSpan } from '../core/parser';
import { getLanguageByExtension } from '../core/registry';
import { CodeCleanerProcessor } from './types';
import * as vscode from 'vscode';

export function shouldKeepComment(text: string, keepKeywords: string[]): boolean {
	const normalized = text.toLowerCase();
	for (const kw of keepKeywords) {
		if (normalized.includes(kw.toLowerCase())) {
			return true;
		}
	}
	return false;
}

export function filterComments(comments: CommentSpan[], keepKeywords: string[]): CommentSpan[] {
	return comments.filter(c => !shouldKeepComment(c.text, keepKeywords));
}

export function removeCommentsFromText(text: string, commentsToRemove: CommentSpan[]): string {
	const sorted = [...commentsToRemove].sort((a, b) => b.start - a.start);
	let result = text;
	for (const comment of sorted) {
		let start = comment.start;
		let end = comment.end;

		while (start > 0 && (result[start - 1] === ' ' || result[start - 1] === '\t')) {
			start--;
		}

		if ((start === 0 || result[start - 1] === '\n' || result[start - 1] === '\r') &&
			(end === result.length || result[end] === '\n' || result[end] === '\r')) {
			if (end < result.length) {
				if (result[end] === '\r' && result[end + 1] === '\n') {
					end += 2;
				} else {
					end += 1;
				}
			}
		}

		result = result.substring(0, start) + result.substring(end);
	}
	return result;
}

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

			while (startOffset > 0 && (text[startOffset - 1] === ' ' || text[startOffset - 1] === '\t')) {
				startOffset--;
			}

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
