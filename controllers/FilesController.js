import { promises as fs } from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuid4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  // handles logic for the POST /files route
  static async postUpload(req, res) {
    const token = req.headers['x-token'] || '';
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    const user = await dbClient.getUserById(id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });

    if (parentId) {
      const parentFile = await dbClient.getFileById(parentId);
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const files = dbClient.db.collection('files');

    const fileData = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : new ObjectId(parentId),
    };

    if (type === 'folder') {
      const result = await files.insertOne(fileData);
      return res.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      });
    }

    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileName = `${FOLDER_PATH}/${uuid4()}`;

    await fs.mkdir(FOLDER_PATH, { recursive: true });
    await fs.writeFile(fileName, Buffer.from(data, 'base64'));

    fileData.localPath = fileName;

    const result = await files.insertOne(fileData);
    return res.status(201).json({
      id: result.insertedId,
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId || 0,
    });
  }

  // Handles logic for the GET /files/:id route
  static async getShow(req, res) {
    const token = req.headers['x-token'] || '';
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    const user = await dbClient.getUserById(id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const file = await dbClient.getFileById(fileId);

    if (!file || file.userId.toString() !== user._id.toString()) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId || 0,
    });
  }

  // Handles logic for the GET /files route
  static async getIndex(req, res) {
    const token = req.headers['x-token'] || '';
    const key = `auth_${token}`;
    const id = await redisClient.get(key);
    const user = await dbClient.getUserById(id);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const query = req.query.parentId
      ? { userId: user._id, parentId: new ObjectId(req.query.parentId) } : { userId: user._id };
    const page = parseInt(req.query.page, 10) || 0;
    const limit = 20; // Maximum items per page
    const skip = page * limit;

    const files = await dbClient.db.collection('files')
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    // can use agregate instead.
    const formattedFiles = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId || 0,
    }));

    return res.status(200).json(formattedFiles);
  }
}

module.exports = FilesController;
