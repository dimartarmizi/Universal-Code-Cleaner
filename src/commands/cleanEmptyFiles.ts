import * as vscode from 'vscode';
import * as fs from 'fs';
import { getSettings } from '../settings/config';
import { scanWorkspace } from '../scanner/workspaceScanner';

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
