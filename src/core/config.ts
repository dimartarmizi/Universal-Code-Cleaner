import * as vscode from 'vscode';

export interface CommentRemoverSettings {
	ignore: string[];
	keep: string[];
	preview: boolean;
	autoSave: boolean;
	debugStatements: {
		keepConsoleError: boolean;
		keepConsoleWarn: boolean;
	};
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
	const keepError = config.get<boolean>('debugStatements.keepConsoleError') ?? config.get<boolean>('consoleLogs.keepError') !== false;
	const keepWarn = config.get<boolean>('debugStatements.keepConsoleWarn') ?? config.get<boolean>('consoleLogs.keepWarn') === true;

	return {
		ignore: config.get<string[]>('ignore') || [],
		keep: config.get<string[]>('keep') || [],
		preview: config.get<boolean>('preview') !== false,
		autoSave: config.get<boolean>('autoSave') !== false,
		debugStatements: {
			keepConsoleError: keepError,
			keepConsoleWarn: keepWarn
		},
		consoleLogs: {
			keepError: keepError,
			keepWarn: keepWarn
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
