import {
	removeCommentsCurrentFile,
	removeEmptyLinesCurrentFile,
	removeTrailingSpacesCurrentFile,
	removeDebugStatementsCurrentFile,
	sortImportsCurrentFile,
	convertIndentCurrentFile
} from './commands/file';
import { removeEmptyFilesWorkspace, removeEmptyFoldersWorkspace } from './commands/structural';
import {
	removeCommentsWorkspace,
	removeEmptyLinesWorkspace,
	removeTrailingSpacesWorkspace,
	removeDebugStatementsWorkspace,
	sortImportsWorkspace,
	convertIndentWorkspace
} from './commands/workspace';
import { getSettings } from './core/config';
import { CommentProcessor } from './processors/comment';
import { DebugStatementsProcessor } from './processors/debugStatements';
import { EmptyLinesProcessor } from './processors/emptyLines';
import { IndentProcessor } from './processors/indent';
import { SortImportsProcessor } from './processors/sortImports';
import { TrailingSpacesProcessor } from './processors/trailingSpaces';
import { CodeCleanerProcessor } from './processors/types';
import { setTreeProviders, computeCleanedContent } from './ui/manager';
import { PreviewContentProvider } from './ui/provider';
import { UnifiedViewProvider, FileItem } from './ui/sidebar';
import * as fs from 'fs';
import * as vscode from 'vscode';

import { getActiveWorkspaceFolder } from './core/scanner';

const PROCESSOR_MAP: Record<string, CodeCleanerProcessor> = {
	'Comments': new CommentProcessor(),
	'EmptyLines': new EmptyLinesProcessor(),
	'TrailingSpaces': new TrailingSpacesProcessor(),
	'DebugStatements': new DebugStatementsProcessor(),
	'SortImports': new SortImportsProcessor(),
	'Indent': new IndentProcessor()
};

async function resolveWorkspaceFolderScope(): Promise<vscode.WorkspaceFolder | undefined | 'CANCEL' | 'ALL'> {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders || folders.length <= 1) {
		return undefined;
	}

	const activeFolder = getActiveWorkspaceFolder();
	const activeFolderName = activeFolder ? activeFolder.name : 'None';

	const choice = await vscode.window.showQuickPick(
		[
			{
				label: `$(root-folder) Active Project Only (${activeFolderName})`,
				description: activeFolder?.uri.fsPath,
				target: 'active'
			},
			{
				label: `$(repo) All Project Roots (${folders.length} folders)`,
				description: 'Scan across all open workspace folders',
				target: 'all'
			}
		],
		{ placeHolder: 'Multi-root workspace detected: select scan scope' }
	);

	if (!choice) {
		return 'CANCEL';
	}

	return choice.target === 'active' ? activeFolder : 'ALL';
}

