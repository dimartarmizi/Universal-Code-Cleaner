import * as vscode from 'vscode';

export interface CommentRemoverSettings {
	ignore: string[];
	keep: string[];
	preview: boolean;
	autoSave: boolean;
}

export function getSettings(): CommentRemoverSettings {
	const config = vscode.workspace.getConfiguration('codeCleaner');
	return {
		ignore: config.get<string[]>('ignore') || [],
		keep: config.get<string[]>('keep') || [],
		preview: config.get<boolean>('preview') !== false,
		autoSave: config.get<boolean>('autoSave') !== false
	};
}
