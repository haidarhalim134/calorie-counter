import express from 'express';
import multer from 'multer';
import path from 'path';
import Storage from '../utilities/storage.js';

const router = express.Router();
const storage = new Storage();
const upload = multer(); 

// router.post('/upload', upload.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: 'No file uploaded' });
//     }

//     const id = await storage.store(req.file.buffer);
//     res.status(201).json({ id });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

router.get('/file/:id', async (req, res) => {
  try {
    const data = await storage.get(req.params.id);
    const ext = path.extname(req.params.id).substring(1);
    res.setHeader('Content-Type', `image/${ext}`);
    res.send(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.delete('/file/:id', async (req, res) => {
  try {
    await storage.delete(req.params.id);
    res.json({ message: 'File deleted' });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router