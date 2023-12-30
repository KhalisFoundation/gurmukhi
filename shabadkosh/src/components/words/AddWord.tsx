/* eslint-disable @typescript-eslint/indent */
import React, { FormEvent, useEffect, useState } from 'react';
import {
  Card, Button, Form, Alert,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  DocumentData, DocumentReference, QuerySnapshot, onSnapshot,
} from 'firebase/firestore';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import { SentenceType } from '../../types/sentence';
import {
  QuestionType, MiniWord, Option, MiniWordlist,
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
  getNumOfQuestionsFromType,
  getSampleQuestion,
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
import { regexMsg } from '../constants/regexMessage';

const AddWord = () => {
  const { t: text } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formValues, setFormValues] = useState({} as any);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [words, setWords] = useState<MiniWord[]>([]);
  const [wordExists, setWordExists] = useState<[boolean, string?]>([false]);
  const [wordlists, setWordlists] = useState<MiniWordlist[]>([]);
  const [synonyms, setSynonyms] = useState<MiniWord[]>([]);
  const [antonyms, setAntonyms] = useState<MiniWord[]>([]);
  const [selectedWordlists, setSelectedWordlists] = useState<DocumentReference[]>([]);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMesssage] = useState('');
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
    if (event.target.id === 'word' && words) {
      const duplicate = words.find(
        (obj) => obj.word === event.target.value.trim(),
      );
      if (duplicate && duplicate.id) {
        setWordExists([true, duplicate.id]);
      } else {
        setWordExists([false]);
      }
    }
    setFormValues({
      ...formValues, [event.target.id]: event.target.value.trim(),
    });
  };

  const handleSupport = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues, [event.target.id]: event.target.checked,
    });
  };

  useEffect(() => {
    window.onkeydown = function (event: KeyboardEvent) {
      if (event.keyCode === 13) {
        event.preventDefault();
        return false;
      }
    };
  }, [formValues]);

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
    setIsLoading(true);

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
      alert(text('WORD_CANNOT_BE_OWN'));
      setIsLoading(false);
      return;
    }

    if (formData.word.trim() === '' || formData.translation.trim() === '') {
      alert(text('WORD_CANNOT_BE_EMPTY'));
      setIsLoading(false);
      return;
    }

    const wordIsNew = await isWordNew(formData.word);
    if (!wordIsNew) {
      alert(text('WORD_ALREADY_EXISTS'));
      setIsLoading(false);
    } else {
      const validOptions = hasValidOptions(questions);
      if (!validOptions) {
        alert(text('ALERT_QUESTION_OPTIONS'));
        setIsLoading(false);
      } else {
        formData.sentences = sentences;
        formData.questions = setOptionsDataForSubmit(questions);
        formData.wordlists = selectedWordlists ? selectedWordlists.map((wordlist) => wordlist.id) : [];
        const wordData = await createWordData(formData, synonyms, antonyms, user, setErrorMesssage);
        addNewWord(wordData);
      }
    }
  };

  const unsetSubmitted = () => {
    setSubmitted(false);
    setErrorMesssage('');
    // refresh page
    window.location.reload();
  };

  const navigate = useNavigate();

  if (isLoading) {
    return <h2>{text('LOADING')}</h2>;
  }
  return (
    <div className="d-flex flex-column justify-content-center align-items-center background">
      <h2>{text('ADD_NEW', { what: text('WORD') })}</h2>
      <Form className="rounded p-4 p-sm-3" hidden={submitted} noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="word" onChange={handleChange}>
          <Form.Label>
            {text('WORD')}{' '}
            {wordExists[0] && (
              <span className='red'>
                ({text('WORD_ALREADY_EXISTS')} -{' '}
                {wordExists[1] && <a href={routes.editWord.replace(':wordid', wordExists[1])}>{text('EDIT')}</a>})
              </span>
            )}
          </Form.Label>
          <Form.Control type="text" placeholder="ਸ਼ਬਦ" pattern={regex.gurmukhiWordRegex} required />
          <Form.Control.Feedback type="invalid">
            {regexMsg.gurmukhiWordRegex}
          </Form.Control.Feedback>
        </Form.Group>

        <div style={{
          display: wordExists[0] ? 'none' : 'block',
        }}>
          <Form.Group className="mb-3" controlId="translation" onChange={handleChange}>
            <Form.Label>{text('TRANSLATION')}</Form.Label>
            <Form.Control type="text" placeholder="Enter translation" pattern={regex.translationRegex} required />
            <Form.Control.Feedback type="invalid">
              {regexMsg.translationRegex}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="meaning_punjabi" onChange={handleChange}>
            <Form.Label>{text('MEANING_PUNJABI')}</Form.Label>
            <Form.Control type="text" placeholder="ਇੱਥੇ ਅਰਥ ਦਰਜ ਕਰੋ" pattern={regex.gurmukhiSentenceRegex} />
            <Form.Control.Feedback type="invalid">
              {regexMsg.gurmukhiSentenceRegex}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="meaning_english" onChange={handleChange}>
            <Form.Label>{text('MEANING_ENGLISH')}</Form.Label>
            <Form.Control type="text" placeholder="Enter meaning" pattern={regex.translationRegex} />
            <Form.Control.Feedback type="invalid">
              {regexMsg.translationRegex}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="part_of_speech" onChange={handleChange}>
            <Form.Label>{text('PART_OF_SPEECH')}</Form.Label>
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
            <Form.Label>{text('IMAGES')}</Form.Label>
            <Form.Control type="text" placeholder="imgUrl1, imgUrl2, ..." />
          </Form.Group>

          <Form.Group className="mb-3" controlId="words">
            <Form.Label>{text('CHOOSE_WORDLIST')}</Form.Label>
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
              <p>{capitalize(text('SENTENCES'))}</p>
              <div
                className="d-flex align-items-center"
              >
                <button type="button" className="btn btn-sm" onClick={(e) => addNewSentence(e, setSentences)}>{text('PLUS')}</button>
                <button type="button" className="btn btn-sm" onClick={(e) => removeAllData(e, DATATYPES.SENTENCE)}>{text('CROSS')}</button>
              </div>
            </Form.Label>
            {sentences && sentences.length ? sentences.map((sentence, sentenceId) => (
              <div key={sentenceId} className="d-flex flex-column justify-content-between mb-3">
                <div className="d-flex justify-content-between">
                  <p>
                    {text('SENTENCE_WITH_NUM', { num: sentenceId + 1 })}
                  </p>
                  <button type="button" className="btn btn-sm" onClick={(e) => removeData(sentenceId, e, text, sentences, setSentences, SUBMIT_TYPE.CREATE, DATATYPES.SENTENCE)}>{text('BIN')}</button>
                </div>
                <Form.Label>{text('SENTENCE')}</Form.Label>
                <Form.Control id={`sentence${sentenceId}`} className="m-1" type="text" value={sentence.sentence} placeholder="ਇੱਥੇ ਵਾਕ ਦਰਜ ਕਰੋ" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.gurmukhiSentenceRegex} />
                <Form.Control.Feedback type="invalid" itemID={`sentence${sentenceId}`}>
                  {regexMsg.gurmukhiSentenceRegex}
                </Form.Control.Feedback>

                <Form.Label>{text('TRANSLATION')}</Form.Label>
                <Form.Control id={`translation${sentenceId}`} className="m-1" type="text" value={sentence.translation} placeholder="Enter translation" onChange={(e) => changeSentence(e, sentences, setSentences)} pattern={regex.translationRegex} required />
                <Form.Control.Feedback type="invalid" itemID={`translation${sentenceId}`}>
                  {regexMsg.translationRegex}
                </Form.Control.Feedback>
              </div>
            )) : null}
            <Button className="btn btn-sm" onClick={(e) => addNewSentence(e, setSentences)}>{text('ADD_NEW', { what: text('SENTENCE') })}</Button>
          </Form.Group>

          <Form.Group className="mb-3" onChange={handleChange}>
            <Form.Label
              className="d-flex flex-row align-items-center justify-content-between w-100"
            >
              <p>{capitalize(text('QUESTIONS'))}</p>
              <div
                className="d-flex align-items-center"
              >
                <button type="button" className="btn btn-sm" onClick={(e) => addNewQuestion(e, setQuestions)}>{text('PLUS')}</button>
                <button type="button" className="btn btn-sm" onClick={(e) => removeAllData(e, DATATYPES.QUESTION)}>{text('CROSS')}</button>
              </div>
            </Form.Label>
            {questions && questions.length ? questions.map((question, questionId) => (
              <div
                key={questionId}
                className="d-flex flex-column justify-content-between m-0"
              >
                <div className="d-flex justify-content-between align-items-center">
                  <b>{text('QUESTION_WITH_NUM', { num: questionId + 1 })}</b>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={(e) => removeData(questionId, e, text, questions, setQuestions, SUBMIT_TYPE.CREATE, DATATYPES.QUESTION)}
                  >
                    {text('BIN')}
                  </button>
                </div>
                <div>
                  <Form.Label>{text('QUESTION')}</Form.Label>
                  <Form.Control id={`question${questionId}`} className="m-1" type="text" value={question.question} placeholder="ਇੱਥੇ ਸਵਾਲ ਦਰਜ ਕਰੋ" onChange={(e) => changeQuestion(e, questions, setQuestions)} pattern={regex.gurmukhiQuestionRegex} required />
                  <Form.Control.Feedback type="invalid" itemID={`question${questionId}`}>
                    {regexMsg.gurmukhiQuestionRegex}
                  </Form.Control.Feedback>
                  <br />

                  <Form.Label>{text('TRANSLATION')}</Form.Label>
                  <Form.Control id={`qtranslation${questionId}`} className="m-1" type="text" value={question.translation} placeholder="Enter english translation of question" onChange={(e) => changeQuestion(e, questions, setQuestions)} pattern={regex.englishQuestionTranslationRegex}  />
                  <Form.Control.Feedback type="invalid" itemID={`qtranslation${questionId}`}>
                    {regexMsg.englishQuestionTranslationRegex}
                  </Form.Control.Feedback>
                  <br />

                  <Form.Label>{text('TYPE')}</Form.Label>
                  <Form.Select aria-label="Default select example" id={`type${questionId}`} value={question.type ?? 'context'} onChange={(e) => changeQuestion(e, questions, setQuestions)}>
                    {Object.values(qtypes).map((questionType) => (
                      <option key={questionType} value={questionType}>{questionType + getNumOfQuestionsFromType(questionType, questions)}</option>
                    ))}
                  </Form.Select><br />

                  <Form.Label>{text('SAMPLE_FOR_TYPE')}</Form.Label>
                  <Form.Control id={`sample${questionId}`} as='textarea' rows={7} className="m-1 text-muted" value={getSampleQuestion(question.type)} disabled={true} />

                  <Options id={`options${questionId}`} name="Options" word={question.options as Option[]} setWord={changeQOptions} words={words} placeholder="ਜਵਾਬ" type={(document.getElementById(`type${questionId}`) as HTMLSelectElement)?.value} />
                  <Form.Control.Feedback type="invalid" itemID={`options${questionId}`}>
                    {regexMsg.gurmukhiSentenceRegex}
                  </Form.Control.Feedback>

                  <Form.Label>{text('ANSWER')}</Form.Label>
                  <Form.Select id={`answer${questionId}`} value={question.answer} onChange={(e) => changeQuestion(e, questions, setQuestions)} required>
                    {(question.options as Option[]).map((option, optionId) => (
                      <option key={optionId} value={optionId}>{option.option}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid" itemID={`answer${questionId}`}>
                    {text('FEEDBACK', { for: 'answer' })}
                  </Form.Control.Feedback>
                </div>
                <hr />
              </div>
            )) : null}
            <Button className="btn btn-sm" onClick={(e) => addNewQuestion(e, setQuestions)}>{text('ADD_NEW', { what: text('QUESTION') })}</Button>
          </Form.Group>

          <Form.Group className="mb-3" controlId="notes" onChange={handleChange}>
            <Form.Label>{text('NOTES')}</Form.Label>
            <Form.Control as="textarea" rows={3} placeholder="Enter notes" />
          </Form.Group>

          <div className="d-flex justify-content-between align-items-center">
            <Form.Group className="mb-3" controlId="status" onChange={handleChange}>
              <Form.Label>{text('STATUS')}</Form.Label>
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
              {text('SAVE')}
            </Button>
          </div>
        </div>
      </Form>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {submitted ? (
        <Card className="d-flex justify-content-center align-items-center background">
          <Card.Body className="rounded p-4 p-sm-3">
            <h3>{text('SUCCESS_ADD_NEW', { for: 'word' })}</h3>
            <div className="d-flex justify-content-around">
              <Button variant="primary" onClick={unsetSubmitted}>{text('ADD_ANOTHER', { what: text('WORD') })}</Button>
              <Button variant="primary" onClick={() => navigate(routes.words)}>{text('BACK_TO', { page: 'words' })}</Button>
            </div>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
};

export default AddWord;
