import * as vscode from 'vscode';

export interface ScanResult {
	filePath: string;
	languageId: string;
	commentCount: number;
	commentsSize: number;
}

export function showStatistics(modifiedFiles: number, totalItemsRemoved: number, durationSeconds: number, actionName: string = 'Items', actionVerb: string = 'clean'): void {
	const pastTense = actionVerb === 'sort' ? 'sorted' : (actionVerb === 'convert' ? 'converted' : 'cleaned');
	vscode.window.showInformationMessage(
		`Finished!\nFiles modified: ${modifiedFiles}\n${actionName} ${pastTense}: ${totalItemsRemoved}\nElapsed: ${durationSeconds.toFixed(1)} seconds`
	);
}

export async function showPreview(scanResults: ScanResult[], actionName: string = 'items', actionVerb: string = 'clean'): Promise<boolean> {
	const totalItems = scanResults.reduce((sum, r) => sum + r.commentCount, 0);
	const totalFiles = scanResults.length;

	if (totalItems === 0) {
		vscode.window.showInformationMessage(`No ${actionName} found to ${actionVerb}.`);
		return false;
	}

	const langStats: Record<string, number> = {};
	for (const r of scanResults) {
		langStats[r.languageId] = (langStats[r.languageId] || 0) + r.commentCount;
	}

	let message = `Files:\n`;
	for (const r of scanResults.slice(0, 10)) {
		message += `- ${vscode.workspace.asRelativePath(r.filePath)} (${r.commentCount} ${actionName})\n`;
	}
	if (scanResults.length > 10) {
		message += `- ... and ${scanResults.length - 10} more files\n`;
	}

	message += `\n${actionName.charAt(0).toUpperCase() + actionName.slice(1)} Found:\n`;
	for (const [lang, count] of Object.entries(langStats)) {
		message += `${lang.toUpperCase()}: ${count}\n`;
	}

	message += `\nTotal: ${totalItems} ${actionName} across ${totalFiles} files.\n\nDo you want to ${actionVerb} ${actionName}?`;

	const buttonLabel = actionVerb === 'sort' ? 'Sort' : (actionVerb === 'convert' ? 'Convert' : 'Clean');

	const option = await vscode.window.showWarningMessage(
		message,
		{ modal: true },
		buttonLabel
	);

	return option === buttonLabel;
}
