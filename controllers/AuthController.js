import crypto from 'crypto';
import { v4 as uuid4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  // handles logic for GET /connect route
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization || ''; // Authorization to authorization
    const base64AuthString = authHeader.split(' ')[1] || '';
    const credentials = Buffer.from(base64AuthString, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPassword });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuid4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);

    return res.status(200).json({ token });
  }

  // handles logic for GET /disconnect route
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'] || '';
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    if (id) {
      await redisClient.del(key);
      res.status(204).end();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}

module.exports = AuthController;
