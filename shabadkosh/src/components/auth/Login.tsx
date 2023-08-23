/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form, Alert, Card, Button,
} from 'react-bootstrap';
import { UserCredential } from 'firebase/auth';
import GoogleButton from 'react-google-button';
import { Trans, useTranslation } from 'react-i18next';
import { useUserAuth } from '../UserAuthContext';
import checkUser from '../util/checkUser';
import routes from '../constants/routes';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { logIn, signInWithGoogle, logOut } = useUserAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    try {
      await logIn(email, password).then((data: UserCredential) => {
        const { uid } = data.user;
        if (email) {
          checkUser(uid, email).then((found) => {
            if (!found) {
              logOut();
              setError('Invalid user');
            }
          });
        }
      });
      navigate(routes.words);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async (e: any) => {
    e.preventDefault();
    try {
      // left with getting confirmation of logging to navigate to homepage
      await signInWithGoogle().then((success: any) => {
        if (success) {
          navigate(routes.words);
        }
      });
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <div className="container">
      <div className="p-4 box d-flex flex-column align-items-center">
        <h2 className="mb-3">{t('KOSH_LOGIN')}</h2>
        {error && <Alert variant="danger">{error}</Alert>}
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
