import { MongoClient, ObjectId } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const db = process.DB_DATABASE || 'files_manager';
const uri = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(uri);
    this.client.connect()
      .then(() => {
        this.isalive = true;
        this.db = this.client.db(db);
      }).catch((err) => console.log(err));
  }

  isAlive() {
    if (this.isalive) return true;
    return false;
  }

  async nbUsers() {
    const users = this.db.collection('users');
    const usersCount = await users.estimatedDocumentCount();
    return usersCount;
  }

  async nbFiles() {
    const files = this.db.collection('files');
    const filesCount = await files.estimatedDocumentCount();
    return filesCount;
  }

  async findUser(queryKey, queryVal) {
    const query = {};
    if (queryKey === '_id') {
      query[queryKey] = ObjectId(queryVal);
    } else {
      query[queryKey] = queryVal;
    }
    const users = this.db.collection('users');
    const user = await users.findOne(query, {});
    if (user) return user;
    return false;
  }

  async addUser(userData) {
    const users = this.db.collection('users');
    const result = await users.insertOne(userData);
    return result;
  }

  async addFile(fileData) {
    const files = this.db.collection('files');
    const result = await files.insertOne(fileData);
    return result;
  }

  async findFile(queryKey, queryVal) {
    const query = {};
    if (queryKey === '_id') {
      query[queryKey] = ObjectId(queryVal);
    } else {
      query[queryKey] = queryVal;
    }
    const files = this.db.collection('files');
    const file = await files.findOne(query, {});
    if (file) return file;
    return false;
  }

  async findFiles(pipeline) {
    const files = this.db.collection('files');
    const all = await files.aggregate(pipeline);
    return all.toArray();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
