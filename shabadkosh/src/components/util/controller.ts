import {
  DocumentReference,
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore as db, firestore } from '../../firebase';
import { MiniWord, NewWordType } from '../../types/word';
import { MiniWordlist, NewWordlistType, WordlistType } from '../../types/wordlist';
import { Option, QuestionData, SentenceType } from '../../types';

export default db;

// Words collection
export const wordsCollection = collection(db, 'words');

// check if word already exists
export const isWordNew = async (word: string, exception_id = ' ') => {
  if (word && word !== undefined) {
    const queryStatement = query(wordsCollection, where('word', '==', word), where(documentId(), '!=', exception_id));
    const result = await getDocs(queryStatement);
    return result.empty;
  }
  return true;
};

// add new word to words collection
export const addWord = async (word_data: NewWordType | MiniWord) => {
  const newWord = await addDoc(wordsCollection, {
    ...word_data,
  });
  return newWord.id;
};

// update word in words collection
export const updateWord = async (word: DocumentReference, word_data: NewWordType) => {
  const updatedWord = await updateDoc(word, {
    ...word_data,
  });
  return updatedWord;
};

export const deleteWord = async (word: DocumentReference) => {
  const delWord = await deleteDoc(word);
  return delWord;
};

// get word from words collection
export const getWords = async () => {
  const querySnapshot = await getDocs(wordsCollection);
  const words: NewWordType[] = [];
  querySnapshot.forEach((wordData) => {
    words.push({
      ...wordData.data(),
      id: wordData.id,
      created_at: wordData.data().created_at,
      created_by: wordData.data().created_by,
      updated_at: wordData.data().updated_at,
      updated_by: wordData.data().updated_by,
    });
  });
  return words;
};

// set word status as reviewed
export const reviewWord = async (
  word: DocumentReference,
  word_data: NewWordType,
  status: string,
  updated_by: string,
) => {
  const revWord = await updateDoc(word, {
    ...word_data, status, updated_at: Timestamp.now(), updated_by, sentences: word_data.sentences || [],
  });
  return revWord;
};

// get word from a list of word ids
export const getWordsByIdList = async (id_list: string[]) => {
  if (id_list && id_list.length > 0) {
    const queryStatement = query(wordsCollection, where(documentId(), 'in', id_list));
    const result = await getDocs(queryStatement);
    return result.docs;
  }
  return [];
};

// Sentences collection
export const sentencesCollection = collection(db, 'sentences');

export const addSentence = async (sentence_data: SentenceType) => {
  const newSentence = await addDoc(sentencesCollection, {
    ...sentence_data,
  });
  return newSentence.id;
};

export const updateSentence = async (sentence: DocumentReference, sentence_data: SentenceType) => {
  const updatedSentence = await updateDoc(sentence, {
    ...sentence_data,
  });
  return updatedSentence;
};

export const deleteSentence = async (sentence: DocumentReference) => {
  const delSentence = deleteDoc(sentence);
  return delSentence;
};

