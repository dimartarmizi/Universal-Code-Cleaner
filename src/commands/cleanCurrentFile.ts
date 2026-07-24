import * as vscode from 'vscode';
import { getSettings } from '../settings/config';
import { showPreview, showStatistics } from '../preview/diffPreview';
import { CommentProcessor } from '../remover/commentProcessor';
import { DeadCodeProcessor } from '../remover/deadCodeProcessor';
import { EmptyLinesProcessor } from '../remover/emptyLinesProcessor';
import { TrailingSpacesProcessor } from '../remover/trailingSpacesProcessor';
import { ConsoleLogProcessor } from '../remover/consoleLogProcessor';
import { SortImportsProcessor } from '../remover/sortImportsProcessor';
import { applyProcessorToEditor } from '../remover/cleanerEngine';

const commentProcessor = new CommentProcessor();
const deadCodeProcessor = new DeadCodeProcessor();
const emptyLinesProcessor = new EmptyLinesProcessor();
const trailingSpacesProcessor = new TrailingSpacesProcessor();
const consoleLogProcessor = new ConsoleLogProcessor();
const sortImportsProcessor = new SortImportsProcessor();

export async function removeCommentsCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	const settings = getSettings();
	await applyProcessorToEditor(editor, commentProcessor, settings, showPreview, showStatistics);
}

export async function removeDeadCodeCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	const settings = getSettings();
	await applyProcessorToEditor(editor, deadCodeProcessor, settings, showPreview, showStatistics);
}

export async function removeEmptyLinesCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	const settings = getSettings();
	await applyProcessorToEditor(editor, emptyLinesProcessor, settings, showPreview, showStatistics);
}

export async function removeTrailingSpacesCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	const settings = getSettings();
	await applyProcessorToEditor(editor, trailingSpacesProcessor, settings, showPreview, showStatistics);
}

export async function removeConsoleLogsCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	const settings = getSettings();
	await applyProcessorToEditor(editor, consoleLogProcessor, settings, showPreview, showStatistics);
}

export async function sortImportsCurrentFile() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage('No active text editor found.');
		return;
	}
	const settings = getSettings();
	await applyProcessorToEditor(editor, sortImportsProcessor, settings, showPreview, showStatistics);
}


