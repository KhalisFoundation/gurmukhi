/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';

const Logout = () => {
  const navigate = useNavigate();
  const { logOut } = useUserAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await logOut();
        navigate(routes.login);
      } catch (error: any) {
        console.log(error.message);
      }
    };
    handleLogout();
  }, []);

  return (
    <h2>{t('LOGGING_OUT')}</h2>
  );
};

export default Logout;
