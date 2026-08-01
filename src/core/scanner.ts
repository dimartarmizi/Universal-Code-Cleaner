import fg from 'fast-glob';
import * as vscode from 'vscode';

export async function scanWorkspace(ignorePatterns: string[]): Promise<string[]> {
	const folders = vscode.workspace.workspaceFolders;
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
