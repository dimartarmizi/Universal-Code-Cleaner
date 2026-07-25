import * as vscode from 'vscode';
import {
	removeCommentsCurrentFile,
	removeDeadCodeCurrentFile,
	removeEmptyLinesCurrentFile,
	removeTrailingSpacesCurrentFile,
	removeConsoleLogsCurrentFile,
	sortImportsCurrentFile
} from './commands/cleanCurrentFile';
import {
	removeCommentsWorkspace,
	removeDeadCodeWorkspace,
	removeEmptyLinesWorkspace,
	removeTrailingSpacesWorkspace,
	removeConsoleLogsWorkspace,
	sortImportsWorkspace
} from './commands/cleanWorkspace';
import { removeEmptyFilesWorkspace } from './commands/cleanEmptyFiles';
import { removeEmptyFoldersWorkspace } from './commands/cleanEmptyFolders';

async function promptScopeAndExecute(
	actionName: string,
	currentFileAction: () => Promise<void>,
	workspaceAction: () => Promise<void>
) {
	const choice = await vscode.window.showQuickPick(
		[
			{ label: '$(file) Current File', description: `Apply to active document only` },
			{ label: '$(files) Workspace', description: `Apply to all supported files in workspace` }
		],
		{
			placeHolder: `Choose scope for: ${actionName}`
		}
	);

	if (choice) {
		if (choice.label.includes('Current File')) {
			await currentFileAction();
		} else if (choice.label.includes('Workspace')) {
			await workspaceAction();
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	const disposableRemoveComments = vscode.commands.registerCommand(
		'codeCleaner.removeComments',
		async () => {
			await promptScopeAndExecute('Remove Comments', removeCommentsCurrentFile, removeCommentsWorkspace);
		}
	);

	const disposableRemoveDeadCode = vscode.commands.registerCommand(
		'codeCleaner.removeDeadCode',
		async () => {
			await promptScopeAndExecute('Remove Dead Code', removeDeadCodeCurrentFile, removeDeadCodeWorkspace);
		}
	);

	const disposableRemoveEmptyLines = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyLines',
		async () => {
			await promptScopeAndExecute('Remove Empty Lines', removeEmptyLinesCurrentFile, removeEmptyLinesWorkspace);
		}
	);

	const disposableRemoveTrailingSpaces = vscode.commands.registerCommand(
		'codeCleaner.removeTrailingSpaces',
		async () => {
			await promptScopeAndExecute('Remove Trailing Spaces', removeTrailingSpacesCurrentFile, removeTrailingSpacesWorkspace);
		}
	);

	const disposableRemoveConsoleLogs = vscode.commands.registerCommand(
		'codeCleaner.removeConsoleLogs',
		async () => {
			await promptScopeAndExecute('Remove Console Logs', removeConsoleLogsCurrentFile, removeConsoleLogsWorkspace);
		}
	);

	const disposableSortImports = vscode.commands.registerCommand(
		'codeCleaner.sortImports',
		async () => {
			await promptScopeAndExecute('Sort Imports', sortImportsCurrentFile, sortImportsWorkspace);
		}
	);

	const disposableRemoveEmptyFiles = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyFiles',
		async () => {
			await removeEmptyFilesWorkspace();
		}
	);

	const disposableRemoveEmptyFolders = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyFolders',
		async () => {
			await removeEmptyFoldersWorkspace();
		}
	);

	context.subscriptions.push(
		disposableRemoveComments,
		disposableRemoveDeadCode,
		disposableRemoveEmptyLines,
		disposableRemoveTrailingSpaces,
		disposableRemoveConsoleLogs,
		disposableSortImports,
		disposableRemoveEmptyFiles,
		disposableRemoveEmptyFolders
	);
}

export function deactivate() { }
