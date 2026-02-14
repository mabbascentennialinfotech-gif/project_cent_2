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
        // Check for existing assignment on the SAME DAY for a DIFFERENT employee
        const sameDayDifferentPerson = await Assignment.findOne({
          monthYear,
          day,
          type: "DATE",
          role,
          employeeId: { $ne: employeeId }
        });

        if (sameDayDifferentPerson) {
          const emp = await Employee.findById(sameDayDifferentPerson.employeeId);
          const name = emp ? emp.name : "another staff";

          // RULE 1: If existing person has RED, allow ANYONE to take ANY COLOR on same day
          if (sameDayDifferentPerson.status === "red") {
            // COMPLETE FREEDOM FOR RED! Anyone can take any color when existing is RED
            console.log(`RED holder allows anyone to take any color on same day`);

            // We DO NOT delete the old RED - multiple REDs allowed!
            // Just proceed to save the new assignment
          }
          // RULE 2: If existing person has GREEN, block anyone else from taking it
          else if (sameDayDifferentPerson.status === "green") {
            return res.status(400).json({
              message: `Cannot assign — ${name} has this role as GREEN 🟢 (occupied). Only RED holders allow sharing.`
            });
          }
          // RULE 3: If existing person has BLUE, block everyone
          else if (sameDayDifferentPerson.status === "blue") {
            return res.status(400).json({
              message: `Cannot assign — ${name} has this role as BLUE 🔵. BLUE blocks everyone for 7 days.`
            });
          }
        }

        // Check for existing assignment in the last 7 days (for 7-day rule)
        const recentAssignment = await Assignment.findOne({
          role,
          type: "DATE",
          date: { $gte: sevenDaysAgo, $lte: newDate },
          employeeId: { $ne: employeeId } // Exclude current employee
        }).sort({ date: -1 });

        if (recentAssignment) {
          // RULE: RED and GREEN can freely interchange across days - NO RESTRICTIONS!
          if ((status === "red" || status === "green") &&
            (recentAssignment.status === "red" || recentAssignment.status === "green")) {
            // Allow ANY combination of RED and GREEN across different days
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