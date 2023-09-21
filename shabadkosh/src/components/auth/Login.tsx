/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form, Alert, Card, Button,
} from 'react-bootstrap';
import GoogleButton from 'react-google-button';
import { Trans, useTranslation } from 'react-i18next';
import { useUserAuth } from '../UserAuthContext';
import checkUser from '../util/checkUser';
import routes from '../constants/routes';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { logIn, signInWithGoogle, logOut } = useUserAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      const userCredential = await logIn(email, password);
      const { uid } = userCredential.user;
      if (email) {
        const found = await checkUser(uid, email);
        if (!found) {
          logOut();
          setErrorMessage('Invalid user');
        }
      }
      navigate(routes.words);
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  const handleGoogleSignIn = async (event: React.MouseEvent) => {
    event.preventDefault();
    try {
      // left with getting confirmation of logging to navigate to homepage
      const success = await signInWithGoogle();
      if (success) {
        navigate(routes.words);
      }
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <div className="container">
      <div className="p-4 box d-flex flex-column align-items-center">
        <h2 className="mb-3">{t('KOSH_LOGIN')}</h2>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Control
              type="email"
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Control
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button variant="primary" type="submit">
              {t('LOGIN')}
            </Button>
          </div>
        </Form>
        <hr className="w-100" />
        <div>
          <GoogleButton
            className="g-btn"
            type="dark"
            onClick={handleGoogleSignIn}
          />
        </div>
        <Card
          className="p-4 box mt-3 text-center w-50"
        >
          <Trans components={{ newline: <br /> }}>CONTACT_ADMIN</Trans>
          <a href={routes.signup}>{t('SIGNUP')}</a>

          <br />
          <Link to="/forgot-password">{t('FORGOT_PASSWORD')}</Link>
        </Card>
      </div>
    </div>
  );
};

export default Login;
