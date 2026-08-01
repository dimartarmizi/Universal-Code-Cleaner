import * as vscode from 'vscode';

export interface FileItem {
	filePath: string;
	relativePath: string;
	actionName: string;
	ranges: vscode.Range[];
	processorName: string;
	checked: boolean;
	lineItems?: LineItem[];
}

export interface LineItem {
	fileItem: FileItem;
	range: vscode.Range;
	lineNumber: number;
	lineText: string;
	checked: boolean;
}

export type TreeElement = FolderItem | TreeItem | LineItemNode;

export class TreeViewProvider implements vscode.TreeDataProvider<TreeElement> {
	private _onDidChangeTreeData = new vscode.EventEmitter<TreeElement | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(
		private getItems: () => FileItem[],
		private getCollapsedState: (key: string) => vscode.TreeItemCollapsibleState,
		private getCollapseVersion: () => number
	) { }

	getTreeItem(element: TreeElement): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TreeElement): TreeElement[] {
		if (element instanceof LineItemNode) {
			return [];
		}

		if (element instanceof TreeItem) {
			return element.fileItem.lineItems?.map(line => new LineItemNode(line)) || [];
		}

		if (element instanceof FolderItem) {
			return element.children;
		}

		const items = this.getItems();
		const rootItems: TreeElement[] = [];
		const folderMap = new Map<string, FolderItem>();
		const version = this.getCollapseVersion();

		for (const item of items) {
			const parts = item.relativePath.split(/[\\/]/);
			if (parts.length === 1) {
				const state = this.getCollapsedState(item.relativePath);
				rootItems.push(new TreeItem(item, state, version));
			} else {
				let currentPath = '';
				let parentFolder: FolderItem | undefined;

				for (let i = 0; i < parts.length - 1; i++) {
					const part = parts[i];
					currentPath = currentPath ? `${currentPath}/${part}` : part;

					let folderItem = folderMap.get(currentPath);
					if (!folderItem) {
						const state = this.getCollapsedState(currentPath);
						folderItem = new FolderItem(part, currentPath, state, version);
						folderMap.set(currentPath, folderItem);

						if (parentFolder) {
							parentFolder.addChild(folderItem);
						} else {
							rootItems.push(folderItem);
						}
					}
					parentFolder = folderItem;
				}

				if (parentFolder) {
					const state = this.getCollapsedState(item.relativePath);
					parentFolder.addChild(new TreeItem(item, state, version));
				}
			}
		}

		return rootItems;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class ListViewProvider implements vscode.TreeDataProvider<TreeElement> {
	private _onDidChangeTreeData = new vscode.EventEmitter<TreeElement | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(
		private getItems: () => FileItem[],
		private getCollapsedState: (key: string) => vscode.TreeItemCollapsibleState,
		private getCollapseVersion: () => number
	) { }

	getTreeItem(element: TreeElement): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TreeElement): TreeElement[] {
		if (element instanceof TreeItem) {
			return element.fileItem.lineItems?.map(line => new LineItemNode(line)) || [];
		}
		if (element) {
			return [];
		}
		const items = this.getItems();
		const version = this.getCollapseVersion();
		return items.map(item => new TreeItem(item, this.getCollapsedState(item.relativePath), version));
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class UnifiedViewProvider implements vscode.TreeDataProvider<TreeElement> {
	private _onDidChangeTreeData = new vscode.EventEmitter<TreeElement | undefined | null | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private items: FileItem[] = [];
	private viewMode: 'list' | 'tree' = 'tree';
	private collapseStates = new Map<string, vscode.TreeItemCollapsibleState>();
	private collapseVersion = 0;

	private treeProvider = new TreeViewProvider(
		() => this.items,
		(key) => this.getCollapsedState(key),
		() => this.collapseVersion
	);
	private listProvider = new ListViewProvider(
		() => this.items,
		(key) => this.getCollapsedState(key),
		() => this.collapseVersion
	);

	constructor() {
		this.treeProvider.onDidChangeTreeData(e => this._onDidChangeTreeData.fire(e));
		this.listProvider.onDidChangeTreeData(e => this._onDidChangeTreeData.fire(e));
	}

	getCollapsedState(key: string): vscode.TreeItemCollapsibleState {
		return this.collapseStates.get(key) ?? vscode.TreeItemCollapsibleState.Expanded;
	}

	setCollapsedState(key: string, state: vscode.TreeItemCollapsibleState) {
		this.collapseStates.set(key, state);
		if (state === vscode.TreeItemCollapsibleState.Collapsed) {
			const prefix = key + '/';
			for (const k of this.collapseStates.keys()) {
				if (k.startsWith(prefix)) {
					this.collapseStates.set(k, vscode.TreeItemCollapsibleState.Collapsed);
				}
			}
		}
	}

	clearCollapseStates() {
		this.collapseStates.clear();
	}

	getVisibleElements(): { key: string, level: number }[] {
		const elements: { key: string, level: number }[] = [];
		if (this.viewMode === 'list') {
			for (const item of this.items) {
				elements.push({ key: item.relativePath, level: 2 });
			}
		} else {
			const folderSet = new Set<string>();
			for (const item of this.items) {
				elements.push({ key: item.relativePath, level: 2 });
				const parts = item.relativePath.split(/[\\/]/);
				if (parts.length > 1) {
					let currentPath = '';
					for (let i = 0; i < parts.length - 1; i++) {
						const part = parts[i];
						currentPath = currentPath ? `${currentPath}/${part}` : part;
						if (!folderSet.has(currentPath)) {
							folderSet.add(currentPath);
							const level = currentPath.indexOf('/') === -1 ? 0 : 1;
							elements.push({ key: currentPath, level });
						}
					}
				}
			}
		}
		return elements;
	}

	updateCollapsedContext() {
		const visibleElements = this.getVisibleElements();
		let anyExpanded = false;
		for (const el of visibleElements) {
			if (this.getCollapsedState(el.key) === vscode.TreeItemCollapsibleState.Expanded) {
				anyExpanded = true;
				break;
			}
		}
		vscode.commands.executeCommand('setContext', 'codeCleaner.isCollapsed', !anyExpanded);
	}

	collapseStepByStep() {
		this.collapseVersion++;
		const visibleElements = this.getVisibleElements();

		let expandedFiles = visibleElements.filter(el => el.level === 2 && this.getCollapsedState(el.key) === vscode.TreeItemCollapsibleState.Expanded);
		if (expandedFiles.length > 0) {
			for (const el of visibleElements) {
				if (el.level === 2) {
					this.setCollapsedState(el.key, vscode.TreeItemCollapsibleState.Collapsed);
				}
			}
			this.refresh();
			this.updateCollapsedContext();
			return;
		}

		let expandedSubfolders = visibleElements.filter(el => el.level === 1 && this.getCollapsedState(el.key) === vscode.TreeItemCollapsibleState.Expanded);
		if (expandedSubfolders.length > 0) {
			for (const el of visibleElements) {
				if (el.level === 1) {
					this.setCollapsedState(el.key, vscode.TreeItemCollapsibleState.Collapsed);
				}
			}
			this.refresh();
			this.updateCollapsedContext();
			return;
		}

		let expandedMain = visibleElements.filter(el => el.level === 0 && this.getCollapsedState(el.key) === vscode.TreeItemCollapsibleState.Expanded);
		if (expandedMain.length > 0) {
			for (const el of visibleElements) {
				if (el.level === 0) {
					this.setCollapsedState(el.key, vscode.TreeItemCollapsibleState.Collapsed);
				}
			}
			this.refresh();
			this.updateCollapsedContext();
			return;
		}

		this.updateCollapsedContext();
	}

	expandAll() {
		this.collapseVersion++;
		this.clearCollapseStates();
		this.refresh();
		this.updateCollapsedContext();
	}

	updateItems(items: FileItem[]) {
		this.items = items;
		for (const item of this.items) {
			try {
				const content = require('fs').readFileSync(item.filePath, 'utf8');
				const lines = content.split(/\r?\n/);
				item.lineItems = item.ranges.map(range => {
					const lineNum = range.start.line;
					const text = lines[lineNum] || '';
					return {
						fileItem: item,
						range,
						lineNumber: lineNum + 1,
						lineText: text.trim(),
						checked: true
					};
				});
			} catch (e) {
				item.lineItems = item.ranges.map(range => ({
					fileItem: item,
					range,
					lineNumber: range.start.line + 1,
					lineText: `Line ${range.start.line + 1}`,
					checked: true
				}));
			}
		}
		vscode.commands.executeCommand('setContext', 'codeCleaner.hasResults', this.items.length > 0);
		this.updateCollapsedContext();
		this.refresh();
	}

	getItems(): FileItem[] {
		return this.items;
	}

	setViewMode(mode: 'list' | 'tree') {
		this.viewMode = mode;
		this.refresh();
	}

	getViewMode(): 'list' | 'tree' {
		return this.viewMode;
	}

	getTreeItem(element: TreeElement): vscode.TreeItem {
		if (this.viewMode === 'list') {
			return this.listProvider.getTreeItem(element);
		}
		return this.treeProvider.getTreeItem(element);
	}

	getChildren(element?: TreeElement): TreeElement[] {
		if (this.viewMode === 'list') {
			return this.listProvider.getChildren(element);
		}
		return this.treeProvider.getChildren(element);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}

export class FolderItem extends vscode.TreeItem {
	public children: (TreeItem | FolderItem)[] = [];

	constructor(
		public readonly label: string,
		public readonly path: string,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded,
		version: number = 0
	) {
		super(label, collapsibleState);
		this.contextValue = 'cleanerFolderItem';
		this.resourceUri = vscode.Uri.file(path);
		this.iconPath = vscode.ThemeIcon.Folder;
		this.id = `${path}_${collapsibleState}_v${version}`;
	}

	addChild(child: TreeItem | FolderItem) {
		this.children.push(child);
	}
}

export class TreeItem extends vscode.TreeItem {
	constructor(
		public readonly fileItem: FileItem,
		collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded,
		version: number = 0
	) {
		super(vscode.Uri.file(fileItem.filePath), collapsibleState);

		this.tooltip = `${fileItem.filePath}\nFound: ${fileItem.ranges.length} ${fileItem.actionName}`;
		this.description = `(${fileItem.ranges.length} ${fileItem.actionName})`;
		this.contextValue = 'cleanerFileItem';
		this.resourceUri = vscode.Uri.file(fileItem.filePath);
		this.iconPath = vscode.ThemeIcon.File;
		this.id = `${fileItem.relativePath}_${collapsibleState}_v${version}`;
	}
}

export class LineItemNode extends vscode.TreeItem {
	constructor(public readonly lineItem: LineItem) {
		super(`${lineItem.lineNumber}: ${lineItem.lineText}`, vscode.TreeItemCollapsibleState.None);
		this.contextValue = 'cleanerLineItem';
		this.description = '';

		this.iconPath = undefined;

		this.command = {
			command: 'codeCleaner.openPreviewDiff',
			title: 'Open Preview Diff',
			arguments: [lineItem.fileItem, lineItem.range]
		};
	}
}
