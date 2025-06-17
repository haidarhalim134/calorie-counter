import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Image from '../models/image.js';
import { fileTypeFromBuffer } from 'file-type';

async function checkMimeType(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !type.mime.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  return type.ext;
}

class FileStorage {
  constructor(baseFolder = './storage') {
    this.baseFolder = baseFolder;
    if (!fs.existsSync(this.baseFolder)) {
      fs.mkdirSync(this.baseFolder, { recursive: true });
    }
  }

  getFilePath(id) {
    return path.join(this.baseFolder, id);
  }

  async store(fileBuffer) {
    const mimeType = await checkMimeType(fileBuffer)

    const id = crypto.randomUUID();
    const filePath = this.getFilePath(id);

    await fs.promises.writeFile(filePath, fileBuffer);
    return id;
  }

  async get(id) {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    return await fs.promises.readFile(filePath);
  }

  async delete(id) {
    const filePath = this.getFilePath(id);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    } else {
      throw new Error('File not found');
    }
  }
}

class DatabaseStorage {
  constructor() {}

  async store(fileBuffer) {
    const mimeType = await checkMimeType(fileBuffer)
    const id = crypto.randomUUID();

    await Image.create({
      id,
      filename: id, 
      mimeType,
      data: fileBuffer,
    });

    return id;
  }

  async get(id) {
    const image = await Image.findByPk(id);
    if (!image) {
      throw new Error('File not found');
    }

    return Buffer.from(image.data);
  }

  async delete(id) {
    const deleted = await Image.destroy({ where: { id } });
    if (deleted === 0) {
      throw new Error('File not found');
    }
  }
}

const Storage = DatabaseStorage;
export default Storage;