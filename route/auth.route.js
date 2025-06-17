import express from "express";
import jwt from 'jsonwebtoken'
import { z } from "zod";
import bcrypt from "bcrypt"
import authenticateToken from "../middleware/authenticateToken.js";
import { validateData } from "../middleware/validationMiddleware.js";
import User from "../models/user.js"

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '400d';

const router = express.Router();

const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const UserRegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

router.post('/register', validateData(UserRegisterSchema), async (req, res) => {
    const { email, password } = UserRegisterSchema.parse(req.body);

    const existingUser = await User.findOne({
        where: {
            email: email 
        }
    });

    if (existingUser) {
        return res.status(409).json({
            message: 'User with this username or email already exists'
        });
    }

    const user = await User.create({
        email,
        password
    });
    const token = generateToken(user.id);

    res.status(201).json({
        message: 'User registered successfully',
        data: {
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.createdAt
            },
            token
        }
    });
});

const UserLoginSchema = z.object({
    email: z.string(),
    password: z.string()
});

router.post('/login', validateData(UserLoginSchema), async (req, res) => {
    const { email, password } = UserLoginSchema.parse(req.body);

    const user = await User.findOne({
        where: {
            email: email 
        }
    });

    if (!user || !user.active) {
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

    const token = generateToken(user.id);

    res.json({
        message: 'Login successful',
        data: {
            user: {
                id: user.id,
                email: user.email,
            },
            token
        }
    });
});

router.post('/logout', authenticateToken, async (req, res) => {
    // TODO: mungkin blacklist token nanti, buat sekarang cukup delete token di localstorage
    res.json({
        message: 'Logout successful'
    });
});

export default router
