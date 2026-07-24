import * as vscode from 'vscode';
import * as fs from 'fs';
import { CodeCleanerProcessor } from './IProcessor';

export async function applyProcessorToEditor(editor: vscode.TextEditor, processor: CodeCleanerProcessor, settings: any, showPreview: any, showStatistics: any) {
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
		'SortImports': 'sorted imports'
	};
	const verbMap: Record<string, string> = {
		'SortImports': 'sort'
	};
	const actionName = nameMap[processor.name] || processor.name.toLowerCase();
	const actionVerb = verbMap[processor.name] || 'clean';

	if (ranges.length === 0) {
		vscode.window.showInformationMessage(`No ${actionName} found to ${actionVerb} in this file.`);
		return;
	}

	if (settings.preview) {
		const confirm = await showPreview([{
			filePath: document.fileName,
			languageId: document.languageId,
			commentCount: ranges.length,
			commentsSize: 0
		}], actionName, actionVerb);
		if (!confirm) {
			return;
		}
	}

	const startTime = Date.now();
	await editor.edit(editBuilder => {
		if (processor.applyCustomEdit) {
			processor.applyCustomEdit(editBuilder, document);
		} else {
			const sorted = [...ranges].sort((a, b) => {
				const aStart = document.offsetAt(a.start);
				const bStart = document.offsetAt(b.start);
				return bStart - aStart;
			});

			for (const range of sorted) {
				editBuilder.delete(range);
			}
		}
	});

	if (settings.autoSave) {
		await document.save();
	}

	const duration = (Date.now() - startTime) / 1000;
	showStatistics(1, ranges.length, duration, actionName, actionVerb);
}

export async function applyProcessorToWorkspace(processor: CodeCleanerProcessor, settings: any, files: string[], getLanguageByExtension: any, showPreview: any, showStatistics: any) {
	const scanResults: any[] = [];
	const fileContentsMap = new Map<string, { ranges: vscode.Range[] }>();

	const nameMap: Record<string, string> = {
		'Comments': 'comments',
		'DeadCode': 'dead code items',
		'EmptyLines': 'empty lines',
		'TrailingSpaces': 'trailing spaces',
		'EmptyFiles': 'empty files',
		'EmptyFolders': 'empty folders',
		'ConsoleLog': 'console logs',
		'SortImports': 'sorted imports'
	};
	const verbMap: Record<string, string> = {
		'SortImports': 'sort'
	};
	const actionName = nameMap[processor.name] || processor.name.toLowerCase();
	const actionVerb = verbMap[processor.name] || 'clean';

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
					scanResults.push({
						filePath: file,
						languageId: langConfig.id,
						commentCount: ranges.length,
						commentsSize: 0
					});
					fileContentsMap.set(file, { ranges });
				}
			} catch (err) {
			}

			progress.report({ increment: (1 / files.length) * 100, message: `${i + 1}/${files.length} files` });
		}
	});

	if (scanResults.length === 0) {
		vscode.window.showInformationMessage(`No ${actionName} found to ${actionVerb} in the workspace.`);
		return;
	}

	const proceed = await showPreview(scanResults, actionName, actionVerb);
	if (!proceed) {
		return;
	}

	const startTime = Date.now();
	let modifiedCount = 0;
	let removedCount = 0;

	const progressTitle = actionVerb === 'sort' ? 'Sorting' : 'Cleaning';
	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: `${progressTitle} ${actionName}...`,
		cancellable: false
	}, async (progress) => {
		let index = 0;
		for (const [file, info] of fileContentsMap.entries()) {
			try {
				let doc = vscode.workspace.textDocuments.find(d => d.fileName === file);
				if (!doc) {
					doc = await vscode.workspace.openTextDocument(file);
				}

				const edit = new vscode.WorkspaceEdit();
				if (processor.applyCustomWorkspaceEdit) {
					processor.applyCustomWorkspaceEdit(edit, doc);
				} else {
					const sorted = [...info.ranges].sort((a, b) => {
						const aStart = doc!.offsetAt(a.start);
						const bStart = doc!.offsetAt(b.start);
						return bStart - aStart;
					});

					for (const range of sorted) {
						edit.delete(doc.uri, range);
					}
				}

				await vscode.workspace.applyEdit(edit);
				if (settings.autoSave) {
					await doc.save();
				}
				modifiedCount++;
				removedCount += info.ranges.length;
			} catch (err) {
				try {
					let content = fs.readFileSync(file, 'utf8');
					let doc = await vscode.workspace.openTextDocument(file);
					const sorted = [...info.ranges].sort((a, b) => {
						const aStart = doc.offsetAt(a.start);
						const bStart = doc.offsetAt(b.end);
						return bStart - aStart;
					});
					for (const range of sorted) {
						const startOffset = doc.offsetAt(range.start);
						const endOffset = doc.offsetAt(range.end);
						content = content.substring(0, startOffset) + content.substring(endOffset);
					}
					fs.writeFileSync(file, content, 'utf8');
					modifiedCount++;
					removedCount += info.ranges.length;
				} catch (fsErr) {
					vscode.window.showErrorMessage(`Failed to ${actionVerb} file: ${file}`);
				}
			}
			index++;
			progress.report({ increment: (1 / fileContentsMap.size) * 100, message: `${index}/${fileContentsMap.size} files` });
		}
	});

	const duration = (Date.now() - startTime) / 1000;
	showStatistics(modifiedCount, scanResults.length, duration, actionName, actionVerb);
}
