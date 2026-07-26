import * as vscode from 'vscode';
import { CommentProcessor } from '../remover/commentProcessor';
import { DeadCodeProcessor } from '../remover/deadCodeProcessor';
import { EmptyLinesProcessor } from '../remover/emptyLinesProcessor';
import { TrailingSpacesProcessor } from '../remover/trailingSpacesProcessor';
import { ConsoleLogProcessor } from '../remover/consoleLogProcessor';
import { SortImportsProcessor } from '../remover/sortImportsProcessor';
import { IndentProcessor } from '../remover/indentProcessor';
import { applyProcessorToEditor } from '../remover/cleanerEngine';

const commentProcessor = new CommentProcessor();
const deadCodeProcessor = new DeadCodeProcessor();
const emptyLinesProcessor = new EmptyLinesProcessor();
const trailingSpacesProcessor = new TrailingSpacesProcessor();
const consoleLogProcessor = new ConsoleLogProcessor();
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

export async function removeDeadCodeCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, deadCodeProcessor);
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

export async function removeConsoleLogsCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	await applyProcessorToEditor(editor, consoleLogProcessor);
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


