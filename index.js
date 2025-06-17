import express from 'express';
import sequelize from './utilities/db.js';
import authRoute from './route/auth.route.js';
import userRoute from './route/user.route.js';
import scanRoute from './route/scan.route.js';
import dayLogRoute from './route/dayLog.route.js';
import storageRoute from './route/storage.route.js';
import errorHandler from './middleware/errorMiddleware.js';

export const app = express();

app.use(express.json());

app.use("/auth", authRoute)
app.use("/user", userRoute)
app.use("/scan", scanRoute)
app.use("/dayLog", dayLogRoute)
app.use("/storage", storageRoute)

app.use(errorHandler)

const startServer = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: false });

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Unable to start server:', error);
    }
};

startServer();

export default app;