async function promptScopeAndExecute(
	actionName: string,
	currentFileAction: () => Promise<void>,
	workspaceAction: (targetFolder?: vscode.WorkspaceFolder) => Promise<void>
) {
	const folders = vscode.workspace.workspaceFolders;
	const isMultiRoot = folders && folders.length > 1;

	const options: { label: string; description: string; scope: 'file' | 'activeProject' | 'workspace' }[] = [
		{ label: '$(file) Current File', description: 'Apply to active document only', scope: 'file' }
	];

	if (isMultiRoot) {
		const activeFolder = getActiveWorkspaceFolder();
		options.push({
			label: `$(root-folder) Active Project (${activeFolder?.name || 'Active'})`,
			description: 'Scan active project root folder only',
			scope: 'activeProject'
		});
		options.push({
			label: `$(files) Entire Workspace (${folders.length} projects)`,
			description: 'Scan all project folders in workspace',
			scope: 'workspace'
		});
	} else {
		options.push({
			label: '$(files) Workspace',
			description: 'Apply to all supported files in workspace',
			scope: 'workspace'
		});
	}

	const choice = await vscode.window.showQuickPick(options, {
		placeHolder: `Choose scope for: ${actionName}`
	});

	if (choice) {
		if (choice.scope === 'file') {
			await currentFileAction();
		} else if (choice.scope === 'activeProject') {
			const activeFolder = getActiveWorkspaceFolder();
			await workspaceAction(activeFolder);
		} else if (choice.scope === 'workspace') {
			await workspaceAction(undefined);
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	const treeProvider = new UnifiedViewProvider();
	const previewProvider = new PreviewContentProvider();
	setTreeProviders(treeProvider, previewProvider);

	let lastCommandId: string = 'codeCleaner.removeComments';

	vscode.commands.executeCommand('setContext', 'codeCleaner.hasResults', false);
	vscode.commands.executeCommand('setContext', 'codeCleaner.isCollapsed', false);
	vscode.commands.executeCommand('setContext', 'codeCleaner.isListView', false);

	const sidebarView = vscode.window.createTreeView('codeCleanerSidebar', {
		treeDataProvider: treeProvider,
		showCollapseAll: false
	});

	sidebarView.onDidExpandElement(e => {
		if (e.element && 'path' in e.element) {
			treeProvider.setCollapsedState((e.element as any).path, vscode.TreeItemCollapsibleState.Expanded);
		} else if (e.element && 'fileItem' in e.element) {
			treeProvider.setCollapsedState((e.element as any).fileItem.relativePath, vscode.TreeItemCollapsibleState.Expanded);
		}
		treeProvider.updateCollapsedContext();
	});

	sidebarView.onDidCollapseElement(e => {
		if (e.element && 'path' in e.element) {
			treeProvider.setCollapsedState((e.element as any).path, vscode.TreeItemCollapsibleState.Collapsed);
		} else if (e.element && 'fileItem' in e.element) {
			treeProvider.setCollapsedState((e.element as any).fileItem.relativePath, vscode.TreeItemCollapsibleState.Collapsed);
		}
		treeProvider.updateCollapsedContext();
	});

	context.subscriptions.push(sidebarView);

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(PreviewContentProvider.scheme, previewProvider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.openPreviewDiff', async (item: FileItem, range?: vscode.Range) => {
			const originalUri = vscode.Uri.file(item.filePath);
			const previewUri = vscode.Uri.parse(`code-cleaner-preview:${item.filePath}`);

			let doc = vscode.workspace.textDocuments.find(d => d.fileName === item.filePath);
			if (!doc) {
				doc = await vscode.workspace.openTextDocument(item.filePath);
			}

			const processor = PROCESSOR_MAP[item.processorName];

			if (doc && processor) {
				const activeLines = item.lineItems ? item.lineItems.filter(l => l.checked) : [];
				const rangesToClean = activeLines.length > 0 ? activeLines.map(l => l.range) : item.ranges;
				const cleanedText = computeCleanedContent(doc, processor, rangesToClean);
				previewProvider.updatePreview(previewUri, cleanedText);
			}

			await vscode.commands.executeCommand('vscode.diff', originalUri, previewUri, `Clean Preview: ${item.relativePath}`);

			if (range) {
				const originalEditor = vscode.window.visibleTextEditors.find(editor =>
					editor.document.uri.toString() === originalUri.toString()
				);
				if (originalEditor) {
					originalEditor.selection = new vscode.Selection(range.start, range.end);
					originalEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
				}
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.toggleFileItem', (item: import('./ui/sidebar').TreeItem) => {
			item.fileItem.checked = !item.fileItem.checked;
			if (item.fileItem.lineItems) {
				for (const line of item.fileItem.lineItems) {
					line.checked = item.fileItem.checked;
				}
			}
			treeProvider.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.dismissLineItem', (item: import('./ui/sidebar').LineItemNode) => {
			const fileItem = item.lineItem.fileItem;
			fileItem.ranges = fileItem.ranges.filter(r => r !== item.lineItem.range);
			if (fileItem.lineItems) {
				fileItem.lineItems = fileItem.lineItems.filter(l => l !== item.lineItem);
			}

			if (fileItem.ranges.length === 0) {
				const remaining = treeProvider.getItems().filter(i => i !== fileItem);
				treeProvider.updateItems(remaining);
			} else {
				treeProvider.refresh();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.dismissFileItem', (item: import('./ui/sidebar').TreeItem) => {
			const fileItem = item.fileItem;
			const remaining = treeProvider.getItems().filter(i => i !== fileItem);
			treeProvider.updateItems(remaining);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.dismissFolderItem', (item: import('./ui/sidebar').FolderItem) => {
			const folderPrefix = item.path + '/';
			const remaining = treeProvider.getItems().filter(fileItem =>
				fileItem.relativePath !== item.path && !fileItem.relativePath.startsWith(folderPrefix)
			);
			treeProvider.updateItems(remaining);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.applySingleFolderItem', async (item: import('./ui/sidebar').FolderItem) => {
			const folderPrefix = item.path + '/';
			const folderFiles = treeProvider.getItems().filter(fileItem =>
				fileItem.relativePath === item.path || fileItem.relativePath.startsWith(folderPrefix)
			);

			if (folderFiles.length === 0) {
				return;
			}

			const settings = getSettings();

			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Applying clean operations to folder: ${item.label}...`,
				cancellable: false
			}, async (progress) => {
				let index = 0;
				for (const fileItem of folderFiles) {
					try {
						const processor = PROCESSOR_MAP[fileItem.processorName];
						if (!processor) {
							continue;
						}

						let doc = vscode.workspace.textDocuments.find(d => d.fileName === fileItem.filePath);
						if (!doc) {
							doc = await vscode.workspace.openTextDocument(fileItem.filePath);
						}

						const activeLines = fileItem.lineItems ? fileItem.lineItems.filter(l => l.checked) : [];
						if (activeLines.length === 0) {
							continue;
						}

						const rangesToClean = activeLines.map(l => l.range);
						const edit = new vscode.WorkspaceEdit();

						if (processor.applyCustomWorkspaceEdit) {
							const cleanedText = computeCleanedContent(doc, processor, rangesToClean);
							edit.replace(doc.uri, new vscode.Range(new vscode.Position(0, 0), doc.positionAt(doc.getText().length)), cleanedText);
						} else {
							const sorted = [...rangesToClean].sort((a, b) => {
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
					} catch (err) {
						try {
							const processor = PROCESSOR_MAP[fileItem.processorName];
							let content = fs.readFileSync(fileItem.filePath, 'utf8');
							let doc = await vscode.workspace.openTextDocument(fileItem.filePath);

							const activeLines = fileItem.lineItems ? fileItem.lineItems.filter(l => l.checked) : [];
							const rangesToClean = activeLines.map(l => l.range);
							const sorted = [...rangesToClean].sort((a, b) => {
								const aStart = doc.offsetAt(a.start);
								const bStart = doc.offsetAt(b.end);
								return bStart - aStart;
							});

							if (processor && processor.applyCustomWorkspaceEdit) {
								content = computeCleanedContent(doc, processor, rangesToClean);
							} else {
								for (const range of sorted) {
									const startOffset = doc.offsetAt(range.start);
									const endOffset = doc.offsetAt(range.end);
									content = content.substring(0, startOffset) + content.substring(endOffset);
								}
							}
							fs.writeFileSync(fileItem.filePath, content, 'utf8');
						} catch (fsErr) { }
					}
					index++;
					progress.report({ increment: (1 / folderFiles.length) * 100, message: `${index}/${folderFiles.length} files` });
				}
			});

			const remaining = treeProvider.getItems().filter(fileItem =>
				fileItem.relativePath !== item.path && !fileItem.relativePath.startsWith(folderPrefix)
			);
			treeProvider.updateItems(remaining);
			vscode.window.showInformationMessage(`Successfully applied changes to folder ${item.label}.`);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.applySingleLineItem', async (item: import('./ui/sidebar').LineItemNode) => {
			const fileItem = item.lineItem.fileItem;
			const settings = getSettings();

			try {
				const processor = PROCESSOR_MAP[fileItem.processorName];
				if (!processor) {
					return;
				}

				let doc = vscode.workspace.textDocuments.find(d => d.fileName === fileItem.filePath);
				if (!doc) {
					doc = await vscode.workspace.openTextDocument(fileItem.filePath);
				}

				const edit = new vscode.WorkspaceEdit();
				if (processor.applyCustomWorkspaceEdit) {
					const cleanedText = computeCleanedContent(doc, processor, [item.lineItem.range]);
					edit.replace(doc.uri, new vscode.Range(new vscode.Position(0, 0), doc.positionAt(doc.getText().length)), cleanedText);
				} else {
					edit.delete(doc.uri, item.lineItem.range);
				}

				await vscode.workspace.applyEdit(edit);
				if (settings.autoSave) {
					await doc.save();
				}

				const newRanges = await processor.scan(doc);
				fileItem.ranges = newRanges;

				try {
					const lines = doc.getText().split(/\r?\n/);
					fileItem.lineItems = newRanges.map((range: vscode.Range) => {
						const lineNum = range.start.line;
						const text = lines[lineNum] || '';
						return {
							fileItem: fileItem,
							range,
							lineNumber: lineNum + 1,
							lineText: text.trim(),
							checked: true
						};
					});
				} catch (e) {
					fileItem.lineItems = newRanges.map((range: vscode.Range) => ({
						fileItem: fileItem,
						range,
						lineNumber: range.start.line + 1,
						lineText: `Line ${range.start.line + 1}`,
						checked: true
					}));
				}

				if (fileItem.ranges.length === 0) {
					const remaining = treeProvider.getItems().filter(i => i !== fileItem);
					treeProvider.updateItems(remaining);
				} else {
					treeProvider.refresh();
				}
				vscode.window.showInformationMessage('Successfully applied change to the line.');
			} catch (err) {
				vscode.window.showErrorMessage(`Failed to apply line change: ${err}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.applySingleFileItem', async (item: import('./ui/sidebar').TreeItem) => {
			const fileItem = item.fileItem;
			const settings = getSettings();

			try {
				const processor = PROCESSOR_MAP[fileItem.processorName];
				if (!processor) {
					return;
				}

				let doc = vscode.workspace.textDocuments.find(d => d.fileName === fileItem.filePath);
				if (!doc) {
					doc = await vscode.workspace.openTextDocument(fileItem.filePath);
				}

				const activeLines = fileItem.lineItems ? fileItem.lineItems.filter(l => l.checked) : [];
				if (activeLines.length === 0) {
					vscode.window.showInformationMessage('No active line items selected in this file.');
					return;
				}

				const rangesToClean = activeLines.map(l => l.range);

				const edit = new vscode.WorkspaceEdit();
				if (processor.applyCustomWorkspaceEdit) {
					const cleanedText = computeCleanedContent(doc, processor, rangesToClean);
					edit.replace(doc.uri, new vscode.Range(new vscode.Position(0, 0), doc.positionAt(doc.getText().length)), cleanedText);
				} else {
					const sorted = [...rangesToClean].sort((a, b) => {
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

				const remaining = treeProvider.getItems().filter(i => i !== fileItem);
				treeProvider.updateItems(remaining);
				vscode.window.showInformationMessage(`Successfully applied changes to ${fileItem.relativePath}.`);
			} catch (err) {
				vscode.window.showErrorMessage(`Failed to apply file changes: ${err}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.toggleViewMode', () => {
			treeProvider.setViewMode('list');
			vscode.commands.executeCommand('setContext', 'codeCleaner.isListView', true);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.toggleViewModeTree', () => {
			treeProvider.setViewMode('tree');
			vscode.commands.executeCommand('setContext', 'codeCleaner.isListView', false);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.clearResults', () => {
			treeProvider.clearCollapseStates();
			treeProvider.updateItems([]);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.collapseAllResults', () => {
			treeProvider.collapseStepByStep();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.expandAllResults', () => {
			treeProvider.expandAll();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.refreshResults', async () => {
			const items = treeProvider.getItems();
			if (items.length === 0) {
				vscode.window.showInformationMessage('No active scan results to refresh.');
				return;
			}
			await vscode.commands.executeCommand(lastCommandId);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.runActionFromSidebar', async () => {
			const actionChoice = await vscode.window.showQuickPick(
				[
					{ label: '$(comment-discussion) Remove Comments', id: 'codeCleaner.removeComments', requiresScope: true },
					{ label: '$(whitespace) Remove Empty Lines', id: 'codeCleaner.removeEmptyLines', requiresScope: true },
					{ label: '$(symbol-keyword) Remove Trailing Spaces', id: 'codeCleaner.removeTrailingSpaces', requiresScope: true },
					{ label: '$(debug) Remove Debug & Dump Statements', id: 'codeCleaner.removeDebugStatements', requiresScope: true },
					{ label: '', kind: vscode.QuickPickItemKind.Separator },
					{ label: '$(references) Sort Imports', id: 'codeCleaner.sortImports', requiresScope: true },
					{ label: '$(indent) Convert Indentation', id: 'codeCleaner.convertIndent', requiresScope: true },
					{ label: '', kind: vscode.QuickPickItemKind.Separator },
					{ label: '$(file) Remove Empty Files', id: 'codeCleaner.removeEmptyFiles', requiresScope: false },
					{ label: '$(folder) Remove Empty Folders', id: 'codeCleaner.removeEmptyFolders', requiresScope: false }
				],
				{ placeHolder: 'Select a clean code action to run' }
			);

			if (!actionChoice || !actionChoice.id) {
				return;
			}

			if (!actionChoice.requiresScope) {
				lastCommandId = actionChoice.id;
				const directCommands: Record<string, (targetFolder?: vscode.WorkspaceFolder) => Promise<void>> = {
					'codeCleaner.removeEmptyFiles': removeEmptyFilesWorkspace,
					'codeCleaner.removeEmptyFolders': removeEmptyFoldersWorkspace
				};
				const directAction = directCommands[actionChoice.id];
				if (directAction) {
					const folderScope = await resolveWorkspaceFolderScope();
					if (folderScope === 'CANCEL') {
						return;
					}
					await directAction(folderScope === 'ALL' ? undefined : folderScope);
				}
				return;
			}

			const folders = vscode.workspace.workspaceFolders;
			const isMultiRoot = folders && folders.length > 1;

			const scopeOptions: { label: string; description?: string; scope: 'current' | 'activeProject' | 'workspace' }[] = [
				{ label: '$(file) Current File', description: 'Apply to active document only', scope: 'current' }
			];

			if (isMultiRoot) {
				const activeFolder = getActiveWorkspaceFolder();
				scopeOptions.push({
					label: `$(root-folder) Active Project (${activeFolder?.name || 'Active'})`,
					description: 'Scan active project root folder only',
					scope: 'activeProject'
				});
				scopeOptions.push({
					label: `$(files) Entire Workspace (${folders.length} projects)`,
					description: 'Scan all project folders in workspace',
					scope: 'workspace'
				});
			} else {
				scopeOptions.push({
					label: '$(files) Workspace',
					description: 'Apply to all supported files in workspace',
					scope: 'workspace'
				});
			}

			const scopeChoice = await vscode.window.showQuickPick(scopeOptions, {
				placeHolder: `Select scope for ${actionChoice.label}`
			});

			if (!scopeChoice) {
				return;
			}

			lastCommandId = actionChoice.id;

			const targetFolder = scopeChoice.scope === 'activeProject' ? getActiveWorkspaceFolder() : undefined;

			const mapCommands: Record<string, () => Promise<void>> = {
				'codeCleaner.removeComments': scopeChoice.scope === 'current' ? removeCommentsCurrentFile : () => removeCommentsWorkspace(targetFolder),
				'codeCleaner.removeEmptyLines': scopeChoice.scope === 'current' ? removeEmptyLinesCurrentFile : () => removeEmptyLinesWorkspace(targetFolder),
				'codeCleaner.removeTrailingSpaces': scopeChoice.scope === 'current' ? removeTrailingSpacesCurrentFile : () => removeTrailingSpacesWorkspace(targetFolder),
				'codeCleaner.removeDebugStatements': scopeChoice.scope === 'current' ? removeDebugStatementsCurrentFile : () => removeDebugStatementsWorkspace(targetFolder),
				'codeCleaner.sortImports': scopeChoice.scope === 'current' ? sortImportsCurrentFile : () => sortImportsWorkspace(targetFolder),
				'codeCleaner.convertIndent': scopeChoice.scope === 'current' ? convertIndentCurrentFile : () => convertIndentWorkspace(targetFolder)
			};

			const selectedAction = mapCommands[actionChoice.id];
			if (selectedAction) {
				await selectedAction();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('codeCleaner.applySelectedClean', async () => {
			const items = treeProvider.getItems();
			if (items.length === 0) {
				vscode.window.showInformationMessage('No files selected to clean.');
				return;
			}

			const settings = getSettings();
			const startTime = Date.now();
			let modifiedCount = 0;
			let totalRemoved = 0;

			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: 'Applying selected clean operations...',
				cancellable: false
			}, async (progress) => {
				let index = 0;
				for (const item of items) {
					try {
						const processor = PROCESSOR_MAP[item.processorName];
						if (!processor) {
							continue;
						}

						let doc = vscode.workspace.textDocuments.find(d => d.fileName === item.filePath);
						if (!doc) {
							doc = await vscode.workspace.openTextDocument(item.filePath);
						}

						const activeLines = item.lineItems ? item.lineItems.filter(l => l.checked) : [];
						if (activeLines.length === 0) {
							continue;
						}

						const rangesToClean = activeLines.map(l => l.range);

						const edit = new vscode.WorkspaceEdit();
						if (processor.applyCustomWorkspaceEdit) {
							const cleanedText = computeCleanedContent(doc, processor, rangesToClean);
							edit.replace(doc.uri, new vscode.Range(new vscode.Position(0, 0), doc.positionAt(doc.getText().length)), cleanedText);
						} else {
							const sorted = [...rangesToClean].sort((a, b) => {
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
						totalRemoved += rangesToClean.length;
					} catch (err) {
						try {
							const processor = PROCESSOR_MAP[item.processorName];
							let content = fs.readFileSync(item.filePath, 'utf8');
							let doc = await vscode.workspace.openTextDocument(item.filePath);

							const activeLines = item.lineItems ? item.lineItems.filter(l => l.checked) : [];
							const rangesToClean = activeLines.map(l => l.range);
							const sorted = [...rangesToClean].sort((a, b) => {
								const aStart = doc.offsetAt(a.start);
								const bStart = doc.offsetAt(b.end);
								return bStart - aStart;
							});

							if (processor && processor.applyCustomWorkspaceEdit) {
								content = computeCleanedContent(doc, processor, rangesToClean);
							} else {
								for (const range of sorted) {
									const startOffset = doc.offsetAt(range.start);
									const endOffset = doc.offsetAt(range.end);
									content = content.substring(0, startOffset) + content.substring(endOffset);
								}
							}
							fs.writeFileSync(item.filePath, content, 'utf8');
							modifiedCount++;
							totalRemoved += rangesToClean.length;
						} catch (fsErr) {
							vscode.window.showErrorMessage(`Failed to clean file: ${item.filePath}`);
						}
					}
					index++;
					progress.report({ increment: (1 / items.length) * 100, message: `${index}/${items.length} files` });
				}
			});

			const duration = (Date.now() - startTime) / 1000;
			vscode.window.showInformationMessage(
				`Clean application complete!\nFiles modified: ${modifiedCount}\nItems processed: ${totalRemoved}\nElapsed: ${duration.toFixed(1)} seconds`
			);

			treeProvider.updateItems([]);
		})
	);

	const disposableRemoveComments = vscode.commands.registerCommand(
		'codeCleaner.removeComments',
		async () => {
			await promptScopeAndExecute('Remove Comments', removeCommentsCurrentFile, removeCommentsWorkspace);
		}
	);

	const disposableRemoveEmptyLines = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyLines',
		async () => {
			await promptScopeAndExecute('Remove Empty Lines', removeEmptyLinesCurrentFile, removeEmptyLinesWorkspace);
		}
	);

	const disposableRemoveTrailingSpaces = vscode.commands.registerCommand(
		'codeCleaner.removeTrailingSpaces',
		async () => {
			await promptScopeAndExecute('Remove Trailing Spaces', removeTrailingSpacesCurrentFile, removeTrailingSpacesWorkspace);
		}
	);

	const disposableRemoveDebugStatements = vscode.commands.registerCommand(
		'codeCleaner.removeDebugStatements',
		async () => {
			await promptScopeAndExecute('Remove Debug & Dump Statements', removeDebugStatementsCurrentFile, removeDebugStatementsWorkspace);
		}
	);

	const disposableSortImports = vscode.commands.registerCommand(
		'codeCleaner.sortImports',
		async () => {
			await promptScopeAndExecute('Sort Imports', sortImportsCurrentFile, sortImportsWorkspace);
		}
	);

	const disposableConvertIndent = vscode.commands.registerCommand(
		'codeCleaner.convertIndent',
		async () => {
			await promptScopeAndExecute('Convert Indentation', convertIndentCurrentFile, convertIndentWorkspace);
		}
	);

	const disposableRemoveEmptyFiles = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyFiles',
		async () => {
			const folderScope = await resolveWorkspaceFolderScope();
			if (folderScope === 'CANCEL') {
				return;
			}
			await removeEmptyFilesWorkspace(folderScope === 'ALL' ? undefined : folderScope);
		}
	);

	const disposableRemoveEmptyFolders = vscode.commands.registerCommand(
		'codeCleaner.removeEmptyFolders',
		async () => {
			const folderScope = await resolveWorkspaceFolderScope();
			if (folderScope === 'CANCEL') {
				return;
			}
			await removeEmptyFoldersWorkspace(folderScope === 'ALL' ? undefined : folderScope);
		}
	);

	context.subscriptions.push(
		disposableRemoveComments,
		disposableRemoveEmptyLines,
		disposableRemoveTrailingSpaces,
		disposableRemoveDebugStatements,
		disposableSortImports,
		disposableConvertIndent,
		disposableRemoveEmptyFiles,
		disposableRemoveEmptyFolders
	);
}

export function deactivate() { }
