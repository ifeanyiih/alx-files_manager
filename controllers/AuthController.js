import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');

const AuthController = {
  async getConnect(req, res) {
    const Authorization = req.get('Authorization');
    if (!Authorization) {
      res.statusCode = 401;
      res.json({ error: 'Unauthorized' });
      return;
    }
    const buff = Authorization.split(' ')[1];
    if (!buff) {
      res.statusCode = 401;
      res.json({ error: 'Unauthorized' });
      return;
    }
    const decode = Buffer.from(buff, 'base64').toString('utf-8');
    const cred = decode.split(':');
    const email = cred[0];
    const password = cred[1];
    const hash = crypto.createHash('sha1');
    hash.update(password);
    const hashedPass = hash.digest('hex');
    const exists = await dbClient.findUser('email', email);
    if (exists) {
      if (exists.password !== hashedPass) {
        res.statusCode = 401;
        res.json({ error: 'Unauthorized' });
      } else {
        const token = uuidv4();
        const key = `auth_${token}`;
        const expire = 86400000;
        await redisClient.set(key, exists._id.toString(), expire);
        res.statusCode = 200;
        res.json({ token });
      }
    } else {
      res.statusCode = 401;
      res.json({ error: 'Unauthorized' });
    }
  },

  async getDisconnect(req, res) {
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
      redisClient.del(`auth_${token}`);
      res.status(204).end();
    }
  },
};

module.exports = AuthController;
