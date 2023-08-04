/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Card, Button, Form,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DocumentData, QuerySnapshot, Timestamp, doc, getDoc, getDocs, onSnapshot, query, where,
} from 'firebase/firestore';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import { firestore } from '../../firebase';
import {
  NewSentenceType, MiniWord, NewWordType, Option, MiniWordlist, WordlistType, QuestionType,
} from '../../types';
import { useUserAuth } from '../UserAuthContext';
import {
  astatus, rstatus, cstatus, qtypes, STATUS,
} from '../constants';
import {
  addQuestion,
  addSentence,
  deleteQuestion,
  deleteSentence,
  getWordlistsByWordId,
  isWordNew,
  questionsCollection,
  sentencesCollection,
  setWordInWordlists,
  updateQuestion,
  updateSentence,
  updateWord,
  wordlistsCollection,
  wordsCollection,
  capitalize,
  createSupportWords,
  seperateIdsAndNewWords,
  setOptionsDataForSubmit,
  splitAndClear,
  splitAndCapitalize,
} from '../util';
import SupportWord from '../util/SupportWord';
import Options from '../util/Options';
import regex from '../constants/regex';
import roles from '../constants/roles';
import routes from '../constants/routes';
import PARTS_OF_SPEECH from '../constants/pos';

const EditWord = () => {
  const { wordid } = useParams();
  const { t } = useTranslation();
  const getWord = doc(firestore, `words/${wordid}`);
  // const getSentences = doc(firestore, `sentences`, );

  const [found, setFound] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [word, setWord] = useState<NewWordType>({
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
  });
  const [formValues, setFormValues] = useState({
  } as any);
  const [sentences, setSentences] = useState<NewSentenceType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [wordlists, setWordlists] = useState<WordlistType[]>([]);
  const [words, setWords] = useState<MiniWord[]>([]);
  const [synonyms, setSynonyms] = useState<MiniWord[]>([]);
  const [antonyms, setAntonyms] = useState<MiniWord[]>([]);
  const [support, setSupport] = useState<boolean>(false);
  const [selectedWordlists, setSelectedWordlists] = useState<MiniWordlist[]>([]);
  const [removedWordlists, setRemovedWordlists] = useState<MiniWordlist[]>([]);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useUserAuth();

  let status = [] as string[];
  if (user.role === roles.admin) {
    status = astatus;
  } else if (user.role === roles.reviewer) {
    status = rstatus;
  } else if (user.role === roles.creator) {
    status = cstatus;
  }

  useEffect(() => {
    let localWlist = [] as any;
    let localWords = [] as any;
    let localWordlists = [] as any;

    const fetchWords = async () => {
      setIsLoading(true);
      onSnapshot(wordsCollection, (snapshot: QuerySnapshot<DocumentData>) => {
        localWords = snapshot.docs.map((wordDoc) => ({
          id: wordDoc.id,
          word: wordDoc.data().word,
          translation: wordDoc.data().translation,
          value: wordDoc.id,
          label: `${wordDoc.data().word} (${wordDoc.data().translation.toLowerCase()})`,
        } as MiniWord));
        setWords(localWords);
      });

      onSnapshot(wordlistsCollection, (snapshot:
      QuerySnapshot<DocumentData>) => {
        localWordlists = snapshot.docs.map((wlDoc) => ({
          id: wlDoc.id,
          ...wlDoc.data(),
        }));
        setWordlists(localWordlists);
      });

      setIsLoading(false);
    };

    const fillFormValues = (wordElement: any) => {
      const formVal = {
      } as any;
      Object.keys(wordElement).forEach((key) => {
        formVal[key] = wordElement[key];
        (document.getElementById(key) as HTMLInputElement)?.setAttribute('value', wordElement[key]);
      });
      setFormValues(formVal);
    };

    const fetchWord = async () => {
      setIsLoading(true);
      const docSnap = await getDoc(getWord);
      if (docSnap.exists()) {
        const newWordObj = {
          id: docSnap.id,
          created_at: docSnap.data().created_at,
          updated_at: docSnap.data().updated_at,
          created_by: docSnap.data().created_by,
          updated_by: docSnap.data().updated_by,
          synonyms: docSnap.data().synonyms ?? [],
          antonyms: docSnap.data().antonyms ?? [],
          is_for_support: docSnap.data().is_for_support ?? false,
          ...docSnap.data(),
        };
        await getWordlistsByWordId(wordid ?? '').then((data) => {
          data.forEach((ele) => {
            localWlist = [...localWlist, {
              id: ele.id,
              name: ele.data().name,
            }];
          });
        });
        setWord(newWordObj);
        const synList = localWords.filter((obj: MiniWord) => newWordObj.synonyms.includes(obj.id));
        const antList = localWords.filter((obj: MiniWord) => newWordObj.antonyms.includes(obj.id));
        setSynonyms(synList);
        setAntonyms(antList);
        setSupport(newWordObj.is_for_support);
        setSelectedWordlists(localWlist);
        fillFormValues(newWordObj);
      } else {
        setFound(false);
      }
      setIsLoading(false);
    };

    const fetchSentence = async () => {
      setIsLoading(true);
      const q = query(sentencesCollection, where('word_id', '==', wordid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const newSentences = querySnapshot.docs.map((sentDoc) => ({
          id: sentDoc.id,
          ...sentDoc.data(),
        }));
        setSentences(newSentences);
      }
      setIsLoading(false);
    };

    const fetchQuestions = async () => {
      setIsLoading(true);
      const q = query(questionsCollection, where('word_id', '==', wordid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const newQuestions = querySnapshot.docs.map((quesDoc) => {
          const opt = quesDoc.data().options.map((ele: any) => {
            if (typeof ele === 'string') {
              const d = localWords.find((obj: MiniWord) => obj.word === ele || obj.id === ele);
              if (d) {
                return {
                  id: d.id,
                  option: d.word,
                  translation: d.translation,
                  label: `${d.word} (${d.translation.toLowerCase()})`,
                };
              }
              return undefined;
            }
            return ele;
          }).filter((ele: any) => ele !== undefined);
          return {
            ...quesDoc.data(),
            id: quesDoc.id,
            question: quesDoc.data().question,
            translation: quesDoc.data().translation ?? '',
            type: quesDoc.data().type,
            options: opt,
            answer: quesDoc.data().answer,
          };
        });
        setQuestions(newQuestions);
      }
      setIsLoading(false);
    };
    fetchWords();
    fetchWord().then(() => {
      fetchSentence();
      fetchQuestions();
    });
  }, []);

  const onSelect = (selectedList: [], selectedItem: any) => {
    if (removedWordlists.includes(selectedItem)) {
      const updatedRem = removedWordlists.filter((ele) => ele !== selectedItem);
      setRemovedWordlists(updatedRem);
    }
    setSelectedWordlists(selectedList);
  };

  const onRemove = (selectedList: [], removedItem: any) => {
    setSelectedWordlists(selectedList);
    const newRem = [...removedWordlists, removedItem];
    setRemovedWordlists(newRem);
  };

  const addNewSentence = (e: any) => {
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

  const removeSentence = (idx: number, e: any) => {
    e.preventDefault();

    if (sentences[idx].word_id || sentences[idx].id) {
      const response = window.confirm(`Are you sure you to delete this sentence: ${sentences[idx].sentence} for word: ${word.word}? \n This action is not reversible.`);

      if (response) {
        const getSentence = doc(firestore, `sentences/${sentences[idx].id}`);
        deleteSentence(getSentence);
      }
    }

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
  };

  const changeSentence = (event: any) => {
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

  const addNewQuestion = (e: any) => {
    e.preventDefault();
    setQuestions((prevQuestions) => [
      ...prevQuestions,
      {
        question: '',
        translation: '',
        type: 'context',
        options: [],
        answer: 0,
        word_id: '',
      },
    ]);
  };

  const removeQuestion = (idx: number, e: any) => {
    e.preventDefault();

    if (questions[idx].word_id) {
      const response = window.confirm(`Are you sure you to delete this question: ${questions[idx].question} for word: ${word.word}? \n This action is not reversible.`);

      if (response) {
        const getQuestion = doc(firestore, `questions/${questions[idx].id}`);
        deleteQuestion(getQuestion);
      }
    }

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
  };

  const changeQuestion = (event: any) => {
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

  const changeQOptions = (id: string, optionData: any, type = '') => {
    const typo = (type as any)?.value;
    // event.preventDefault()
    const updatedQuestions = questions.map((question, qidx) => {
      if (parseInt(id.split('options')[1], 10) !== qidx) {
        return question;
      }
      if (optionData[optionData.length - 1].option && optionData[optionData.length - 1].option.includes(' ') && typo !== 'meaning') {
        alert('Option cannot contain spaces!');
        return question;
      }
      return {
        ...question, options: optionData,
      };
    });
    setQuestions(updatedQuestions);
  };

  const resetState = () => {
    setSentences([]);
    setQuestions([]);
    setValidated(false);
  };

  const handleChange = (e: any) => {
    setFormValues({
      ...formValues, [e.target.id]: e.target.value,
    });
  };

  const handleSupport = (e: any) => {
    e.persist();
    setSupport(e.target.checked);
  };

  const editWord = async (formData: any) => {
    setIsLoading(true);
    const { fSentences, fQuestions, ...form } = formData;

    const wordIsNew = await isWordNew(form.word, wordid);
    if (wordIsNew) {
      updateWord(
        getWord,
        {
          word: form.word,
          translation: form.translation,
          meaning_punjabi: form.meaning_punjabi ?? '',
          meaning_english: form.meaning_english ?? '',
          part_of_speech: form.part_of_speech ?? '',
          synonyms: form.synonyms,
          antonyms: form.antonyms,
          images: splitAndClear(form.images) ?? [],
          status: form.status ?? STATUS.CREATING_ENGLISH,
          created_at: word.created_at ?? Timestamp.now(),
          updated_at: Timestamp.now(),
          created_by: form.created_by ?? user.email,
          updated_by: user.email ?? '',
          notes: form.notes ?? '',
          is_for_support: form.is_for_support ?? false,
        },
      )
        .then(() => {
        // use return value of addWord to add sentences
          fSentences.forEach((sentence: any) => {
            const lSentence = {
              ...sentence, word_id: wordid,
            };
            if (sentence.id === undefined) {
              addSentence(lSentence);
            } else {
              const getSentence = doc(firestore, `sentences/${sentence.id}`);
              updateSentence(getSentence, {
                ...lSentence,
              });
            }
          });

          fQuestions.forEach((question: any) => {
            const lQuestion = {
              ...question,
              translation: question.translation ?? '',
              options: question.options ?? [],
              type: question.type ?? 'context',
              word_id: wordid,
            };
            if (question.id === undefined) {
              addQuestion(lQuestion);
            } else {
              const getQuestion = doc(firestore, `questions/${question.id}`);
              updateQuestion(getQuestion, lQuestion);
            }
          });
        }).finally(() => {
          setIsLoading(false);
        });

      resetState();
      setSubmitted(true);
    } else {
      alert('Word already exists!');
      setIsLoading(false);
    }
  };

  const sendForReview = (e: any, type = 'review') => {
    e.preventDefault();
    e.stopPropagation();

    const { form } = e.target;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    const formData = {
    } as any;
    Object.keys(formValues).map((ele) => {
      if (!ele.match(/sentence\d+/)
          && !ele.match(/translation\d+/)
          && !ele.match(/question\d+/)
          && !ele.match(/type\d+/)
          && !ele.match(/options\d+/)
          && !ele.match(/answer\d+/)) {
        formData[ele] = formValues[ele];
      }
      return null;
    });

    formData.fSentences = sentences;
    formData.fQuestions = questions.map((ele) => ({
      ...ele,
      options: (ele.options as MiniWord[]).map((opt) => opt.id),
    }));
    formData.is_for_support = support;

    const [uniqueSyn, synIds] = seperateIdsAndNewWords(synonyms);
    const [uniqueAnt, antIds] = seperateIdsAndNewWords(antonyms);

    createSupportWords(uniqueSyn, user).then((synIdlist) => {
      createSupportWords(uniqueAnt, user).then((antIdList) => {
        const synArr = synIds.concat(synIdlist);
        const antArr = antIds.concat(antIdList);

        formData.synonyms = synArr;
        formData.antonyms = antArr;
        formData.part_of_speech = formData.part_of_speech ?? PARTS_OF_SPEECH.NOUN;
        if (word.status) {
          if (type === 'review') {
            if ([STATUS.CREATING_ENGLISH, STATUS.FEEDBACK_ENGLISH].includes(word.status)) {
              formData.status = STATUS.REVIEW_ENGLISH;
            } else if ([STATUS.CREATING_PUNJABI, STATUS.FEEDBACK_PUNJABI].includes(word.status)) {
              formData.status = STATUS.REVIEW_FINAL;
            }
          } else if (type === 'approve') {
            if (word.status === STATUS.REVIEW_ENGLISH) {
              formData.status = STATUS.CREATING_PUNJABI;
            } else if (word.status === STATUS.REVIEW_FINAL) {
              formData.status = STATUS.ACTIVE;
            }
          }
        } else {
          formData.status = STATUS.REVIEW_ENGLISH;
        }

        // make list of docRefs from selectedWordlists
        formData.wordlists = selectedWordlists.map((docu) => docu.id);
        editWord(formData);
      });
    });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    const formData = {
    } as any;
    Object.keys(formValues).map((ele) => {
      if (!ele.match(/sentence\d+/) && !ele.match(/translation\d+/) && !ele.match(/question\d+/) && !ele.match(/qtranslation\d+/) && !ele.match(/type\d+/) && !ele.match(/options\d+/) && !ele.match(/answer\d+/)) {
        formData[ele] = formValues[ele];
      }
      return null;
    });

    formData.fSentences = sentences;
    formData.fQuestions = setOptionsDataForSubmit(questions);
    formData.is_for_support = support;

    const [uniqueSyn, synIds] = seperateIdsAndNewWords(synonyms);
    const [uniqueAnt, antIds] = seperateIdsAndNewWords(antonyms);

    createSupportWords(uniqueSyn, user).then((synIdlist) => {
      createSupportWords(uniqueAnt, user).then((antIdList) => {
        const synArr = synIds.concat(synIdlist);
        const antArr = antIds.concat(antIdList);

        formData.synonyms = synArr;
        formData.antonyms = antArr;
        formData.part_of_speech = formData.part_of_speech ?? PARTS_OF_SPEECH.NOUN;
        formData.status = formData.status ?? STATUS.CREATING_ENGLISH;

        // make list of docRefs from selectedWordlists
        formData.wordlists = selectedWordlists.map((docu) => docu.id);
        setWordInWordlists(selectedWordlists, removedWordlists, wordid as string);
        editWord(formData);
      });
    });
  };

  const navigate = useNavigate();

  if (isLoading) {
    return <h2>{t('LOADING')}</h2>;
  }
  if (!found) {
    return <h2>{t('NOT_FOUND', { what: t('WORD') })}</h2>;
  }
  if (!status.includes(word.status ?? STATUS.CREATING_ENGLISH)) { navigate(-1); }
  return (
    <div className="d-flex flex-column justify-content-center align-items-center background">
      <h2>{t('EDIT_TEXT', { for: t('WORD') })}</h2>
      <Form className="rounded p-4 p-sm-3" hidden={submitted} noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="word" onChange={handleChange}>
          <Form.Label>{t('WORD')}</Form.Label>
          <Form.Control type="text" placeholder="ਸ਼ਬਦ" pattern={regex.gurmukhiWordRegex} defaultValue={word.word} required />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_GURMUKHI', { for: 'a word' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="translation" onChange={handleChange}>
          <Form.Label>{t('TRANSLATION')}</Form.Label>
          <Form.Control type="text" placeholder="Enter translation" pattern={regex.translationRegex} defaultValue={word.translation} required />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_ENGLISH', { for: 'translation' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="meaning_punjabi" onChange={handleChange}>
          <Form.Label>{t('MEANING_PUNJABI')}</Form.Label>
          <Form.Control type="text" placeholder="ਇੱਥੇ ਅਰਥ ਦਰਜ ਕਰੋ" pattern={regex.gurmukhiSentenceRegex} defaultValue={word.meaning_punjabi} />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_GURMUKHI', { for: 'meaning' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="meaning_english" onChange={handleChange}>
          <Form.Label>{t('MEANING_ENGLISH')}</Form.Label>
          <Form.Control type="text" placeholder="Enter meaning" pattern={regex.translationRegex} defaultValue={word.meaning_english} />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_ENGLISH', { for: 'meaning' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="part_of_speech" onChange={handleChange}>
          <Form.Label>{t('PART_OF_SPEECH')}</Form.Label>
          <Form.Select aria-label="Choose part of speech" defaultValue={word.part_of_speech ?? PARTS_OF_SPEECH.NOUN}>
            {Object.values(PARTS_OF_SPEECH).map((ele) => (
              <option key={ele} value={ele}>{capitalize(ele)}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="synonyms" onChange={handleChange}>
          <SupportWord id="synonyms" name="Synonyms" word={synonyms} setWord={setSynonyms} words={words.filter((val) => val.id !== wordid)} type="synonyms" placeholder="ਸਮਾਨਾਰਥਕ ਸ਼ਬਦ" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="antonyms" onChange={handleChange}>
          <SupportWord id="antonyms" name="Antonyms" word={antonyms} setWord={setAntonyms} words={words.filter((val) => val.id !== wordid)} type="antonyms" placeholder="ਵਿਰੋਧੀ ਸ਼ਬਦ" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="images" onChange={handleChange}>
          <Form.Label>{t('IMAGES')}</Form.Label>
          <Form.Control type="text" placeholder="imgUrl1, imgUrl2, ..." defaultValue={word.images} />
        </Form.Group>

        <Form.Group className="mb-3" controlId="words">
          <Form.Label>{t('CHOOSE_WORDLIST')}</Form.Label>
          <Multiselect
            options={wordlists}
            displayValue="name"
            showCheckbox
            onSelect={onSelect}
            onRemove={onRemove}
            selectedValues={selectedWordlists}
          />
        </Form.Group>

        <Form.Group className="mb-3" onChange={handleChange}>
          <Form.Label
            className="d-flex flex-row align-items-center justify-content-between w-100"
          >
            <h5>{t('SENTENCES')}</h5>
            <div
              className="d-flex align-items-center"
            >
              <button type="button" className="btn btn-sm" onClick={addNewSentence}>➕</button>
            </div>
          </Form.Label>
          {sentences && sentences.length ? sentences.map((sentence, idx) => (
            <div
              key={idx}
              className="d-flex flex-column justify-content-between mb-3"
            >
              <div className="d-flex justify-content-between align-items-center">
                <b>{t('SENTENCE_WITH_NUM', { num: idx + 1 })}</b>
                <button type="button" className="btn btn-sm" onClick={(e) => removeSentence(idx, e)}>🗑️</button>
              </div>
              <div>
                {t('SENTENCE')}
                <Form.Control id={`sentence${idx}`} className="m-1" type="text" value={sentence.sentence} placeholder="ਇੱਥੇ ਵਾਕ ਦਰਜ ਕਰੋ" onChange={(e) => changeSentence(e)} pattern={regex.gurmukhiSentenceRegex} required />
                <Form.Control.Feedback type="invalid" itemID={`sentence${idx}`}>
                  {t('FEEDBACK_GURMUKHI', { for: 'sentence' })}
                </Form.Control.Feedback>
                <br />

                {t('TRANSLATION')}
                <Form.Control id={`translation${idx}`} className="m-1" type="text" value={sentence.translation} placeholder="Enter translation" onChange={(e) => changeSentence(e)} pattern={regex.translationRegex} required />
                <Form.Control.Feedback type="invalid" itemID={`translation${idx}`}>
                  {t('FEEDBACK_ENGLISH', { for: 'translation' })}
                </Form.Control.Feedback>
              </div>
              <hr />
            </div>
          )) : null}
        </Form.Group>

        <Form.Group className="mb-3" onChange={handleChange}>
          <Form.Label
            className="d-flex flex-row align-items-center justify-content-between w-100"
          >
            <h5>{t('QUESTIONS')}</h5>
            <div
              className="d-flex align-items-center"
            >
              <button
                type="button"
                className="btn btn-sm"
                onClick={addNewQuestion}
              >
                {t('PLUS')}
              </button>
            </div>
          </Form.Label>
          {questions && questions.length ? questions.map((question, idx) => (
            <div
              key={idx}
              className="d-flex flex-column justify-content-between"
            >
              <div className="d-flex justify-content-between align-items-center">
                <b>{t('QUESTION_WITH_NUM', { num: idx + 1 })}</b>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => removeQuestion(idx, e)}
                >
                  {t('BIN')}
                </button>
              </div>
              <div>
                <Form.Label>{t('QUESTION')}</Form.Label>
                <Form.Control id={`question${idx}`} className="m-1" type="text" value={question.question} placeholder="ਇੱਥੇ ਸਵਾਲ ਦਰਜ ਕਰੋ" onChange={(e) => changeQuestion(e)} pattern={regex.gurmukhiQuestionRegex} required />
                <Form.Control.Feedback type="invalid" itemID={`question${idx}`}>
                  {t('FEEDBACK_GURMUKHI', { for: 'question' })}
                </Form.Control.Feedback>
                <br />

                <Form.Label>{t('TRANSLATION')}</Form.Label>
                <Form.Control id={`qtranslation${idx}`} className="m-1" type="text" value={question.translation} placeholder="Enter english translation of question" onChange={(e) => changeQuestion(e)} pattern={regex.englishQuestionTranslationRegex} />
                <Form.Control.Feedback type="invalid" itemID={`qtranslation${idx}`}>
                  {t('FEEDBACK_ENGLISH', { for: 'translation' })}
                </Form.Control.Feedback>
                <br />

                <Form.Label>{t('TYPE')}</Form.Label>
                <Form.Select aria-label="Default select example" id={`type${idx}`} value={question.type ?? 'context'} onChange={(e) => changeQuestion(e)}>
                  {Object.values(qtypes).map((ele) => (
                    <option key={ele} value={ele}>{ele}</option>
                  ))}
                </Form.Select>

                <Options id={`options${idx}`} name="Options" word={question.options as Option[]} setWord={changeQOptions} words={words} placeholder="ਜਵਾਬ" type={(document.getElementById(`type${idx}`) as any)} />
                <Form.Control.Feedback type="invalid" itemID={`options${idx}`}>
                  {t('FEEDBACK', { for: 'options' })}
                </Form.Control.Feedback>

                <Form.Label>{t('ANSWER')}</Form.Label>
                <Form.Select id={`answer${idx}`} value={question.answer} onChange={(e) => changeQuestion(e)} required>
                  {(question.options as Option[]).map((ele, i) => (
                    <option key={`${ele.option}${i}`} value={i}>{ele.option}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid" itemID={`answer${idx}`}>
                  {t('FEEDBACK', { for: 'answer' })}
                </Form.Control.Feedback>
              </div>
              <hr />
            </div>
          )) : null}
          <Button className="btn btn-sm" onClick={addNewQuestion}>{t('ADD_NEW', { what: t('QUESTION') })}</Button>
        </Form.Group>

        <Form.Group className="mb-3" controlId="notes" onChange={handleChange}>
          <Form.Label>{t('NOTES')}</Form.Label>
          <Form.Control as="textarea" rows={3} placeholder="Enter notes" defaultValue={word.notes} />
        </Form.Group>

        <div className="d-flex justify-content-between align-items-center">
          <Form.Group className="mb-3" controlId="status" onChange={handleChange}>
            <Form.Label>{t('STATUS')}</Form.Label>
            <Form.Select aria-label="Default select example">
              {status.map((ele) => {
                const value = splitAndCapitalize(ele);
                return (
                  <option
                    key={ele + value.toString()}
                    value={ele}
                    selected={ele === word.status}
                  >
                    {value}
                  </option>
                );
              })}
            </Form.Select>
          </Form.Group>
          <Form.Check
            reverse
            id="is_for_support"
            type="switch"
            checked={support}
            onChange={handleSupport}
            label="Is this word a synonym/antonym for another word and doesn't have its own data?"
          />
        </div>

        <div className="d-flex justify-content-around">
          <Button variant="primary" type="submit">
            Submit
          </Button>
          {word.status && cstatus.includes(word.status)
            ? (
              <Button variant="primary" type="button" onClick={(e) => sendForReview(e)}>
                {t('SEND_FOR_REVIEW')}
              </Button>
            )
            : null}
          {word.status && [
            roles.reviewer,
            roles.admin,
          ].includes(user.role) && [
            STATUS.REVIEW_ENGLISH,
            STATUS.REVIEW_FINAL,
          ].includes(word.status)
            ? (
              <Button variant="primary" type="button" onClick={(e) => sendForReview(e, 'approve')}>
                {t('APPROVE')}
              </Button>
            )
            : null }
        </div>
      </Form>
      {submitted ? (
        <Card className="d-flex justify-content-center align-items-center background mt-4">
          <Card.Body className="rounded p-4 p-sm-3">
            <h3>{t('SUCCESS_UPDATE', { for: t('WORD') })}</h3>
            <Button variant="primary" onClick={() => navigate(routes.words)}>{t('BACK_TO', { page: 'words' })}</Button>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
};

export default EditWord;
