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

const Search = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [words, setWords] = useState<NewWordType[]>([]);
  const [filteredWords, setFilteredWords] = useState<NewWordType[]>([]);
  const navigate = useNavigate();
  const { t: text } = useTranslation();

  const handleSearch = async (event: React.FormEvent) => {
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
    return <h2>{text('LOADING')}</h2>;
  }
  return (
    <div className="container justify-content-center align-items-center">
      <Form onSubmit={handleSearch}>
        <Form.Group controlId="formBasicSearch">
          <Form.Label>{text('SEARCH')}</Form.Label>
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
            <th>{text('WORD')}</th>
            <th>{text('TRANSLATION')}</th>
            <th>{text('SYNONYMS')}</th>
            <th>{text('ANTONYMS')}</th>
            <th>{text('STATUS')}</th>
            <th>{text('MEANING_PUNJABI')}</th>
            <th>{text('MEANING_ENGLISH')}</th>
            <th>{text('CREATED_BY')}</th>
            <th>{text('CREATED_AT')}</th>
            <th>{text('UPDATED_BY')}</th>
            <th>{text('UPDATED_AT')}</th>
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
              <td>{word.status ?? (word.is_for_support ? text('SYN_OR_ANT') : '') }</td>
              <td>{word.meaning_punjabi}</td>
              <td>{word.meaning_english}</td>
              <td>{word.created_by}</td>
              <td>{convertTimestampToDateString(word.created_at, text)}</td>
              <td>{word.updated_by}</td>
              <td>{convertTimestampToDateString(word.updated_at, text)}</td>
            </tr>
          ))}
        </tbody>
      </Table>

    </div>
  );
};

export default Search;
