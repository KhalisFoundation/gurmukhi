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
import { MiniWordlist } from '../../types/wordlist';

export default db;

// Words collection
export const wordsCollection = collection(db, 'words');

// check if word already exists
export const isWordNew = async (word: string, exception_id = ' ') => {
  if (word && word !== undefined) {
    const q = query(wordsCollection, where('word', '==', word), where(documentId(), '!=', exception_id));
    const result = await getDocs(q);
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
  const words: any[] = [];
  querySnapshot.forEach((wordData) => {
    words.push({
      ...wordData.data(), id: wordData.id,
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
  console.log('word_data', word_data);
  console.log('status', status);
  console.log('updated_by', updated_by);
  console.log('word', word);
  
  const revWord = await updateDoc(word, {
    ...word_data, status, updated_at: Timestamp.now(), updated_by,
  });
  return revWord;
};

// get word from a list of word ids
export const getWordsByIdList = async (id_list: string[]) => {
  if (id_list && id_list.length > 0) {
    const q = query(wordsCollection, where(documentId(), 'in', id_list));
    const result = await getDocs(q);
    return result.docs;
  }
  return [];
};

// Sentences collection
export const sentencesCollection = collection(db, 'sentences');

export const addSentence = async (sentence_data: any) => {
  const newSentence = await addDoc(sentencesCollection, {
    ...sentence_data,
  });
  return newSentence.id;
};

export const updateSentence = async (sentence: DocumentReference, sentence_data: any) => {
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
  const q = query(sentencesCollection, where('word_id', '==', word_id));
  const querySnapshot = await getDocs(q).then((data) => {
    data.docs.forEach((sentenceData) => {
      if (sentenceData.data().word_id === word_id) {
        deleteDoc(sentenceData.ref);
      }
    });
  });
  return querySnapshot;
};

// Questions collection
export const questionsCollection = collection(db, 'questions');

export const addQuestion = async (question_data: any) => {
  const newQuestion = await addDoc(questionsCollection, {
    ...question_data,
  });
  return newQuestion.id;
};

export const updateQuestion = async (question: DocumentReference, question_data: any) => {
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
  const q = query(questionsCollection, where('word_id', '==', word_id));
  const querySnapshot = await getDocs(q).then((data) => {
    data.docs.forEach((questionData) => {
      if (questionData.data().word_id === word_id) {
        deleteDoc(questionData.ref);
      }
    });
  });
  return querySnapshot;
};

// Wordlists collection
export const wordlistsCollection = collection(db, 'wordlists');

export const addNewWordlist = async (wordlist_data: any) => {
  const newWordlist = await addDoc(wordlistsCollection, {
    ...wordlist_data,
  });
  return newWordlist.id;
};

export const getWordlist = async (wordlist_ref: DocumentReference) => {
  const gotWlist = await getDoc(wordlist_ref);
  return gotWlist;
};

export const updateWordlist = async (wordlist: DocumentReference, wordlist_data: any) => {
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
    const q = query(wordlistsCollection, where(documentId(), 'in', id_list));
    const result = await getDocs(q);
    return result.docs;
  }
  return [];
};

// get wordlists with a word id as a part of it
export const getWordlistsByWordId = async (word_id: string) => {
  const q = query(wordlistsCollection, where('words', 'array-contains', word_id));
  const result = await getDocs(q);
  return result.docs;
};

export const getWordsFromSupportWordIds = async (word_id: string, type: string) => {
  const q = query(wordsCollection, where(type, 'array-contains', word_id));
  const result = await getDocs(q);
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
  const res = await batch.commit();
  return res;
};

export const removeWordFromWordlists = async (word_id: string) => {
  const batch = writeBatch(firestore);
  await getWordlistsByWordId(word_id).then((ele) => {
    ele.map((val) => {
      const wlRef = doc(firestore, 'wordlists', val.id);
      batch.update(wlRef, {
        words: arrayRemove(word_id),
      });
      return null;
    });
  });
  const res = await batch.commit();
  return res;
};

export const removeWordFromSupport = async (word_id: string) => {
  const batch = writeBatch(firestore);
  await getWordsFromSupportWordIds(word_id, 'synonyms').then(async (syn) => {
    await getWordsFromSupportWordIds(word_id, 'antonyms').then((ant) => {
      const eleIds = syn.concat(ant);
      eleIds.map((val) => {
        const wordRef = doc(firestore, 'words', val.id);
        batch.update(wordRef, {
          synonyms: arrayRemove(word_id), antonyms: arrayRemove(word_id),
        });
        return null;
      });
    });
  });
  const res = await batch.commit();
  return res;
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
  const res = await batch.commit();
  return res;
};

export const createMultipleValsAtOnce = async (values: any[], collectionName: string) => {
  const batch = writeBatch(firestore);
  const valIdList = [] as string[];
  if (values.length > 0) {
    values.map((val: any) => {
      const valRef = doc(collection(firestore, collectionName));
      valIdList.push(valRef.id);
      batch.set(valRef, {
        ...val,
      });
      return null;
    });
  }
  const res = await batch.commit().then(() => valIdList);
  return res;
};
