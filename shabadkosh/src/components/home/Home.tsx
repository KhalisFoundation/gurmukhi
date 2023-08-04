/* eslint-disable  @typescript-eslint/no-explicit-any */
import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useUserAuth } from '../UserAuthContext';
import routes from '../constants/routes';

const Home = () => {
  const { logOut, user } = useUserAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleLogout = async () => {
    try {
      await logOut();
      navigate(routes.login);
    } catch (error: any) {
      console.log(error.message);
    }
  };

  return (
    <div className="container p-4">
      <Card>
        <Card.Body className="m-2 p-2">
          <div className="p-4 box mt-3 text-center">
            <Trans components={{
              newline: <br />,
            }}
            >
              {t('HOME_DATA', {
                user_name: user.displayName,
              })}
            </Trans>
          </div>
          <div className="d-grid gap-2 col-6 mx-auto">
            <Button variant="primary" onClick={handleLogout}>
              {t('LOGOUT')}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Home;
