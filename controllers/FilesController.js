import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const fs = require('fs');

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

const FilesController = {
  /**
    * @async
    * postUploads: handles file uploads POST requests
    * @param {Request} req: Request Object
    * @param {Response} res: Response Object
    * @returns {Response}
    */
  async postUpload(req, res) {
    const token = req.get('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.findUser('_id', userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      const { body } = req;
      const {
        name, type, parentId, isPublic, data,
      } = body;
      if (!name) {
        res.status(400).json({ error: 'Missing name' });
        return;
      }
      if (!type) {
        res.status(400).json({ error: 'Missing type' });
        return;
      }
      if (!data && (type !== 'folder')) {
        res.status(400).json({ error: 'Missing data' });
        return;
      }
      if (parentId) {
        const file = await dbClient.findFile('_id', parentId);
        if (!file) {
          res.status(400).json({ error: 'Parent not found' });
          return;
        }
        if (file.type !== 'folder') {
          const error = 'Parent is not a folder';
          res.status(400).json({ error });
          return;
        }
      }

      const fileData = {};
      fileData.userId = userId;
      fileData.name = name;
      fileData.type = type;
      fileData.isPublic = isPublic || false;
      fileData.parentId = parentId || 0;

      let responseData;
      if (type === 'folder') {
        const result = await dbClient.addFile(fileData);
        responseData = { id: result.insertedId, ...fileData };
        delete responseData._id;
        res.status(201).json(responseData);
      }
      const fileUUID = uuidv4();
      const localPath = `${folderPath}/${fileUUID}`;
      const dataDecode = Buffer.from(data, 'base64').toString('utf-8');
      if (!fs.existsSync(folderPath)) {
        await fs.mkdir(folderPath, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      await fs.writeFile(localPath, dataDecode, (err) => {
        if (err) console.log(err);
        else console.log('file created');
      });

      fileData.localPath = localPath;
      const result = await dbClient.addFile(fileData);
      responseData = { id: result.insertedId, ...fileData };
      delete responseData.localPath;
      delete responseData._id;
      res.status(201).json(responseData).end();
    }
  },

  /**
    * @async
    * getShow: retrieves file documents based on ID
    * @param {Request} req: Request Object
    * @param {Response} res: Response Object
    * @returns {Response}
    */
  async getShow(req, res) {
    const token = req.get('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' }).end();
      return;
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.findUser('_id', userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' }).end();
    } else {
      const ID = req.params.id;
      const file = await dbClient.findFile('_id', ID);
      if (!file) {
        res.json({ error: 'Not found' }).status(404).end();
        return;
      }
      if (!(file.userId === userId)) {
        res.json({ error: 'Not found' }).status(404).end();
        return;
      }
      const response = { id: file._id, ...file };
      delete response._id;
      delete response.localPath;
      res.json(response).status(200).end();
    }
  },

  async getIndex(req, res) {
    const token = req.get('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    const user = await dbClient.findUser('_id', userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
    } else {
      let { parentId, page } = req.query;
      if (!parentId) parentId = 0;
      if (!page) page = 0;
      const limit = 20;
      let result = await dbClient.findFiles('parentId', parentId, limit, page);
      result = result.map((result) => {
        const newResult = { id: result._id, ...result };
        delete newResult._id;
        delete newResult.localPath;
        return newResult;
      });
      res.status(200).json(result).end();
    }
  },
};

module.exports = FilesController;
