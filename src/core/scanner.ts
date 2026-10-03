import fg from 'fast-glob';
import * as vscode from 'vscode';

export function getActiveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		const folder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
		if (folder) {
			return folder;
		}
	}
	const folders = vscode.workspace.workspaceFolders;
	if (folders && folders.length > 0) {
		return folders[0];
	}
	return undefined;
}

export async function scanWorkspace(ignorePatterns: string[], targetFolder?: vscode.WorkspaceFolder): Promise<string[]> {
	const folders = targetFolder ? [targetFolder] : vscode.workspace.workspaceFolders;
	if (!folders || folders.length === 0) {
		return [];
	}

	const results: string[] = [];
	for (const folder of folders) {
		const rootPath = folder.uri.fsPath.replace(/\\/g, '/');
		const pattern = `${rootPath}/**/*`;
		try {
			const files = await fg(pattern, {
				ignore: ignorePatterns,
				absolute: true,
				onlyFiles: true,
				dot: true
			});
			results.push(...files);
		} catch (err) {
		}
	}
	return results;
}
