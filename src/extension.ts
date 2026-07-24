import * as vscode from 'vscode';
import {
	removeCommentsCurrentFile,
	removeDeadCodeCurrentFile,
	removeEmptyLinesCurrentFile,
	removeTrailingSpacesCurrentFile
} from './commands/cleanCurrentFile';
import {
	removeCommentsWorkspace,
	removeDeadCodeWorkspace,
	removeEmptyLinesWorkspace,
	removeTrailingSpacesWorkspace
} from './commands/cleanWorkspace';
import { removeEmptyFilesWorkspace } from './commands/cleanEmptyFiles';
import { removeEmptyFoldersWorkspace } from './commands/cleanEmptyFolders';

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

	const disposableRemoveTrailingSpacesCurrent = vscode.commands.registerCommand(
		'codeCleaner.removeTrailingSpacesCurrentFile',
		async () => {
			await removeTrailingSpacesCurrentFile();
		}
	);

	const disposableRemoveTrailingSpacesWorkspace = vscode.commands.registerCommand(
		'codeCleaner.removeTrailingSpacesWorkspace',
		async () => {
			await removeTrailingSpacesWorkspace();
		}
	);

	const disposableRemoveEmptyFilesWorkspace = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyFilesWorkspace',
		async () => {
			await removeEmptyFilesWorkspace();
		}
	);

	const disposableRemoveEmptyFoldersWorkspace = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyFoldersWorkspace',
		async () => {
			await removeEmptyFoldersWorkspace();
		}
	);

	context.subscriptions.push(
		disposableRemoveCommentsCurrent,
		disposableRemoveCommentsWorkspace,
		disposableRemoveDeadCodeCurrent,
		disposableRemoveDeadCodeWorkspace,
		disposableRemoveEmptyLinesCurrent,
		disposableRemoveEmptyLinesWorkspace,
		disposableRemoveTrailingSpacesCurrent,
		disposableRemoveTrailingSpacesWorkspace,
		disposableRemoveEmptyFilesWorkspace,
		disposableRemoveEmptyFoldersWorkspace
	);
}

export function deactivate() { }
