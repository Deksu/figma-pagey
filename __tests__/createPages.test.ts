import {
  createPages,
  undoPages,
  FigmaLike,
  PageNodeLike
} from '../src/createPages';

describe('createPages', () => {
  it('creates pages and returns ids', () => {
    const created: PageNodeLike[] = [];
    const figma: FigmaLike = {
      createPage: () => {
        const page = { id: `${created.length + 1}`, name: '' };
        created.push(page);
        return page;
      },
      getNodeByIdAsync: async () => null,
      currentPage: { id: 'root', name: 'Root' },
      setCurrentPageAsync: async () => {},
      root: { children: [] }
    };

    const ids = createPages(figma, ['One', 'Two']);

    expect(ids).toEqual(['1', '2']);
    expect(created.map((page) => page.name)).toEqual(['One', 'Two']);
  });
});

describe('undoPages', () => {
  it('removes only existing nodes', async () => {
    const removed: string[] = [];
    const figma: FigmaLike = {
      createPage: () => ({ id: 'ignored', name: '' }),
      getNodeByIdAsync: async (id: string) =>
        id === '1' ? { remove: () => removed.push(id) } : null,
      currentPage: { id: 'other', name: 'Other' },
      setCurrentPageAsync: async () => {},
      root: { children: [{ id: 'other', name: 'Other' }] }
    };

    await undoPages(figma, ['1', '2']);

    expect(removed).toEqual(['1']);
  });

  it('switches away from the current page before removing it', async () => {
    const removed: string[] = [];
    const otherPage: PageNodeLike = { id: 'other', name: 'Other' };
    const createdPage: PageNodeLike = { id: '1', name: 'One' };
    let currentPage: PageNodeLike = createdPage;

    const figma: FigmaLike = {
      createPage: () => ({ id: 'ignored', name: '' }),
      getNodeByIdAsync: async (id: string) =>
        id === '1'
          ? {
              remove: () => {
                if (currentPage.id === '1') {
                  throw new Error('Cannot remove current page');
                }
                removed.push(id);
              }
            }
          : null,
      get currentPage() {
        return currentPage;
      },
      setCurrentPageAsync: async (page: PageNodeLike) => {
        currentPage = page;
      },
      root: { children: [otherPage, createdPage] }
    };

    await undoPages(figma, ['1']);

    expect(currentPage.id).toBe('other');
    expect(removed).toEqual(['1']);
  });

  it('continues removing after a failure on one page', async () => {
    const removed: string[] = [];
    const figma: FigmaLike = {
      createPage: () => ({ id: 'ignored', name: '' }),
      getNodeByIdAsync: async (id: string) => ({
        remove: () => {
          if (id === '1') throw new Error('boom');
          removed.push(id);
        }
      }),
      currentPage: { id: 'other', name: 'Other' },
      setCurrentPageAsync: async () => {},
      root: { children: [{ id: 'other', name: 'Other' }] }
    };

    await undoPages(figma, ['1', '2', '3']);

    expect(removed).toEqual(['2', '3']);
  });
});
