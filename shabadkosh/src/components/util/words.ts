import { Dispatch, SetStateAction } from 'react';
import { SentenceType, QuestionType, NewWordType, MiniWord } from '../../types';
import { firestore } from '../../firebase';
import { DocumentData, DocumentReference, Timestamp, doc } from 'firebase/firestore';
import { addQuestion, addSentence, addWord, addWordIdToWordlists, deleteQuestion, deleteSentence, updateQuestion, updateSentence, updateWord } from './controller';
import { TFunction } from 'i18next';
import { STATUS, qtypes } from '../constants';
import { createSupportWords, createWordsFromOptions, seperateIdsAndNewOptions, seperateIdsAndNewWords, splitAndClear } from './utils';
import SUBMIT_TYPE from '../constants/submit';
import { User } from 'firebase/auth';
import PARTS_OF_SPEECH from '../constants/pos';

export const addNewSentence = (e: any, setSentences: Dispatch<SetStateAction<SentenceType[]>>) => {
  e.preventDefault();
  setSentences((prevSentences) => [
    ...prevSentences,
    {
      word_id: '',
      sentence: '',
      translation: '',
    },
  ]);
};

export const changeQuestion = (event: any, questions: QuestionType[], setQuestions: Dispatch<SetStateAction<QuestionType[]>>) => {
  event.preventDefault();
  const updatedQuestions = questions.map((question, qidx) => {
    if (event.target.id.includes('question')) {
      if (parseInt(event.target.id.split('question')[1], 10) !== qidx) {
        return question;
      }
      return {
        ...question, question: event.target.value,
      };
    } if (event.target.id.includes('qtranslation')) {
      if (parseInt(event.target.id.split('qtranslation')[1], 10) !== qidx) {
        return question;
      }
      return {
        ...question, translation: event.target.value,
      };
    } if (event.target.id.includes('type')) {
      if (parseInt(event.target.id.split('type')[1], 10) !== qidx) {
        return question;
      }
      return {
        ...question, type: event.target.value,
      };
    } if (event.target.id.includes('options')) {
      if (parseInt(event.target.id.split('options')[1], 10) !== qidx) {
        return question;
      }
      return {
        ...question, options: event.target.value,
      };
    } if (event.target.id.includes('answer')) {
      if (parseInt(event.target.id.split('answer')[1], 10) !== qidx) {
        return question;
      }
      return {
        ...question, answer: event.target.value,
      };
    }
    return question;
  });
  setQuestions(updatedQuestions);
};


export const changeSentence = (event: any, sentences: SentenceType[], setSentences: Dispatch<SetStateAction<SentenceType[]>>) => {
  event.preventDefault();
  const updatedSentences = sentences.map((sentence, sidx) => {
    if (event.target.id.includes('translation')) {
      if (parseInt(event.target.id.split('translation')[1], 10) !== sidx) {
        return sentence;
      }
      return {
        ...sentence, translation: event.target.value,
      };
    } if (event.target.id.includes('sentence')) {
      if (parseInt(event.target.id.split('sentence')[1], 10) !== sidx) {
        return sentence;
      }
      return {
        ...sentence, sentence: event.target.value,
      };
    }
    return sentence;
  });
  setSentences(updatedSentences);
};

export const removeSentence = (
  idx: number,
  e: any,
  t: TFunction<'translation', undefined>,
  sentences: SentenceType[],
  setSentences: Dispatch<SetStateAction<SentenceType[]>>,
  formValues: any,
  setFormValues: Dispatch<SetStateAction<any>>,
  type = SUBMIT_TYPE.CREATE,
  word?: string,
) => {

  e.preventDefault();
  let proceed = true;

  if (type === SUBMIT_TYPE.EDIT && sentences[idx].id) {
    const response = window.confirm(t('DELETE_FOR_WORD_CONFIRM', { what: 'sentence', data: sentences[idx].sentence, word }));

    if (response) {
      const getSentence = doc(firestore, `sentences/${sentences[idx].id}`);
      deleteSentence(getSentence);
    } else {
      proceed = false;
    }
  }

  if (proceed) {
    const newSFormValues = {
    } as any;

    // update sentences based on id of deleted sentence
    sentences.forEach((sentence, i) => {
      const newSentence = {
        ...sentence,
        sentence: formValues[`sentence${i}`],
        translation: formValues[`translation${i}`],
      };
      if (i > idx) {
        newSFormValues[`sentence${i - 1}`] = newSentence.sentence;
        newSFormValues[`translation${i - 1}`] = newSentence.translation;
      } else if (i < idx) {
        newSFormValues[`sentence${i}`] = newSentence.sentence;
        newSFormValues[`translation${i}`] = newSentence.translation;
      }
    });

    // add other fields which are not part of sentences
    Object.entries(formValues).forEach(([key, value]) => {
      if (!key.match(/sentence\d+/) && !key.match(/translation\d+/)) {
        newSFormValues[key] = value;
      }
    });

    setFormValues(newSFormValues);
    setSentences((prevSentences) => {
      const newSentences = [...prevSentences];
      newSentences.splice(idx, 1);
      return newSentences;
    });
  }
};

