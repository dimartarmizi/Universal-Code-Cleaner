import { getSettings } from '../core/config';
import { applyProcessorToWorkspace } from '../core/engine';
import { getLanguageByExtension } from '../core/registry';
import { scanWorkspace } from '../core/scanner';
import { CommentProcessor } from '../processors/comment';
import { ConsoleLogProcessor } from '../processors/consoleLog';
import { DeadCodeProcessor } from '../processors/deadCode';
import { EmptyLinesProcessor } from '../processors/emptyLines';
import { IndentProcessor } from '../processors/indent';
import { SortImportsProcessor } from '../processors/sortImports';
import { TrailingSpacesProcessor } from '../processors/trailingSpaces';

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
