const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Import route modules
  const employeesRouter = require('./routes/employees');
  const attendanceRouter = require('./routes/attendance');
  const desksRouter = require('./routes/desks');
  const tasksRouter = require('./routes/tasks');
  const analyticsRouter = require('./routes/analytics');
  const esp32Router = require('./routes/esp32');

  // Mount API routes
  app.use('/api/employees', employeesRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/desks', desksRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/esp32', esp32Router);

  // Added /api/state for the Emergency Mode and dashboard to fetch employees + static rooms
  const supabase = require('./data/supabase');
  app.get('/api/state', async (req, res) => {
    const { data: employees, error } = await supabase.from('employees').select('*');
    if (error) return res.status(500).json({ status: 'error', message: error.message });
    res.json({
      status: 'success',
      data: {
        employees: employees || [],
        rooms: ["Main Hallway", "Cafeteria"]
      }
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // True Single Server Setup: Serve Vite directly through Express!
  if (process.env.NODE_ENV !== 'production') {
    const fs = require('fs');
    // Development mode: use Vite middleware for hot-reloading
    const { createServer: createViteServer } = require('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Serve index.html and let Vite transform it for HMR
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production mode: Serve frontend static files from the built Vite app
    const frontendDist = path.join(__dirname, 'dist');
    app.use(express.static(frontendDist));

    // SPA fallback — any non-API route serves index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  // Start the server
  app.listen(PORT, () => {
    console.log(`Smart Office Tracking running seamlessly on http://localhost:${PORT}`);
  });
}

startServer();
