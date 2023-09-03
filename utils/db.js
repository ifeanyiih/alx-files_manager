import { MongoClient } from 'mongodb';

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
      });
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
}

const dbClient = new DBClient();
module.exports = dbClient;
