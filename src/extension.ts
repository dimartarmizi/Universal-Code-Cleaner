import * as vscode from 'vscode';
import {
	removeCommentsCurrentFile,
	removeDeadCodeCurrentFile
} from './commands/cleanCurrentFile';
import {
	removeCommentsWorkspace,
	removeDeadCodeWorkspace
} from './commands/cleanWorkspace';

export function activate(context: vscode.ExtensionContext) {
	const disposableRemoveCommentsCurrent = vscode.commands.registerCommand(
		'codeCleaner.removeCommentsCurrentFile',
		async () => {
			await removeCommentsCurrentFile();
		}
	);

	const disposableRemoveCommentsWorkspace = vscode.commands.registerCommand(
		'codeCleaner.removeCommentsWorkspace',
		async () => {
			await removeCommentsWorkspace();
		}
	);

	const disposableRemoveDeadCodeCurrent = vscode.commands.registerCommand(
		'codeCleaner.removeDeadCodeCurrentFile',
		async () => {
			await removeDeadCodeCurrentFile();
		}
	);

	const disposableRemoveDeadCodeWorkspace = vscode.commands.registerCommand(
		'codeCleaner.removeDeadCodeWorkspace',
		async () => {
			await removeDeadCodeWorkspace();
		}
	);

	context.subscriptions.push(
		disposableRemoveCommentsCurrent,
		disposableRemoveCommentsWorkspace,
		disposableRemoveDeadCodeCurrent,
		disposableRemoveDeadCodeWorkspace
	);
}

export function deactivate() { }
