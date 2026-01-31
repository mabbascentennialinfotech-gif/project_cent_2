
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth")



const app = express();
app.use(cors({
  origin: [
    "https://jobportal.centennialinfotech.com", // deployed frontend
    "http://localhost:5173"                     // local dev frontend
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());


// API routes
app.use("/api/auth", authRoutes);
///

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
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
  type: String, // "DATE" or "AC"
  employeeId: String,
  role: String,
  status: String,
  value: String,
});

const roleSchema = new mongoose.Schema({ name: String });

const Employee = mongoose.model("Employee", employeeSchema);
const Assignment = mongoose.model("Assignment", assignmentSchema);
const Role = mongoose.model("Role", roleSchema);

/* ---------------- API Routes ---------------- */
// Employees
app.get("/api/employees", async (req, res) => res.json(await Employee.find()));
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
app.get("/api/roles", async (req, res) => res.json(await Role.find()));
app.post("/api/roles", async (req, res) => {
  const newRole = new Role(req.body);
  await newRole.save();
  res.json(newRole);
});
app.delete("/api/roles/:id", async (req, res) => {
  await Role.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// Assignments
app.get("/api/assignments/:monthYear", async (req, res) => {
  res.json(await Assignment.find({ monthYear: req.params.monthYear }));
});
app.post("/api/assignments", async (req, res) => {
  const { monthYear, day, type, employeeId, role, status, value } = req.body;
  const updated = await Assignment.findOneAndUpdate(
    { monthYear, day, type, employeeId },
    { role, status, value },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(updated);
});
app.delete("/api/assignments", async (req, res) => {
  const { monthYear, day, type, employeeId } = req.body;
  await Assignment.findOneAndDelete({ monthYear, day, type, employeeId });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
