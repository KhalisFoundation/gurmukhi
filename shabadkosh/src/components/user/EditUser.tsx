/* eslint-disable react-hooks/exhaustive-deps */
import React, { FormEvent, useEffect, useState } from 'react';
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
import { NewUserType } from '../../types';
import { UserProfile } from 'firebase/auth';

const EditUser = () => {
  const { uid } = useParams();
  const getUser = doc(firestore, `users/${uid}`);

  const [localUser, setLocalUser] = useState({} as NewUserType);
  const [formValues, setFormValues] = useState({} as UserProfile);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [found, setFound] = useState<boolean>(true);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { user } = useUserAuth();
  const navigate = useNavigate();
  const { t: text } = useTranslation();

  const fillFormValues = (formData: any) => {
    const formVal = {
    } as UserProfile;
    Object.keys(formData).forEach((key) => {
      formVal[key] = formData[key];
      (document.getElementById(key) as HTMLInputElement)?.setAttribute('value', formData[key]);
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
        } as NewUserType;
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues, [event.target.id]: event.target.value,
    });
  };

  const resetState = () => {
    setValidated(false);
  };

  const editUser = (formData: UserProfile) => {
    setIsLoading(true);

    updateUser(
      getUser,
      {
        displayName: formData.name ?? formData.displayName,
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

  const handleSubmit = async (event : FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setError('');

    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }
    editUser(formValues);
  };

  if (isLoading) {
    return <h2>{text('LOADING')}</h2>;
  }
  if (!found) {
    return <h2>{text('USER_NOT_FOUND')}</h2>;
  }
  if (user?.role !== roles.admin) {
    return <h2>{text('NO_ACCESS')}</h2>;
  }
  return (
    <div className="container">
      <div className="p-4 box">
        <h2 className="mb-3">{text('UPDATE_USER')}</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form className="rounded p-4 p-sm-3" hidden={submitted} noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="name">
            <Form.Label>{text('NAME')}</Form.Label>
            <Form.Control
              type="name"
              placeholder="Name"
              onChange={handleChange}
              defaultValue={localUser.displayName}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="role" onChange={handleChange}>
            <Form.Label>{text('ROLE')}</Form.Label>
            <Form.Select aria-label="Default select example" defaultValue={localUser.role}>
              {Object.entries(roles).map((role) => {
                const [roleId, value] = role;
                return (
                  <option key={roleId} value={roleId}>{capitalize(value)}</option>
                );
              })}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>{text('EMAIL')}</Form.Label>
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
              {text('SUBMIT')}
            </Button>
          </div>
        </Form>
        {submitted ? (
          <Card className="background mt-4">
            <Card.Body className="rounded p-4 p-sm-3">
              <h3>{text('USER_UPDATE_SUCCESS')}</h3>
              <Button variant="primary" onClick={() => navigate(routes.users)}>{text('BACK_TO', { page: text('USERS') })}</Button>
            </Card.Body>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default EditUser;