export const addNewQuestion = (e: any, setQuestions: Dispatch<SetStateAction<QuestionType[]>>) => {
  e.preventDefault();
  setQuestions((prevQuestions) => [
    ...prevQuestions,
    {
      question: '',
      translation: '',
      type: qtypes.CONTEXT,
      options: [],
      answer: 0,
      word_id: '',
    },
  ]);
};

export const removeQuestion = (
  idx: number,
  e: any,
  t: TFunction<'translation', undefined>,
  questions: QuestionType[],
  setQuestions: Dispatch<SetStateAction<QuestionType[]>>,
  formValues: any,
  setFormValues: Dispatch<SetStateAction<any>>,
  type = SUBMIT_TYPE.CREATE,
  word?: string,
) => {

  e.preventDefault();
  let proceed = true;
  if (type === SUBMIT_TYPE.EDIT && questions[idx].id) {
    const response = window.confirm(t('DELETE_FOR_WORD_CONFIRM', { what: 'question', data: questions[idx].question, word }));

    if (response) {
      const getQuestion = doc(firestore, `questions/${questions[idx].id}`);
      deleteQuestion(getQuestion);
    } else {
      proceed = false;
    }
  }
  
  if (proceed) {
    const newSFormValues = {
    } as any;

    // update questions based on id of deleted question
    questions.forEach((question, i) => {
      const newQuestion = {
        ...question,
        question: formValues[`question${i}`],
        translation: formValues[`qtranslation${i}`],
        type: formValues[`type${i}`],
        options: formValues[`options${i}`],
        answer: formValues[`answer${i}`],
      };
      if (i > idx) {
        newSFormValues[`question${i - 1}`] = newQuestion.question;
        newSFormValues[`qtranslation${i - 1}`] = newQuestion.translation;
        newSFormValues[`type${i - 1}`] = newQuestion.type;
        newSFormValues[`options${i - 1}`] = newQuestion.options;
        newSFormValues[`answer${i - 1}`] = newQuestion.answer;
      } else if (i < idx) {
        newSFormValues[`question${i}`] = newQuestion.question;
        newSFormValues[`qtranslation${i}`] = newQuestion.translation;
        newSFormValues[`type${i}`] = newQuestion.type;
        newSFormValues[`options${i}`] = newQuestion.options;
        newSFormValues[`answer${i}`] = newQuestion.answer;
      }
    });

    // add other fields which are not part of questions
    Object.keys(formValues).forEach((key) => {
      if (!key.match(/question\d+/) && !key.match(/qtranslation\d+/) && !key.match(/type\d+/) && !key.match(/options\d+/) && !key.match(/answer\d+/)) {
        newSFormValues[key] = formValues[key];
      }
    });

    setFormValues(newSFormValues);
    setQuestions((prevQuestions) => {
      const newQuestions = [...prevQuestions];
      newQuestions.splice(idx, 1);
      return newQuestions;
    });
  }
};

export const saveWord = async (formData: any, type: string, user: User, word?: NewWordType, getWord?: DocumentReference<DocumentData>, updated_word_id?: string) => {
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

export const createWordData = async (formData: any, synonyms: MiniWord[], antonyms: MiniWord[], user: User, type?: string, old_status?: string) => {
  const [uniqueSyn, synIds] = seperateIdsAndNewWords(synonyms);
  const [uniqueAnt, antIds] = seperateIdsAndNewWords(antonyms);

  return createSupportWords(uniqueSyn, user).then((synIdlist) => {
    return createSupportWords(uniqueAnt, user).then((antIdList) => {
      return createWordsFromOptions(formData.questions, user).then((qData) => {
        const synArr = synIds.concat(synIdlist);
        const antArr = antIds.concat(antIdList);

        formData.synonyms = synArr;
        formData.antonyms = antArr;
        formData.questions = qData;
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
      });
    });
  });
};
