import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { parse } from "csv-parse/sync";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Helper to read CSVs
  const readCSV = (filename: string) => {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return parse(content, { columns: true, skip_empty_lines: true });
  };

  // API Routes
  app.get("/api/data/employees", (req, res) => {
    res.json(readCSV('aiml_employees_large (2).csv'));
  });

  app.get("/api/data/projects", (req, res) => {
    res.json(readCSV('projects.csv'));
  });

  app.get("/api/data/history", (req, res) => {
    res.json(readCSV('project_history.csv'));
  });

  app.get("/api/data/tools", (req, res) => {
    res.json(readCSV('tools.csv'));
  });

  app.get("/api/data/memory", (req, res) => {
    const memoryPath = path.join(process.cwd(), 'memory.json');
    if (fs.existsSync(memoryPath)) {
      res.json(JSON.parse(fs.readFileSync(memoryPath, 'utf-8')));
    } else {
      res.json([]);
    }
  });

  app.post("/api/data/memory", (req, res) => {
    const { project, decision } = req.body;
    const memoryPath = path.join(process.cwd(), 'memory.json');
    let memory = [];
    if (fs.existsSync(memoryPath)) {
      memory = JSON.parse(fs.readFileSync(memoryPath, 'utf-8'));
    }
    memory.push({
      timestamp: new Date().toISOString(),
      project,
      decision
    });
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
