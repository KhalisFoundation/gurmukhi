/* eslint-disable @typescript-eslint/indent */
import { Dispatch, SetStateAction } from 'react';
import { DocumentData, DocumentReference, Timestamp, doc } from 'firebase/firestore';
import { TFunction } from 'i18next';
import { User } from 'firebase/auth';

import { SentenceType, QuestionType, NewWordType, MiniWord, WordType } from '../../types';
import { firestore } from '../../firebase';
import { addQuestion, addSentence, addWord, addWordIdToWordlists, deleteQuestion, deleteQuestionByWordId, deleteSentence, deleteSentenceByWordId, deleteWord, removeWordFromSupport, removeWordFromWordlists, updateQuestion, updateSentence, updateWord } from './controller';
import { DATATYPES, STATUS, qtypes } from '../constants';
import { createSupportWords, createWordsFromOptions, seperateIdsAndNewWords, splitAndClear } from './utils';
import SUBMIT_TYPE from '../constants/submit';
import PARTS_OF_SPEECH from '../constants/pos';
import routes from '../constants/routes';
import { NavigateFunction } from 'react-router-dom';

export const addNewData = (
  event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  setData: Dispatch<SetStateAction<(SentenceType | QuestionType)[]>>,
  datatype: string,
) => {
  event.preventDefault();
  const newData = {
    word_id: '',
    translation: '',
  };
  if (datatype === DATATYPES.SENTENCE) {
    setData((prevData) => [
      ...prevData,
      {
        ...newData,
        sentence: '',
      } as SentenceType,
    ]);
  } else if (datatype === DATATYPES.QUESTION) {
    setData((prevData) => [
      ...prevData,
      {
        ...newData,
        question: '',
        type: qtypes.CONTEXT,
        options: [],
        answer: 0,
      } as QuestionType,
    ]);
  }
};

export const addNewSentence = (
  event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  setSentences: Dispatch<SetStateAction<SentenceType[]>>,
) => addNewData(event, setSentences as Dispatch<SetStateAction<(SentenceType | QuestionType)[]>>, DATATYPES.SENTENCE);

export const addNewQuestion = (
  event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  setQuestions: Dispatch<SetStateAction<QuestionType[]>>,
) => addNewData(event, setQuestions as Dispatch<SetStateAction<(SentenceType | QuestionType)[]>>, DATATYPES.QUESTION);

export const changeData = (
  event: React.ChangeEvent<any>,
  dataList: (SentenceType | QuestionType)[], 
  setDataList: Dispatch<SetStateAction<(SentenceType | QuestionType)[]>>,
  datatype: string,
) => {
  event.preventDefault();
  let updatedDataList = [] as SentenceType[] | QuestionType[];
  if (datatype === DATATYPES.SENTENCE) {
    updatedDataList = dataList.map((sentence, sentenceId) => {
      switch (event.target.id) {
      case `sentence${sentenceId}`:
        return {
          ...sentence, sentence: event.target.value,
        };
      case `translation${sentenceId}`:
        return {
          ...sentence, translation: event.target.value,
        };
      default:
        return sentence;
      }
    }) as SentenceType[];
  } else if (datatype === DATATYPES.QUESTION) {
    updatedDataList = dataList.map((question, questionId) => {
      switch (event.target.id) {
      case `question${questionId}`:
        return {
          ...question, question: event.target.value,
        };
      case `qtranslation${questionId}`:
        return {
          ...question, translation: event.target.value,
        };
      case `type${questionId}`:
        return {
          ...question, type: event.target.value,
        };
      case `options${questionId}`:
        return {
          ...question, options: event.target.value,
        };
      case `answer${questionId}`:
        return {
          ...question, answer: event.target.value,
        };
      default:
        return question;
      }
    }) as QuestionType[];
  }
  setDataList(updatedDataList);
};

export const changeQuestion = (event: React.ChangeEvent<any>, questions: QuestionType[], setQuestions: Dispatch<SetStateAction<QuestionType[]>>) =>
  changeData(event, questions, setQuestions as Dispatch<SetStateAction<(SentenceType | QuestionType)[]>>, DATATYPES.QUESTION);

export const changeSentence = (event: React.ChangeEvent<any>, sentences: SentenceType[], setSentences: Dispatch<SetStateAction<SentenceType[]>>) =>
  changeData(event, sentences, setSentences as Dispatch<SetStateAction<(SentenceType | QuestionType)[]>>, DATATYPES.SENTENCE);

export const removeData = (
  removedDataId: number,
  event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  text: TFunction<'translation', undefined>,
  dataArray: SentenceType[] | QuestionType[],
  setDataArray: Dispatch<SetStateAction<SentenceType[]>> | Dispatch<SetStateAction<QuestionType[]>>,
  type = SUBMIT_TYPE.CREATE,
  datatype = DATATYPES.SENTENCE,
  word?: string,
) => {
  event.preventDefault();
  let proceed = true;

  if (type === SUBMIT_TYPE.EDIT && dataArray[removedDataId].id) {
    const removedData = datatype === DATATYPES.SENTENCE ? (dataArray[removedDataId] as SentenceType).sentence : (dataArray[removedDataId] as QuestionType).question;
    const response = window.confirm(text('DELETE_FOR_WORD_CONFIRM', { what: datatype, data: removedData, word }));
    if (response) {
      if (datatype === DATATYPES.SENTENCE) {
        const getSentence = doc(firestore, `sentences/${dataArray[removedDataId].id}`);
        deleteSentence(getSentence);
      } else if (datatype === DATATYPES.QUESTION) {
        const getQuestion = doc(firestore, `questions/${dataArray[removedDataId].id}`);
        deleteQuestion(getQuestion);
      }
    } else {
      proceed = false;
    }
  }

  if (proceed) {
    setDataArray((prevDataArray: any) => {
      const newDataArray = [...prevDataArray];
      newDataArray.splice(removedDataId, 1);
      return newDataArray;
    });
  }
};

