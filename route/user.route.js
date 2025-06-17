import express from "express";
import { validateData } from "../middleware/validationMiddleware.js";
import bcrypt from "bcrypt"
import authenticateToken from "../middleware/authenticateToken.js";
import { z } from "zod";
import multer from "multer";
import Storage from "../utilities/storage.js";
import User from "../models/user.js";
import sequelize from "../utilities/db.js";

const router = express.Router();
const storage = new Storage();
const upload = multer(); 

// get current user berdasarkan auth token
router.get('/currentUser', authenticateToken, async (req, res) => {
    res.status(200).json(req.user);
});

const UserSetupAccountSchema = z.object({
    username: z.string().nonempty(),
    gender: z.enum(['Male', 'Female']),
    height: z.number().min(1.0).max(500.0),
    weight: z.number().min(1.0).max(500.0),
    activityLevel: z.number().min(1).max(4),
    dateOfBirth: z.coerce.date()
});

router.post("/setupAccount", authenticateToken, validateData(UserSetupAccountSchema), async (req, res) => {
    const { username, gender, height, weight, activityLevel, dateOfBirth } = req.body;

    const user = req.user;

    if (user.username)
    {
        return res.status(500).json({ message: "Setup for this account is already completed" });
    }
    user.username = username;
    user.gender = gender;
    user.height = height;
    user.weight = weight;
    user.activityLevel = activityLevel;
    user.dateOfBirth = dateOfBirth;
    await user.save();

    res.status(200).json({ message: "Account setup successful" });
});

router.post("/deactivateAccount", authenticateToken, async (req, res) => {
    req.user.active = false;
    await req.user.save();

    res.status(200).json({ message: "Account deactivation successful" });
})

router.post('/reactivateAccount', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({
        where: {
            email: email 
        }
    });

    if (!user) {
        return res.status(401).json({
            message: 'Invalid credentials'
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: 'Invalid credentials'
        });
    }

    user.active = true;
    await user.save();

    res.json({
        message: 'Account reactivated',
    });
});

router.post('/updateProfilePicture', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const user = req.user;

  const t = await sequelize.transaction();

  try {
    if (user.profileImage) {
      await storage.delete(user.profileImage); 
    }

    const id = await storage.store(req.file.buffer); 

    user.profileImage = id;
    await user.save({ transaction: t }); 

    await t.commit();
    res.status(201).json({ id });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

router.get("/calorieGoal", authenticateToken, async (req, res) => {
    const user = req.user

    const activityLevelMap = {
        1: 1.2,
        2: 1.375,
        3: 1.55,
        4: 1.725
    }

    if (user.gender === "Male") {
        return res.status(200).json(((10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5) * activityLevelMap[user.activityLevel]);
    } else {
        return res.status(200).json(((10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161) * activityLevelMap[user.activityLevel]);
    }
})

const UpdatePasswordSchema = z.object({
    oldPassword: z.string().nonempty(),
    newPassword: z.string().min(6),
});

router.post('/updatePassword', authenticateToken, validateData(UpdatePasswordSchema), async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old and new passwords are required' });
  }

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    user.password = newPassword; 
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
})

const UpdateDataSchema = z.object({
  username: z.string().min(3).max(50).optional().or(z.literal("")),
  email: z.string().min(1, { message: "Email is required" }).email().optional(),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format for dateOfBirth",
  }).optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  height: z.number().min(1.0).max(500.0).optional(),
  weight: z.number().min(1.0).max(500.0).optional(),
  activityLevel: z.number().int().min(1).max(4).optional(),
}).partial();


router.put("/updateData", authenticateToken, async (req, res) => {
    const parsed = UpdateDataSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const data = parsed.data;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    for (const [key, value] of Object.entries(data)) {
      if (
        value !== undefined &&
        value !== null &&
        !(typeof value === 'string' && value.trim() === '')
      ) {
        user[key] = value;
      }
    }

    await user.save();
    res.status(200).json({ message: 'User data updated successfully', user });
})

export default router