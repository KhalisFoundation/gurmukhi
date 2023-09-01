/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Card, Button, Form,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DocumentData, QuerySnapshot, doc, getDoc, getDocs, onSnapshot, query, where,
} from 'firebase/firestore';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import { firestore } from '../../firebase';
import {
  SentenceType, MiniWord, NewWordType, Option, MiniWordlist, WordlistType, QuestionType,
} from '../../types';
import { useUserAuth } from '../UserAuthContext';
import {
  astatus, rstatus, qtypes, STATUS, cstatus, cstatus2,
} from '../constants';
import {
  getWordlistsByWordId,
  isWordNew,
  questionsCollection,
  sentencesCollection,
  setWordInWordlists,
  wordlistsCollection,
  wordsCollection,
  capitalize,
  setOptionsDataForSubmit,
  splitAndCapitalize,
  hasValidOptions,
} from '../util';
import SupportWord from '../util/SupportWord';
import Options from '../util/Options';
import regex from '../constants/regex';
import roles from '../constants/roles';
import routes from '../constants/routes';
import PARTS_OF_SPEECH from '../constants/pos';
import SUBMIT_TYPE from '../constants/submit';
import {
  addNewQuestion,
  addNewSentence,
  changeQuestion,
  changeSentence,
  createWordData,
  removeQuestion,
  removeSentence,
  saveWord,
} from '../util/words';

