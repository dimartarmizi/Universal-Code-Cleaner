import * as vscode from 'vscode';

export interface CodeCleanerProcessor {
	name: string;
	scan(document: vscode.TextDocument): Promise<vscode.Range[]>;
	applyCustomEdit?(editBuilder: vscode.TextEditorEdit, document: vscode.TextDocument): void;
	applyCustomWorkspaceEdit?(edit: vscode.WorkspaceEdit, document: vscode.TextDocument): void;
}
