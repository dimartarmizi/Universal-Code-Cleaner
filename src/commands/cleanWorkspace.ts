import * as vscode from 'vscode';
import { getLanguageByExtension } from '../language/languageRegistry';
import { getSettings } from '../settings/config';
import { showPreview, showStatistics } from '../preview/diffPreview';
import { scanWorkspace } from '../scanner/workspaceScanner';
import { CommentProcessor } from '../remover/commentProcessor';
import { DeadCodeProcessor } from '../remover/deadCodeProcessor';
import { applyProcessorToWorkspace } from '../remover/cleanerEngine';

const commentProcessor = new CommentProcessor();
const deadCodeProcessor = new DeadCodeProcessor();

export async function removeCommentsWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);
	await applyProcessorToWorkspace(commentProcessor, settings, files, getLanguageByExtension, showPreview, showStatistics);
}

export async function removeDeadCodeWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);
	await applyProcessorToWorkspace(deadCodeProcessor, settings, files, getLanguageByExtension, showPreview, showStatistics);
}