export const saveWord = async (
  formData: any,
  type: string,
  user: User,
  word?: NewWordType,
  getWord?: DocumentReference<DocumentData>,
  updated_word_id?: string,
) => {
  const {
    sentences, questions, ...form
  } = formData;

  let operation;
  const wordData = {
    word: form.word,
    translation: form.translation,
    meaning_punjabi: form.meaning_punjabi ?? '',
    meaning_english: form.meaning_english ?? '',
    part_of_speech: form.part_of_speech ?? '',
    synonyms: form.synonyms,
    antonyms: form.antonyms,
    images: splitAndClear(form.images) ?? [],
    status: form.status ?? STATUS.CREATING_ENGLISH,
    created_at: word?.created_at ?? Timestamp.now(),
    updated_at: Timestamp.now(),
    created_by: form.created_by ?? user.email,
    updated_by: user.email,
    notes: form.notes ?? '',
    is_for_support: form.is_for_support ?? false,
  } as NewWordType;

  if (type === SUBMIT_TYPE.CREATE) {
    operation = addWord(wordData);
  } else if (type === SUBMIT_TYPE.EDIT && getWord) {
    operation = updateWord(getWord, wordData);
  }

  if (operation) {
    return operation.then((word_id) => {
      const id = word_id === undefined ? updated_word_id : word_id;
      if (type === SUBMIT_TYPE.CREATE && word_id) {
        addWordIdToWordlists(form.wordlists, word_id);
      }

      sentences.forEach((sentence: SentenceType) => {
        if (sentence.id === undefined || type === SUBMIT_TYPE.CREATE || !updated_word_id) {
          addSentence({
            ...sentence,
            word_id: id,
          });
        } else {
          const getSentence = doc(firestore, `sentences/${sentence.id}`);
          updateSentence(getSentence, {
            ...sentence,
            word_id: updated_word_id,
          });
        }
      });

      questions.forEach((question: QuestionType) => {
        if (question.id === undefined || type === SUBMIT_TYPE.CREATE || !updated_word_id) {
          addQuestion({
            ...question,
            translation: question.translation ?? '',
            options: question.options ?? [],
            type: question.type ?? qtypes.CONTEXT,
            word_id: id,
          });
        } else {
          const getQuestion = doc(firestore, `questions/${question.id}`);
          updateQuestion(getQuestion, {
            ...question,
            translation: question.translation ?? '',
            options: question.options ?? [],
            type: question.type ?? qtypes.CONTEXT,
            word_id: updated_word_id,
          });
        }
      });
    });
  }
};

export const createWordData = async (
  formData: any,
  synonyms: MiniWord[],
  antonyms: MiniWord[],
  user: User,
  type?: string,
  old_status?: string,
) => {
  const [newSynonymsList, existingSynonymsIds] = seperateIdsAndNewWords(synonyms);
  const [newAntonymsList, existingAntonymsIds] = seperateIdsAndNewWords(antonyms);

  try {
    const newSynonymsIds = await createSupportWords(newSynonymsList, user);
    const newAntonymsIds = await createSupportWords(newAntonymsList, user);
    const newQuestions = await createWordsFromOptions(formData.questions, user);

    const synonymIds = existingSynonymsIds.concat(newSynonymsIds);
    const antonymsIds = existingAntonymsIds.concat(newAntonymsIds);

    formData.synonyms = synonymIds;
    formData.antonyms = antonymsIds;
    formData.questions = newQuestions;

    formData.part_of_speech = formData.part_of_speech ?? PARTS_OF_SPEECH.NOUN;
    let status = formData.status ?? STATUS.CREATING_ENGLISH;
    if (type === SUBMIT_TYPE.APPROVE) {
      if (old_status === STATUS.REVIEW_ENGLISH) {
        status = STATUS.CREATING_PUNJABI;
      } else if (old_status === STATUS.REVIEW_FINAL) {
        status = STATUS.ACTIVE;
      }
    }
    formData.status = status;
    return formData;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const removeWord = async (word: WordType, setIsLoading: Dispatch<SetStateAction<boolean>>, navigate: NavigateFunction) => {
  const response = window.confirm(`Are you sure you want to delete this word: ${word.word}? \n This action is not reversible.`);
  if (response) {
    setIsLoading(true);
    const getWord = doc(firestore, `words/${word.id}`);
    await removeWordFromSupport(word.id);
    await removeWordFromWordlists(word.id);
    await deleteWord(getWord);
    await deleteSentenceByWordId(word.id);
    await deleteQuestionByWordId(word.id);
    setIsLoading(false);
    navigate(routes.words);
  }
};
