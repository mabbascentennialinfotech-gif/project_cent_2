const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ---------------- CORS CONFIG ---------------- */

const allowedOrigins = [
  "https://frontenddashboard-wcz6.onrender.com",
  "https://jobportal.centennialinfotech.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.options("*", cors());

app.use(express.json());

/* ---------------- PORT ---------------- */

const PORT = process.env.PORT || 5000;

/* ---------------- DATABASE ---------------- */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ---------------- Schemas ---------------- */

const employeeSchema = new mongoose.Schema({
  name: String,
  totalCount: Number,
});

const assignmentSchema = new mongoose.Schema({
  monthYear: String,
  day: Number,
  type: String,
  employeeId: String,
  role: String,
  status: String,
  value: String,
});

const roleSchema = new mongoose.Schema({
  name: String,
});

/* ---------------- Models ---------------- */

const Employee = mongoose.model("Employee", employeeSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);
const Role = mongoose.model("Role", roleSchema);

/* ---------------- API Routes ---------------- */

/* Employees */

app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const newEmp = new Employee(req.body);
    await newEmp.save();
    res.json(newEmp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Roles */

app.get("/api/roles", async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/roles", async (req, res) => {
  try {
    const newRole = new Role(req.body);
    await newRole.save();
    res.json(newRole);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/roles/:id", async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Assignments */

app.get("/api/assignments/:monthYear", async (req, res) => {
  try {
    const assignments = await Assignment.find({
      monthYear: req.params.monthYear,
    });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/assignments", async (req, res) => {
  try {
    const { monthYear, day, type, employeeId, role, status, value } = req.body;

    const updated = await Assignment.findOneAndUpdate(
      { monthYear, day, type, employeeId },
      { role, status, value },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/assignments", async (req, res) => {
  try {
    const { monthYear, day, type, employeeId } = req.body;

    await Assignment.findOneAndDelete({
      monthYear,
      day,
      type,
      employeeId,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
