import bcrypt from 'bcrypt';
import userService from './users.service';

export const basicAuth = async (req: any, res: any, next: any) => {
    // make authenticate path public
    if (req.path === '/authenticate') {
        return next();
    }
    
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }
    
    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':').map(cred => bcrypt.hashSync(cred, 10));
    const user = await userService.authenticate({ username, password });
    if (!user) {
        return res.status(401).json({ message: 'Invalid Authentication Credentials' });
    }
    
    // attach user to request object
    req.user = user
    
    next();
};

export const errorHandler = (err: any, req: any, res: any, next: any) => {
    if (typeof (err) === 'string') {
        // custom application error
        return res.status(400).json({ message: err });
    }
    
    // default to 500 server error
    return res.status(500).json({ message: err.message });
};
