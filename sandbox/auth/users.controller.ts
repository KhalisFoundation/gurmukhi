import express from 'express';
import userService from './users.service';

const router = express.Router();

const authenticate = (req: any, res: any, next: any) => {
    userService.authenticate(req.body)
        .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
        .catch(err => next(err));
};

router.post('/authenticate', authenticate);

module.exports = router;
