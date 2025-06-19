import express from 'express';
import multer from 'multer';
import FormData from 'form-data'
import Storage from '../utilities/storage.js';
import authenticateToken from '../middleware/authenticateToken.js';
import Scan from '../models/scan.js';
import DayLog from '../models/dayLog.js';
import ScanItem from '../models/scanItem.js';
import { z } from "zod";
import { validateData } from '../middleware/validationMiddleware.js';
import sequelize from '../utilities/db.js';
import axios from 'axios'
const router = express.Router();
const storage = new Storage();
const upload = multer(); 

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const t = await sequelize.transaction();

  let imageId
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    imageId = await storage.store(req.file.buffer);

    const form = new FormData();
    form.append('image', req.file.buffer, req.file.originalname || 'upload.jpg');

    let predictionResult;
    try {
      const flaskRes = await axios.post('http://localhost:5000/detect', form, {
        headers: form.getHeaders(),
      });

      predictionResult = flaskRes.data;
    } catch (err) {
      console.log(err)
      return res.status(500).json({ error: 'ML service failed', detail: err });
    }

    const [dayLog, found] = await DayLog.findOrCreate({
      where: { date: new Date(), userId: req.user.id },
      transaction: t,
    });

    const scan = await Scan.create({
      dayLogId: dayLog.id,
      foodName: "Food Name", // placeholder
      calories: predictionResult.total_calorie,
      imageId: imageId,
    }, { transaction: t });

    const scanItems = await Promise.all(predictionResult.items.map(itm =>
      ScanItem.create({
        scanId: scan.id,
        foodName: itm.name,
        confidence: itm.confidence,
        x1: itm.boxX1,
        y1: itm.boxY1,
        x2: itm.boxX2,
        y2: itm.boxY2 
      }, { transaction: t })
    ));

    await t.commit();
    res.status(201).json({ scan, scanItems });

  } catch (err) {
    await t.rollback();

    if (req.file) {
      try {
        if (imageId)
            await storage.delete(imageId); 
      } catch (e) {
        console.error("Failed to clean up image:", e);
      }
    }

    res.status(400).json({ error: err.message });
  }
});

const RenameScanSchema = z.object({
    foodName: z.string().nonempty(),
});

router.post("/renameScan/:id", authenticateToken, validateData(RenameScanSchema), async (req, res) => {
    const { foodName } = req.body;

    let scan = await Scan.findByPk(req.params.id);

    if (!scan)
    {
        return res.status(404).json({ message: "Scan not found" });
    }

    scan.foodName = foodName;
    await scan.save();

    res.status(200).json({ message: "Scan rename successful" });
});

export default router;