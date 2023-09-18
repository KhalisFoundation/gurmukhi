import { Timestamp } from 'firebase/firestore';
import {
  SentenceType, QuestionType, Option, TimestampType, MiniWord,
} from '../../types';
import { createMultipleValsAtOnce } from './controller';
import { qtypes } from '../constants';
import { User } from 'firebase/auth';
import { TFunction } from 'i18next';

export const seperateIdsAndNewWords = (words: MiniWord[]): [MiniWord[], string[]] => {
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

export const seperateIdsAndNewSentences = (sentences: SentenceType[]): [SentenceType[], string[]] => {
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
  let valid = questions ? true : false;
  questions.forEach((question: QuestionType) => {
    if (question.type !== qtypes.MEANING) {
      question.options.forEach((option: Option) => {
        if (!Object.keys(option).includes('id') && option.option) {
          if (option.option.includes(' ')) {
            valid = false;
          }
        }
      });
    }
  });
  return valid;
};

export const seperateIdsAndNewOptions = (options: Option[]): [Option[], string[]] => {
  const newOptionsList = [] as Option[];
  const optionIdsList = [] as string[];
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
  return createMultipleValsAtOnce(newWordsList, 'words');
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
  return createMultipleValsAtOnce(options, 'words');
};

export const createWordsFromOptions = async (questions: QuestionType[], user: User) => {
  return Promise.all(questions.map(async (question: QuestionType) => {
    if (question.type !== qtypes.MEANING) {
      const [newOptionsList, oldOptionsIdList] = seperateIdsAndNewOptions(question.options);
      const optionIdsList = oldOptionsIdList;
      const newOptionsIdList = await createOptions(newOptionsList as Option[], user);
      optionIdsList.push(...newOptionsIdList);
      const questionData = {
        ...question,
        options: optionIdsList,
      };
      return questionData;
    } else {
      return question;
    }
  })).then((data) => data);
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

export const convertTimestampToDateString = (timestamp: TimestampType | null, t: TFunction<'translation', undefined>) => {
  if (!timestamp) {
    return t('INVALID_TIME');
  }
  const timestampDate = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  return timestampDate.toLocaleString('en-us', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
};

export const convertTimestampToDate = (timestamp: TimestampType, t: TFunction<'translation', undefined>) => {
  if (!timestamp) {
    return t('INVALID_TIME');
  }
  const timestampDate = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  return timestampDate;
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const splitAndCapitalize = (str: string) => str.split('-').map((ele: string) => capitalize(ele.trim())).join(' ');

export const splitAndClear = (data: string | string[]) => {
  // returns empty array if data is null or undefined
  if (!data) {
    return [];
  }

  let splitList = data;
  // if data is string, split it
  if (typeof data === 'string') {
    splitList = data.split(',').map((ele: string) => ele.trim());
  }

  // remove empty strings
  const splitArray = (splitList as string[]).filter((str: string) => str !== '');
  return splitArray;
};

export const compareUpdatedAt = (word1: any, word2: any) => {
  if (word1.updated_at < word2.updated_at) {
    return 1;
  } if (word1.updated_at > word2.updated_at) {
    return -1;
  }
  return 0;
};
