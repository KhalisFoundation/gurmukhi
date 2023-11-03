/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form, Alert, Button,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import roles from '../constants/roles';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';
import { checkIfEmailUnique } from '../util';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [diplayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const { signUp } = useUserAuth();
  const navigate = useNavigate();
  const { t: text } = useTranslation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      const role = roles.unassigned;
      await checkIfEmailUnique(email).then(async (unique) => {
        if (unique) {
          await signUp(diplayName, role, email, password).then((val: any) => {
            if (val) {
              navigate(routes.words);
            }
          });
        } else {
          setErrorMessage('Username already exists!');
        }
      });
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="container justify-content-center">
      <h2 className="mb-3">{text('KOSH_SIGNUP')}</h2>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form
        onSubmit={handleSubmit}
        className="w-100"
      >
        <Form.Group className="mb-3" controlId="formBasicName">
          <Form.Label>{text('FULL_NAME')}</Form.Label>
          <Form.Control
            type="name"
            placeholder="Name"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicRole">
          <Form.Label>{text('ROLE')}</Form.Label>
          <Form.Control
            type="role"
            placeholder="Role"
            defaultValue={roles.unassigned}
            disabled
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>{text('EMAIL')}</Form.Label>
          <Form.Control
            type="email"
            placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>{text('PASSWORD')}</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <div className="d-grid gap-2">
          <Button variant="primary" type="submit">
            {text('SIGNUP')}
          </Button>
        </div>
        <div
          className="p-4 box mt-3 text-center bg-white"
        >
          {text('ALREADY_HAVE_ACC')}
          <Link to="/">{text('LOGIN')}</Link>
        </div>
      </Form>
    </div>
  );
};

export default Signup;
