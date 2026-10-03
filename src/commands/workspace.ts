import * as vscode from 'vscode';
import { getSettings } from '../core/config';
import { applyProcessorToWorkspace } from '../core/engine';
import { getLanguageByExtension } from '../core/registry';
import { scanWorkspace } from '../core/scanner';
import { CommentProcessor } from '../processors/comment';
import { DebugStatementsProcessor } from '../processors/debugStatements';
import { EmptyLinesProcessor } from '../processors/emptyLines';
import { IndentProcessor } from '../processors/indent';
import { SortImportsProcessor } from '../processors/sortImports';
import { TrailingSpacesProcessor } from '../processors/trailingSpaces';

const commentProcessor = new CommentProcessor();
const emptyLinesProcessor = new EmptyLinesProcessor();
const trailingSpacesProcessor = new TrailingSpacesProcessor();
const debugStatementsProcessor = new DebugStatementsProcessor();
const sortImportsProcessor = new SortImportsProcessor();
const indentProcessor = new IndentProcessor();

export async function removeCommentsWorkspace(targetFolder?: vscode.WorkspaceFolder) {
	const files = await scanWorkspace(getSettings().ignore, targetFolder);
	await applyProcessorToWorkspace(commentProcessor, files, getLanguageByExtension);
}

export async function removeEmptyLinesWorkspace(targetFolder?: vscode.WorkspaceFolder) {
	const files = await scanWorkspace(getSettings().ignore, targetFolder);
	await applyProcessorToWorkspace(emptyLinesProcessor, files, getLanguageByExtension);
}

export async function removeTrailingSpacesWorkspace(targetFolder?: vscode.WorkspaceFolder) {
	const files = await scanWorkspace(getSettings().ignore, targetFolder);
	await applyProcessorToWorkspace(trailingSpacesProcessor, files, getLanguageByExtension);
}

export async function removeDebugStatementsWorkspace(targetFolder?: vscode.WorkspaceFolder) {
	const files = await scanWorkspace(getSettings().ignore, targetFolder);
	await applyProcessorToWorkspace(debugStatementsProcessor, files, getLanguageByExtension);
}

export async function sortImportsWorkspace(targetFolder?: vscode.WorkspaceFolder) {
	const files = await scanWorkspace(getSettings().ignore, targetFolder);
	await applyProcessorToWorkspace(sortImportsProcessor, files, getLanguageByExtension);
}

export async function convertIndentWorkspace(targetFolder?: vscode.WorkspaceFolder) {
	const files = await scanWorkspace(getSettings().ignore, targetFolder);
	await applyProcessorToWorkspace(indentProcessor, files, getLanguageByExtension);
}
