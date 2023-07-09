import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import db from './controller'

export const usersCollection = collection(db, 'users');
export const checkUser = async (email: string, pwd: string) => {
    const q = query(usersCollection, where('email', '==', email), where('pwd', '==', pwd));
    const usersSnapshot = await getDocs(q);
    if (!usersSnapshot.empty) {
        const user = usersSnapshot.docs[0];
        localStorage.setItem('user', JSON.stringify(user.data()));
        return true;
    }
    return false;
}

export const checkIfUsernameUnique = async (username: string) => {
    const q = query(usersCollection, where('username', '==', username));
    const usersSnapshot = await getDocs(q);
    return usersSnapshot.empty;
}

export const checkIfEmailUnique = async (email: string) => {
    const q = query(usersCollection, where('email', '==', email));
    const usersSnapshot = await getDocs(q);
    return usersSnapshot.empty;
}

export const getUser = async (email: string, uid: string) => {
    // uid is the document id of the user
    const getUser = doc(usersCollection, uid);
    const userDoc = await getDoc(getUser);
    if (userDoc.exists()) {
        const user = userDoc.data();
        // check if the email matches
        if (user.email === email) {
            return user;
        }
    }
    return null;
}