const EditWord = () => {
  const { wordid: wordId } = useParams();
  const { t } = useTranslation();
  const getWord = doc(firestore, `words/${wordId}`);
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
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [words, setWords] = useState<MiniWord[]>([]);
  const [wordlists, setWordlists] = useState<WordlistType[]>([]);
  const [synonyms, setSynonyms] = useState<MiniWord[]>([]);
  const [antonyms, setAntonyms] = useState<MiniWord[]>([]);
  const [support, setSupport] = useState<boolean>(false);
  const [selectedWordlists, setSelectedWordlists] = useState<MiniWordlist[]>([]);
  const [removedWordlists, setRemovedWordlists] = useState<MiniWordlist[]>([]);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useUserAuth();
  
  let statuses = [] as string[];
  let editable = [] as string[];
  if (user.role === roles.admin) {
    statuses = astatus;
    editable = astatus;
  } else if (user.role === roles.reviewer) {
    statuses = rstatus;
    editable = rstatus;
  } else if (user.role === roles.creator) {
    editable = cstatus;
    statuses = cstatus2;
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
        await getWordlistsByWordId(wordId ?? '').then((data) => {
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
      const q = query(sentencesCollection, where('word_id', '==', wordId));
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
      const q = query(questionsCollection, where('word_id', '==', wordId));
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


  const changeQOptions = (id: string, optionData: any, type = '') => {
    const typo = (type as any)?.value;
    // event.preventDefault()
    const updatedQuestions = questions.map((question, qidx) => {
      if (parseInt(id.split('options')[1], 10) !== qidx) {
        return question;
      }
      if (optionData[optionData.length - 1].option && optionData[optionData.length - 1].option.includes(' ') && typo !== qtypes.MEANING) {
        alert(t('OPTION_NO_SPACES'));
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
    saveWord(formData, SUBMIT_TYPE.EDIT, user, word, getWord, wordId).finally(() => {
      setIsLoading(false);
    });

    resetState();
    setSubmitted(true);
  };

  const handleSubmit = async (e: any, type: string = SUBMIT_TYPE.CREATE) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    const form = type === SUBMIT_TYPE.APPROVE ? e.target.form : e.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      setIsLoading(false);
      return;
    }

    const formData = {
    } as any;
    Object.keys(formValues).forEach((ele) => {
      if (!ele.match(/sentence\d+/) && !ele.match(/translation\d+/) && !ele.match(/question\d+/) && !ele.match(/qtranslation\d+/) && !ele.match(/type\d+/) && !ele.match(/options\d+/) && !ele.match(/answer\d+/)) {
        formData[ele] = formValues[ele];
      }
    });

    if (synonyms.includes(formData.word) || antonyms.includes(formData.word)) {
      alert(t('WORD_CANNOT_BE_OWN'));
      setIsLoading(false);
      return;
    }

    const wordIsNew = await isWordNew(formData.word, wordId);
    if (!wordIsNew) {
      alert(t('WORD_ALREADY_EXISTS'));
      setIsLoading(false);
    } else {
      const validOptions = hasValidOptions(questions);
      if (!validOptions) {
        alert(t('ALERT_QUESTION_OPTIONS'));
        setIsLoading(false);
      } else {
        formData.sentences = sentences ?? [];
        formData.questions = setOptionsDataForSubmit(questions);
        formData.is_for_support = support;
        await createWordData(formData, synonyms, antonyms, user, type, word.status).then((wordData) => {
          wordData.wordlists = selectedWordlists.map((docu) => docu.id);
          setWordInWordlists(selectedWordlists, removedWordlists, wordId as string);
          editWord(wordData);
        });
      }
    }
  };

  const handleApprove = async (e: any) => {
    handleSubmit(e, SUBMIT_TYPE.APPROVE);
  };

  const navigate = useNavigate();

  if (isLoading) {
    return <h2>{t('LOADING')}</h2>;
  }
  if (!found) {
    return <h2>{t('NOT_FOUND', { what: t('WORD') })}</h2>;
  }
  if (!editable.includes(word.status ?? STATUS.CREATING_ENGLISH)) { navigate(-1); }
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
          <SupportWord id="synonyms" name="Synonyms" word={synonyms} setWord={setSynonyms} words={words.filter((val) => val.id !== wordId)} type="synonyms" placeholder="ਸਮਾਨਾਰਥਕ ਸ਼ਬਦ" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="antonyms" onChange={handleChange}>
          <SupportWord id="antonyms" name="Antonyms" word={antonyms} setWord={setAntonyms} words={words.filter((val) => val.id !== wordId)} type="antonyms" placeholder="ਵਿਰੋਧੀ ਸ਼ਬਦ" />
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
              <button type="button" className="btn btn-sm" onClick={(e) => addNewSentence(e, setSentences)}>{t('PLUS')}</button>
            </div>
          </Form.Label>
          {sentences && sentences.length ? sentences.map((sentence, idx) => (
            <div
              key={idx}
              className="d-flex flex-column justify-content-between mb-3"
            >
              <div className="d-flex justify-content-between align-items-center">
                <b>{t('SENTENCE_WITH_NUM', { num: idx + 1 })}</b>
                <button type="button" className="btn btn-sm" onClick={(e) => removeSentence(idx, e, t, sentences, setSentences, formValues, setFormValues, 'edit', word.word)}>{t('BIN')}</button>
              </div>
              <div>
                {t('SENTENCE')}
                <Form.Control id={`sentence${idx}`} className="m-1" type="text" value={sentence.sentence} placeholder="ਇੱਥੇ ਵਾਕ ਦਰਜ ਕਰੋ" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.gurmukhiSentenceRegex} />
                <Form.Control.Feedback type="invalid" itemID={`sentence${idx}`}>
                  {t('FEEDBACK_GURMUKHI', { for: 'sentence' })}
                </Form.Control.Feedback>
                <br />

                {t('TRANSLATION')}
                <Form.Control id={`translation${idx}`} className="m-1" type="text" value={sentence.translation} placeholder="Enter translation" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.translationRegex} required />
                <Form.Control.Feedback type="invalid" itemID={`translation${idx}`}>
                  {t('FEEDBACK_ENGLISH', { for: 'translation' })}
                </Form.Control.Feedback>
              </div>
              <hr />
            </div>
          )) : null}
          <Button className="btn btn-sm" onClick={(e) => addNewSentence(e, setSentences)}>{t('ADD_NEW', { what: t('SENTENCE') })}</Button>
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
                onClick={(e) => addNewQuestion(e, setQuestions)}
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
                  onClick={(e) => removeQuestion(idx, e, t, questions, setQuestions, formValues, setFormValues, 'edit', word.word)}
                >
                  {t('BIN')}
                </button>
              </div>
              <div>
                <Form.Label>{t('QUESTION')}</Form.Label>
                <Form.Control id={`question${idx}`} className="m-1" type="text" value={question.question} placeholder="ਇੱਥੇ ਸਵਾਲ ਦਰਜ ਕਰੋ" onChange={(e) => changeQuestion(e, questions, setQuestions)} pattern={regex.gurmukhiQuestionRegex} required />
                <Form.Control.Feedback type="invalid" itemID={`question${idx}`}>
                  {t('FEEDBACK_GURMUKHI', { for: 'question' })}
                </Form.Control.Feedback>
                <br />

                <Form.Label>{t('TRANSLATION')}</Form.Label>
                <Form.Control id={`qtranslation${idx}`} className="m-1" type="text" value={question.translation} placeholder="Enter english translation of question" onChange={(e) => changeQuestion(e, questions, setQuestions)} pattern={regex.englishQuestionTranslationRegex} />
                <Form.Control.Feedback type="invalid" itemID={`qtranslation${idx}`}>
                  {t('FEEDBACK_ENGLISH', { for: 'translation' })}
                </Form.Control.Feedback>
                <br />

                <Form.Label>{t('TYPE')}</Form.Label>
                <Form.Select aria-label="Default select example" id={`type${idx}`} value={question.type ?? 'context'} onChange={(e) => changeQuestion(e, questions, setQuestions)}>
                  {Object.values(qtypes).map((ele) => (
                    <option key={ele} value={ele}>{ele}</option>
                  ))}
                </Form.Select>

                <Options id={`options${idx}`} name="Options" word={question.options as Option[]} setWord={changeQOptions} words={words} placeholder="ਜਵਾਬ" type={(document.getElementById(`type${idx}`) as any)} />
                <Form.Control.Feedback type="invalid" itemID={`options${idx}`}>
                  {t('FEEDBACK', { for: 'options' })}
                </Form.Control.Feedback>

                <Form.Label>{t('ANSWER')}</Form.Label>
                <Form.Select id={`answer${idx}`} value={question.answer} onChange={(e) => changeQuestion(e, questions, setQuestions)} required>
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
          <Button className="btn btn-sm" onClick={(e) => addNewQuestion(e, setQuestions)}>{t('ADD_NEW', { what: t('QUESTION') })}</Button>
        </Form.Group>

        <Form.Group className="mb-3" controlId="notes" onChange={handleChange}>
          <Form.Label>{t('NOTES')}</Form.Label>
          <Form.Control as="textarea" rows={3} placeholder="Enter notes" defaultValue={word.notes} />
        </Form.Group>

        <div className="d-flex justify-content-between align-items-center">
          <Form.Group className="mb-3" controlId="status" onChange={handleChange}>
            <Form.Label>{t('STATUS')}</Form.Label>
            <Form.Select aria-label="Default select example">
              {statuses.map((ele) => {
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
            label={t('SUPPORT_LABEL')}
          />
        </div>

        <div className="d-flex justify-content-around">
          <Button variant="primary" type="submit">
            {t('SUBMIT')}
          </Button>
          {word.status && [
            roles.reviewer,
            roles.admin,
          ].includes(user.role) && [
            STATUS.REVIEW_ENGLISH,
            STATUS.REVIEW_FINAL,
          ].includes(word.status)
            ? (
              <Button variant="primary" type="button" onClick={handleApprove}>
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
