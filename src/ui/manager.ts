import { CodeCleanerProcessor } from '../processors/types';
import { PreviewContentProvider } from './provider';
import { UnifiedViewProvider } from './sidebar';
import * as vscode from 'vscode';

export let treeProvider: UnifiedViewProvider | undefined;
export let previewContentProvider: PreviewContentProvider | undefined;

export function setTreeProviders(tree: UnifiedViewProvider, preview: PreviewContentProvider) {
	treeProvider = tree;
	previewContentProvider = preview;
}

export function computeCleanedContent(doc: vscode.TextDocument, processor: CodeCleanerProcessor, ranges: vscode.Range[]): string {
	if (processor.applyCustomWorkspaceEdit) {
		const tempEdit = new vscode.WorkspaceEdit();
		processor.applyCustomWorkspaceEdit(tempEdit, doc);

		const entries = tempEdit.get(doc.uri);
		const sorted = [...entries].sort((a, b) => b.range.start.compareTo(a.range.start));
		let text = doc.getText();
		for (const edit of sorted) {
			const start = doc.offsetAt(edit.range.start);
			const end = doc.offsetAt(edit.range.end);
			text = text.substring(0, start) + edit.newText + text.substring(end);
		}
		return text;
	} else if (processor.applyCustomEdit) {
	}

	const sorted = [...ranges].sort((a, b) => b.start.compareTo(a.start));
	let text = doc.getText();
	for (const range of sorted) {
		const start = doc.offsetAt(range.start);
		const end = doc.offsetAt(range.end);
		text = text.substring(0, start) + text.substring(end);
	}
	return text;
}
