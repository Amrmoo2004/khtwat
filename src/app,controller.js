import express from 'express';
import connectDB from './modules/DB/db.connect.js';
import mongoose from 'mongoose';
import authcontroller from './modules/auth/auth.controller.js';
import notescontroller from './modules/notes/notes.controller.js';
import examRoutes from './modules/exam/exam.routes.js';
import antiCheatRoutes from './modules/antiCheat/antiCheat.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import recommendationsRoutes from './modules/recommendations/recommendations.routes.js';
import communityRoutes from './modules/community/community.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import cors from 'cors';

import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger.js';

const app = express();
const port = 3000;
await connectDB();

export const bootstrap = async () => {
    // Middleware
    app.use(cors({ origin: "*", credentials: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));


    // Auth routes
    app.use('/auth', authcontroller);
    app.use('/api', notescontroller);

    // Exam routes
    app.use('/exam', examRoutes);

    // Anti-Cheat routes
    app.use('/anti-cheat', antiCheatRoutes);

    // Analytics routes
    app.use('/analytics', analyticsRoutes);

    // Recommendations routes
    app.use('/recommendations', recommendationsRoutes);

    // Community routes
    app.use('/community', communityRoutes);

    // Dashboard routes
    app.use('/admin', dashboardRoutes);

    // Swagger API Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ message: 'Something went wrong!' });
    });

    return app.listen(port, () => {
        console.log(`🚀 Server is running at http://localhost:${port}`);
        console.log(`📝 Swagger Documentation: http://localhost:${port}/api-docs`);
        console.log(`🔐 Auth endpoints: http://localhost:${port}/auth`);
    });
};
