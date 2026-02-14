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

      // Check if this is an update to an existing cell (same employee, same day)
      const existingToday = await Assignment.findOne({
        monthYear,
        day,
        type: "DATE",
        employeeId,
      });

      // If it's the same employee updating their own cell on the same day, allow it
      if (existingToday && existingToday.employeeId === employeeId) {
        // Allow update - proceed to save
      } else {
        // Check for existing assignment in the last 7 days
        const recentAssignment = await Assignment.findOne({
          role,
          type: "DATE",
          date: { $gte: sevenDaysAgo, $lte: newDate },
        }).sort({ date: -1 });

        if (recentAssignment) {
          // RULE: RED and GREEN can freely interchange - NO RESTRICTIONS!
          if ((status === "red" || status === "green") &&
            (recentAssignment.status === "red" || recentAssignment.status === "green")) {
            // Allow ANY combination of RED and GREEN
            console.log(`${recentAssignment.status}→${status} assignment allowed within 7 days`);
          }
          // RULE: Any rule involving BLUE is BLOCKED for 7 days
          else if (status === "blue" || recentAssignment.status === "blue") {
            const diffDays = Math.floor(
              (newDate - new Date(recentAssignment.date)) /
              (1000 * 60 * 60 * 24)
            );
            const daysLeft = 7 - diffDays;

            const emp = await Employee.findById(recentAssignment.employeeId);
            const name = emp ? emp.name : "another staff";

            let message = "";
            if (status === "blue" && recentAssignment.status === "blue") {
              message = `Cannot assign BLUE — already assigned as BLUE 🔵 to ${name}. Please wait ${daysLeft} days.`;
            } else if (status === "blue") {
              message = `Cannot assign BLUE — role was assigned as ${recentAssignment.status === "red" ? "RED 🔴" : "GREEN 🟢"} to ${name}. Please wait ${daysLeft} days.`;
            } else {
              message = `Cannot assign ${status === "red" ? "RED" : "GREEN"} — role was assigned as BLUE 🔵 to ${name}. Please wait ${daysLeft} days.`;
            }

            return res.status(400).json({
              message: message
            });
          }
        }

        // Check for same role on same day for different employee
        const sameDayOther = await Assignment.findOne({
          monthYear,
          day,
          type: "DATE",
          role,
          employeeId: { $ne: employeeId }
        });

        if (sameDayOther) {
          const emp = await Employee.findById(sameDayOther.employeeId);
          const name = emp ? emp.name : "another staff";
          return res.status(400).json({
            message: `Cannot assign — already assigned to ${name}`
          });
        }
      }

      // Save assignment
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