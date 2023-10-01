import { Timestamp } from 'firebase/firestore';
import {
  SentenceType, QuestionType, Option, TimestampType, MiniWord,
} from '../../types';
import { createMultipleWordsAtOnce } from './controller';
import { qtypes } from '../constants';
import { User } from 'firebase/auth';
import { TFunction } from 'i18next';

export const separateIdsAndNewWords = (words: MiniWord[]): [MiniWord[], string[]] => {
  const newWordsList = [] as MiniWord[];
  const wordsIdList = [] as string[];
  words.forEach((word: MiniWord) => {
    const duplicate = newWordsList.find(
      (obj) => obj.word === word.word,
    );
    if (!duplicate) {
      if (Object.keys(word).includes('id') && word.id) {
        wordsIdList.push(word.id);
      } else {
        newWordsList.push(word);
      }
    }
  });
  return [newWordsList, wordsIdList];
};

export const separateIdsAndNewSentences = (sentences: SentenceType[]): [SentenceType[], string[]] => {
  const newSentencesList = [] as SentenceType[];
  const sentencesIdList = [] as string[];
  sentences.forEach((sentence: SentenceType) => {
    const duplicate = newSentencesList.find(
      (obj) => obj.sentence === sentence.sentence,
    );
    if (!duplicate) {
      if (Object.keys(sentence).includes('id') && sentence.id) {
        sentencesIdList.push(sentence.id);
      } else {
        newSentencesList.push({
          sentence: sentence.sentence,
          translation: sentence.translation,
        });
      }
    }
  });
  return [newSentencesList, sentencesIdList];
};

export const hasValidOptions = (questions: QuestionType[]): boolean => {
  if (!questions) return false;
  
  for (const question of questions) {
    if (question.type !== qtypes.MEANING) {
      for (const option of question.options) {
        if (!('id' in option) && option.option && option.option.includes(' ')) {
          return false;
        }
      }
    }
  }

  return true;
};

export const separateIdsAndNewOptions = (options: Option[]): [Option[], string[]] => {
  const newOptionsList: Option[] = [];
  const optionIdsList: string[] = [];
  options.forEach((option: Option) => {
    const duplicate = newOptionsList.find(
      (obj) => obj.option === option.option,
    );
    if (!duplicate) {
      if (typeof option === 'string') {
        optionIdsList.push(option);
      } else {
        newOptionsList.push({
          option: option.option,
          translation: option.translation,
        } as Option);
      }
    }
  });
  return [newOptionsList, optionIdsList];
};

export const createSupportWords = async (wordsList: MiniWord[], user: User) => {
  const newWordsList = wordsList.map((word) => ({
    word: word.word,
    translation: word.translation,
    is_for_support: true,
    created_by: user.email,
    created_at: Timestamp.now(),
    updated_by: user.email,
    updated_at: Timestamp.now(),
  }));
  return createMultipleWordsAtOnce(newWordsList, 'words');
};

export const createOptions = async (optionsList: Option[], user: User) => {
  const options = optionsList.map((option) => ({
    word: option.option,
    translation: option.translation,
    is_for_support: true,
    created_by: user.email,
    created_at: Timestamp.now(),
    updated_by: user.email,
    updated_at: Timestamp.now(),
  }));
  return createMultipleWordsAtOnce(options, 'words');
};

export const createWordsFromOptions = async (questions: QuestionType[], user: User) => {
  return Promise.all(questions.map(async (question: QuestionType) => {
    if (question.type !== qtypes.MEANING) {
      const [newOptionsList, oldOptionsIdList] = separateIdsAndNewOptions(question.options);
      const optionsIdList = oldOptionsIdList;
      const newOptionsIdList = await createOptions(newOptionsList as Option[], user);
      optionsIdList.push(...newOptionsIdList);
      const questionData = {
        ...question,
        options: optionsIdList,
      };
      return questionData;
    } else {
      return question;
    }
  }));
};

export const setOptionsDataForSubmit = (questionsData: QuestionType[]): QuestionType[] => {
  const newQuestions = questionsData.map((questionData) => {
    const optionsList = (questionData.options as Option[]).map((option) => {
      if (Object.keys(option).includes('id')) {
        return option.id;
      }
      return option;
    });
    return {
      ...questionData,
      options: optionsList as Option[],
    };
  });
  return newQuestions;
};

export const convertTimestampToDateString = (timestamp: TimestampType | null, text: TFunction<'translation', undefined>) => {
  if (!timestamp) {
    return text('INVALID_VALUE', { val: 'time' });
  }
  const timestampDate = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  return timestampDate.toLocaleString('en-us', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
};

export const convertTimestampToDate = (timestamp: TimestampType, text: TFunction<'translation', undefined>) => {
  if (!timestamp) {
    return text('INVALID_VALUE', { val: 'time' });
  }
  const timestampDate = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  return timestampDate;
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const splitAndCapitalize = (str: string) => str.split('-').map((ele: string) => capitalize(ele.trim())).join(' ');

export const splitAndClear = (stringData: string | string[]) => {
  // returns empty array if data is null or undefined
  if (!stringData) {
    return [];
  }

  let splitList = stringData;
  // if str is string, split it
  if (typeof stringData === 'string') {
    splitList = stringData.split(',').map((ele: string) => ele.trim());
  }

  // remove empty strings
  const splitArray = (splitList as string[]).filter((str: string) => str !== '');
  return splitArray;
};

export const compareUpdatedAt = (timestamp1: TimestampType, timestamp2: TimestampType) => {
  if (timestamp1 < timestamp2) {
    return 1;
  } if (timestamp1 > timestamp2) {
    return -1;
  }
  return 0;
};
