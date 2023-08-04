/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  Button, Container, ListGroup, ButtonGroup,
} from 'react-bootstrap';
import {
  DocumentData, QuerySnapshot, doc, onSnapshot,
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { firestore } from '../../firebase';
import roles from '../constants/roles';
import routes from '../constants/routes';
import { useUserAuth } from '../UserAuthContext';
import { NewUserType } from '../../types/user';
import { compareUpdatedAt, deleteWord, usersCollection } from '../util';

const Users = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<NewUserType[]>([]);
  const { user } = useUserAuth();
  const { t } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    if (user?.role !== roles.admin) {
      onSnapshot(usersCollection, (snapshot:
      QuerySnapshot<DocumentData>) => {
        setUsers(
          snapshot.docs.map((userDoc) => ({
            id: userDoc.id,
            created_at: userDoc.data().created_at,
            updated_at: userDoc.data().updated_at,
            created_by: userDoc.data().created_by,
            updated_by: userDoc.data().updated_by,
            ...userDoc.data(),
          })),
        );
      });

      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const sortedUsers = users.sort(
    (p1, p2) => compareUpdatedAt(p1, p2),
  );

  const delUser = (lUser: any) => {
    if (lUser.email === user.email && lUser.id === user.uid) {
      alert('Self-destruct is not allowed!');
      return;
    }
    const response = window.confirm(`Are you sure you to delete this user: ${lUser.displayName}? \n This action is not reversible.`);
    if (response) {
      const getWord = doc(firestore, `users/${lUser.id}`);
      deleteWord(getWord).then(() => {
        alert('User deleted!');
      });
    }
  };

  const usersData = sortedUsers?.map((cuser) => {
    const editUrl = routes.editUser.replace(':uid', cuser.id ?? '');
    return (
      <ListGroup.Item
        key={cuser.id}
        className="d-flex justify-content-between align-items-start"
      >
        <div className="ms-2 me-auto">
          <h5 className="fw-bold">{cuser.displayName}</h5>
          <p>
            {t('EMAILED', { email: cuser.email })}
          </p>
          <p>
            {t('WITH_ROLE', { role: cuser.role })}
          </p>
        </div>
        <div className="d-flex flex-column align-items-end">
          <ButtonGroup>
            <Button
              href={editUrl}
              className="bg-transparent border-0"
              hidden={user?.role !== roles.admin}
            >
              {t('PEN')}
            </Button>
            <Button
              onClick={() => delUser(cuser)}
              className="bg-transparent border-0"
              hidden={user?.role !== roles.admin}
            >
              {t('BIN')}
            </Button>
          </ButtonGroup>
        </div>
      </ListGroup.Item>
    );
  });

  if (users.length === 0 || isLoading) {
    return <h2>{t('LOADING')}</h2>;
  }
  if (user?.role !== roles.admin) {
    return <h2>{t('NO_ACCESS')}</h2>;
  }
  return (
    <div className="container">
      <h2>{t('USERS')}</h2>
      {users && users.length ? (
        <div className="d-flex ms-2 justify-content-evenly">
          <Container className="p-4">
            <ListGroup>{usersData}</ListGroup>
          </Container>
        </div>
      ) : (
        <h2 className="no-words">{t('NO_USERS_FOUND')}</h2>
      )}
    </div>
  );
};

export default Users;
