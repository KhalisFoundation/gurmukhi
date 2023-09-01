require('dotenv').config();
import bcrypt from 'bcrypt';

// API users hardcoded for now, should be stored in a db for production applications
const users = [{ id: 1, username: 'admin', password: bcrypt.hashSync(process.env.ACCESS_TOKEN ?? '', 10) }];

const authenticate = async ({ username, password }: { username: string, password: string }) => {
    const user = users.find(async (u) => await bcrypt.compare(username, u.username) && bcrypt.compare(password, u.password));
    if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};

const getAll = async () => {
    return users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
};

export default {
    authenticate,
    getAll
};
