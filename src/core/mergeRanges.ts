import * as vscode from 'vscode';

export function mergeOverlappingRanges(doc: vscode.TextDocument, ranges: vscode.Range[]): vscode.Range[] {
	if (ranges.length <= 1) {
		return ranges;
	}

	const intervals = ranges.map(r => ({
		start: doc.offsetAt(r.start),
		end: doc.offsetAt(r.end)
	}));

	intervals.sort((a, b) => a.start - b.start || a.end - b.end);

	const merged: { start: number; end: number }[] = [];
	let current = { ...intervals[0] };
	for (let i = 1; i < intervals.length; i++) {
		const next = intervals[i];
		if (next.start <= current.end) {
			current.end = Math.max(current.end, next.end);
		} else {
			merged.push(current);
			current = { ...next };
		}
	}
	merged.push(current);

	return merged
		.sort((a, b) => b.start - a.start)
		.map(m => new vscode.Range(doc.positionAt(m.start), doc.positionAt(m.end)));
}
