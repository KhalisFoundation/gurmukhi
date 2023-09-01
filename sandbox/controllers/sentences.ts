import { db } from "../config";

export const getSentences = async (req: any, res: any, next: any) => {
  try {
    const word_id = req.params.word_id;
    const sentences = await db.collection("sentences").where("word_id", "==", word_id).get();
    const sentencesArr: any[] = [];
    if (sentences.empty) {
      res.status(404).send(`Sentences not found with word id: ${word_id}!`);
    } else {
      sentences.forEach((sentence: any) => {
        sentencesArr.push({
          id: sentence.id,
          ...sentence.data(),
        });
      });
      res.send(sentencesArr);
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const getSentence = async (req: any, res: any, next: any) => {
  try {
    console.log(req.params);
    const sentence = await db.collection("sentences").doc(req.params.sentence_id).get();
    if (!sentence.exists) {
      res.status(404).send("Sentence not found!");
    } else {
      res.send({
        id: sentence.id,
        ...sentence.data(),
      });
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};
