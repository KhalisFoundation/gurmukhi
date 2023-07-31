/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Container,
  Form,
  ListGroup,
  Row,
} from 'react-bootstrap';
import {
  DocumentData, QuerySnapshot, doc, onSnapshot,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  deleteQuestionByWordId,
  deleteSentenceByWordId,
  deleteWord,
  removeWordFromSupport,
  removeWordFromWordlists,
  wordsCollection,
} from '../util/controller';
import { NewWordType, Status } from '../../types/word';
import { firestore } from '../../firebase';
import { useUserAuth } from '../UserAuthContext';
import {
  astatus,
  cstatus,
  rstatus,
} from '../constants';
import { capitalize, compareUpdatedAt } from '../util/utils';
import regex from '../constants/regex';
import roles from '../constants/roles';
import routes from '../constants/routes';

function ViewDictionary() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState('all');
  const [listView, setListView] = useState<boolean>(false);
  const [words, setWords] = useState<NewWordType[]>([]);
  const [filteredWords, setFilteredWords] = useState<NewWordType[]>([]);
  const { user } = useUserAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  let statusList = {
  } as Status;
  if (user.role === roles.admin) {
    statusList = astatus;
  } else if (user.role === roles.reviewer) {
    statusList = rstatus;
  } else if (user.role === roles.creator) {
    statusList = cstatus;
  }

  const sortWords = (unwords: NewWordType[]) => {
    const sortedWords = unwords.sort(
      (p1, p2) => compareUpdatedAt(p1, p2),
    );
    return sortedWords;
  };

  const handleFilter = (filterVal = filter, statusVal = status, filterList = words) => {
    let filteredList = filterList;
    if (filterVal === 'created_by_me') {
      filteredList = filteredList.filter((val) => val.created_by === user.email);
    } else if (filterVal === 'am_working_on') {
      filteredList = filteredList.filter((val) => (val.created_by === user.email || val.updated_by === user.email) && val.status?.includes('ing'));
    } else if (filterVal === 'updated_by_me') {
      filteredList = filteredList.filter((val) => val.updated_by === user.email);
    } else if (filterVal === 'syn_or_ant') {
      filteredList = filteredList.filter((val) => val.is_for_support);
    }

    if (statusVal !== 'all') {
      filteredList = filteredList.filter((val) => val.status?.includes(statusVal));
    }

    setFilteredWords(sortWords(filteredList));
  };

  const handleSearch = async (event: any) => {
    event.preventDefault();
  };

  useEffect(() => {
    let localWords = words;
    if (query.match(regex.gurmukhiWordRegex)) {
      localWords = words.filter((word) => word.word?.includes(query));
    } else if (query.match(regex.englishSentenceRegex)) {
      localWords = words.filter((word) => word.translation?.toLowerCase().includes(query));
    }
    handleFilter(filter, status, localWords);
  }, [query, filter, status]);

  useEffect(() => {
    setIsLoading(true);
    onSnapshot(wordsCollection, (snapshot:
    QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map((wordDoc) => ({
        id: wordDoc.id,
        created_at: wordDoc.data().created_at,
        updated_at: wordDoc.data().updated_at,
        created_by: wordDoc.data().created_by,
        updated_by: wordDoc.data().updated_by,
        ...wordDoc.data(),
      }));
      setWords(data);
      setFilteredWords(data);
    });

    setIsLoading(false);
  }, []);

  const delWord = (deleted_word: any) => {
    // add code to remove word_id from its respective wordlist
    const response = window.confirm(`Are you sure you want to delete this word: ${deleted_word.word}? \n This action is not reversible.`);
    if (response) {
      const getWord = doc(firestore, `words/${deleted_word.id}`);
      removeWordFromSupport(deleted_word.id).then(() => {
        removeWordFromWordlists(deleted_word.id).then(() => {
          deleteWord(getWord).then(() => {
            deleteSentenceByWordId(deleted_word.id).then(() => {
              deleteQuestionByWordId(deleted_word.id).then(() => {
                setIsLoading(false);
                navigate(routes.words);
              });
            });
          });
        });
      });
    }
  };

  const wordsData = sortWords(filteredWords) && sortWords(filteredWords).length
    ? sortWords(filteredWords)?.map((word) => {
      const detailUrl = routes.word.replace(':wordid', word.id ?? '');
      const editUrl = routes.editWord.replace(':wordid', word.id ?? '');
      if (listView) {
        return (
          <ListGroup.Item
            key={word.id}
            className="d-flex justify-content-between"
          >
            <div className="ms-2 me-auto">
              <h3 className="fw-bold">{word.word}</h3>
              <p>{word.translation}</p>
            </div>
            <div className="d-flex flex-column align-items-end">
              <ButtonGroup>
                <Button
                  href={detailUrl}
                  className="bg-transparent border-0"
                >
                  {t('EYE')}
                </Button>
                {Object.keys(statusList).includes(word.status ?? 'creating-english') ? (
                  <Button
                    href={editUrl}
                    className="bg-transparent border-0"
                  >
                    {t('PEN')}
                  </Button>
                ) : null }
                {user?.role === roles.admin ? (
                  <Button
                    onClick={() => delWord(word)}
                    className="bg-transparent border-0"
                  >
                    {t('BIN')}
                  </Button>
                ) : null}
              </ButtonGroup>
              <Badge pill bg="primary" text="white" className="mb-2" hidden={!word.status}>
                {word.status}
              </Badge>
              <Badge pill bg="primary" text="white" className="mb-2" hidden={!word.is_for_support}>
                Synonym/Antonym
              </Badge>
            </div>
          </ListGroup.Item>
        );
      }
      return (
        <Card
          className="p-2 wordCard col-lg-3 col-md-5 col-sm-12"
          key={word.id}
        >
          <Card.Body
            className="d-flex flex-column justify-content-center w-100"
          >
            <div
              className="d-flex flex-row justify-content-between align-items-center w-100"
            >
              <Card.Title>
                {word.word}
                <br />
                (
                {word.translation}
                )
              </Card.Title>
              <div className="d-flex flex-column align-items-end">
                <Badge pill bg="primary" text="white" hidden={!word.status} className="mb-2">
                  {word.status}
                </Badge>
                <Badge pill bg="primary" text="white" hidden={!word.is_for_support}>
                  {t('SYN_OR_ANT')}
                </Badge>
              </div>
            </div>
            <ButtonGroup>
              <Button href={detailUrl} variant="success">{t('view')}</Button>
              {Object.keys(statusList).includes(word.status ?? 'creating-english') ? <Button href={editUrl}>{t('EDIT')}</Button> : null }
              {user?.role === roles.admin ? <Button onClick={() => delWord(word)} variant="danger">{t('DELETE')}</Button> : null }
            </ButtonGroup>
          </Card.Body>
        </Card>
      );
    })
    : (
      <Card>
        <Card.Body>
          <h3>
            No words
            {user?.role === roles.reviewer ? 'to review!' : 'found!'}
          </h3>
        </Card.Body>
      </Card>
    );

  if (words.length === 0 || isLoading) return <h2>{t('LOADING')}</h2>;
  return (
    <div className="container mt-2">
      <div className="d-flex justify-content-between align-items-center">
        <h2>{t('WORDS')}</h2>
        <Button href={routes.newWord}>{t('ADD_NEW', { what: '' })}</Button>
      </div>
      <Button
        className="button"
        variant="primary"
        onClick={() => setListView(!listView)}
      >
        {listView ? 'Card View' : 'List View'}
      </Button>
      <Form
        className="d-flex align-items-center w-100"
        onSubmit={handleSearch}
      >
        <Form.Group
          controlId="formBasicSearch"
          className="w-70"
        >
          <Form.Label>{t('SEARCH')}</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter search term"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Form.Group>

        <div className="d-flex align-items-center">
          <Form.Group controlId="filter" onChange={(e: any) => setFilter(e.target.value ?? '')} defaultValue={filter}>
            <Form.Label>{t('FILTER')}</Form.Label>
            <Form.Select>
              <option key="all" value="all">{t('SHOW_ALL')}</option>
              <option key="cbyme" value="created_by_me">{t('CREATED_BY_ME')}</option>
              <option key="amwon" value="am_working_on">{t('AM_WORKING_ON')}</option>
              <option key="lupme" value="updated_by_me">{t('LAST_UPDATED_BY_ME')}</option>
              <option key="synant" value="syn_or_ant">{t('SYN_OR_ANT')}</option>
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="status" onChange={(e: any) => setStatus(e.target.value ?? '')}>
            <Form.Label>{t('STATUS')}</Form.Label>
            <Form.Select defaultValue={status}>
              <option key="all" value="all">{t('SHOW_ALL')}</option>
              {Object.keys(statusList).length > 0 && Object.keys(statusList).map((ele) => {
                const val = statusList[ele];
                return (
                  <option key={ele} value={ele}>{capitalize(val)}</option>
                );
              })}
            </Form.Select>
          </Form.Group>
        </div>

      </Form>
      {filteredWords && filteredWords.length ? (
        <div className="d-flex ms-2 justify-content-evenly">
          <Container className="p-4">
            { listView
              ? <ListGroup className="d-flex">{wordsData}</ListGroup>
              : (
                <Row className="d-flex justify-content-center align-items-center">
                  {wordsData}
                </Row>
              )}
          </Container>
        </div>
      ) : (
        <h2 className="no-words">{t('NO_VALS', { vals: t('WORDS') })}</h2>
      )}
    </div>
  );
}

export default ViewDictionary;
