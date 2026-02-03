import { createPages, undoPages, FigmaLike } from '../src/createPages';

describe('createPages', () => {
  it('creates pages and returns ids', () => {
    const created: { id: string; name: string }[] = [];
    const figma: FigmaLike = {
      createPage: () => {
        const page = { id: `${created.length + 1}`, name: '' };
        created.push(page);
        return page;
      },
      getNodeById: () => null
    };

    const ids = createPages(figma, ['One', 'Two']);

    expect(ids).toEqual(['1', '2']);
    expect(created.map((page) => page.name)).toEqual(['One', 'Two']);
  });
});

describe('undoPages', () => {
  it('removes only existing nodes', () => {
    const removed: string[] = [];
    const figma: FigmaLike = {
      createPage: () => ({ id: 'ignored', name: '' }),
      getNodeById: (id: string) =>
        id === '1'
          ? {
              remove: () => removed.push(id)
            }
          : null
    };

    undoPages(figma, ['1', '2']);

    expect(removed).toEqual(['1']);
  });
});
