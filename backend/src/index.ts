import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import uploadRoutes from './routes/upload';
import orderRoutes from './routes/order';
import userRoutes from './routes/user';
import pdfRoutes from './routes/pdf';

// Import utilities
import { ensureBuckets } from './utils/ensureBuckets';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
if (!require('fs').existsSync(tempDir)) {
  require('fs').mkdirSync(tempDir, { recursive: true });
  console.log(`Created temp directory at ${tempDir}`);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve temp files
app.use('/temp', express.static(tempDir));
console.log(`Serving static files from ${tempDir} at /temp endpoint`);

// Routes
app.use('/api/uploads', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pdfs', pdfRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
const startServer = async () => {
  try {
    // Ensure S3 buckets exist before starting the server
    console.log('Checking and creating S3 buckets if needed...');
    await ensureBuckets();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api/`);
      console.log(`S3 endpoint (LocalStack): ${process.env.AWS_ENDPOINT || 'Not configured'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
