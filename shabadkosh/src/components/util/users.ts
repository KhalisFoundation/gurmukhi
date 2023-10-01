import {
  DocumentReference, collection, doc, getDoc, getDocs, query, setDoc, where,
} from 'firebase/firestore';
import db from './controller';
import { UserProfile } from 'firebase/auth';

export const usersCollection = collection(db, 'users');

export const checkIfUsernameUnique = async (username: string) => {
  const queryStatement = query(usersCollection, where('username', '==', username));
  const usersSnapshot = await getDocs(queryStatement);
  return usersSnapshot.empty;
};

export const checkIfEmailUnique = async (email: string) => {
  const queryStatement = query(usersCollection, where('email', '==', email));
  const usersSnapshot = await getDocs(queryStatement);
  return usersSnapshot.empty;
};

export const updateUser = async (userRef: DocumentReference, userData: UserProfile) => {
  const updatedUser = await setDoc(userRef, {
    ...userData,
  });
  return updatedUser;
};

export const getUser = async (email: string, uid: string) => {
  // uid is the document id of the user
  const userRef = doc(usersCollection, uid);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const user = userDoc.data();
    // check if the email matches
    if (user.email === email) {
      return user;
    }
  }
  return null;
};
