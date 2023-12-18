import { WordType } from '../../types';

export * from './status';

export const DATATYPES = {
  SENTENCE: 'sentence',
  WORD: 'word',
  QUESTION: 'question',
};

export const EmptyWord = {
  id: '',
  created_at: {
    seconds: 0,
    nanoseconds: 0,
  },
  updated_at: {
    seconds: 0,
    nanoseconds: 0,
  },
  created_by: '',
  updated_by: '',
} as WordType;