import { getSettings } from '../core/config';
import { scanWorkspace } from '../core/scanner';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export async function removeEmptyFilesWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);

	const emptyFiles: string[] = [];

	for (const file of files) {
		try {
			const stats = fs.statSync(file);
			if (stats.size === 0) {
				emptyFiles.push(file);
			} else {
				const content = fs.readFileSync(file, 'utf8');
				if (content.trim() === '') {
					emptyFiles.push(file);
				}
			}
		} catch (e) {
		}
	}

	if (emptyFiles.length === 0) {
		vscode.window.showInformationMessage('No empty files found in the workspace.');
		return;
	}

	const proceed = await vscode.window.showWarningMessage(
		`Found ${emptyFiles.length} empty files. Do you want to delete them?`,
		{ modal: true },
		'Delete'
	);
	if (proceed !== 'Delete') {
		return;
	}

	const startTime = Date.now();
	let deletedCount = 0;

	for (const file of emptyFiles) {
		try {
			fs.unlinkSync(file);
			deletedCount++;
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to delete file: ${file}`);
		}
	}

	const duration = (Date.now() - startTime) / 1000;
	vscode.window.showInformationMessage(
		`Finished!\nFiles deleted: ${deletedCount}\nElapsed: ${duration.toFixed(1)} seconds`
	);
}

export async function removeEmptyFoldersWorkspace() {
	const settings = getSettings();
	const folders = vscode.workspace.workspaceFolders;
	if (!folders || folders.length === 0) {
		return;
	}

	const emptyFolders: string[] = [];

	function scanDirs(dir: string) {
		try {
			const relPath = vscode.workspace.asRelativePath(dir);
			if (settings.ignore.some(pat => {
				const globPattern = pat.replace(/\*\*/g, '.*');
				return new RegExp(globPattern).test(relPath) || new RegExp(globPattern).test(dir);
			})) {
				return;
			}

			const files = fs.readdirSync(dir);
			if (files.length === 0) {
				emptyFolders.push(dir);
				return;
			}

			let subdirsOnlyEmpty = true;
			for (const file of files) {
				const fullPath = path.join(dir, file);
				const stats = fs.statSync(fullPath);
				if (stats.isDirectory()) {
					scanDirs(fullPath);
					if (fs.readdirSync(fullPath).length > 0) {
						subdirsOnlyEmpty = false;
					}
				} else {
					subdirsOnlyEmpty = false;
				}
			}

			if (subdirsOnlyEmpty && fs.readdirSync(dir).length === 0) {
				emptyFolders.push(dir);
			}
		} catch (e) {
		}
	}

	for (const folder of folders) {
		const rootPath = folder.uri.fsPath;
		const items = fs.readdirSync(rootPath);
		for (const item of items) {
			const fullPath = path.join(rootPath, item);
			if (fs.statSync(fullPath).isDirectory()) {
				scanDirs(fullPath);
			}
		}
	}

	if (emptyFolders.length === 0) {
		vscode.window.showInformationMessage('No empty folders found in the workspace.');
		return;
	}

	const proceed = await vscode.window.showWarningMessage(
		`Found ${emptyFolders.length} empty folders. Do you want to delete them?`,
		{ modal: true },
		'Delete'
	);
	if (proceed !== 'Delete') {
		return;
	}

	const startTime = Date.now();
	let deletedCount = 0;

	const sortedFolders = [...emptyFolders].sort((a, b) => b.length - a.length);

	for (const dir of sortedFolders) {
		try {
			if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
				fs.rmdirSync(dir);
				deletedCount++;
			}
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to delete folder: ${dir}`);
		}
	}

	const duration = (Date.now() - startTime) / 1000;
	vscode.window.showInformationMessage(
		`Finished!\nFolders deleted: ${deletedCount}\nElapsed: ${duration.toFixed(1)} seconds`
	);
}
