import * as vscode from 'vscode';

export interface CodeCleanerProcessor {
	name: string;
	scan(document: vscode.TextDocument): Promise<vscode.Range[]>;
}
