/* eslint-disable react-hooks/exhaustive-deps */
import {
  DocumentData,
  QuerySnapshot,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  ListGroup,
  NavLink,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firestore } from '../../firebase';
import {
  getWordlistsByWordId,
  getWordsByIdList,
  questionsCollection,
  reviewWord,
  sentencesCollection,
  wordsCollection,
} from '../util/controller';
import {
  NewWordType, SentenceType, WordlistType, MiniWord, Option, QuestionType, WordType,
} from '../../types';
import { useUserAuth } from '../UserAuthContext';
import {
  astatus, rstatus, cstatus, STATUS, EmptyWord,
} from '../constants';
import { capitalize, convertTimestampToDateString } from '../util/utils';
import roles from '../constants/roles';
import routes from '../constants/routes';
import { removeWord } from '../util/words';

const WordDetail = () => {
  const { wordid } = useParams();
  const { user } = useUserAuth();
  const { t: text } = useTranslation();
  const navigate = useNavigate();
  // fetch a single word from the database
  const getWord = doc(firestore, `words/${wordid}`);

  const [found, setFound] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [word, setWord] = useState<WordType>(EmptyWord);
  const [sentences, setSentences] = useState<SentenceType[]>([]);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [wordlists, setWordlists] = useState<WordlistType[]>([]);

  let statusList = [] as string[];
  if (user.role === roles.admin) {
    statusList = astatus;
  } else if (user.role === roles.reviewer) {
    statusList = rstatus;
  } else if (user.role === roles.creator) {
    statusList = cstatus;
  }

  useEffect(() => {
    let synonymsList = [] as string[] | MiniWord[];
    let antonymsList = [] as string[] | MiniWord[];
    let localWords = [] as NewWordType[];

    const fetchWords = async () => {
      setIsLoading(true);
      onSnapshot(wordsCollection, (snapshot:
      QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map((docu) => ({
          id: docu.id,
          created_at: docu.data().created_at,
          updated_at: docu.data().updated_at,
          created_by: docu.data().created_by,
          updated_by: docu.data().updated_by,
          ...docu.data(),
        }));
        localWords = data;
      });

      setIsLoading(false);
    };

    const fetchWord = async () => {
      setIsLoading(true);
      const docSnap = await getDoc(getWord);
      if (docSnap.exists()) {
        const newWordObj = {
          id: docSnap.id,
          synonyms: docSnap.data().synonyms,
          antonyms: docSnap.data().antonyms,
          sentences: docSnap.data().sentences,
          created_at: docSnap.data().created_at,
          updated_at: docSnap.data().updated_at,
          created_by: docSnap.data().created_by,
          updated_by: docSnap.data().updated_by,
          ...docSnap.data(),
        };
        synonymsList = newWordObj.synonyms;
        antonymsList = newWordObj.antonyms;
        setWord(newWordObj);
        let listOfWordlists = [] as WordlistType[];
        const wordlistData = await getWordlistsByWordId(wordid ?? '');
        if (wordlistData && wordlistData !== undefined) {
          listOfWordlists = wordlistData.map((wordlist) => ({
            id: wordlist.id,
            ...wordlist.data(),
          } as WordlistType));
        }
        setIsLoading(false);
        setWordlists(listOfWordlists);
      } else {
        setFound(false);
        setIsLoading(false);
      }
    };

    const fetchWordsList = async (unfoundWords: string[] | MiniWord[]) => {
      setIsLoading(true);
      const wordsData = await getWordsByIdList(unfoundWords as string[]);
      if (wordsData && wordsData !== undefined) {
        unfoundWords = wordsData.map((wordData) => ({
          id: wordData.id, ...wordData.data(),
        } as MiniWord));
      }
      setIsLoading(false);
    };

    const fetchSentence = async () => {
      setIsLoading(true);
      const queryStatement = query(sentencesCollection, where('word_id', '==', wordid));
      const querySnapshot = await getDocs(queryStatement).finally(() => {
        setIsLoading(false);
      });
      if (!querySnapshot.empty) {
        const newSentences = querySnapshot.docs.map((docu) => ({
          id: docu.id,
          ...docu.data(),
        }));
        setSentences(newSentences);
      }
    };

    const fetchQuestions = async () => {
      setIsLoading(true);
      const queryStatement = query(questionsCollection, where('word_id', '==', wordid));
      const querySnapshot = await getDocs(queryStatement).finally(() => {
        setIsLoading(false);
      });
      if (!querySnapshot.empty) {
        const newQuestions = querySnapshot.docs.map((question) => {
          const optionList = question.data().options.map((option: string | Option) => {
            if (typeof option === 'string') {
              const words = localWords.find((localWord) => localWord.id === option || localWord.word === option);
              return {
                id: words?.id,
                option: words?.word,
                translation: words?.translation,
              } as Option;
            }
            return option;
          }).filter((option: Option) => option !== undefined) as Option[];
          return {
            ...question.data(),
            id: question.id,
            question: question.data().question,
            translation: question.data().translation ?? '',
            type: question.data().type,
            options: optionList,
            answer: question.data().answer,
          };
        });
        setQuestions(newQuestions);
      }
    };

    fetchWords().then(() => {
      fetchWord().then(() => {
        fetchWordsList(synonymsList).then(() => {
          fetchWordsList(antonymsList).then(() => {
            setWord((prev) => ({
              ...prev, synonyms: synonymsList as MiniWord[], antonyms: antonymsList as MiniWord[],
            }));
            fetchSentence();
            fetchQuestions();
          });
        });
      });
    });
  }, []);

  const editUrl = routes.editWord.replace(':wordid', wordid ?? '');

  const revWord = (word_in_review: NewWordType, type: string) => {
    let action = '';
    if (type === 'review') {
      action = 'send this word for review';
    } else if (type === 'approve') {
      action = 'approve this word';
    }
    const response = window.confirm(text('CONFIRM', { action: action, what: word_in_review.word }));
    if (response) {
      const getRevWord = doc(firestore, `words/${word_in_review.id}`);
      let status = STATUS.REVIEW_ENGLISH;
      if (word_in_review.status) {
        if (type === 'review') {
          if (Object.keys(cstatus).includes(word_in_review.status)) {
            if (word_in_review.status.includes('english')) {
              status = STATUS.REVIEW_ENGLISH;
            } else if (word_in_review.status.includes('punjabi')) {
              status = STATUS.REVIEW_FINAL;
            }
          }
        } else if (type === 'approve') {
          if (word_in_review.status === STATUS.REVIEW_ENGLISH) {
            status = STATUS.CREATING_PUNJABI;
          } else if (word_in_review.status === STATUS.REVIEW_FINAL) {
            status = STATUS.ACTIVE;
          }
        }
      } else {
        status = STATUS.REVIEW_ENGLISH;
      }
      reviewWord(getRevWord, word_in_review, status, user.email).then(() => {
        navigate(routes.words);
      });
    }
  };

  const onError = (event: any) => {
    event.target.parentElement.style.display = 'none';
  };

  const wordlistData = wordlists?.map((wordlist: WordlistType) => (
    <li key={wordlist.id} className="row">
      <NavLink
        className="col-4 text-center border rounded-pill m-1"
        href={routes.wordlist.replace(':wlid', wordlist.id ?? '')}
        key={wordlist.id}
      >
        {wordlist.name}
      </NavLink>
    </li>
  ));

  const supportList = (supportWord: MiniWord[]) => (supportWord && supportWord.length ? (
    <span className="d-inline-flex">
      {(supportWord as MiniWord[]).map((synonym) => (
        <NavLink
          className="col-12 text-center border rounded-pill m-1 p-1"
          href={routes.word.replace(':wordid', synonym.id ?? '')}
          key={synonym.id}
        >
          {synonym.word}
        </NavLink>
      ))}
    </span>
  ) : text('NO_TEXT', { for: text('SYNONYMS') }));

  if (isLoading) {
    return <h2>{text('LOADING')}</h2>;
  }
  if (!found) {
    return <h2>{text('NOT_FOUND', { what: text('WORD') })}</h2>;
  }
  return (
    <Card className="container p-5">
      <Breadcrumb>
        <Breadcrumb.Item href={routes.home}>{text('HOME')}</Breadcrumb.Item>
        <Breadcrumb.Item href={routes.words}>{text('WORDS')}</Breadcrumb.Item>
        <Breadcrumb.Item active>{word.word}</Breadcrumb.Item>
      </Breadcrumb>
      <h2>{text('WORD_DETAIL')}</h2>

      <br />
      <span>
        <div className="d-flex justify-content-between">
          <h3>
            {text('WORD_WITH_TRANSLATION', { word: word.word, translation: word.translation })}
          </h3>

          <ButtonGroup className="d-flex align-self-end">
            {((word.status && statusList.includes(word.status ?? STATUS.CREATING_ENGLISH)) || word.is_for_support) ? <Button href={editUrl}>{text('EDIT')}</Button> : null}
            {(word.status && Object.values(cstatus).includes(word.status)) ? <Button onClick={() => revWord(word, 'review')} variant="success">{text('SEND_TO_REVIEW')}</Button> : null}
            {(word.status && [roles.reviewer, roles.admin].includes(user.role) && [STATUS.REVIEW_ENGLISH, STATUS.REVIEW_FINAL].includes(word.status)) ? <Button onClick={() => revWord(word, 'approve')} variant="success">{text('APPROVE')}</Button> : null}
            {user.role === roles.admin ? <Button onClick={() => removeWord(word, setIsLoading, navigate, text)} variant="danger">{text('DELETE')}</Button> : null}
          </ButtonGroup>
        </div>

        <Badge bg="primary">
          {word.status}
        </Badge>
        <Badge bg="primary">
          {word.is_for_support ? text('SYN_OR_ANT') : null}
        </Badge>
      </span>

      {Object.keys(word) && Object.keys(word).length ? (
        <div className="d-flex flex-column justify-content-evenly">
          {word.images && word.images.length ? (
            word.images.map((img) => (
              <Card
                className="p-2 wordCard"
                key={img}
                style={{
                  width: '20rem',
                }}
              >
                <Card.Img variant="top" src={img} onError={onError} />
              </Card>
            ))
          ) : null}
          <br />
          {word.is_for_support
            ? <h6>{text('SUPPORT_WORD_DESC')}</h6>
            : null}
          <h4>
            {text('LABEL_VAL', {
              label: 'ਅਰਥ',
              val: word.meaning_punjabi ? word.meaning_punjabi : '~',
            })}
          </h4>
          <h4>
            {text('LABEL_VAL', {
              label: 'Meaning',
              val: word.meaning_english ? word.meaning_english : '~',
            })}
          </h4>
          {word.part_of_speech && (
            <h4>
              {text('LABEL_VAL', {
                label: text('PART_OF_SPEECH'),
                val: word.part_of_speech,
              })}
            </h4>
          )}

          <br />
          <h5><b>{text('SYNONYMS')}</b></h5>
          <div className="d-flex">
            {supportList(word.synonyms as MiniWord[])}
          </div>

          <br />
          <h5><b>{text('ANTONYMS')}</b></h5>
          <div className="d-flex">
            {supportList(word.antonyms as MiniWord[])}
          </div>

          <br />
          <h5><b>{capitalize(text('SENTENCES'))}</b></h5>
          <ListGroup>
            {sentences && sentences.length ? (
              sentences.map((sentence) => (
                <ListGroup.Item key={sentence.id}>
                  <h5>{sentence.sentence}</h5>
                  <h6>{sentence.translation}</h6>
                </ListGroup.Item>
              ))
            ) : text('NO_TEXT', { for: capitalize(text('SENTENCES')) })}
          </ListGroup>

          <br />
          <h5><b>{capitalize(text('QUESTIONS'))}</b></h5>
          <ListGroup>
            {questions && questions.length ? (
              questions.map((question, qid) => (
                <ListGroup.Item key={question.id}>
                  <h5>
                    {text('LABEL_VAL', {
                      label: text('QUESTION'),
                      val: question.question,
                    })}
                  </h5>
                  <h5>
                    {text('LABEL_VAL', {
                      label: text('TRANSLATION'),
                      val: question.translation,
                    })}
                  </h5>
                  <h6>
                    {text('OPTIONS')}
                    :
                    <ul>
                      {question.options?.map((option, optionId) => <li key={`qoption${qid}${optionId}`}>{option.option}</li>)}
                    </ul>
                  </h6>
                  <h6>
                    {text('LABEL_VAL', {
                      label: text('ANSWER'),
                      val: question.options[question.answer]?.option
                        ?? JSON.stringify(question.answer),
                    })}
                  </h6>
                  <h6>
                    {text('LABEL_VAL', {
                      label: text('TYPE'),
                      val: question.type,
                    })}
                  </h6>
                </ListGroup.Item>
              ))
            ) : text('NO_TEXT', { for: capitalize(text('QUESTIONS')) })}
          </ListGroup>

          <br />
          {wordlistData && wordlistData.length !== 0
            && (
              <div>
                <h5>
                  {text('WORDLISTS')}
                </h5>
                <ul>
                  {wordlistData}
                </ul>
              </div>
            )}

          <p className="mt-3" hidden={!word.notes}>
            {text('LABEL_VAL', {
              label: text('NOTES'),
              val: word.notes,
            })}
          </p>

          <br />
          <h5><b>{text('INFO')}</b></h5>
          <div className="d-flex justify-content-between flex-column">
            <h6>
              {text('LABEL_VAL', {
                label: text('CREATED_BY'),
                val: word.created_by,
              })}
            </h6>
            <h6>
              {text('LABEL_VAL', {
                label: text('UPDATED_BY'),
                val: convertTimestampToDateString(word.created_at, text),
              })}
            </h6>
            <h6>
              {text('LABEL_VAL', {
                label: text('LAST_UPDATED_BY'),
                val: word.updated_by,
              })}
            </h6>
            <h6>
              {text('LABEL_VAL', {
                label: text('LAST_UPDATED_AT'),
                val: convertTimestampToDateString(word.updated_at, text),
              })}
            </h6>
          </div>
        </div>
      )
        : ('Loading...')}
      <br />
    </Card>
  );
};

export default WordDetail;
