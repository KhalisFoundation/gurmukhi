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
  deleteQuestionByWordId,
  deleteSentenceByWordId,
  deleteWord, getWordlistsByWordId,
  getWordsByIdList, questionsCollection,
  removeWordFromSupport,
  removeWordFromWordlists,
  reviewWord,
  sentencesCollection,
  wordsCollection,
} from '../util/controller';
import {
  NewWordType, NewSentenceType, WordlistType, MiniWord, Option, QuestionType,
} from '../../types';
import { useUserAuth } from '../UserAuthContext';
import {
  astatus, rstatus, cstatus, STATUS,
} from '../constants';
import { convertTimestampToDateString } from '../util/utils';
import roles from '../constants/roles';
import routes from '../constants/routes';

const WordDetail = () => {
  const { wordid } = useParams();
  const { user } = useUserAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  // fetch a single word from the database
  const getWord = doc(firestore, `words/${wordid}`);

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
  const [sentences, setSentences] = useState<NewSentenceType[]>([]);
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
    let synList = [] as any[];
    let antList = [] as any[];
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
        synList = newWordObj.synonyms;
        antList = newWordObj.antonyms;
        setWord(newWordObj);
        let listOfWordlists = [] as WordlistType[];
        await getWordlistsByWordId(wordid ?? '').then((data) => {
          if (data && data !== undefined) {
            listOfWordlists = data.map((ele) => ({
              id: ele.id,
              ...ele.data(),
            } as WordlistType));
          }
        }).finally(() => {
          setIsLoading(false);
        });
        setWordlists(listOfWordlists);
      } else {
        setFound(false);
        setIsLoading(false);
      }
    };

    const fetchSynonyms = async () => {
      setIsLoading(true);
      await getWordsByIdList(synList).then((docs) => {
        if (docs && docs !== undefined) {
          synList = docs.map((d) => ({
            id: d.id, ...d.data(),
          } as MiniWord)) as MiniWord[];
        }
      }).finally(() => {
        setIsLoading(false);
      });
    };

    const fetchAntonyms = async () => {
      setIsLoading(true);
      await getWordsByIdList(antList).then((docs) => {
        if (docs && docs !== undefined) {
          antList = docs.map((d) => ({
            id: d.id, ...d.data(),
          } as MiniWord)) as MiniWord[];
        }
      }).finally(() => {
        setIsLoading(false);
      });
    };

    const fetchSentence = async () => {
      setIsLoading(true);
      const q = query(sentencesCollection, where('word_id', '==', wordid));
      const querySnapshot = await getDocs(q).finally(() => {
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
      const q = query(questionsCollection, where('word_id', '==', wordid));
      const querySnapshot = await getDocs(q).finally(() => {
        setIsLoading(false);
      });
      if (!querySnapshot.empty) {
        const newQuestions = querySnapshot.docs.map((docu) => {
          const lOptions = docu.data().options.map((ele: string | Option) => {
            if (typeof ele === 'string') {
              const d = localWords.find((e) => e.id === ele || e.word === ele);
              return {
                id: d?.id, option: d?.word, translation: d?.translation,
              } as Option;
            }
            return ele;
          }).filter((ele: any) => ele !== undefined) as Option[];
          return {
            ...docu.data(),
            id: docu.id,
            question: docu.data().question,
            translation: docu.data().translation ?? '',
            type: docu.data().type,
            options: lOptions,
            answer: docu.data().answer,
          };
        });
        setQuestions(newQuestions);
      }
    };

    fetchWords().then(() => {
      fetchWord().then(() => {
        fetchSynonyms().then(() => {
          fetchAntonyms().then(() => {
            setWord((prev) => ({
              ...prev, synonyms: synList, antonyms: antList,
            }));
            fetchSentence();
            fetchQuestions();
          });
        });
      });
    });
  }, []);

  const editUrl = routes.editWord.replace(':wordid', wordid ?? '');
  const delWord = (deleted_word: any) => {
    const response = window.confirm(`Are you sure you want to delete this word: ${deleted_word.word}?\nThis action will delete all sentences and questions for this word as well. \n This action is not reversible!`);
    if (response) {
      const getDelWord = doc(firestore, `words/${deleted_word.id}`);
      setIsLoading(true);
      removeWordFromSupport(deleted_word.id).then(() => {
        removeWordFromWordlists(deleted_word.id).then(() => {
          deleteWord(getDelWord).then(() => {
            deleteSentenceByWordId(deleted_word.id).then(() => {
              deleteQuestionByWordId(deleted_word.id).then(() => {
                alert('Word deleted!');
                setIsLoading(false);
                navigate(routes.words);
              });
            });
          });
        });
      });
    }
  };
  const revWord = (word_in_review: NewWordType, type: string) => {
    let action = '';
    if (type === 'review') {
      action = 'send this word for review';
    } else if (type === 'approve') {
      action = 'approve this word';
    }
    const response = window.confirm(`Are you sure you want to ${action} : ${word_in_review.word}?`);
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

  const onError = (e: any) => {
    e.target.parentElement.style.display = 'none';
  };

  const wordlistData = wordlists?.map((ele: any) => (
    <li key={ele.id} className="row">
      <NavLink
        className="col-4 text-center border rounded-pill m-1"
        href={routes.wordlist.replace(':wlid', ele.id)}
        key={ele.id}
      >
        {ele.name}
      </NavLink>
    </li>
  ));

  const supportList = (supportWord: any) => (supportWord && supportWord.length ? (
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
  ) : t('NO_TEXT', { for: t('SYNONYMS') }));

  if (isLoading) {
    return <h2>{t('LOADING')}</h2>;
  }
  if (!found) {
    return <h2>{t('NOT_FOUND', { what: t('WORD') })}</h2>;
  }
  return (
    <Card className="container p-5">
      <Breadcrumb>
        <Breadcrumb.Item href={routes.home}>{t('HOME')}</Breadcrumb.Item>
        <Breadcrumb.Item href={routes.words}>{t('WORDS')}</Breadcrumb.Item>
        <Breadcrumb.Item active>{word.word}</Breadcrumb.Item>
      </Breadcrumb>
      <h2>{t('WORD_DETAIL')}</h2>

      <br />
      <span>
        <div className="d-flex justify-content-between">
          <h3>
            {t('WORD_WITH_TRANSLATION', { word: word.word, translation: word.translation })}
          </h3>

          <ButtonGroup className="d-flex align-self-end">
            {((word.status && statusList.includes(word.status ?? STATUS.CREATING_ENGLISH)) || word.is_for_support) ? <Button href={editUrl}>{t('EDIT')}</Button> : null}
            {(word.status && Object.values(cstatus).includes(word.status)) ? <Button onClick={() => revWord(word, 'review')} variant="success">{t('SEND_TO_REVIEW')}</Button> : null}
            {(word.status && [roles.reviewer, roles.admin].includes(user.role) && [STATUS.REVIEW_ENGLISH, STATUS.REVIEW_FINAL].includes(word.status)) ? <Button onClick={() => revWord(word, 'approve')} variant="success">{t('APPROVE')}</Button> : null}
            {user.role === roles.admin ? <Button onClick={() => delWord(word)} variant="danger">{t('DELETE')}</Button> : null}
          </ButtonGroup>
        </div>

        <Badge bg="primary">
          {word.status}
        </Badge>
        <Badge bg="primary">
          {word.is_for_support ? t('SYN_OR_ANT') : null}
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
            ? <h6>{t('supportWordDesc')}</h6>
            : null}
          <h4>
            {t('LABEL_VAL', {
              label: 'ਅਰਥ',
              val: word.meaning_punjabi ? word.meaning_punjabi : '~',
            })}
          </h4>
          <h4>
            {t('LABEL_VAL', {
              label: 'Meaning',
              val: word.meaning_english ? word.meaning_english : '~',
            })}
          </h4>
          {word.part_of_speech && (
            <h4>
              {t('LABEL_VAL', {
                label: t('PART_OF_SPEECH'),
                val: word.part_of_speech,
              })}
            </h4>
          )}

          <br />
          <h5><b>{t('SYNONYMS')}</b></h5>
          <div className="d-flex">
            {supportList(word.synonyms)}
          </div>

          <br />
          <h5><b>{t('ANTONYMS')}</b></h5>
          <div className="d-flex">
            {supportList(word.antonyms)}
          </div>

          <br />
          <h5><b>{t('SENTENCES')}</b></h5>
          <ListGroup>
            {sentences && sentences.length ? (
              sentences.map((sentence) => (
                <ListGroup.Item key={sentence.id}>
                  <h5>{sentence.sentence}</h5>
                  <h6>{sentence.translation}</h6>
                </ListGroup.Item>
              ))
            ) : t('NO_TEXT', { for: t('SENTENCES') })}
          </ListGroup>

          <br />
          <h5><b>{t('QUESTIONS')}</b></h5>
          <ListGroup>
            {questions && questions.length ? (
              questions.map((question, qid) => (
                <ListGroup.Item key={question.id}>
                  <h5>
                    {t('LABEL_VAL', {
                      label: t('QUESTION'),
                      val: question.question,
                    })}
                  </h5>
                  <h5>
                    {t('LABEL_VAL', {
                      label: t('TRANSLATION'),
                      val: question.translation,
                    })}
                  </h5>
                  <h6>
                    {t('OPTIONS')}
                    :
                    <ul>
                      {question.options?.map((ele, idx) => <li key={`qoption${qid}${idx}`}>{ele.option}</li>)}
                    </ul>
                  </h6>
                  <h6>
                    {t('LABEL_VAL', {
                      label: t('ANSWER'),
                      val: question.options[question.answer]?.option
                        ?? JSON.stringify(question.answer),
                    })}
                  </h6>
                  <h6>
                    {t('LABEL_VAL', {
                      label: t('TYPE'),
                      val: question.type,
                    })}
                  </h6>
                </ListGroup.Item>
              ))
            ) : t('NO_TEXT', { for: t('QUESTIONS') })}
          </ListGroup>

          <br />
          {wordlistData && wordlistData.length !== 0
            && (
              <div>
                <h5>
                  {t('WORDLISTS')}
                </h5>
                <ul>
                  {wordlistData}
                </ul>
              </div>
            )}

          <p className="mt-3" hidden={!word.notes}>
            {t('LABEL_VAL', {
              label: t('NOTES'),
              val: word.notes,
            })}
          </p>

          <br />
          <h5><b>{t('INFO')}</b></h5>
          <div className="d-flex justify-content-between flex-column">
            <h6>
              {t('LABEL_VAL', {
                label: t('CREATED_BY'),
                val: word.created_by,
              })}
            </h6>
            <h6>
              {t('LABEL_VAL', {
                label: t('UPDATED_BY'),
                val: convertTimestampToDateString(word.created_at, t),
              })}
            </h6>
            <h6>
              {t('LABEL_VAL', {
                label: t('LAST_UPDATED_BY'),
                val: word.updated_by,
              })}
            </h6>
            <h6>
              {t('LABEL_VAL', {
                label: t('LAST_UPDATED_AT'),
                val: convertTimestampToDateString(word.updated_at, t),
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
