import express from 'express';
import { Op } from 'sequelize';
import authenticateToken from '../middleware/authenticateToken.js';
import Scan from '../models/scan.js';
import DayLog from '../models/dayLog.js';
import ScanItem from '../models/scanItem.js';
import { z } from "zod";
import { validateData } from '../middleware/validationMiddleware.js';

const router = express.Router();

const CalorieLogSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional()
}).partial();

router.post('/calorieLog', authenticateToken, validateData(CalorieLogSchema), async (req, res) => {
    const { startDate, endDate } = req.body;

    const today = new Date();
    const defaultEnd = today.toISOString().split('T')[0];

    const defaultStartDate = new Date();
    defaultStartDate.setDate(today.getDate() - 6);
    const defaultStart = defaultStartDate.toISOString().split('T')[0];

    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    const logs = await DayLog.findAll({
        where: {
            date: {
                [Op.gte]: start,
                [Op.lte]: end,
            },
            userId: req.user.id
        },
        include: [{
        model: Scan,
        attributes: ['calories']
        }],
        order: [['date', 'ASC']]
    });

    const result = logs.map(log => ({
        date: log.date,
        totalCalories: log.Scans.reduce((sum, scan) => sum + scan.calories, 0)
    }));

    res.json(result);
});

router.get('/scans/:date', authenticateToken, async (req, res) => {

    const { date } = req.params;

    // kedepannya scanItem tidak harus dibawa, bisa dibuat endpoint terpisah
    const log = await DayLog.findOne({
        where: { date, userId: req.user.id },
        include: [{
        model: Scan,
        attributes: ['id', 'foodName', 'calories', 'timeEaten', 'imageId'],
        include: [{
            model: ScanItem,
            as: "items",
            attributes: ['id', 'foodName', 'confidence', 'boxX', 'boxY', 'boxW', 'boxH']
        }]
      }]
    });

    if (!log) {
        return res.status(404).json({ error: 'No log found for that date' });
    }

    const totalCalories = log.Scans.reduce((sum, scan) => sum + scan.calories, 0);

    res.json({
        date: log.date,
        totalCalories,
        scans: log.Scans
    });
});

export default router;