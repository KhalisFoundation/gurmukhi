import React, { useEffect, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { auth } from '../../firebase';
import roles from '../constants/roles';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';
import { User } from 'firebase/auth';

const Profile = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useUserAuth();
  const { t: text } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    auth.onAuthStateChanged((usr) => {
      if (usr) {
        setAuthUser(usr);
        setIsLoading(false);
      } else {
        setAuthUser(null);
      }
    });
  }, []);

  const editUrl = routes.editUser.replace(':uid', user.uid);

  if (isLoading) {
    return <h2>{text('LOADING')}</h2>;
  }
  return (
    <div className="container m-4">
      <Card>
        <Card.Body>
          <Card.Title>
            {text('PROFILE')}
            <Button
              href={editUrl}
              className="bg-transparent border-0"
              hidden={user?.role !== roles.admin}
            >
              🖊️
            </Button>
          </Card.Title>
          <Card.Text>
            <p>
              {text('NAMED', { name: user?.displayName })}
            </p>
            <p>
              {text('WITH_ROLE', { role: user?.role })}
            </p>
            <p>
              {text('EMAILED', { email: authUser?.email })}
            </p>
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Profile;
