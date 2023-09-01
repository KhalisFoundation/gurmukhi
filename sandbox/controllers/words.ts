import { db } from '../config';

export const getWords = async (req: any, res: any, next: any) => {
  try {
    const words = await db.collection('words').get();
    let wordsArr: any[] = [];
    if (words.empty) {
      res.status(404).send('No words found!.');
    } else {
      words.forEach((wordData: any) => {
        wordsArr.push({
          id: wordData.id,
          ...wordData.data(),
        });
      });
      res.send(wordsArr);
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const getWord = async (req: any, res: any, next: any) => {
  try {
    const word = await db.collection('words').doc(req.params.id).get();
    if (!word.exists) {
      res.status(404).send('Word not found!.');
    } else {
      res.send({
        id: word.id,
        ...word.data(),
      });
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};
