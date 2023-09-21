/* eslint-disable @typescript-eslint/indent */
import React, { FormEvent, useEffect, useState } from 'react';
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
  DATATYPES,
  STATUS,
  astatus,
  cstatus2,
  qtypes,
  rstatus,
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
  removeData,
  saveWord,
} from '../util/words';

const AddWord = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formValues, setFormValues] = useState({} as any);
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

  let statuses = [] as string[];
  if (user.role === roles.admin) {
    statuses = astatus;
  } else if (user.role === roles.reviewer) {
    statuses = rstatus;
  } else if (user.role === roles.creator) {
    statuses = cstatus2;
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

  const removeAllData = (event:React.MouseEvent, datatype: string) => {
    event.preventDefault();
    switch (datatype) {
    case DATATYPES.SENTENCE:
      setSentences([]);
      break;
    case DATATYPES.QUESTION:
      setQuestions([]);
      break;
    default:
      break;
    }
  };

  const changeQOptions = (id: string, optionData: Option[]) => {
    const updatedQuestions = questions.map((question, questionId) => {
      switch (id) {
      case `options${questionId}`:
        return {
          ...question,
          options: optionData,
        };
      default:
        return question;
      }
    });
    setQuestions(updatedQuestions);
  };

  const resetState = () => {
    setSentences([]);
    setQuestions([]);
    setValidated(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues, [event.target.id]: event.target.value,
    });
  };

  const handleSupport = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues, [event.target.id]: event.target.checked,
    });
  };

  const addNewWord = async (formData: any) => {
    saveWord(formData, SUBMIT_TYPE.CREATE, user).finally(() => {
      setIsLoading(false);
    });

    resetState();
    setSubmitted(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (formValues.status?.includes('review')) {
      const response = confirm(t('CONFIRM_REVIEW'));
      if (!response) {
        setIsLoading(false);
        return;
      } else {
        setIsLoading(true);
      }
    }

    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      setIsLoading(false);
      return;
    }

    const formData = {} as any;
    Object.keys(formValues).forEach((formElement) => {
      if (!formElement.match(/sentence\d+/) && !formElement.match(/translation\d+/) && !formElement.match(/question\d+/) && !formElement.match(/qtranslation\d+/) && !formElement.match(/type\d+/) && !formElement.match(/options\d+/) && !formElement.match(/answer\d+/)) {
        formData[formElement] = formValues[formElement];
      }
    });
    formData.translation = formData.translation.toLowerCase();

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
        const wordData = await createWordData(formData, synonyms, antonyms, user);
        wordData.wordlists = selectedWordlists.map((docu) => docu.id);
        addNewWord(wordData);
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
            {Object.values(PARTS_OF_SPEECH).map((status) => (
              <option key={status} value={status}>{capitalize(status)}</option>
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
            <p>{capitalize(t('SENTENCES'))}</p>
            <div
              className="d-flex align-items-center"
            >
              <button type="button" className="btn btn-sm" onClick={(e) => addNewSentence(e, setSentences)}>{t('PLUS')}</button>
              <button type="button" className="btn btn-sm" onClick={(e) => removeAllData(e, DATATYPES.SENTENCE)}>{t('CROSS')}</button>
            </div>
          </Form.Label>
          {sentences && sentences.length ? sentences.map((sentence, sentenceId) => (
            <div key={sentenceId} className="d-flex flex-column justify-content-between mb-3">
              <div className="d-flex justify-content-between">
                <p>
                  {t('SENTENCE_WITH_NUM', { num: sentenceId + 1 })}
                </p>
                <button type="button" className="btn btn-sm" onClick={(e) => removeData(sentenceId, e, t, sentences, setSentences, SUBMIT_TYPE.CREATE, DATATYPES.SENTENCE)}>{t('BIN')}</button>
              </div>
              {t('SENTENCE')}
              <Form.Control id={`sentence${sentenceId}`} className="m-1" type="text" value={sentence.sentence} placeholder="ਇੱਥੇ ਵਾਕ ਦਰਜ ਕਰੋ" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.gurmukhiSentenceRegex} />
              <Form.Control.Feedback type="invalid" itemID={`sentence${sentenceId}`}>
                {t('FEEDBACK_GURMUKHI', { for: 'sentence' })}
              </Form.Control.Feedback>

              {t('TRANSLATION')}
              <Form.Control id={`translation${sentenceId}`} className="m-1" type="text" value={sentence.translation} placeholder="Enter translation" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.translationRegex} required />
              <Form.Control.Feedback type="invalid" itemID={`translation${sentenceId}`}>
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
            <p>{capitalize(t('QUESTIONS'))}</p>
            <div
              className="d-flex align-items-center"
            >
              <button type="button" className="btn btn-sm" onClick={(e) => addNewQuestion(e, setQuestions)}>{t('PLUS')}</button>
              <button type="button" className="btn btn-sm" onClick={(e) => removeAllData(e, DATATYPES.QUESTION)}>{t('CROSS')}</button>
            </div>
          </Form.Label>
          {questions && questions.length ? questions.map((question, questionId) => (
            <div
              key={questionId}
              className="d-flex flex-column justify-content-between m-0"
            >
              <div className="d-flex justify-content-between align-items-center">
                <b>{t('QUESTION_WITH_NUM', { num: questionId + 1 })}</b>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => removeData(questionId, e, t, questions, setQuestions, SUBMIT_TYPE.CREATE, DATATYPES.QUESTION)}
                >
                  {t('BIN')}
                </button>
              </div>
              <div>
                <Form.Label>{t('QUESTION')}</Form.Label>
                <Form.Control id={`question${questionId}`} className="m-1" type="text" value={question.question} placeholder="ਇੱਥੇ ਸਵਾਲ ਦਰਜ ਕਰੋ" onChange={(e) => changeQuestion(e, questions, setQuestions)} pattern={regex.gurmukhiQuestionRegex} required />
                <Form.Control.Feedback type="invalid" itemID={`question${questionId}`}>
                  {t('FEEDBACK_GURMUKHI', { for: 'question' })}
                </Form.Control.Feedback>
                <br />

                <Form.Label>{t('TRANSLATION')}</Form.Label>
                <Form.Control id={`qtranslation${questionId}`} className="m-1" type="text" value={question.translation} placeholder="Enter english translation of question" onChange={(e) => changeQuestion(e, questions, setQuestions)} pattern={regex.englishQuestionTranslationRegex}  />
                <Form.Control.Feedback type="invalid" itemID={`qtranslation${questionId}`}>
                  {t('FEEDBACK_ENGLISH', { for: 'translation' })}
                </Form.Control.Feedback>
                <br />

                <Form.Label>{t('TYPE')}</Form.Label>
                <Form.Select aria-label="Default select example" id={`type${questionId}`} value={question.type ?? 'context'} onChange={(e) => changeQuestion(e, questions, setQuestions)}>
                  {Object.values(qtypes).map((questionType) => (
                    <option key={questionType} value={questionType}>{questionType}</option>
                  ))}
                </Form.Select>

                <Options id={`options${questionId}`} name="Options" word={question.options as Option[]} setWord={changeQOptions} words={words} placeholder="ਜਵਾਬ" type={(document.getElementById(`type${questionId}`) as HTMLSelectElement)?.value} />
                <Form.Control.Feedback type="invalid" itemID={`options${questionId}`}>
                  {t('FEEDBACK', { for: 'options' })}
                </Form.Control.Feedback>

                <Form.Label>{t('ANSWER')}</Form.Label>
                <Form.Select id={`answer${questionId}`} value={question.answer} onChange={(e) => changeQuestion(e, questions, setQuestions)} required>
                  {(question.options as Option[]).map((option, optionId) => (
                    <option key={optionId} value={optionId}>{option.option}</option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid" itemID={`answer${questionId}`}>
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
              {statuses.map((status) => {
                const value = splitAndCapitalize(status);
                return (
                  <option key={status + value.toString()} value={status}>{value}</option>
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
