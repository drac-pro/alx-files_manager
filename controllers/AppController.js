import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  // handles logic for GET /status route
  static getStatus(req, res) {
    res.status(200).json({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
  }

  // handles logic for the GET /stats routes
  static async getStats(req, res) {
    try {
      const users = await dbClient.nbUsers();
      const files = await dbClient.nbFiles();
      res.status(200).json({ users, files });
    } catch (err) {
      console.error('Error getting stats: ', err);
    }
  }
}

module.exports = AppController;
