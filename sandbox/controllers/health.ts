import { db } from "../config";

export const healthCheck = async (req: any, res: any) => {
  try {
    const testDocRef = db.collection('test').doc('testDoc');
    const testDocSnapshot = await testDocRef.get();

    if (testDocSnapshot.exists) {
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(500).json({ status: 'error', message: 'Test document not found' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Firestore connection error' });
  }
};
