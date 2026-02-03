export type PageNodeLike = {
  id: string;
  name: string;
};

export type NodeLike = {
  remove: () => void;
};

export type FigmaLike = {
  createPage: () => PageNodeLike;
  getNodeById: (id: string) => NodeLike | null;
};

export const createPages = (
  figma: FigmaLike,
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

export const undoPages = (figma: FigmaLike, pageIds: string[]): void => {
  pageIds.forEach((id) => {
    const node = figma.getNodeById(id);
    if (node) {
      node.remove();
    }
  });
};
