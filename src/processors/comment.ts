import { getSettings } from '../core/config';
import { parseComments, CommentSpan } from '../core/parser';
import { expandToFullLineIfIsolated } from '../core/rangeUtils';
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
		const isJsx = fileName.endsWith('.tsx') || fileName.endsWith('.jsx');

		for (const comment of commentsToRemove) {
			let start = comment.start;
			let end = comment.end;

			if (isJsx) {
				let braceBefore = start - 1;
				while (braceBefore >= 0 && (text[braceBefore] === ' ' || text[braceBefore] === '\t')) {
					braceBefore--;
				}
				let braceAfter = end;
				while (braceAfter < text.length && (text[braceAfter] === ' ' || text[braceAfter] === '\t')) {
					braceAfter++;
				}
				if (braceBefore >= 0 && text[braceBefore] === '{' && braceAfter < text.length && text[braceAfter] === '}') {
					start = braceBefore;
					end = braceAfter + 1;
				}
			}

			ranges.push(expandToFullLineIfIsolated(document, start, end));
		}

		return ranges;
	}
}
