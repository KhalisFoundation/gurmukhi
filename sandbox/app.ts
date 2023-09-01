require('dotenv').config();
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cacheControl from 'express-cache-controller';

import { routes } from './routes';
import { basicAuth, errorHandler } from './auth/basic-auth';

const app = express();
app.use(express.json());
app.use(cors());
app.use(cacheControl({ maxAge: 21600 }));

app.use(basicAuth);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/v1', routes);
// app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/v1/auth', require('./auth/users.controller'));
app.use(errorHandler);

// sends error 404 message if necessary
app.use((req: any, res: any) => {
  res.cacheControl = { noCache: true };
  res.status(404).send({ url: `${req.originalUrl} not found` });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
