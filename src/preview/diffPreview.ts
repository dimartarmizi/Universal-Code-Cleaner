import * as vscode from 'vscode';

export interface ScanResult {
  filePath: string;
  languageId: string;
  commentCount: number;
  commentsSize: number;
}

export function showStatistics(modifiedFiles: number, totalCommentsRemoved: number, durationSeconds: number): void {
  vscode.window.showInformationMessage(
    `Finished!\nFiles modified: ${modifiedFiles}\nComments removed: ${totalCommentsRemoved}\nElapsed: ${durationSeconds.toFixed(1)} seconds`
  );
}

export async function showPreview(scanResults: ScanResult[]): Promise<boolean> {
  const totalComments = scanResults.reduce((sum, r) => sum + r.commentCount, 0);
  const totalFiles = scanResults.length;

  if (totalComments === 0) {
    vscode.window.showInformationMessage('No comments found to remove.');
    return false;
  }

  const langStats: Record<string, number> = {};
  for (const r of scanResults) {
    langStats[r.languageId] = (langStats[r.languageId] || 0) + r.commentCount;
  }

  let message = `Files:\n`;
  for (const r of scanResults.slice(0, 10)) {
    message += `- ${vscode.workspace.asRelativePath(r.filePath)} (${r.commentCount} comments)\n`;
  }
  if (scanResults.length > 10) {
    message += `- ... and ${scanResults.length - 10} more files\n`;
  }

  message += `\nComments Found:\n`;
  for (const [lang, count] of Object.entries(langStats)) {
    message += `${lang.toUpperCase()}: ${count}\n`;
  }

  message += `\nTotal: ${totalComments} comments across ${totalFiles} files.\n\nDo you want to proceed with removing comments?`;

  const option = await vscode.window.showWarningMessage(
    message,
    { modal: true },
    'Remove'
  );

  return option === 'Remove';
}
