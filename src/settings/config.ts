import * as vscode from 'vscode';

export interface CommentRemoverSettings {
	ignore: string[];
	keep: string[];
	preview: boolean;
	autoSave: boolean;
	consoleLogs: {
		keepError: boolean;
		keepWarn: boolean;
	};
	emptyLines: {
		maxConsecutive: number;
	};
	indent?: {
		style: 'tab' | 'space';
		size: number;
	};
}

export function getSettings(): CommentRemoverSettings {
	const config = vscode.workspace.getConfiguration('codeCleaner');
	return {
		ignore: config.get<string[]>('ignore') || [],
		keep: config.get<string[]>('keep') || [],
		preview: config.get<boolean>('preview') !== false,
		autoSave: config.get<boolean>('autoSave') !== false,
		consoleLogs: {
			keepError: config.get<boolean>('consoleLogs.keepError') !== false,
			keepWarn: config.get<boolean>('consoleLogs.keepWarn') === true
		},
		emptyLines: {
			maxConsecutive: config.get<number>('emptyLines.maxConsecutive') ?? 1
		},
		indent: {
			style: config.get<'tab' | 'space'>('indent.style') || 'tab',
			size: config.get<number>('indent.size') ?? 4
		}
	};
}

