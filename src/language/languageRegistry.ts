export interface LanguageConfig {
	id: string;
	extensions: string[];
	commentType: 'c' | 'python' | 'html' | 'css' | 'ini' | 'sfc';
}

export const LANGUAGES: LanguageConfig[] = [
	{ id: 'javascript', extensions: ['.js', '.jsx', '.mjs', '.cjs'], commentType: 'c' },
	{ id: 'typescript', extensions: ['.ts', '.tsx'], commentType: 'c' },
	{ id: 'json', extensions: ['.json', '.jsonc'], commentType: 'c' },
	{ id: 'python', extensions: ['.py'], commentType: 'python' },
	{ id: 'php', extensions: ['.php'], commentType: 'c' },
	{ id: 'go', extensions: ['.go'], commentType: 'c' },
	{ id: 'rust', extensions: ['.rs'], commentType: 'c' },
	{ id: 'java', extensions: ['.java'], commentType: 'c' },
	{ id: 'csharp', extensions: ['.cs'], commentType: 'c' },
	{ id: 'cpp', extensions: ['.cpp', '.hpp', '.c', '.h'], commentType: 'c' },
	{ id: 'sfc', extensions: ['.vue', '.svelte', '.astro', '.riot'], commentType: 'sfc' },
	{ id: 'html', extensions: ['.html', '.htm', '.blade.php'], commentType: 'html' },
	{ id: 'css', extensions: ['.css', '.scss', '.sass', '.less'], commentType: 'css' },
	{ id: 'yaml', extensions: ['.yaml', '.yml'], commentType: 'python' },
	{ id: 'ruby', extensions: ['.rb'], commentType: 'python' },
	{ id: 'shell', extensions: ['.sh', '.bash'], commentType: 'python' }
];

export function getLanguageByExtension(filename: string): LanguageConfig | undefined {

	const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
	return LANGUAGES.find(lang => lang.extensions.includes(ext));
}
