import * as vscode from 'vscode';

export class PreviewContentProvider implements vscode.TextDocumentContentProvider {
	static scheme = 'code-cleaner-preview';
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	readonly onDidChange = this._onDidChange.event;

	private previews = new Map<string, string>();

	updatePreview(uri: vscode.Uri, content: string) {
		this.previews.set(uri.toString(), content);
		this._onDidChange.fire(uri);
	}

	provideTextDocumentContent(uri: vscode.Uri): string {
		return this.previews.get(uri.toString()) || '';
	}
}
