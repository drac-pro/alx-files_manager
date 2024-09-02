import { createClient } from 'redis';
import { promisify } from 'util';

// class to represent a redis client connection
class RedisClient {
  // constructor method
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log('Redis Client Error: ', err));
  }

  /**
   * checks if the redis client was successfully connected
   * @returns {boolean} true if connection was successfull
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * retrieve a value from redis db
   * @param {string} key - The key
   * @returns {any} the value assigned to the key
   */
  async get(key) {
    try {
      const getAsync = promisify(this.client.get).bind(this.client);
      const value = await getAsync(key);
      return value;
    } catch (error) {
      console.error('Redis get key Error: ', error);
    }
    return null;
  }

  /**
   * sets a key in a redis db with a value for some duration
   * @param {string} key - The key to be assigned
   * @param {any} value - The value to assign
   * @param {number} duration - The duration the key will be stored in the redis db
   */
  async set(key, value, duration) {
    try {
      const setAsync = promisify(this.client.set).bind(this.client);
      await setAsync(key, value, 'EX', duration);
    } catch (error) {
      console.error('Redis set key Error: ', error);
    }
  }

  /**
   * deletes a key from a redis db
   * @param {string} key - The key
   */
  async del(key) {
    try {
      const delAsync = promisify(this.client.del).bind(this.client);
      await delAsync(key);
    } catch (error) {
      console.error('Redis del key Error: ', error);
    }
  }
}

const redisClient = new RedisClient();

export default redisClient;
