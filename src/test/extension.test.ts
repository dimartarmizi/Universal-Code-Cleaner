import * as assert from 'assert';
import { parseComments } from '../parser/parserManager';
import { filterComments, removeCommentsFromText } from '../remover/commentRemover';

describe('Comment Remover Logic Test Suite', () => {
  it('should parse and remove single line comments in C/JS/TS style', () => {
    const code = 'const x = 1; // this is a comment\nconst y = 2;';
    const comments = parseComments(code, 'c');
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].text, '// this is a comment');

    const filtered = filterComments(comments, []);
    const result = removeCommentsFromText(code, filtered);
    assert.strictEqual(result, 'const x = 1;\nconst y = 2;');
  });

  it('should parse and remove block comments in C/JS/TS style', () => {
    const code = 'const x = 1; /* block\ncomment */ const y = 2;';
    const comments = parseComments(code, 'c');
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].text, '/* block\ncomment */');

    const filtered = filterComments(comments, []);
    const result = removeCommentsFromText(code, filtered);
    assert.strictEqual(result, 'const x = 1; const y = 2;');
  });

  it('should respect keep keywords like license or ts-ignore', () => {
    const code = '/* @license MIT */\n// @ts-ignore\n// ordinary comment\nconst x = 1;';
    const comments = parseComments(code, 'c');
    assert.strictEqual(comments.length, 3);

    const filtered = filterComments(comments, ['license', 'ts-ignore']);
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].text, '// ordinary comment');

    const result = removeCommentsFromText(code, filtered);
    assert.strictEqual(result, '/* @license MIT */\n// @ts-ignore\nconst x = 1;');
  });

  it('should parse and remove Python style comments', () => {
    const code = 'x = 1 # python comment\ny = 2';
    const comments = parseComments(code, 'python');
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].text, '# python comment');

    const filtered = filterComments(comments, []);
    const result = removeCommentsFromText(code, filtered);
    assert.strictEqual(result, 'x = 1\ny = 2');
  });

  it('should not parse comments inside double quoted strings', () => {
    const code = 'const x = "http://example.com";';
    const comments = parseComments(code, 'c');
    assert.strictEqual(comments.length, 0);
  });

  it('should not parse comments inside backticks (template literals)', () => {
    const code = 'const x = `http://example.com`;';
    const comments = parseComments(code, 'c');
    assert.strictEqual(comments.length, 0);
  });

  it('should not parse comments inside single quoted strings', () => {
    const code = "const x = 'http://example.com';";
    const comments = parseComments(code, 'c');
    assert.strictEqual(comments.length, 0);
  });
});
