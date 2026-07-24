import * as vscode from 'vscode';
import * as path from 'path';
import fg from 'fast-glob';

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
      // Ignore errors scanning a specific folder
    }
  }
  return results;
}
