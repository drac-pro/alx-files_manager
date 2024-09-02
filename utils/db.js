import { MongoClient } from 'mongodb';

// class to represent a MongoDB database connection
class DBClient {
  // constructor method
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(dbName);
      })
      .catch((err) => {
        console.error('MongoDB Connection Error: ', err);
      });
  }

  /**
   * checks the MongoDB connection status
   * @returns {boolean} true if the connection to MongoDB was successfull
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * retrieves the number of documents in users collection
   * @returns {number} number of users
   */
  async nbUsers() {
    try {
      const numUsers = await this.db.collection('users').countDocuments();
      return numUsers;
    } catch (err) {
      console.error('Error fetching user count: ', err);
    }
    return 0;
  }

  /**
   * retrieves the number of documents in files collection
   * @returns {number} number of files
   */
  async nbFiles() {
    try {
      const numFiles = await this.db.collection('files').countDocuments();
      return numFiles;
    } catch (err) {
      console.error('Error fetching file count: ', err);
    }
    return 0;
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
