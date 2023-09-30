export * from './controller';
export * from './users';
export * from './utils';

export const removeExtraSpaces = (str: string) => {
  if (!str) return '';
  return str.replace(/\s\s+/g, ' ').trim();
};
