export type NodeLike = {
  remove: () => void;
};

export type PageNodeLike = {
  id: string;
  name: string;
};

export type FigmaLike<P extends PageNodeLike = PageNodeLike> = {
  createPage: () => P;
  getNodeByIdAsync: (id: string) => Promise<NodeLike | null>;
  currentPage: P;
  setCurrentPageAsync: (page: P) => Promise<void>;
  root: { children: ReadonlyArray<P> };
};

export const createPages = <P extends PageNodeLike>(
  figma: FigmaLike<P>,
  pageNames: string[]
): string[] => {
  const createdIds: string[] = [];

  pageNames.forEach((name) => {
    const page = figma.createPage();
    page.name = name;
    createdIds.push(page.id);
  });

  return createdIds;
};

export const undoPages = async <P extends PageNodeLike>(
  figma: FigmaLike<P>,
  pageIds: string[]
): Promise<void> => {
  if (pageIds.length === 0) return;

  const idSet = new Set(pageIds);

  // Figma refuses to remove the currently-active page; move off it first.
  if (idSet.has(figma.currentPage.id)) {
    const fallback = figma.root.children.find((page) => !idSet.has(page.id));
    if (fallback) {
      try {
        await figma.setCurrentPageAsync(fallback);
      } catch (error) {
        console.error('Failed to switch current page before undo', error);
      }
    }
  }

  for (const id of pageIds) {
    try {
      const node = await figma.getNodeByIdAsync(id);
      if (node) {
        node.remove();
      }
    } catch (error) {
      console.error('Failed to remove page', id, error);
    }
  }
};
