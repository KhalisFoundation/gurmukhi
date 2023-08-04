import React, { useEffect, useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import {
  onSnapshot, QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import regex from '../constants/regex';
import routes from '../constants/routes';
import { NewWordType } from '../../types/word';
import { wordsCollection, convertTimestampToDateString } from '../util';

function Search() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [words, setWords] = useState<NewWordType[]>([]);
  const [filteredWords, setFilteredWords] = useState<NewWordType[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSearch = async (event: any) => {
    event.preventDefault();
  };

  useEffect(() => {
    if (words) {
      if (query === '') {
        setFilteredWords(words);
      } else if (query.match(regex.gurmukhiWordRegex)) {
        const filterWords = words.filter(
          (word: NewWordType) => word.word?.includes(query),
        );
        setFilteredWords(filterWords);
      } else if (query.match(regex.englishSentenceRegex)) {
        const filterWords = words.filter(
          (word: NewWordType) => word.translation?.includes(query),
        );
        setFilteredWords(filterWords);
      }
    }
  }, [query, words]);

  useEffect(() => {
    setIsLoading(true);
    onSnapshot(wordsCollection, (snapshot:
    QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        created_at: doc.data().created_at,
        updated_at: doc.data().updated_at,
        created_by: doc.data().created_by,
        updated_by: doc.data().updated_by,
        ...doc.data(),
      }));
      setWords(data);
      setFilteredWords(data);
    });

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <h2>{t('LOADING')}</h2>;
  }
  return (
    <div className="container justify-content-center align-items-center">
      <Form onSubmit={handleSearch}>
        <Form.Group controlId="formBasicSearch">
          <Form.Label>{t('SEARCH')}</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter search term"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Form.Group>
      </Form>

      <p />

      <Table striped bordered hover responsive variant="light">
        <thead>
          <tr>
            <th>#</th>
            <th>{t('WORD')}</th>
            <th>{t('TRANSLATION')}</th>
            <th>{t('SYNONYMS')}</th>
            <th>{t('ANTONYMS')}</th>
            <th>{t('STATUS')}</th>
            <th>{t('MEANING_PUNJABI')}</th>
            <th>{t('MEANING_ENGLISH')}</th>
            <th>{t('CREATED_BY')}</th>
            <th>{t('CREATED_AT')}</th>
            <th>{t('UPDATED_BY')}</th>
            <th>{t('UPDATED_AT')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredWords.map((word, index) => (
            <tr key={word.id} onClick={() => navigate(`${routes.word.replace(':wordid', word.id ?? '')}`)}>
              <td>{index + 1}</td>
              <td>{word.word}</td>
              <td>{word.translation}</td>
              <td>{word.synonyms?.join(', ')}</td>
              <td>{word.antonyms?.join(', ')}</td>
              <td>{word.status ?? (word.is_for_support ? t('SYN_OR_ANT') : '') }</td>
              <td>{word.meaning_punjabi}</td>
              <td>{word.meaning_english}</td>
              <td>{word.created_by}</td>
              <td>{convertTimestampToDateString(word.created_at, t)}</td>
              <td>{word.updated_by}</td>
              <td>{convertTimestampToDateString(word.updated_at, t)}</td>
            </tr>
          ))}
        </tbody>
      </Table>

    </div>
  );
}

export default Search;
