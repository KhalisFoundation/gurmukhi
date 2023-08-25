import { Timestamp } from 'firebase/firestore';
import {
  NewSentenceType, NewWordType, QuestionType, Option, TimestampType,
} from '../../types';
import { createMultipleValsAtOnce } from './controller';

export const seperateIdsAndNewWords = (some: any) => {
  const uniqueList = [] as any[];
  const idList = [] as string[];
  some.forEach((item: any) => {
    const duplicate = uniqueList.find(
      (obj) => obj.word === item.word,
    );
    if (!duplicate) {
      if (Object.keys(item).includes('id') && item.id) {
        idList.push(item.id);
      } else {
        uniqueList.push(item);
      }
    }
  });
  return [uniqueList, idList];
};

export const seperateIdsAndNewSentences = (some: any) => {
  const uniqueList = [] as any[];
  const idList = [] as string[];
  some.forEach((item: any) => {
    const duplicate = uniqueList.find(
      (obj) => obj.sentence === item.sentence,
    );
    if (!duplicate) {
      if (Object.keys(item).includes('id') && item.id) {
        idList.push(item.id);
      } else {
        uniqueList.push({
          sentence: item.sentence,
          translation: item.translation,
        });
      }
    }
  });
  return [uniqueList, idList];
};

export const hasValidOptions = (questions: any) => {
  let valid = true;
  if (!questions) {
    valid = false;
  }
  questions.forEach((question: any) => {
    if (question.type !== 'meaning') {
      question.options.forEach((ele: any) => {
        if (!Object.keys(ele).includes('id') && ele.option) {
          if (ele.option.includes(' ')) {
            valid = false;
          }
        }
      });
    }
  });
  return valid;
};

export const seperateIdsAndNewOptions = (some: any) => {
  const uniqueList = [] as any[];
  const idList = [] as string[];
  some.forEach((item: any) => {
    const duplicate = uniqueList.find(
      (obj) => obj.option === item.option,
    );
    if (!duplicate) {
      if (typeof item === 'string') {
        idList.push(item);
      } else {
        uniqueList.push({
          option: item.option,
          translation: item.translation,
        });
      }
    }
  });
  return [uniqueList, idList];
};

export const createSupportWords = async (wordList: NewWordType[], user: any) => {
  const w = wordList.map((ele) => ({
    word: ele.word,
    translation: ele.translation,
    is_for_support: true,
    created_by: user.email,
    created_at: Timestamp.now(),
    updated_by: user.email,
    updated_at: Timestamp.now(),
  }));
  return createMultipleValsAtOnce(w, 'words');
};

export const createSupportSentences = async (sentList: NewSentenceType[], user: any) => {
  const s = sentList.map((item) => ({
    sentence: item.sentence,
    translation: item.translation,
    created_by: user.email,
    created_at: Timestamp.now(),
    updated_by: user.email,
    updated_at: Timestamp.now(),
  }));
  return createMultipleValsAtOnce(s, 'sentences');
};

export const createOptions = async (optList: any[], user: any) => {
  const o = optList.map((item) => ({
    word: item.option,
    translation: item.translation,
    is_for_support: true,
    created_by: user.email,
    created_at: Timestamp.now(),
    updated_by: user.email,
    updated_at: Timestamp.now(),
  }));
  return createMultipleValsAtOnce(o, 'words');
};

export const createWordsFromOptions = async (questions: any[], user: any) => {
  return Promise.all(questions.map(async (question: any) => {
    if (question.type !== 'meaning') {
      const [uniqueList, idList] = seperateIdsAndNewOptions(question.options);
      const lOptions = idList;
      return createOptions(uniqueList, user).then((res) => {
        lOptions.push(...res);
        const q = {
          ...question,
          options: lOptions,
        };

        return q;
      });
    } else {
      return question;
    }
  })).then((res) => res);
};

export const setOptionsDataForSubmit = (questionsData: QuestionType[]) => {
  const newQuestions = questionsData.map((ele) => {
    const lOptions = (ele.options as Option[]).map((opt) => {
      if (Object.keys(opt).includes('id')) {
        return opt.id;
      }
      return opt;
    });
    return {
      ...ele,
      options: lOptions,
    };
  });
  return newQuestions;
};

export const convertTimestampToDateString = (timestamp: TimestampType, t: any) => {
  if (!timestamp) {
    return t('INVALID_TIME');
  }
  const timestampDate = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  return timestampDate.toLocaleString('en-us', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
};

export const convertTimestampToDate = (timestamp: TimestampType, t: any) => {
  if (!timestamp) {
    return t('INVALID_TIME');
  }
  const timestampDate = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  return timestampDate;
};

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const splitAndCapitalize = (some: any) => some.split('-').map((ele: string) => capitalize(ele.trim())).join(' ');

export const splitAndClear = (some: any) => {
  if (!some) {
    return [];
  }
  let splitList = some;
  if (typeof some === 'string') {
    splitList = some.split(',').map((ele: string) => ele.trim());
  }
  // remove empty strings
  const arr = splitList.filter((str: string) => str !== '');
  return arr;
};

export const compareUpdatedAt = (a: NewWordType, b: NewWordType) => {
  if (a.updated_at < b.updated_at) {
    return 1;
  } if (a.updated_at > b.updated_at) {
    return -1;
  }
  return 0;
};
