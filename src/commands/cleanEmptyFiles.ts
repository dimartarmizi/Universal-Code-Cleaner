import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getSettings } from '../settings/config';
import { scanWorkspace } from '../scanner/workspaceScanner';
import { showPreview, showStatistics } from '../preview/diffPreview';

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

	const scanResults = emptyFiles.map(file => ({
		filePath: file,
		languageId: path.extname(file).substring(1) || 'file',
		commentCount: 1,
		commentsSize: 0
	}));

	const proceed = await showPreview(scanResults, 'empty files', 'delete');
	if (!proceed) {
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
	showStatistics(deletedCount, deletedCount, duration, 'empty files');
}
