import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

const AppController = {
    async getStatus(req, res) {
        const data = {
            redis: redisClient.isAlive(),
            db: dbClient.isAlive()
        }        
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.send(JSON.stringify(data));
    },

    async getStats(req, res) {
        const data = {
            users: await dbClient.nbUsers(),
            files: await dbClient.nbFiles()
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
    }
}

module.exports = AppController;
