import { db } from "../config";

export const getQuestions = async (req: any, res: any, next: any) => {
  try {
    const word_id = req.params.word_id;
    const questions = await db.collection("questions").where("word_id", "==", word_id).get();
    const questionsArr: any[] = [];
    if (questions.empty) {
      res.status(404).send(`Questions not found with word id: ${word_id}!`);
    } else {
      questions.forEach((question: any) => {
        questionsArr.push({
          id: question.id,
          ...question.data(),
        });
      });
      res.send(questionsArr);
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};

export const getQuestion = async (req: any, res: any, next: any) => {
  try {
    console.log(req.params);
    const question = await db.collection("questions").doc(req.params.question_id).get();
    if (!question.exists) {
      res.status(404).send("Question not found!");
    } else {
      res.send({
        id: question.id,
        ...question.data(),
      });
    }
  } catch (error: any) {
    res.status(400).send(error.message);
  }
};
