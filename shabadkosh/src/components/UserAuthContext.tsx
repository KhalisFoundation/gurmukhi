/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable consistent-return */
import React, {
  ReactElement,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import {
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  Timestamp, doc, setDoc,
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { auth, firestore } from '../firebase';
import { getUser } from './util';
import checkUser from './util/checkUser';
import roles from './constants/roles';
import errors from './constants/error';

const userAuthContext = createContext<any>(null);

export const UserAuthContextProvider = ({ children }: { children:ReactElement }) => {
  const [user, setUser] = useState({});
  const { t } = useTranslation();

  const logIn = (
    email: string,
    password: string,
  ) => signInWithEmailAndPassword(auth, email, password);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider)
      .then((userCredential) => {
        const { uid, email, displayName } = userCredential.user;
        return checkUser(uid, email ?? '').then((found) => {
          if (!found) {
            const localUser = doc(firestore, `users/${uid}`);
            setDoc(localUser, {
              role: roles.unassigned,
              email,
              displayName: displayName ?? email?.split('@')[0],
              created_at: Timestamp.now(),
              created_by: t('SELF'),
              updated_at: Timestamp.now(),
              updated_by: t('SELF'),
            }).then(() => true);
          } else {
            return true;
          }
          setUser(userCredential.user);
        });
      }).catch((error: any) => {
        if (Object.keys(errors).includes(error.code)) {
          alert(errors[error.code]);
        }
        return false;
      });
  };

  const signUp = async (
    name: string,
    role: string,
    email: string,
    password: string,
  ) => createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const userData = userCredential.user;
      const { uid, displayName } = userData;
      const localUser = doc(firestore, `users/${uid}`);
      setDoc(localUser, {
        name,
        role,
        email,
        displayName: displayName ?? name,
        created_at: Timestamp.now(),
        created_by: t('SELF'),
        updated_at: Timestamp.now(),
        updated_by: t('SELF'),
      });
      setUser(userData);

      sendEmailVerification(auth.currentUser ?? userData).then(() => {
        alert(t('EMAIL_VERIFICATION_SENT'));
      });
      return true;
    })
    .catch((error: any) => {
      if (Object.keys(errors).includes(error.code)) {
        alert(errors[error.code]);
      }
      return false;
    });

  const logOut = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentuser: any) => {
      if (currentuser !== null) {
        const { uid, email } = currentuser;
        getUser(email ?? '', uid)
          .then((data) => {
            const usr = {
              user,
              uid,
              email: data?.email,
              displayName: data?.displayName,
              photoURL: '',
              role: data?.role,
            };
            setUser(usr);
          });
      }
      setUser(currentuser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <userAuthContext.Provider value={{
      user, logIn, signUp, logOut, signInWithGoogle,
    }}
    >
      {children}
    </userAuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(userAuthContext);
