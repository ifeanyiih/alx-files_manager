import dbClient from '../utils/db';

const crypto = require('crypto');

const hash = crypto.createHash('sha1');

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
      const emailExists = await dbClient.emailExists(email);
      if (emailExists) {
        res.statusCode = 400;
        res.json({ error: 'Already exist' });
      } else {
        res.statusCode = 201;
        hash.update(password);
        const hashedPass = hash.digest('hex');
        const userData = {
          email,
          password: hashedPass,
        };
        const result = await dbClient.addUser(userData);
        const response = { email, id: result.insertedId };
        res.json(response);
      }
    }
  },
};

module.exports = UsersController;
