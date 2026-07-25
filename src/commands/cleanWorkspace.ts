import { getLanguageByExtension } from '../language/languageRegistry';
import { getSettings } from '../settings/config';
import { showPreview, showStatistics } from '../preview/diffPreview';
import { scanWorkspace } from '../scanner/workspaceScanner';
import { CommentProcessor } from '../remover/commentProcessor';
import { DeadCodeProcessor } from '../remover/deadCodeProcessor';
import { EmptyLinesProcessor } from '../remover/emptyLinesProcessor';
import { TrailingSpacesProcessor } from '../remover/trailingSpacesProcessor';
import { ConsoleLogProcessor } from '../remover/consoleLogProcessor';
import { SortImportsProcessor } from '../remover/sortImportsProcessor';
import { IndentProcessor } from '../remover/indentProcessor';
import { applyProcessorToWorkspace } from '../remover/cleanerEngine';

const commentProcessor = new CommentProcessor();
const deadCodeProcessor = new DeadCodeProcessor();
const emptyLinesProcessor = new EmptyLinesProcessor();
const trailingSpacesProcessor = new TrailingSpacesProcessor();
const consoleLogProcessor = new ConsoleLogProcessor();
const sortImportsProcessor = new SortImportsProcessor();
const indentProcessor = new IndentProcessor();

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

export async function removeEmptyLinesWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);
	await applyProcessorToWorkspace(emptyLinesProcessor, settings, files, getLanguageByExtension, showPreview, showStatistics);
}

export async function removeTrailingSpacesWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);
	await applyProcessorToWorkspace(trailingSpacesProcessor, settings, files, getLanguageByExtension, showPreview, showStatistics);
}

export async function removeConsoleLogsWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);
	await applyProcessorToWorkspace(consoleLogProcessor, settings, files, getLanguageByExtension, showPreview, showStatistics);
}

export async function sortImportsWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);
	await applyProcessorToWorkspace(sortImportsProcessor, settings, files, getLanguageByExtension, showPreview, showStatistics);
}

export async function convertIndentWorkspace() {
	const settings = getSettings();
	const files = await scanWorkspace(settings.ignore);
	await applyProcessorToWorkspace(indentProcessor, settings, files, getLanguageByExtension, showPreview, showStatistics);
}


