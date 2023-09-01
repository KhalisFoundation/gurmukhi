import React, { useEffect, useState } from 'react';
import {
  Card, Button, Form,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  DocumentData, DocumentReference, QuerySnapshot, onSnapshot,
} from 'firebase/firestore';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import { SentenceType } from '../../types/sentence';
import {
  QuestionType, WordlistType, MiniWord, Option,
} from '../../types';
import { useUserAuth } from '../UserAuthContext';
import {
  STATUS,
  astatus, cstatus2, qtypes, rstatus,
} from '../constants';
import {
  isWordNew,
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

const AddWord = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formValues, setFormValues] = useState({
  } as any);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [words, setWords] = useState<MiniWord[]>([]);
  const [wordlists, setWordlists] = useState<WordlistType[]>([]);
  const [synonyms, setSynonyms] = useState<MiniWord[]>([]);
  const [antonyms, setAntonyms] = useState<MiniWord[]>([]);
  const [selectedWordlists, setSelectedWordlists] = useState<DocumentReference[]>([]);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useUserAuth();

  let status = [] as string[];
  if (user.role === roles.admin) {
    status = astatus;
  } else if (user.role === roles.reviewer) {
    status = rstatus;
  } else if (user.role === roles.creator) {
    status = cstatus2;
  }

  useEffect(() => {
    setIsLoading(true);
    onSnapshot(wordsCollection, (snapshot: QuerySnapshot<DocumentData>) => {
      setWords(snapshot.docs.map((doc) => ({
        id: doc.id,
        word: doc.data().word,
        translation: doc.data().translation,
        value: doc.id,
        label: `${doc.data().word} (${doc.data().translation.toLowerCase()})`,
      })));
    });

    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    onSnapshot(wordlistsCollection, (snapshot:
    QuerySnapshot<DocumentData>) => {
      setWordlists(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
    });

    setIsLoading(false);
  }, []);

  const onChangeWlist = (selectedList: []) => {
    setSelectedWordlists(selectedList);
  };

  const removeAllSentences = (e:any) => {
    e.preventDefault();
    setSentences([]);
    const newSFormValues = {
    } as any;
    Object.keys(formValues).forEach((key) => {
      if (!key.match(/sentence\d+/) && !key.match(/translation\d+/)) {
        newSFormValues[key] = formValues[key];
      }
    });
    setFormValues(newSFormValues);
  };

  const removeAllQuestions = (e:any) => {
    e.preventDefault();
    setQuestions([]);
    const newSFormValues = {
    } as any;
    Object.keys(formValues).forEach((key) => {
      if (!key.match(/question\d+/) && !key.match(/type\d+/) && !key.match(/options\d+/) && !key.match(/answer\d+/)) {
        newSFormValues[key] = formValues[key];
      }
    });
    setFormValues(newSFormValues);
  };

  const changeQOptions = (id: string, optionData: any) => {
    // event.preventDefault()
    const updatedQuestions = questions.map((question, qidx) => {
      if (parseInt(id.split('options')[1], 10) !== qidx) {
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
    setFormValues({
      ...formValues, [e.target.id]: e.target.checked,
    });
  };

  const addNewWord = async (formData: any) => {
    saveWord(formData, SUBMIT_TYPE.CREATE, user).finally(() => {
      setIsLoading(false);
    });

    resetState();
    setSubmitted(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (formValues.status.includes('review')) {
      const response = confirm(t('CONFIRM_REVIEW'));
      if (!response) {
        setIsLoading(false);
        return;
      } else {
        setIsLoading(true);
      }
    }

    const form = e.currentTarget;
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

    const wordIsNew = await isWordNew(formData.word);
    if (!wordIsNew) {
      alert(t('WORD_ALREADY_EXISTS'));
      setIsLoading(false);
    } else {
      const validOptions = hasValidOptions(questions);
      if (!validOptions) {
        alert(t('ALERT_QUESTION_OPTIONS'));
        setIsLoading(false);
      } else {
        formData.sentences = sentences;
        formData.questions = setOptionsDataForSubmit(questions);
        await createWordData(formData, synonyms, antonyms, user).then((wordData) => {
          wordData.wordlists = selectedWordlists.map((docu) => docu.id);
          addNewWord(wordData);
        });
      }
    }
  };

  const unsetSubmitted = () => {
    setSubmitted(false);
    // refresh page
    window.location.reload();
  };

  const navigate = useNavigate();

  if (isLoading) {
    return <h2>{t('LOADING')}</h2>;
  }
  return (
    <div className="d-flex flex-column justify-content-center align-items-center background">
      <h2>{t('ADD_NEW', { what: t('WORD') })}</h2>
      <Form className="rounded p-4 p-sm-3" hidden={submitted} noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="word" onChange={handleChange}>
          <Form.Label>{t('WORD')}</Form.Label>
          <Form.Control type="text" placeholder="ਸ਼ਬਦ" pattern={regex.gurmukhiWordRegex} required />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_GURMUKHI', { for: 'a word' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="translation" onChange={handleChange}>
          <Form.Label>{t('TRANSLATION')}</Form.Label>
          <Form.Control type="text" placeholder="Enter translation" pattern={regex.translationRegex} required />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_ENGLISH', { for: 'translation' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="meaning_punjabi" onChange={handleChange}>
          <Form.Label>{t('MEANING_PUNJABI')}</Form.Label>
          <Form.Control type="text" placeholder="ਇੱਥੇ ਅਰਥ ਦਰਜ ਕਰੋ" pattern={regex.gurmukhiSentenceRegex} />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_GURMUKHI', { for: 'meaning' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="meaning_english" onChange={handleChange}>
          <Form.Label>{t('MEANING_ENGLISH')}</Form.Label>
          <Form.Control type="text" placeholder="Enter meaning" pattern={regex.translationRegex} />
          <Form.Control.Feedback type="invalid">
            {t('FEEDBACK_ENGLISH', { for: 'meaning' })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="part_of_speech" onChange={handleChange}>
          <Form.Label>{t('PART_OF_SPEECH')}</Form.Label>
          <Form.Select aria-label="Choose part of speech" defaultValue={PARTS_OF_SPEECH.NOUN}>
            {Object.values(PARTS_OF_SPEECH).map((ele) => (
              <option key={ele} value={ele}>{capitalize(ele)}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="synonyms" onChange={handleChange}>
          <SupportWord id="synonyms" name="Synonyms" word={synonyms} setWord={setSynonyms} words={words} type="synonyms" placeholder="ਸਮਾਨਾਰਥਕ ਸ਼ਬਦ" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="antonyms" onChange={handleChange}>
          <SupportWord id="antonyms" name="Antonyms" word={antonyms} setWord={setAntonyms} words={words} type="antonyms" placeholder="ਵਿਰੋਧੀ ਸ਼ਬਦ" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="images" onChange={handleChange}>
          <Form.Label>{t('IMAGES')}</Form.Label>
          <Form.Control type="text" placeholder="imgUrl1, imgUrl2, ..." />
        </Form.Group>

        <Form.Group className="mb-3" controlId="words">
          <Form.Label>{t('CHOOSE_WORDLIST')}</Form.Label>
          <Multiselect
            options={wordlists}
            displayValue="name"
            showCheckbox
            onSelect={onChangeWlist}
            onRemove={onChangeWlist}
          />
        </Form.Group>

        <Form.Group onChange={handleChange}>
          <Form.Label
            className="d-flex flex-row align-items-center justify-content-between w-100"
          >
            <p>{t('SENTENCES')}</p>
            <div
              className="d-flex align-items-center"
            >
              <button type="button" className="btn btn-sm" onClick={(e) => addNewSentence(e, setSentences)}>{t('PLUS')}</button>
              <button type="button" className="btn btn-sm" onClick={removeAllSentences}>{t('CROSS')}</button>
            </div>
          </Form.Label>
          {sentences && sentences.length ? sentences.map((sentence, idx) => (
            <div key={idx} className="d-flex flex-column justify-content-between mb-3">
              <div className="d-flex justify-content-between">
                <p>
                  {t('SENTENCE_WITH_NUM', { num: idx + 1 })}
                </p>
                <button type="button" className="btn btn-sm" onClick={(e) => removeSentence(idx, e, t, sentences, setSentences, formValues, setFormValues)}>{t('BIN')}</button>
              </div>
              {t('SENTENCE')}
              <Form.Control id={`sentence${idx}`} className="m-1" type="text" value={sentence.sentence} placeholder="ਇੱਥੇ ਵਾਕ ਦਰਜ ਕਰੋ" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.gurmukhiSentenceRegex} />
              <Form.Control.Feedback type="invalid" itemID={`sentence${idx}`}>
                {t('FEEDBACK_GURMUKHI', { for: 'sentence' })}
              </Form.Control.Feedback>

              {t('TRANSLATION')}
              <Form.Control id={`translation${idx}`} className="m-1" type="text" value={sentence.translation} placeholder="Enter translation" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.translationRegex} required />
              <Form.Control.Feedback type="invalid" itemID={`translation${idx}`}>
                {t('FEEDBACK_ENGLISH', { for: 'translation' })}
              </Form.Control.Feedback>
            </div>
          )) : null}
          <Button className="btn btn-sm" onClick={(e) => addNewSentence(e, setSentences)}>{t('ADD_NEW', { what: t('SENTENCE') })}</Button>
        </Form.Group>

        <Form.Group className="mb-3" onChange={handleChange}>
          <Form.Label
            className="d-flex flex-row align-items-center justify-content-between w-100"
          >
            <p>{t('QUESTIONS')}</p>
            <div
              className="d-flex align-items-center"
            >
              <button type="button" className="btn btn-sm" onClick={(e) => addNewQuestion(e, setQuestions)}>{t('PLUS')}</button>
              <button type="button" className="btn btn-sm" onClick={removeAllQuestions}>{t('CROSS')}</button>
            </div>
          </Form.Label>
          {questions && questions.length ? questions.map((question, idx) => (
            <div
              key={idx}
              className="d-flex flex-column justify-content-between m-0"
            >
              <div className="d-flex justify-content-between align-items-center">
                <b>{t('QUESTION_WITH_NUM', { num: idx + 1 })}</b>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => removeQuestion(idx, e, t, questions, setQuestions, formValues, setFormValues)}
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
                <Form.Control id={`qtranslation${idx}`} className="m-1" type="text" value={question.translation} placeholder="Enter english translation of question" onChange={(e) => changeQuestion(e, questions, setQuestions)} pattern={regex.englishQuestionTranslationRegex}  />
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
                    <option key={i} value={i}>{ele.option}</option>
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
          <Form.Control as="textarea" rows={3} placeholder="Enter notes" />
        </Form.Group>

        <div className="d-flex justify-content-between align-items-center">
          <Form.Group className="mb-3" controlId="status" onChange={handleChange}>
            <Form.Label>{t('STATUS')}</Form.Label>
            <Form.Select aria-label="Default select example" defaultValue={STATUS.CREATING_ENGLISH}>
              {status.map((ele) => {
                const value = splitAndCapitalize(ele);
                return (
                  <option key={ele + value.toString()} value={ele}>{value}</option>
                );
              })}
            </Form.Select>
          </Form.Group>
          <Form.Check
            reverse
            id="is_for_support"
            type="switch"
            onChange={handleSupport}
            label="Is this word a synonym/antonym for another word and doesn't have its own data?"
          />
        </div>

        <div className="d-flex justify-content-around">
          <Button variant="primary" type="submit">
            {t('SUBMIT')}
          </Button>
        </div>
      </Form>
      {submitted ? (
        <Card className="d-flex justify-content-center align-items-center background">
          <Card.Body className="rounded p-4 p-sm-3">
            <h3>{t('SUCCESS_ADD_NEW', { for: 'word' })}</h3>
            <Button variant="primary" onClick={unsetSubmitted}>{t('ADD_ANOTHER', { what: t('WORD') })}</Button>
            <Button variant="primary" onClick={() => navigate(routes.words)}>{t('BACK_TO', { page: 'words' })}</Button>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
};

export default AddWord;
