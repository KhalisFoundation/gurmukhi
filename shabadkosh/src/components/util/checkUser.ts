import {
  query, where, documentId, getDocs,
} from 'firebase/firestore';
import { usersCollection } from './users';

const checkUser = async (uid: string, email: string) => {
  const q = query(usersCollection, where(documentId(), '==', uid), where('email', '==', email));
  const usersSnapshot = await getDocs(q);
  if (!usersSnapshot.empty) {
    return true;
  }
  return false;
};

export default checkUser;
