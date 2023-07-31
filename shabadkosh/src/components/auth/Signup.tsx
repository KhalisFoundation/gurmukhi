/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form, Alert, Button,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import roles from '../constants/roles';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';
import { checkIfEmailUnique } from '../util';

function Signup() {
  const [email, setEmail] = useState('');
  const [diplayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const { signUp } = useUserAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e : any) => {
    e.preventDefault();
    setError('');
    try {
      const role = roles.creator;
      await checkIfEmailUnique(email).then(async (unique) => {
        if (unique) {
          await signUp(diplayName, role, email, password).then((val: any) => {
            if (val) {
              navigate(routes.words);
            }
          });
        } else {
          setError('Username already exists!');
        }
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container justify-content-center">
      <h2 className="mb-3">{t('KOSH_SIGNUP')}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form
        onSubmit={handleSubmit}
        className="w-100"
      >
        <Form.Group className="mb-3" controlId="formBasicName">
          <Form.Label>{t('FULL_NAME')}</Form.Label>
          <Form.Control
            type="name"
            placeholder="Name"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicRole">
          <Form.Label>{t('ROLE')}</Form.Label>
          <Form.Control
            type="role"
            placeholder="Role"
            defaultValue="Creator"
            disabled
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>{t('EMAIL')}</Form.Label>
          <Form.Control
            type="email"
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>{t('PASSWORD')}</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <div className="d-grid gap-2">
          <Button variant="primary" type="submit">
            {t('SIGNUP')}
          </Button>
        </div>
        <div
          className="p-4 box mt-3 text-center bg-white"
        >
          {t('ALREADY_HAVE_ACC')}
          <Link to="/">{t('LOGIN')}</Link>
        </div>
      </Form>
    </div>
  );
}

export default Signup;
