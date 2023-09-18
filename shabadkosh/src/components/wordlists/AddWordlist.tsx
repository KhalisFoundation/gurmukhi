/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  DocumentData, QuerySnapshot, Timestamp, onSnapshot,
} from 'firebase/firestore';
import React, { FormEvent, useEffect, useState } from 'react';
import {
  Form, Button, Card,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import { addNewWordlist, wordsCollection } from '../util/controller';
import { auth } from '../../firebase';
import routes from '../constants/routes';
import { MiniWord } from '../../types/word';
import { STATUS } from '../constants';
import { useUserAuth } from '../UserAuthContext';

const AddWordlist = () => {
  const [formValues, setFormValues] = useState({
  } as any);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [words, setWords] = useState<MiniWord[]>([]);
  const [selectedWords, setSelectedWords] = useState<MiniWord[]>([]);
  const { t } = useTranslation();
  const { user } = useUserAuth();

  useEffect(() => {
    setIsLoading(true);
    onSnapshot(wordsCollection, (snapshot: QuerySnapshot<DocumentData>) => {
      setWords(snapshot.docs.map((doc) => ({
        id: doc.id,
        word: doc.data().word,
      })));
    });

    setIsLoading(false);
  }, []);

  const onMultiselectChange = (selectedList: []) => {
    setSelectedWords(selectedList);
  };

  const resetState = () => {
    setValidated(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues, [event.target.id]: event.target.value,
    });
  };

  const addWordlist = (formData: any) => {
    setIsLoading(true);
    addNewWordlist({
      name: formData.name,
      status: formData.status ?? STATUS.ACTIVE,
      metadata: {
        curriculum: formData.curriculum ?? '',
        level: formData.level ?? '',
        subgroup: formData.subgroup ?? '',
      },
      words: formData.words ?? [],
      created_at: Timestamp.now(),
      created_by: auth.currentUser?.email ?? user.email,
      updated_at: Timestamp.now(),
      updated_by: auth.currentUser?.email ?? user.email,
      notes: formData.notes ?? '',
    }).finally(() => {
      setIsLoading(false);
    });

    resetState();
    setSubmitted(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    const formData = {
      ...formValues,
      words: selectedWords.map((word) => word.id),
    };

    addWordlist(formData);
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
      <h2>{t('ADD_NEW_WORDLIST')}</h2>
      <Form className="rounded p-4 p-sm-3" hidden={submitted} noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="name" onChange={handleChange}>
          <Form.Label>{t('NAME')}</Form.Label>
          <Form.Control type="text" placeholder="Wordlist name" required />
          <Form.Control.Feedback type="invalid">
            {t('ENTER_NAME_BELONGS', { for: t('WORDLIST') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="words">
          <Form.Label>{t('WORDS')}</Form.Label>
          <Multiselect
            options={words}
            displayValue="word"
            showCheckbox
            onSelect={onMultiselectChange}
            onRemove={onMultiselectChange}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="curriculum" onChange={handleChange}>
          <Form.Label>{t('CURRICULUM')}</Form.Label>
          <Form.Control type="text" placeholder="Curriculum" />
          <Form.Control.Feedback type="invalid">
            {t('ENTER_NAME', { for: t('CURRICULUM') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="level" onChange={handleChange}>
          <Form.Label>{t('LEVEL')}</Form.Label>
          <Form.Control type="text" placeholder="Level" />
          <Form.Control.Feedback type="invalid">
            {t('ENTER_TEXT', { for: t('LEVEL') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="subgroup" onChange={handleChange}>
          <Form.Label>{t('SUBGROUP')}</Form.Label>
          <Form.Control type="text" placeholder="Subgroup" />
          <Form.Control.Feedback type="invalid">
            {t('ENTER_NAME_BELONGS', { for: t('SUBGROUP') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="status" onChange={handleChange}>
          <Form.Label>{t('STATUS')}</Form.Label>
          <Form.Select aria-label="Default select example" defaultValue="active">
            {[STATUS.ACTIVE, STATUS.INACTIVE].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="notes" onChange={handleChange}>
          <Form.Label>{t('NOTES')}</Form.Label>
          <Form.Control as="textarea" rows={3} placeholder="Enter notes" />
        </Form.Group>

        <Button variant="primary" type="submit">
          {t('SUBMIT')}
        </Button>
      </Form>
      {submitted ? (
        <Card className="d-flex justify-content-center align-items-center background">
          <Card.Body className="rounded p-4 p-sm-3">
            <h3>{t('SUCCESS_UPDATE', { for: t('WORDLIST') })}</h3>
            <div className="d-flex justify-content-between align-items-center">
              <Button variant="primary" onClick={unsetSubmitted}>{t('ADD_ANOTHER', { what: t('WORDLIST') })}</Button>
              <Button variant="primary" onClick={() => navigate(routes.wordlists)}>{t('BACK_TO', { page: t('WORDLISTS') })}</Button>
            </div>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
};

export default AddWordlist;
