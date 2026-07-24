import { CommentSpan } from '../parser/parserManager';

export function shouldKeepComment(text: string, keepKeywords: string[]): boolean {
  const normalized = text.toLowerCase();
  for (const kw of keepKeywords) {
    if (normalized.includes(kw.toLowerCase())) {
      return true;
    }
  }
  return false;
}

export function filterComments(comments: CommentSpan[], keepKeywords: string[]): CommentSpan[] {
  return comments.filter(c => !shouldKeepComment(c.text, keepKeywords));
}

export function removeCommentsFromText(text: string, commentsToRemove: CommentSpan[]): string {
  const sorted = [...commentsToRemove].sort((a, b) => b.start - a.start);
  let result = text;
  for (const comment of sorted) {
    let start = comment.start;
    let end = comment.end;

    while (start > 0 && (result[start - 1] === ' ' || result[start - 1] === '\t')) {
      start--;
    }

    if ((start === 0 || result[start - 1] === '\n' || result[start - 1] === '\r') &&
        (end === result.length || result[end] === '\n' || result[end] === '\r')) {
      if (end < result.length) {
        if (result[end] === '\r' && result[end + 1] === '\n') {
          end += 2;
        } else {
          end += 1;
        }
      }
    }

    result = result.substring(0, start) + result.substring(end);
  }
  return result;
}
