import * as vscode from 'vscode';

export function getUnusedCodeRanges(document: vscode.TextDocument): vscode.Range[] {
	const diagnostics = vscode.languages.getDiagnostics(document.uri);
	const unusedRanges: vscode.Range[] = [];

	for (const diag of diagnostics) {
		if (diag.tags && diag.tags.includes(vscode.DiagnosticTag.Unnecessary)) {
			unusedRanges.push(diag.range);
		}
	}

	return unusedRanges;
}

export function cleanUnusedCodeFromText(text: string, document: vscode.TextDocument, unusedRanges: vscode.Range[]): string {
	const sorted = [...unusedRanges].sort((a, b) => {
		const aStart = document.offsetAt(a.start);
		const bStart = document.offsetAt(b.start);
		return bStart - aStart;
	});

	let result = text;
	for (const range of sorted) {
		const startOffset = document.offsetAt(range.start);
		const endOffset = document.offsetAt(range.end);

		let start = startOffset;
		let end = endOffset;

		// Untuk baris import / variabel yang tidak terpakai, mari kita hapus satu baris penuh jika memungkinkan
		const startPos = range.start;
		const endPos = range.end;

		// Cari tahu apakah seluruh baris berisi dead code ini
		const lineText = document.lineAt(startPos.line).text;
		const trimmedLine = lineText.trim();
		const tokenText = text.substring(startOffset, endOffset).trim();

		if (trimmedLine === tokenText || trimmedLine === tokenText + ';' || trimmedLine === 'const ' + tokenText || trimmedLine === 'let ' + tokenText || trimmedLine === 'var ' + tokenText) {
			// Hapus satu baris penuh beserta baris barunya
			const lineStartOffset = document.offsetAt(new vscode.Position(startPos.line, 0));
			const nextLineStartOffset = startPos.line < document.lineCount - 1
				? document.offsetAt(new vscode.Position(startPos.line + 1, 0))
				: document.offsetAt(new vscode.Position(startPos.line, lineText.length));

			start = lineStartOffset;
			end = nextLineStartOffset;
		}

		result = result.substring(0, start) + result.substring(end);
	}
	return result;
}
