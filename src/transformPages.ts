export type TransformOptions = {
  removeDividers: boolean;
  removeEmojis: boolean;
};

const emojiRegex =
  /(\p{Extended_Pictographic}|\u21AA)(?:\uFE0F|\uFE0E)? ?/gu;

export const stripEmojis = (value: string): string => {
  return value.replace(emojiRegex, '');
};

export const transformPages = (
  pages: string[],
  options: TransformOptions
): string[] => {
  let output = pages;

  if (options.removeDividers) {
    output = output.filter((page) => page !== '---');
  }

  if (options.removeEmojis) {
    output = output.map((page) => (page === '---' ? page : stripEmojis(page)));
  }

  return output;
};
