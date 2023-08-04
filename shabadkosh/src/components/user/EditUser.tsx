/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form, Alert, Card, Button,
} from 'react-bootstrap';
import {
  Timestamp, doc, getDoc,
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { auth, firestore } from '../../firebase';
import roles from '../constants/roles';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';
import { updateUser, capitalize } from '../util';

function EditUser() {
  const { uid } = useParams();
  const getUser = doc(firestore, `users/${uid}`);

  const [localUser, setLocalUser] = useState({} as any);
  const [formValues, setFormValues] = useState({} as any);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [found, setFound] = useState<boolean>(true);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fillFormValues = (word: any) => {
    const formVal = {
    } as any;
    Object.keys(word).forEach((key) => {
      formVal[key] = word[key];
      (document.getElementById(key) as HTMLInputElement)?.setAttribute('value', word[key]);
    });
    setFormValues(formVal);
  };

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const docSnap = await getDoc(getUser);
      if (docSnap.exists()) {
        const newUserObj = {
          id: docSnap.id,
          created_at: docSnap.data().created_at ?? Timestamp.now(),
          created_by: docSnap.data().created_by ?? 'self',
          updated_at: docSnap.data().updated_at ?? Timestamp.now(),
          updated_by: docSnap.data().updated_by ?? '',
          ...docSnap.data(),
        };
        setLocalUser(newUserObj);
        fillFormValues(newUserObj);
        setIsLoading(false);
      } else {
        setFound(false);
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e: any) => {
    setFormValues({
      ...formValues, [e.target.id]: e.target.value,
    });
  };

  const resetState = () => {
    setValidated(false);
  };

  const editUser = (formData: any) => {
    setIsLoading(true);

    updateUser(
      getUser,
      {
        displayName: formData.name,
        email: formData.email,
        role: formData.role,
        created_at: formValues.created_at ?? localUser.created_at,
        created_by: formValues.created_by ?? localUser.created_by,
        updated_at: Timestamp.now(),
        updated_by: auth.currentUser?.email,
      },
    ).finally(() => {
      setIsLoading(false);
    });

    resetState();
    setSubmitted(true);
  };

  const handleSubmit = async (e : any) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }
    editUser(formValues);
  };

  if (isLoading) {
    return <h2>{t('LOADING')}</h2>;
  }
  if (!found) {
    return <h2>{t('USER_NOT_FOUND')}</h2>;
  }
  if (user?.role !== roles.admin) {
    return <h2>{t('NO_ACCESS')}</h2>;
  }
  return (
    <div className="container">
      <div className="p-4 box">
        <h2 className="mb-3">{t('UPDATE_USER')}</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form className="rounded p-4 p-sm-3" hidden={submitted} noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>{t('NAME')}</Form.Label>
            <Form.Control
              type="name"
              placeholder="Name"
              onChange={handleChange}
              defaultValue={localUser.displayName}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="role" onChange={handleChange}>
            <Form.Label>{t('ROLE')}</Form.Label>
            <Form.Select aria-label="Default select example" defaultValue={localUser.role}>
              {Object.entries(roles).map((ele) => {
                const [key, value] = ele;
                return (
                  <option key={key} value={key}>{capitalize(value)}</option>
                );
              })}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>{t('EMAIL')}</Form.Label>
            <Form.Control
              type="email"
              placeholder="Email address"
              onChange={handleChange}
              defaultValue={localUser.email}
              disabled
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button variant="primary" type="submit">
              {t('SUBMIT')}
            </Button>
          </div>
        </Form>
        {submitted ? (
          <Card className="background mt-4">
            <Card.Body className="rounded p-4 p-sm-3">
              <h3>{t('userSuccessUpdate')}</h3>
              <Button variant="primary" onClick={() => navigate(routes.users)}>{t('BACK_TO', { page: t('USERS') })}</Button>
            </Card.Body>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export default EditUser;
