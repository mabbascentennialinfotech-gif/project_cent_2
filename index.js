const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

/* ---------------- Middleware ---------------- */
app.use(cors({
  origin: "https://jobportal.centennialinfotech.com",
  credentials: true
}));

app.use(express.json());

/* ---------------- Database ---------------- */
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* ---------------- Schemas ---------------- */
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  totalCount: { type: Number, default: 0 },
});

const assignmentSchema = new mongoose.Schema({
  monthYear: { type: String, required: true },
  day: { type: Number, required: true },
  type: { type: String, enum: ["DATE", "AC"], required: true },
  employeeId: { type: String, required: true },
  role: { type: String, default: "" },
  status: { type: String, default: "" },
  value: { type: String, default: "" },
}, { timestamps: true });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const Employee = mongoose.model("Employee", employeeSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);
const Role = mongoose.model("Role", roleSchema);

/* ---------------- API Routes ---------------- */

// Employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const newEmp = new Employee(req.body);
    await newEmp.save();
    res.status(201).json(newEmp);
  } catch (err) {
    res.status(400).json({ error: "Failed to create employee" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete employee" });
  }
});

// Roles
app.get("/api/roles", async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

app.post("/api/roles", async (req, res) => {
  try {
    const newRole = new Role(req.body);
    await newRole.save();
    res.status(201).json(newRole);
  } catch (err) {
    res.status(400).json({ error: "Failed to create role" });
  }
});

app.delete("/api/roles/:id", async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete role" });
  }
});

// Assignments
app.get("/api/assignments/:monthYear", async (req, res) => {
  try {
    const assignments = await Assignment.find({ monthYear: req.params.monthYear });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assignments" });
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
    res.status(400).json({ error: "Failed to save assignment" });
  }
});

app.delete("/api/assignments", async (req, res) => {
  try {
    const { monthYear, day, type, employeeId } = req.body;
    await Assignment.findOneAndDelete({ monthYear, day, type, employeeId });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete assignment" });
  }
});

/* ---------------- Frontend Serving ---------------- */
// app.use(express.static(path.join(__dirname, "CI-dashboard/dashboard/dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "CI-dashboard/dashboard/dist/index.html"));
// });

/* ---------------- Start Server ---------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
