require('dotenv').config();
import fs from "firebase-admin";

var serviceAccount = require("../gurmukhi-dev-firebase-adminsdk.json");

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount)
});

export const db = fs.firestore();
