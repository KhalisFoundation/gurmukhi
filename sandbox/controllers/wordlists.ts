import { db } from "../config";

export const getWordlists = async (req: any, res: any, next: any) => {
  try {
    const wordlists = await db.collection('wordlists').get();
    let wordlistsArr: any[] = [];
    if (wordlists.empty) {
      res.status(404).send('No wordlists found!.');
    } else {
      wordlists.forEach((wordData: any) => {
        wordlistsArr.push({
          id: wordData.id,
          ...wordData.data(),
        });
      });
      res.send(wordlistsArr);
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const getWordlist = async (req: any, res: any, next: any) => {
  try {
    const wordlist = await db.collection('wordlists').doc(req.params.id).get();
    if (!wordlist.exists) {
      res.status(404).send('Wordlist not found!.');
    } else {
      res.send({
        id: wordlist.id,
        ...wordlist.data(),
      });
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};