// delete sentence by word id
export const deleteSentenceByWordId = async (word_id: string) => {
  const queryStatement = query(sentencesCollection, where('word_id', '==', word_id));
  const batch = writeBatch(firestore);
  const querySnapshot = await getDocs(queryStatement);

  querySnapshot.docs.forEach((sentenceData) => {
    batch.delete(sentenceData.ref);
  });

  try {
    const res = await batch.commit();
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};

// Questions collection
export const questionsCollection = collection(db, 'questions');

export const addQuestion = async (question_data: QuestionData) => {
  const newQuestion = await addDoc(questionsCollection, {
    ...question_data,
  });
  return newQuestion.id;
};

export const updateQuestion = async (question: DocumentReference, question_data: QuestionData) => {
  const updatedQuestion = await updateDoc(question, {
    ...question_data,
  });
  return updatedQuestion;
};

export const deleteQuestion = async (question: DocumentReference) => {
  const delQuestion = deleteDoc(question);
  return delQuestion;
};

// delete question by word id
export const deleteQuestionByWordId = async (word_id: string) => {
  const queryStatement = query(questionsCollection, where('word_id', '==', word_id));
  const batch = writeBatch(firestore);
  const querySnapshot = await getDocs(queryStatement);
  querySnapshot.docs.forEach((questionData) => {
    batch.delete(questionData.ref);
  });

  try {
    const res = await batch.commit();
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};

// Wordlists collection
export const wordlistsCollection = collection(db, 'wordlists');

export const addNewWordlist = async (wordlist_data: NewWordlistType) => {
  const newWordlist = await addDoc(wordlistsCollection, {
    ...wordlist_data,
  });
  return newWordlist.id;
};

export const getWordlist = async (wordlist_ref: DocumentReference) => {
  const gotWlist = await getDoc(wordlist_ref);
  return gotWlist;
};

export const updateWordlist = async (wordlist: DocumentReference, wordlist_data: WordlistType) => {
  const updatedWordlist = await updateDoc(wordlist, {
    ...wordlist_data,
  });
  return updatedWordlist;
};

export const deleteWordlist = async (wordlist: DocumentReference) => {
  const delWordlist = await deleteDoc(wordlist);
  return delWordlist;
};

// get word from a list of word ids
export const getWordlistsByIdList = async (id_list: string[]) => {
  if (id_list.length > 0) {
    const queryStatement = query(wordlistsCollection, where(documentId(), 'in', id_list));
    const result = await getDocs(queryStatement);
    return result.docs;
  }
  return [];
};

// get wordlists with a word id as a part of it
export const getWordlistsByWordId = async (word_id: string) => {
  const queryStatement = query(wordlistsCollection, where('words', 'array-contains', word_id));
  const result = await getDocs(queryStatement);
  return result.docs;
};

export const getWordsFromSupportWordIds = async (word_id: string, type: string) => {
  const queryStatement = query(wordsCollection, where(type, 'array-contains', word_id));
  const result = await getDocs(queryStatement);
  return result.docs;
};

// set word in wordlist
export const setWordInWordlists = async (
  add_wlist_ids: MiniWordlist[],
  rem_wlist_ids: MiniWordlist[],
  word_id: string,
) => {
  const batch = writeBatch(firestore);
  if (add_wlist_ids.length > 0) {
    add_wlist_ids.map((wlist: MiniWordlist) => {
      const wlistRef = doc(firestore, 'wordlists', wlist.id as string);
      batch.update(wlistRef, {
        words: arrayUnion(word_id),
      });
      return null;
    });
  }
  if (rem_wlist_ids.length > 0) {
    rem_wlist_ids.map((wlist: MiniWordlist) => {
      const wlistRef = doc(firestore, 'wordlists', wlist.id as string);
      batch.update(wlistRef, {
        words: arrayRemove(word_id),
      });
      return null;
    });
  }

  try {
    const res = await batch.commit();
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const removeWordFromWordlists = async (word_id: string) => {
  const batch = writeBatch(firestore);
  const wordlist = await getWordlistsByWordId(word_id);
  wordlist.forEach((val) => { 
    const wlRef = doc(firestore, 'wordlists', val.id);
    batch.update(wlRef, {
      words: arrayRemove(word_id),
    });
  });

  try {
    const res = await batch.commit();
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const removeWordFromSupport = async (word_id: string) => {
  const batch = writeBatch(firestore);
  const synonyms = await getWordsFromSupportWordIds(word_id, 'synonyms');
  const antonyms = await getWordsFromSupportWordIds(word_id, 'antonyms');
  const supportWordIds = synonyms.concat(antonyms);
  supportWordIds.forEach((word) => {
    const wordRef = doc(firestore, 'words', word.id);
    batch.update(wordRef, {
      synonyms: arrayRemove(word_id),
      antonyms: arrayRemove(word_id),
    });
  });

  try {
    const res = await batch.commit();
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const addWordIdToWordlists = async (wordlist_ids: string[], word_id: string) => {
  const batch = writeBatch(firestore);
  if (wordlist_ids.length > 0) {
    wordlist_ids.map((wlid: string) => {
      const wlRef = doc(firestore, 'wordlists', wlid);
      batch.update(wlRef, {
        words: arrayUnion(word_id),
      });
      return null;
    });
  }

  try {
    const res = await batch.commit();
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const createMultipleWordsAtOnce = async (wordsList: MiniWord[] | Option[], collectionName: string) => {
  const batch = writeBatch(firestore);
  const wordIdList = [] as string[];
  if (wordsList.length > 0) {
    wordsList.forEach((wordData: MiniWord | Option) => {
      const wordRef = doc(collection(firestore, collectionName));
      wordIdList.push(wordRef.id);
      batch.set(wordRef, {
        ...wordData,
      });
    });
  }
  try {
    const res = await batch.commit().then(() => wordIdList);
    return res;
  } catch (err) {
    console.log(err);
    return [];
  }
};
