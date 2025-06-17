import express from 'express';
import multer from 'multer';
import path from 'path';
import Storage from '../utilities/storage.js';
import authenticateToken from '../middleware/authenticateToken.js';
import Scan from '../models/scan.js';
import DayLog from '../models/dayLog.js';
import ScanItem from '../models/scanItem.js';
import { z } from "zod";
import { validateData } from '../middleware/validationMiddleware.js';
import sequelize from '../utilities/db.js';

const router = express.Router();
const storage = new Storage();
const upload = multer(); 

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const t = await sequelize.transaction();

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // panggil service machine learning, tidak perlu simpan file kalau gagal

    const id = await storage.store(req.file.buffer);

    const [dayLog, found] = await DayLog.findOrCreate({
      where: { date: new Date(), userId: req.user.id },
      transaction: t,
    });

    const scan = await Scan.create({
      dayLogId: dayLog.id,
      foodName: "Food Name", // placeholder
      calories: 1,
      imageId: id,
    }, { transaction: t });

    const result = [{
      name: "Name",
      confidence: 90,
      boxX: 12,
      boxY: 12,
      boxW: 12,
      boxH: 12 
    }];

    const scanItems = result.map(itm => ScanItem.create({
      scanId: scan.id,
      foodName: itm.name,
      confidence: itm.confidence,
      boxX: itm.boxX,
      boxY: itm.boxY,
      boxW: itm.boxW,
      boxH: itm.boxH 
    }, { transaction: t }));

    await Promise.all(scanItems);

    await t.commit();
    res.status(201).json({ scan });

  } catch (err) {
    await t.rollback();

    if (req.file) {
      try {
        if (id)
            await storage.delete(id); 
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