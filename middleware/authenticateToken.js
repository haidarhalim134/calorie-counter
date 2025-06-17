import User from "../models/user.js";
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Access token is required'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid or expired token'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({
            message: 'Invalid or expired token'
        });
    }
};

export default authenticateToken