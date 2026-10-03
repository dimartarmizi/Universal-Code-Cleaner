export interface LanguageConfig {
	id: string;
	extensions: string[];
	commentType: 'c' | 'python' | 'html' | 'css' | 'ini' | 'sfc' | 'blade' | 'php';
}

export const LANGUAGES: LanguageConfig[] = [
	{ id: 'blade', extensions: ['.blade.php'], commentType: 'blade' },
	{ id: 'javascript', extensions: ['.js', '.jsx', '.mjs', '.cjs'], commentType: 'c' },
	{ id: 'typescript', extensions: ['.ts', '.tsx'], commentType: 'c' },
	{ id: 'json', extensions: ['.json', '.jsonc'], commentType: 'c' },
	{ id: 'python', extensions: ['.py'], commentType: 'python' },
	{ id: 'php', extensions: ['.php'], commentType: 'php' },
	{ id: 'go', extensions: ['.go'], commentType: 'c' },
	{ id: 'rust', extensions: ['.rs'], commentType: 'c' },
	{ id: 'java', extensions: ['.java'], commentType: 'c' },
	{ id: 'csharp', extensions: ['.cs'], commentType: 'c' },
	{ id: 'cpp', extensions: ['.cpp', '.hpp', '.c', '.h'], commentType: 'c' },
	{ id: 'sfc', extensions: ['.vue', '.svelte', '.astro', '.riot'], commentType: 'sfc' },
	{ id: 'html', extensions: ['.html', '.htm'], commentType: 'sfc' },
	{ id: 'css', extensions: ['.css', '.scss', '.sass', '.less'], commentType: 'css' },
	{ id: 'yaml', extensions: ['.yaml', '.yml'], commentType: 'python' },
	{ id: 'ruby', extensions: ['.rb'], commentType: 'python' },
	{ id: 'shell', extensions: ['.sh', '.bash'], commentType: 'python' },
	{ id: 'ini', extensions: ['.ini', '.env', '.properties'], commentType: 'ini' }
];

export function getLanguageByExtension(filename: string): LanguageConfig | undefined {
	const lower = filename.toLowerCase();
	return LANGUAGES.find(lang => lang.extensions.some(ext => lower.endsWith(ext)));
}
