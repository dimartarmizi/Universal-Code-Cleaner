import * as vscode from 'vscode';
import { CodeCleanerProcessor } from './IProcessor';

export async function applyProcessorToEditor(editor: vscode.TextEditor, processor: CodeCleanerProcessor, settings: any, showPreview: any, showStatistics: any) {
	const document = editor.document;
	const ranges = await processor.scan(document);

	if (ranges.length === 0) {
		vscode.window.showInformationMessage(`No ${processor.name.toLowerCase()} found to clean in this file.`);
		return;
	}

	if (settings.preview) {
		const confirm = await showPreview([{
			filePath: document.fileName,
			languageId: document.languageId,
			commentCount: ranges.length,
			commentsSize: 0
		}]);
		if (!confirm) {
			return;
		}
	}

	const startTime = Date.now();
	await editor.edit(editBuilder => {
		// Urutkan dari offset paling belakang agar tidak merusak offset range sebelumnya
		const sorted = [...ranges].sort((a, b) => {
			const aStart = document.offsetAt(a.start);
			const bStart = document.offsetAt(b.start);
			return bStart - aStart;
		});

		for (const range of sorted) {
			editBuilder.delete(range);
		}
	});

	if (settings.autoSave) {
		await document.save();
	}

	const duration = (Date.now() - startTime) / 1000;
	showStatistics(1, ranges.length, duration);
}

export async function applyProcessorToWorkspace(processor: CodeCleanerProcessor, settings: any, files: string[], getLanguageByExtension: any, showPreview: any, showStatistics: any) {
	const scanResults: any[] = [];
	const fileContentsMap = new Map<string, { ranges: vscode.Range[]; doc: vscode.TextDocument }>();

	await vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: `Scanning workspace for ${processor.name.toLowerCase()}...`,
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
					fileContentsMap.set(file, { ranges, doc });
				}
			} catch (err) {
				// Ignore
			}

			progress.report({ increment: (1 / files.length) * 100, message: `${i + 1}/${files.length} files` });
		}
	});

	if (scanResults.length === 0) {
		vscode.window.showInformationMessage(`No ${processor.name.toLowerCase()} to remove in the workspace.`);
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
		title: `Removing ${processor.name.toLowerCase()}...`,
		cancellable: false
	}, async (progress) => {
		let index = 0;
		for (const [file, info] of fileContentsMap.entries()) {
			try {
				const edit = new vscode.WorkspaceEdit();
				const sorted = [...info.ranges].sort((a, b) => {
					const aStart = info.doc.offsetAt(a.start);
					const bStart = info.doc.offsetAt(b.start);
					return bStart - aStart;
				});

				for (const range of sorted) {
					edit.delete(info.doc.uri, range);
				}

				await vscode.workspace.applyEdit(edit);
				if (settings.autoSave) {
					await info.doc.save();
				}
				modifiedCount++;
				removedCount += info.ranges.length;
			} catch (err) {
				vscode.window.showErrorMessage(`Failed to clean file: ${file}`);
			}
			index++;
			progress.report({ increment: (1 / fileContentsMap.size) * 100, message: `${index}/${fileContentsMap.size} files` });
		}
	});

	const duration = (Date.now() - startTime) / 1000;
	showStatistics(modifiedCount, removedCount, duration);
}
