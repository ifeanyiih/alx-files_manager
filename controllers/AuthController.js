import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

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
    const decoded = Buffer.from(buff, 'base64').toString();
    const cred = decoded.split(':');
    const email = cred[0];
    const password = cred[1];
    if (!email || !password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const hashedPass = sha1(password);
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
