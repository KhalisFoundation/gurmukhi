import os from 'os';
import express from 'express';
import * as pjson from '../package.json';
import {
    getWords,
    getWord,
    getWordlists,
    getWordlist,
    getSentences,
    getSentence,
    getQuestions,
    getQuestion,
    healthCheck
} from '../controllers';

const route = express.Router();

// Routes
route.get('/', (req, res) => {
    res.json({
        name: 'Shabadavali API',
        version: pjson.version,
        endpoint: os.hostname(),
    });
});

route.get('/health', healthCheck);

route.get('/words', getWords);
route.get('/words/:id', getWord);

route.get('/wordlists', getWordlists);
route.get('/wordlists/:id', getWordlist);

route.get('/sentences/:word_id', getSentences);
route.get('/sentence/:sentence_id', getSentence);

route.get('/questions/:word_id', getQuestions);
route.get('/question/:question_id', getQuestion);

export const routes = route;
