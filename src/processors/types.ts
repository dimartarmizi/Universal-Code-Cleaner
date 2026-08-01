export interface CodeCleanerProcessor {
	name: string;
	scan(document: import('vscode').TextDocument): Promise<import('vscode').Range[]>;
	applyCustomEdit?: (editBuilder: import('vscode').TextEditorEdit, document: import('vscode').TextDocument) => void;
	applyCustomWorkspaceEdit?: (edit: import('vscode').WorkspaceEdit, document: import('vscode').TextDocument) => void;
}
