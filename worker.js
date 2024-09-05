import Queue from 'bull';
import { promises as fs } from 'fs';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';

const fileQueue = new Queue('thumbnail generator');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) done(new Error('Missing fileId'));
  if (!userId) done(new Error('Missing userId'));

  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId: new ObjectId(userId) });
  if (!file) done(new Error('File not found'));

  const filePath = file.localPath;
  const thumbnail500 = await imageThumbnail(filePath, { width: 500 });
  const thumbnail250 = await imageThumbnail(filePath, { width: 250 });
  const thumbnail100 = await imageThumbnail(filePath, { width: 100 });

  const image500 = `${filePath}_500`;
  const image250 = `${filePath}_250`;
  const image100 = `${filePath}_100`;

  await fs.writeFile(image500, thumbnail500);
  await fs.writeFile(image250, thumbnail250);
  await fs.writeFile(image100, thumbnail100);
  done();
});
