import {
  onSnapshot, QuerySnapshot, DocumentData, doc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Badge, Button, ButtonGroup, ListGroup,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firestore } from '../../firebase';
import roles from '../constants/roles';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';
import { compareUpdatedAt } from '../util';
import { deleteWordlist, wordlistsCollection } from '../util/controller';
import { WordlistType } from '../../types';

const Wordlists = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wordlists, setWordlists] = useState<WordlistType[]>([]);
  const { user } = useUserAuth();
  const { t: text } = useTranslation();
  const navigate = useNavigate();
  if (!user) navigate(routes.login);

  useEffect(() => {
    setIsLoading(true);
    onSnapshot(wordlistsCollection, (snapshot:
    QuerySnapshot<DocumentData>) => {
      setWordlists(
        snapshot.docs.map((wlDoc) => ({
          id: wlDoc.id,
          created_at : wlDoc.data().created_at,
          updated_at : wlDoc.data().updated_at,
          created_by : wlDoc.data().created_by,
          updated_by : wlDoc.data().updated_by,
          ...wlDoc.data(),
        })),
      );
      setIsLoading(false);
    });

  }, []);

  const sortWordlists = (unwordlists: WordlistType[]) => {
    const sortedWordlists = unwordlists.sort(
      (p1, p2) => compareUpdatedAt(p1.created_at, p2.created_at),
    );

    return sortedWordlists;
  };

  const delWordlist = (wordlist: WordlistType) => {
    const response = window.confirm(text('DELETE_CONFIRM', { what: wordlist.name }));
    if (response) {
      const getWordlist = doc(firestore, `wordlists/${wordlist.id}`);
      deleteWordlist(getWordlist).then(() => {
        alert(text('DELETE_USER', { what: 'Word' }));
      });
    }
  };

  const wordlistsData = sortWordlists(wordlists)?.map((wordlist) => {
    const viewUrl = routes.wordlist.replace(':wlid', wordlist.id);
    const editUrl = routes.editWordlist.replace(':wlid', wordlist.id);
    return (
      <ListGroup.Item
        key={wordlist.id}
        className="d-flex justify-content-between align-items-start"
      >
        <div className="ms-2 me-auto">
          <h3 className="fw-bold">{wordlist.name}</h3>
          <ul>
            {Object.entries(wordlist.metadata ?? {}).map(([key, val]) => {
              if (val) {
                return (
                  <li key={key}>
                    {text('LABEL_VAL', {
                      label: text(key.toUpperCase()),
                      val,
                    })}
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
        <div className="d-flex flex-column align-items-end">
          <ButtonGroup>
            <Button href={viewUrl} variant="success">{text('VIEW')}</Button>
            <Button href={editUrl} variant="primary">{text('EDIT')}</Button>
            {user?.role === roles.admin ? <Button onClick={() => delWordlist(wordlist)} variant="danger">{text('DELETE')}</Button> : null }
          </ButtonGroup>
          <Badge pill bg="primary" text="white" hidden={!wordlist.status} className="mt-2">
            {wordlist.status}
          </Badge>
        </div>
      </ListGroup.Item>
    );
  });

  if (wordlists.length === 0) {
    if (isLoading) {
      return <h2>{text('LOADING')}</h2>;
    } else {
      return <h2 className="no-wordlists">{text('NO_VALS', { vals: text('WORDLISTS') })}</h2>;
    }
  }
  return (
    <div className="container mt-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>{text('WORDLISTS')}</h2>
        <Button href={routes.newWordlist}>{text('ADD_NEW', { what: text('WORDLIST') })}</Button>
      </div>
      {wordlists && wordlists.length && (
        <ListGroup>
          {wordlistsData}
        </ListGroup>
      )}
    </div>
  );
};

export default Wordlists;
