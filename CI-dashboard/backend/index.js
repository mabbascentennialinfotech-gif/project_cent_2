const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
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

const PORT = process.env.PORT || 5000;

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
  monthYear: String, // format: "2026-0"
  day: Number,
  type: String, // "DATE" or "AC"
  employeeId: String,
  role: String,
  status: String,
  value: String,
});

const roleSchema = new mongoose.Schema({
  name: String,
});

const Employee = mongoose.model("Employee", employeeSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);
const Role = mongoose.model("Role", roleSchema);

/* ---------------- API Routes ---------------- */

// Employees
app.get("/api/employees", async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
});

app.post("/api/employees", async (req, res) => {
  const newEmp = new Employee(req.body);
  await newEmp.save();
  res.json(newEmp);
});

app.delete("/api/employees/:id", async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Roles
app.get("/api/roles", async (req, res) => {
  const roles = await Role.find();
  res.json(roles);
});

app.post("/api/roles", async (req, res) => {
  const newRole = new Role(req.body);
  await newRole.save();
  res.json(newRole);
});

app.delete("/api/roles/:id", async (req, res) => {
  await Role.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Assignments (Fetch by month)
app.get("/api/assignments/:monthYear", async (req, res) => {
  const assignments = await Assignment.find({
    monthYear: req.params.monthYear,
  });
  res.json(assignments);
});

// Save/Update Assignment
app.post("/api/assignments", async (req, res) => {
  const { monthYear, day, type, employeeId, role, status, value } = req.body;

  const updated = await Assignment.findOneAndUpdate(
    { monthYear, day, type, employeeId },
    { role, status, value },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json(updated);
});

// Delete Assignment
app.delete("/api/assignments", async (req, res) => {
  const { monthYear, day, type, employeeId } = req.body;
  await Assignment.findOneAndDelete({ monthYear, day, type, employeeId });
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
