/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';
import { Alert } from 'react-bootstrap';

const Logout = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const { logOut } = useUserAuth();
  const { t: text } = useTranslation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logOut();
        navigate(routes.login);
      } catch (error: any) {
        setErrorMessage(error.message);
      }
    };
    handleLogout();
  }, []);

  return (
    errorMessage ? <Alert variant="danger">{errorMessage}</Alert> 
      : <h2>{text('LOGGING_OUT')}</h2>
  );
};

export default Logout;
