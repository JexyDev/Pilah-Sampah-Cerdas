import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dashboardRoutes from './routes/dashboardRoutes';
import usersRoutes from './routes/usersRoutes';
import binsRoutes from './routes/binsRoutes';
import categoriesRoutes from './routes/categoriesRoutes';
import transactionsRoutes from './routes/transactionsRoutes';
import notificationsRoutes from './routes/notificationsRoutes';
import schedulesRoutes from './routes/schedulesRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/dashboard", dashboardRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/bins', binsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/transactions', transactionsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/schedules', schedulesRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`pilahsampah.id Backend running on port ${PORT}`);
  console.log(`===============================================`);
});
