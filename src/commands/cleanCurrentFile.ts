import * as vscode from 'vscode';
import { getLanguageByExtension } from '../language/languageRegistry';
import { getSettings } from '../settings/config';
import { showPreview, showStatistics } from '../preview/diffPreview';
import { CommentProcessor } from '../remover/commentProcessor';
import { DeadCodeProcessor } from '../remover/deadCodeProcessor';
import { applyProcessorToEditor } from '../remover/cleanerEngine';

const commentProcessor = new CommentProcessor();
const deadCodeProcessor = new DeadCodeProcessor();

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
