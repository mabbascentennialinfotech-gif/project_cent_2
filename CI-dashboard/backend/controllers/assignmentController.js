const Assignment = require("../models/Assignment");
const Employee = require("../models/Employee");

// GET assignments for a month
exports.getAssignments = async (req, res) => {
  try {
    const { monthYear } = req.params;
    const assignments = await Assignment.find({ monthYear });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

// SAVE or UPDATE assignment
exports.saveAssignment = async (req, res) => {
  const { monthYear, day, type, employeeId, role, status, value, date } = req.body;

  try {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);

    // ===== DATE TYPE LOGIC =====
    if (type === "DATE" && role) {

      const sevenDaysAgo = new Date(newDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      // 1️⃣ Check SAME EMPLOYEE first
      const selfRecent = await Assignment.findOne({
        role,
        type: "DATE",
        employeeId,
        date: { $gte: sevenDaysAgo, $lte: newDate },
      }).sort({ date: -1 });

      if (selfRecent) {
        const diffDays = Math.floor(
          (newDate - new Date(selfRecent.date)) /
          (1000 * 60 * 60 * 24)
        );
        const daysLeft = 7 - diffDays;

        const emp = await Employee.findById(employeeId);
        const name = emp ? emp.name : "this staff";

        return res.status(400).json({
          message: `Cannot assign — already assigned to ${name}. Please wait ${daysLeft} days.`
        });
      }

      // 2️⃣ Check OTHER EMPLOYEES
      const otherRecent = await Assignment.findOne({
        role,
        type: "DATE",
        employeeId: { $ne: employeeId },
        date: { $gte: sevenDaysAgo, $lte: newDate },
      }).sort({ date: -1 });

      if (otherRecent) {
        const diffDays = Math.floor(
          (newDate - new Date(otherRecent.date)) /
          (1000 * 60 * 60 * 24)
        );
        const daysLeft = 7 - diffDays;

        const emp = await Employee.findById(otherRecent.employeeId);
        const name = emp ? emp.name : "another staff";

        return res.status(400).json({
          message: `Cannot assign — already assigned to ${name}. Please wait ${daysLeft} days.`
        });
      }

      // 3️⃣ Block same role on same day for different employee
      const existingToday = await Assignment.findOne({
        monthYear,
        day,
        type: "DATE",
        role,
      });

      if (existingToday && existingToday.employeeId !== employeeId) {
        const emp = await Employee.findById(existingToday.employeeId);
        const name = emp ? emp.name : "another staff";
        return res.status(400).json({
          message: `Cannot assign — already assigned to ${name}`
        });
      }

      // 4️⃣ Save assignment
      const updateData = {
        role,
        status,
        value,
        date: newDate,
        monthYear,
        day,
        type,
        employeeId,
        restricted: false,
      };

      const updated = await Assignment.findOneAndUpdate(
        { monthYear, day, type, employeeId },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json(updated);
    }

    // ===== AC TYPE OR NO ROLE =====
    const updated = await Assignment.findOneAndUpdate(
      { monthYear, day, type, employeeId },
      {
        role,
        status,
        value,
        date: newDate,
        monthYear,
        day,
        type,
        employeeId,
        restricted: false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json(updated);

  } catch (err) {
    console.error("Save assignment error:", err);
    res.status(500).json({ message: "Error saving assignment" });
  }
};

// DELETE assignment
exports.deleteAssignment = async (req, res) => {
  const { monthYear, day, type, employeeId } = req.body;
  try {
    await Assignment.findOneAndDelete({ monthYear, day, type, employeeId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error deleting assignment" });
  }
};
