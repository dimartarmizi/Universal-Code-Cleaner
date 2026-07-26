import { getLanguageByExtension } from '../language/languageRegistry';
import { getSettings } from '../settings/config';
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
	const files = await scanWorkspace(getSettings().ignore);
	await applyProcessorToWorkspace(commentProcessor, files, getLanguageByExtension);
}

export async function removeDeadCodeWorkspace() {
	const files = await scanWorkspace(getSettings().ignore);
	await applyProcessorToWorkspace(deadCodeProcessor, files, getLanguageByExtension);
}

export async function removeEmptyLinesWorkspace() {
	const files = await scanWorkspace(getSettings().ignore);
	await applyProcessorToWorkspace(emptyLinesProcessor, files, getLanguageByExtension);
}

export async function removeTrailingSpacesWorkspace() {
	const files = await scanWorkspace(getSettings().ignore);
	await applyProcessorToWorkspace(trailingSpacesProcessor, files, getLanguageByExtension);
}

export async function removeConsoleLogsWorkspace() {
	const files = await scanWorkspace(getSettings().ignore);
	await applyProcessorToWorkspace(consoleLogProcessor, files, getLanguageByExtension);
}

export async function sortImportsWorkspace() {
	const files = await scanWorkspace(getSettings().ignore);
	await applyProcessorToWorkspace(sortImportsProcessor, files, getLanguageByExtension);
}

export async function convertIndentWorkspace() {
	const files = await scanWorkspace(getSettings().ignore);
	await applyProcessorToWorkspace(indentProcessor, files, getLanguageByExtension);
}


