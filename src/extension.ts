import * as vscode from 'vscode';
import {
	removeCommentsCurrentFile,
	removeDeadCodeCurrentFile,
	removeEmptyLinesCurrentFile
} from './commands/cleanCurrentFile';
import {
	removeCommentsWorkspace,
	removeDeadCodeWorkspace,
	removeEmptyLinesWorkspace
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

	const disposableRemoveEmptyLinesCurrent = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyLinesCurrentFile',
		async () => {
			await removeEmptyLinesCurrentFile();
		}
	);

	const disposableRemoveEmptyLinesWorkspace = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyLinesWorkspace',
		async () => {
			await removeEmptyLinesWorkspace();
		}
	);

	context.subscriptions.push(
		disposableRemoveCommentsCurrent,
		disposableRemoveCommentsWorkspace,
		disposableRemoveDeadCodeCurrent,
		disposableRemoveDeadCodeWorkspace,
		disposableRemoveEmptyLinesCurrent,
		disposableRemoveEmptyLinesWorkspace
	);
}

export function deactivate() { }
