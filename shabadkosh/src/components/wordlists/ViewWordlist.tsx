/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Card, Breadcrumb, ButtonGroup, Button, NavLink, Badge,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { Trans, useTranslation } from 'react-i18next';
import { MiniWord } from '../../types/word';
import { firestore } from '../../firebase';
import roles from '../constants/roles';
import routes from '../constants/routes';
import {
  deleteWordlist,
  getWordsByIdList,
  convertTimestampToDateString,
} from '../util';
import { useUserAuth } from '../UserAuthContext';

function ViewWordlist() {
  const { wlid } = useParams();
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const getWordlist = doc(firestore, `wordlists/${wlid}`);

  const [wordlist, setWordlist] = useState<any>({
  });
  const [found, setFound] = useState<boolean>(true);
  const [words, setWords] = useState<MiniWord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchWordlist = async () => {
      setIsLoading(true);
      const docSnap = await getDoc(getWordlist);
      if (docSnap.exists()) {
        const newWordObj = {
          id: docSnap.id,
          created_at: docSnap.data().created_at,
          updated_at: docSnap.data().updated_at,
          created_by: docSnap.data().created_by,
          words: docSnap.data().words ?? [],
          ...docSnap.data(),
        };
        setWordlist(newWordObj);
        const data = await getWordsByIdList(newWordObj.words);
        const listOfWords = data?.map((ele) => ({
          id: ele.id,
          word: ele.data().word,
        } as MiniWord));
        setWords(listOfWords ?? []);
        setIsLoading(false);
      } else {
        setFound(false);
        setIsLoading(false);
      }
    };
    fetchWordlist();
  }, []);

  const wordsData = words?.map((ele) => (
    <li key={ele.id} className="row">
      <NavLink
        className="col-4 text-center border rounded-pill m-1"
        href={routes.word.replace(':wordid', ele.id ?? '')}
        key={ele.id}
      >
        {ele.word}
      </NavLink>
    </li>
  ));

  const editUrl = routes.editWordlist.replace(':wlid', wordlist.id);
  const delWordlist = (remWordlist: any) => {
    const response = window.confirm(`Are you sure you want to delete this wordlist: ${remWordlist.name}? \n This action is not reversible.`);
    if (response) {
      setIsLoading(true);
      const wordlistDoc = doc(firestore, `wordlists/${remWordlist.id}`);
      deleteWordlist(wordlistDoc).then(() => {
        setIsLoading(false);
        alert('Wordlist deleted!');
        navigate(routes.wordlists);
      }).catch((error) => {
        console.log('error while deleting wordlist', error);
      });
    }
  };

  if (isLoading) {
    return (
      <h2>
        {t('LOADING')}
      </h2>
    );
  }
  if (!found) {
    return <h2>{t('NOT_FOUND', { what: t('WORD') })}</h2>;
  }
  return (
    <div className="container">
      <Card className="details p-5">
        <Breadcrumb>
          <Breadcrumb.Item href={routes.home}>{t('HOME')}</Breadcrumb.Item>
          <Breadcrumb.Item href={routes.wordlists}>{t('WORDLISTS')}</Breadcrumb.Item>
          <Breadcrumb.Item active>{wordlist.name}</Breadcrumb.Item>
        </Breadcrumb>
        {Object.keys(wordlist) && Object.keys(wordlist).length && (
          <div className="d-flex flex-column justify-content-evenly">
            <span>
              <div className="d-flex justify-content-between">
                <h2>{wordlist.name}</h2>
                <ButtonGroup className="d-flex align-self-end">
                  <Button href={editUrl}>{t('EDIT')}</Button>
                  {user?.role === roles.admin ? <Button onClick={() => delWordlist(wordlist)} variant="danger">{t('DELETE')}</Button> : null}
                </ButtonGroup>
              </div>
              <Badge
                bg="primary"
              >
                {wordlist.status}
              </Badge>
            </span>
            <br />
            <h5>
              <Trans components={{
                bold: <b />,
              }}
              >
                {t('WORDS_COUNT', { count: words.length })}
              </Trans>
            </h5>
            <ul>
              {wordsData}
            </ul>
            <div className="d-flex flex-column justify-content-evenly">
              <span>
                <h5><b>{t('METADATA')}</b></h5>
                <h6>
                  {t('LABEL_VAL', { label: t('CURRICULUM'), val: wordlist.metadata?.curriculum })}
                </h6>
                <h6>
                  {t('LABEL_VAL', { label: t('LEVEL'), val: wordlist.metadata?.level })}
                </h6>
                <h6>
                  {t('LABEL_VAL', { label: t('SUBGROUP'), val: wordlist.metadata?.subgroup })}
                </h6>
              </span>

              <p className="mt-3" hidden={!wordlist.notes}>
                {t('LABEL_VAL', { label: t('NOTES'), val: wordlist.notes })}
              </p>

              <br />
              <h5><b>{t('INFO')}</b></h5>
              <div className="d-flex justify-content-between flex-column">
                <h6>
                  {t('LABEL_VAL', {
                    label: t('CREATED_BY'),
                    val: wordlist.created_by ? wordlist.created_by : 'Unknown',
                  })}
                </h6>
                <h6>
                  {t('LABEL_VAL', {
                    label: t('CREATED_AT'),
                    val: convertTimestampToDateString(wordlist.created_at, t),
                  })}
                </h6>
                <h6>
                  {t('LABEL_VAL', {
                    label: t('LAST_UPDATED_BY'),
                    val: wordlist.updated_by ? wordlist.updated_by : 'Unknown',
                  })}
                </h6>
                <h6>
                  {t('LABEL_VAL', {
                    label: t('LAST_UPDATED_AT'),
                    val: convertTimestampToDateString(wordlist.updated_at, t),
                  })}
                </h6>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ViewWordlist;
