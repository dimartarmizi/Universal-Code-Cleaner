import * as vscode from 'vscode';
import * as fs from 'fs';
import { getLanguageByExtension } from '../language/languageRegistry';
import { parseComments } from '../parser/parserManager';
import { filterComments, removeCommentsFromText } from '../remover/commentRemover';
import { getSettings } from '../settings/config';
import { showPreview, showStatistics, ScanResult } from '../preview/diffPreview';
import { scanWorkspace } from '../scanner/workspaceScanner';

export async function removeCurrentFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor found.');
    return;
  }

  const document = editor.document;
  const fileName = document.fileName;
  const langConfig = getLanguageByExtension(fileName);

  if (!langConfig) {
    vscode.window.showWarningMessage(`Unsupported language or file type for: ${fileName}`);
    return;
  }

  const text = document.getText();
  const rawComments = parseComments(text, langConfig.commentType);
  const settings = getSettings();
  const commentsToRemove = filterComments(rawComments, settings.keep);

  if (commentsToRemove.length === 0) {
    vscode.window.showInformationMessage('No comments to remove in this file.');
    return;
  }

  if (settings.preview) {
    const scanResult: ScanResult = {
      filePath: fileName,
      languageId: langConfig.id,
      commentCount: commentsToRemove.length,
      commentsSize: commentsToRemove.reduce((acc, c) => acc + c.text.length, 0)
    };
    const confirm = await showPreview([scanResult]);
    if (!confirm) {
      return;
    }
  }

  const startTime = Date.now();
  const newText = removeCommentsFromText(text, commentsToRemove);

  await editor.edit(editBuilder => {
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(text.length)
    );
    editBuilder.replace(fullRange, newText);
  });

  if (settings.autoSave) {
    await document.save();
  }

  const duration = (Date.now() - startTime) / 1000;
  showStatistics(1, commentsToRemove.length, duration);
}

export async function removeWorkspace() {
  const settings = getSettings();
  const files = await scanWorkspace(settings.ignore);

  if (files.length === 0) {
    vscode.window.showInformationMessage('No files found in the workspace.');
    return;
  }

  const scanResults: ScanResult[] = [];
  const fileContentsMap = new Map<string, { text: string; langCommentType: 'c' | 'python' | 'html' | 'css' | 'ini'; commentsToRemove: any[] }>();

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Scanning workspace files...',
    cancellable: true
  }, async (progress, token) => {
    for (let i = 0; i < files.length; i++) {
      if (token.isCancellationRequested) {
        return;
      }
      const file = files[i];
      const langConfig = getLanguageByExtension(file);
      if (!langConfig) {
        continue;
      }

      try {
        const text = fs.readFileSync(file, 'utf8');
        const rawComments = parseComments(text, langConfig.commentType);
        const commentsToRemove = filterComments(rawComments, settings.keep);

        if (commentsToRemove.length > 0) {
          scanResults.push({
            filePath: file,
            languageId: langConfig.id,
            commentCount: commentsToRemove.length,
            commentsSize: commentsToRemove.reduce((acc, c) => acc + c.text.length, 0)
          });
          fileContentsMap.set(file, { text, langCommentType: langConfig.commentType, commentsToRemove });
        }
      } catch (err) {
        // Ignore read errors
      }

      progress.report({ increment: (1 / files.length) * 100, message: `${i + 1}/${files.length} files` });
    }
  });

  if (scanResults.length === 0) {
    vscode.window.showInformationMessage('No comments to remove in the workspace.');
    return;
  }

  const proceed = await showPreview(scanResults);
  if (!proceed) {
    return;
  }

  const startTime = Date.now();
  let modifiedCount = 0;
  let removedCount = 0;

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Removing comments...',
    cancellable: false
  }, async (progress) => {
    let index = 0;
    for (const [file, info] of fileContentsMap.entries()) {
      const newText = removeCommentsFromText(info.text, info.commentsToRemove);
      try {
        fs.writeFileSync(file, newText, 'utf8');
        modifiedCount++;
        removedCount += info.commentsToRemove.length;
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to write to file: ${file}`);
      }
      index++;
      progress.report({ increment: (1 / fileContentsMap.size) * 100, message: `${index}/${fileContentsMap.size} files` });
    }
  });

  const duration = (Date.now() - startTime) / 1000;
  showStatistics(modifiedCount, removedCount, duration);
}
