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
  const { t: text } = useTranslation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await passwordReset(email);
      setEmailMessage(true);
    } catch (error: any) {
      if (Object.keys(errors).includes(error.code)) {
        alert(errors[error.code]);
        setEmail('');
      }
    }
  };

  return (
    <div className="d-flex justify-content-center">
      {
        emailMessage
          ? <h3>{text('PWD_RESET_EMAIL_SENT')}</h3>
          : (
            <Form onSubmit={handleSubmit}>
              <FormGroup controlId="email">
                <Form.Label>{text('EMAIL')}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormGroup>
              <div className="d-grid gap-2">
                <Button variant="primary" type="submit">
                  {text('SUBMIT')}
                </Button>
              </div>
            </Form>
          )
      }
    </div>
  );
};

export default ForgotPassword;
