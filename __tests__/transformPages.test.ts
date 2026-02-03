import { transformPages } from '../src/transformPages';

describe('transformPages', () => {
  const pages = ['🖼️ Cover', '---', '✅ Final views', '   ↪ 💻 Desktop'];

  it('removes dividers when enabled', () => {
    expect(
      transformPages(pages, { removeDividers: true, removeEmojis: false })
    ).toEqual(['🖼️ Cover', '✅ Final views', '   ↪ 💻 Desktop']);
  });

  it('removes emojis when enabled', () => {
    expect(
      transformPages(pages, { removeDividers: false, removeEmojis: true })
    ).toEqual(['Cover', '---', 'Final views', '   Desktop']);
  });

  it('removes emojis and dividers together', () => {
    expect(
      transformPages(pages, { removeDividers: true, removeEmojis: true })
    ).toEqual(['Cover', 'Final views', '   Desktop']);
  });
});
