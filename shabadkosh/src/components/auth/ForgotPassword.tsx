import React, { FormEvent, useState } from 'react';
import {
  Button, Form, FormGroup,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { passwordReset } from '../../firebase';
import errors from '../constants/error';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await passwordReset(email);
      setEmailMessage(true);
    } catch (err: any) {
      if (Object.keys(errors).includes(err.code)) {
        alert(errors[err.code]);
        setEmail('');
      }
    }
  };

  return (
    <div className="d-flex justify-content-center">
      {
        emailMessage
          ? <h3>{t('PWD_RESET_EMAIL_SENT')}</h3>
          : (
            <Form onSubmit={handleSubmit}>
              <FormGroup controlId="email">
                <Form.Label>{t('EMAIL')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormGroup>
              <div className="d-grid gap-2">
                <Button variant="primary" type="submit">
                  {t('SUBMIT')}
                </Button>
              </div>
            </Form>
          )
      }
    </div>
  );
};

export default ForgotPassword;