import { applyProcessorToEditor } from '../core/engine';
import { CommentProcessor } from '../processors/comment';
import { DebugStatementsProcessor } from '../processors/debugStatements';
import { EmptyLinesProcessor } from '../processors/emptyLines';
import { IndentProcessor } from '../processors/indent';
import { SortImportsProcessor } from '../processors/sortImports';
import { TrailingSpacesProcessor } from '../processors/trailingSpaces';
import * as vscode from 'vscode';

const commentProcessor = new CommentProcessor();
const emptyLinesProcessor = new EmptyLinesProcessor();
const trailingSpacesProcessor = new TrailingSpacesProcessor();
const debugStatementsProcessor = new DebugStatementsProcessor();
const sortImportsProcessor = new SortImportsProcessor();
const indentProcessor = new IndentProcessor();

export async function removeCommentsCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, commentProcessor);
}

export async function removeEmptyLinesCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, emptyLinesProcessor);
}

export async function removeTrailingSpacesCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, trailingSpacesProcessor);
}

export async function removeDebugStatementsCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, debugStatementsProcessor);
}

export async function sortImportsCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, sortImportsProcessor);
}

export async function convertIndentCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, indentProcessor);
}
