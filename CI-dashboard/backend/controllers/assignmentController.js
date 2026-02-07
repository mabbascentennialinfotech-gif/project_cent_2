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

    if (type === "DATE" && role) {
      const currentEmployee = await Employee.findById(employeeId);
      const currentEmployeeName = currentEmployee ? currentEmployee.name : "Staff";

      // 1. Same employee, same role, same day → update allowed
      const existingAssignment = await Assignment.findOne({
        monthYear,
        day,
        type: "DATE",
        employeeId,
        role,
      });

      if (existingAssignment) {
        existingAssignment.status = status;
        existingAssignment.value = value;
        const updated = await existingAssignment.save();
        return res.json({
          ...updated.toObject(),
          message: `Role updated for ${currentEmployeeName}.`,
        });
      }

      // 2. Role taken by another employee today (Red/Green)
      const sameDayRole = await Assignment.findOne({
        monthYear,
        day,
        type: "DATE",
        role,
        employeeId: { $ne: employeeId },
      });

      if (sameDayRole && (status === "red" || status === "green")) {
        const occupiedBy = await Employee.findById(sameDayRole.employeeId);
        const occupiedName = occupiedBy ? occupiedBy.name : "another staff";
        return res.status(400).json({
          message: `Cannot assign — "${role}" is already taken today by ${occupiedName}.`,
        });
      }

      // 3. Red ↔ Green 7-day mutual exclusion
      if (status === "red" || status === "green") {
        const oppositeColor = status === "red" ? "green" : "red";
        const recentAssignments = await Assignment.find({
          role,
          type: "DATE",
          status: oppositeColor,
        });

        for (const recent of recentAssignments) {
          const assignedDate = new Date(recent.date);
          assignedDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((newDate - assignedDate) / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= 6) {
            const assignedEmployee = await Employee.findById(recent.employeeId);
            const assignedName = assignedEmployee ? assignedEmployee.name : "another staff";
            return res.status(400).json({
              message: `Cannot assign ${status} — "${role}" was assigned ${oppositeColor} to ${assignedName} on ${assignedDate.toLocaleDateString(
                "en-GB"
              )}. Must wait 7 days.`,
            });
          }
        }
      }

      // 4. Blue 7-day restriction (all employees)
      let restricted = false;
      if (status === "blue") {
        const recentAssignments = await Assignment.find({ role, type: "DATE" });

        for (const recent of recentAssignments) {
          const lastDate = new Date(recent.date);
          lastDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((newDate - lastDate) / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays <= 6) {
            restricted = true;
            const assignedEmployee = await Employee.findById(recent.employeeId);
            const assignedName = assignedEmployee ? assignedEmployee.name : "another staff";
            const nextAvailable = new Date(lastDate);
            nextAvailable.setDate(nextAvailable.getDate() + 7);
            return res.json({
              message: `${currentEmployeeName} was already assigned "${role}" on ${lastDate.toLocaleDateString(
                "en-GB"
              )}. Earliest return: ${nextAvailable.toLocaleDateString("en-GB")}.`,
              restricted: true,
            });
          }
        }
      }

      // 5. Save / Update assignment
      const updateData = {
        role,
        status,
        value,
        date: newDate,
        monthYear,
        day,
        type,
        employeeId,
        restricted,
      };

      const updated = await Assignment.findOneAndUpdate(
        { monthYear, day, type, employeeId },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json(
        restricted
          ? { ...updated.toObject(), message: "Role assigned but restricted.", restricted: true }
          : updated
      );
    }

    // For AC type or no role
    const updated = await Assignment.findOneAndUpdate(
      { monthYear, day, type, employeeId },
      { role, status, value, date: newDate, monthYear, day, type, employeeId, restricted: false },
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
