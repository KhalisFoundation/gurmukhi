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
  const { t: text } = useTranslation();

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
    (p1, p2) => compareUpdatedAt(p1.updated_at, p2.updated_at),
  );

  const delUser = (lUser: NewUserType) => {
    if (lUser.email === user.email && lUser.id === user.uid) {
      alert(text('SELF_DESTRUCT'));
      return;
    }
    const response = window.confirm(text('DELETE_CONFIRM', { what: lUser.displayName }));
    if (response) {
      const getWord = doc(firestore, `users/${lUser.id}`);
      deleteWord(getWord).then(() => {
        alert(text('DELETE_USER', { what: 'User' }));
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
            {text('EMAILED', { email: cuser.email })}
          </p>
          <p>
            {text('WITH_ROLE', { role: cuser.role })}
          </p>
        </div>
        <div className="d-flex flex-column align-items-end">
          <ButtonGroup>
            <Button
              href={editUrl}
              className="bg-transparent border-0"
              hidden={user?.role !== roles.admin}
            >
              {text('PEN')}
            </Button>
            <Button
              onClick={() => delUser(cuser)}
              className="bg-transparent border-0"
              hidden={user?.role !== roles.admin}
            >
              {text('BIN')}
            </Button>
          </ButtonGroup>
        </div>
      </ListGroup.Item>
    );
  });

  if (users.length === 0 || isLoading) {
    return <h2>{text('LOADING')}</h2>;
  }
  if (user?.role !== roles.admin) {
    return <h2>{text('NO_ACCESS')}</h2>;
  }
  return (
    <div className="container">
      <h2>{text('USERS')}</h2>
      {users && users.length ? (
        <div className="d-flex ms-2 justify-content-evenly">
          <Container className="p-4">
            <ListGroup>{usersData}</ListGroup>
          </Container>
        </div>
      ) : (
        <h2 className="no-words">{text('NO_USERS_FOUND')}</h2>
      )}
    </div>
  );
};

export default Users;
