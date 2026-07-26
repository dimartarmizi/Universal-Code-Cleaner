export interface CommentSpan {
	start: number;
	end: number;
	text: string;
}

export function parseComments(text: string, commentType: 'c' | 'python' | 'html' | 'css' | 'ini' | 'sfc'): CommentSpan[] {
	const spans: CommentSpan[] = [];
	const len = text.length;
	let i = 0;

	if (commentType === 'sfc') {
		const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
		const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;

		const blocks: { start: number; end: number; type: 'c' | 'css' }[] = [];
		let match;

		while ((match = scriptRegex.exec(text)) !== null) {
			const contentStart = match.index + match[0].indexOf(match[1]);
			blocks.push({ start: contentStart, end: contentStart + match[1].length, type: 'c' });
		}

		styleRegex.lastIndex = 0;
		while ((match = styleRegex.exec(text)) !== null) {
			const contentStart = match.index + match[0].indexOf(match[1]);
			blocks.push({ start: contentStart, end: contentStart + match[1].length, type: 'css' });
		}

		blocks.sort((a, b) => a.start - b.start);

		let lastIndex = 0;
		const parseSubSection = (subText: string, type: 'html' | 'c' | 'css', offset: number) => {
			const subSpans = parseComments(subText, type);
			for (const s of subSpans) {
				spans.push({ start: s.start + offset, end: s.end + offset, text: s.text });
			}
		};

		for (const block of blocks) {
			if (block.start > lastIndex) {
				parseSubSection(text.substring(lastIndex, block.start), 'html', lastIndex);
			}
			parseSubSection(text.substring(block.start, block.end), block.type, block.start);
			lastIndex = block.end;
		}

		if (lastIndex < len) {
			parseSubSection(text.substring(lastIndex), 'html', lastIndex);
		}

		return spans;
	}

	while (i < len) {
		if (commentType === 'c') {
			const char = text[i];
			const nextChar = text[i + 1];

			if (char === '"' || char === "'") {
				const quote = char;
				i++;
				while (i < len && text[i] !== quote) {
					if (text[i] === '\\') {
						i += 2;
					} else {
						i++;
					}
				}
				i++;
				continue;
			}

			if (char === '`') {
				const quote = char;
				i++;
				while (i < len && text[i] !== quote) {
					if (text[i] === '\\') {
						i += 2;
					} else {
						i++;
					}
				}
				i++;
				continue;
			}

			if (char === '/' && nextChar === '/') {
				const start = i;
				i += 2;
				while (i < len && text[i] !== '\n' && text[i] !== '\r') {
					i++;
				}
				spans.push({ start, end: i, text: text.substring(start, i) });
				continue;
			}

			if (char === '/' && nextChar === '*') {
				const start = i;
				i += 2;
				while (i < len - 1 && !(text[i] === '*' && text[i + 1] === '/')) {
					i++;
				}
				if (i < len - 1) {
					i += 2;
				} else {
					i = len;
				}
				spans.push({ start, end: i, text: text.substring(start, i) });
				continue;
			}

			i++;
		} else if (commentType === 'python') {
			const char = text[i];

			if (char === '"' || char === "'") {
				const quote = char;
				const isTriple = text[i + 1] === quote && text[i + 2] === quote;
				if (isTriple) {
					i += 3;
					while (i < len - 2 && !(text[i] === quote && text[i + 1] === quote && text[i + 2] === quote)) {
						i++;
					}
					if (i < len - 2) {
						i += 3;
					} else {
						i = len;
					}
				} else {
					i++;
					while (i < len && text[i] !== quote) {
						if (text[i] === '\\') {
							i += 2;
						} else {
							i++;
						}
					}
					i++;
				}
				continue;
			}

			if (char === '#') {
				const start = i;
				i++;
				while (i < len && text[i] !== '\n' && text[i] !== '\r') {
					i++;
				}
				spans.push({ start, end: i, text: text.substring(start, i) });
				continue;
			}

			i++;
		} else if (commentType === 'html') {
			const char = text[i];
			if (char === '"' || char === "'") {
				const quote = char;
				i++;
				while (i < len && text[i] !== quote) {
					if (text[i] === '\\') {
						i += 2;
					} else {
						i++;
					}
				}
				i++;
				continue;
			}

			if (char === '<' && text[i + 1] === '!' && text[i + 2] === '-' && text[i + 3] === '-') {
				const start = i;
				i += 4;
				while (i < len - 2 && !(text[i] === '-' && text[i + 1] === '-' && text[i + 2] === '>')) {
					i++;
				}
				if (i < len - 2) {
					i += 3;
				} else {
					i = len;
				}
				spans.push({ start, end: i, text: text.substring(start, i) });
				continue;
			}

			i++;
		} else if (commentType === 'css') {
			const char = text[i];
			if (char === '"' || char === "'") {
				const quote = char;
				i++;
				while (i < len && text[i] !== quote) {
					if (text[i] === '\\') {
						i += 2;
					} else {
						i++;
					}
				}
				i++;
				continue;
			}

			if (char === '/' && text[i + 1] === '*') {
				const start = i;
				i += 2;
				while (i < len - 1 && !(text[i] === '*' && text[i + 1] === '/')) {
					i++;
				}
				if (i < len - 1) {
					i += 2;
				} else {
					i = len;
				}
				spans.push({ start, end: i, text: text.substring(start, i) });
				continue;
			}

			i++;
		} else {
			i++;
		}
	}

	return spans;
}
