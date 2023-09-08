import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';


const UsersController = {
  async postNew(req, res) {
    const { body } = req;
    if (!body.email) {
      res.statusCode = 400;
      res.json({ error: 'Missing email' });
    } else if (!body.password) {
      res.statusCode = 400;
      res.json({ error: 'Missing password' });
    } else {
      const { email } = body;
      const { password } = body;
      const emailExists = await dbClient.findUser('email', email);
      if (emailExists) {
        res.statusCode = 400;
        res.json({ error: 'Already exist' });
      } else {
        res.statusCode = 201;
        const hashedPass = sha1(password);
        const userData = {
          email,
          password: hashedPass,
        };
        const result = await dbClient.addUser(userData);
        const response = { id: result.insertedId, email };
        res.json(response);
      }
    }
  },

  async getMe(req, res) {
    const token = req.get('X-Token');
    if (!token) {
      res.statusCode = 401;
      res.json({ error: 'Unauthorized' });
      return;
    }
    const id = await redisClient.get(`auth_${token}`);
    const user = await dbClient.findUser('_id', id);
    if (!user) {
      res.statusCode = 401;
      res.json({ error: 'Unauthorized' });
    } else {
      res.statusCode = 200;
      res.json({ id, email: user.email });
    }
  },
};

module.exports = UsersController;
