import * as vscode from 'vscode';

export function expandToFullLineIfIsolated(
	document: vscode.TextDocument,
	startOffset: number,
	endOffset: number
): vscode.Range {
	const text = document.getText();

	let expandedStart = startOffset;
	while (expandedStart > 0 && (text[expandedStart - 1] === ' ' || text[expandedStart - 1] === '\t')) {
		expandedStart--;
	}

	const isAtLineStart = expandedStart === 0 || text[expandedStart - 1] === '\n' || text[expandedStart - 1] === '\r';

	let expandedEnd = endOffset;
	while (expandedEnd < text.length && (text[expandedEnd] === ' ' || text[expandedEnd] === '\t')) {
		expandedEnd++;
	}

	const isAtLineEnd = expandedEnd === text.length || text[expandedEnd] === '\n' || text[expandedEnd] === '\r';

	if (isAtLineStart && isAtLineEnd) {
		if (expandedEnd < text.length) {
			if (text[expandedEnd] === '\r' && text[expandedEnd + 1] === '\n') {
				expandedEnd += 2;
			} else {
				expandedEnd += 1;
			}
		} else if (expandedStart > 0) {
			if (expandedStart >= 2 && text[expandedStart - 2] === '\r' && text[expandedStart - 1] === '\n') {
				expandedStart -= 2;
			} else if (text[expandedStart - 1] === '\n' || text[expandedStart - 1] === '\r') {
				expandedStart -= 1;
			}
		}
	}

	return new vscode.Range(
		document.positionAt(expandedStart),
		document.positionAt(expandedEnd)
	);
}
