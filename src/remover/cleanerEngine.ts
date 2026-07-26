import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';

export async function applyProcessorToEditor(editor: vscode.TextEditor, processor: CodeCleanerProcessor) {
	const document = editor.document;
	const ranges = await processor.scan(document);

	const nameMap: Record<string, string> = {
		'Comments': 'comments',
		'DeadCode': 'dead code items',
		'EmptyLines': 'empty lines',
		'TrailingSpaces': 'trailing spaces',
		'EmptyFiles': 'empty files',
		'EmptyFolders': 'empty folders',
		'ConsoleLog': 'console logs',
		'SortImports': 'sorted imports',
		'Indent': 'indentations'
	};
	const actionName = nameMap[processor.name] || processor.name.toLowerCase();

	if (ranges.length === 0) {
		vscode.window.showInformationMessage(`No ${actionName} found to process in this file.`);
		return;
	}

	const { treeProvider, previewContentProvider, computeCleanedContent } = require('../preview/previewManager');
	if (treeProvider && previewContentProvider) {
		const fileItem: import('../preview/view').FileItem = {
			filePath: document.fileName,
			relativePath: vscode.workspace.asRelativePath(document.fileName),
			actionName: actionName,
			ranges: ranges,
			processorName: processor.name,
			checked: true
		};
		treeProvider.clearCollapseStates();
		treeProvider.updateItems([fileItem]);
		const cleaned = computeCleanedContent(document, processor, ranges);
		const previewUri = vscode.Uri.parse(`code-cleaner-preview:${document.fileName}`);
		previewContentProvider.updatePreview(previewUri, cleaned);
		vscode.window.showInformationMessage(`Found ${ranges.length} ${actionName} in this file. Please check the Code Cleaner sidebar panel to review and apply changes.`);
		return;
	}
}

export async function applyProcessorToWorkspace(processor: CodeCleanerProcessor, files: string[], getLanguageByExtension: any) {
	const fileContentsMap = new Map<string, { ranges: vscode.Range[] }>();
	const fileItems: import('../preview/view').FileItem[] = [];

	const nameMap: Record<string, string> = {
		'Comments': 'comments',
		'DeadCode': 'dead code items',
		'EmptyLines': 'empty lines',
		'TrailingSpaces': 'trailing spaces',
		'EmptyFiles': 'empty files',
		'EmptyFolders': 'empty folders',
		'ConsoleLog': 'console logs',
		'SortImports': 'sorted imports',
		'Indent': 'indentations'
	};
	const actionName = nameMap[processor.name] || processor.name.toLowerCase();

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: `Scanning workspace for ${actionName}...`,
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
				let doc = vscode.workspace.textDocuments.find(d => d.fileName === file);
				if (!doc) {
					doc = await vscode.workspace.openTextDocument(file);
				}

				const ranges = await processor.scan(doc);
				if (ranges.length > 0) {
					fileContentsMap.set(file, { ranges });

					fileItems.push({
						filePath: file,
						relativePath: vscode.workspace.asRelativePath(file),
						actionName: actionName,
						ranges: ranges,
						processorName: processor.name,
						checked: true
					});
				}
			} catch (err) {
			}

			progress.report({ increment: (1 / files.length) * 100, message: `${i + 1}/${files.length} files` });
		}
	});

	if (fileItems.length === 0) {
		vscode.window.showInformationMessage(`No ${actionName} found in the workspace.`);
		return;
	}

	const { treeProvider, previewContentProvider, computeCleanedContent } = require('../preview/previewManager');
	if (treeProvider && previewContentProvider) {
		treeProvider.clearCollapseStates();
		treeProvider.updateItems(fileItems);
		for (const item of fileItems) {
			try {
				let doc = vscode.workspace.textDocuments.find(d => d.fileName === item.filePath);
				if (!doc) {
					doc = await vscode.workspace.openTextDocument(item.filePath);
				}
				const cleaned = computeCleanedContent(doc, processor, item.ranges);
				const previewUri = vscode.Uri.parse(`code-cleaner-preview:${item.filePath}`);
				previewContentProvider.updatePreview(previewUri, cleaned);
			} catch (e) {
			}
		}
		vscode.window.showInformationMessage(`Found ${fileItems.length} files with ${actionName}. Please check the Code Cleaner sidebar panel to review and apply changes.`);
		return;
	}
}
