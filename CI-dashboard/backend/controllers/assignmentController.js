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
        const sevenDaysAgo = new Date(newDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        // RULE 1: Check if SAME PERSON is trying to assign RED again within 7 days
        if (status === "red") {
          const recentRedSelf = await Assignment.findOne({
            role,
            type: "DATE",
            employeeId,
            status: "red",
            date: { $gte: sevenDaysAgo, $lte: newDate }
          }).sort({ date: -1 });

          if (recentRedSelf) {
            const emp = await Employee.findById(employeeId);
            const name = emp ? emp.name : "this user";

            return res.status(400).json({
              message: `Cannot assign RED again ${name}`
            });
          }
        }

        // RULE 2: Check if SAME PERSON is trying to assign GREEN again within 7 days
        if (status === "green") {
          const recentGreenSelf = await Assignment.findOne({
            role,
            type: "DATE",
            employeeId,
            status: "green",
            date: { $gte: sevenDaysAgo, $lte: newDate }
          }).sort({ date: -1 });

          if (recentGreenSelf) {
            const emp = await Employee.findById(employeeId);
            const name = emp ? emp.name : "this user";

            return res.status(400).json({
              message: `Cannot assign GREEN again — you already to ${name}`
            });
          }
        }

        // RULE 3: Check if SAME PERSON is trying to assign BLUE again within 7 days (BLUE → BLUE)
        if (status === "blue") {
          const recentBlueSelf = await Assignment.findOne({
            role,
            type: "DATE",
            employeeId,
            status: "blue",
            date: { $gte: sevenDaysAgo, $lte: newDate }
          }).sort({ date: -1 });

          if (recentBlueSelf) {
            const emp = await Employee.findById(employeeId);
            const name = emp ? emp.name : "this user";

            return res.status(400).json({
              message: `Cannot assign BLUE again — already assigned to ${name}`
            });
          }
        }

        // RULE 4: Check if SAME PERSON is trying to assign BLUE after having RED or GREEN within 7 days
        if (status === "blue") {
          const recentAnyColorSelf = await Assignment.findOne({
            role,
            type: "DATE",
            employeeId,
            status: { $in: ["red", "green"] },
            date: { $gte: sevenDaysAgo, $lte: newDate }
          }).sort({ date: -1 });

          if (recentAnyColorSelf) {
            const diffDays = Math.floor(
              (newDate - new Date(recentAnyColorSelf.date)) /
              (1000 * 60 * 60 * 24)
            );
            const daysLeft = 7 - diffDays;

            const colorEmoji = recentAnyColorSelf.status === "red" ? "RED" : "GREEN";

            return res.status(400).json({
              message: `Cannot assign BLUE — you already had this role as ${colorEmoji} recently. Please wait ${daysLeft} more days.`
            });
          }
        }

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

          // RULE 5: If existing person has RED, allow ANYONE to take ANY COLOR on same day
          if (sameDayDifferentPerson.status === "red") {
            // COMPLETE FREEDOM FOR RED! Anyone can take any color when existing is RED
            console.log(`RED holder allows anyone to take any color on same day`);
            // Proceed to save the new assignment
          }
          // RULE 6: If existing person has GREEN or BLUE, block anyone else from taking it on same day
          else if (sameDayDifferentPerson.status === "green" || sameDayDifferentPerson.status === "blue") {
            return res.status(400).json({
              message: `Cannot assign Today Already assigned to ${name}`
            });
          }
        }

        // NO OTHER RESTRICTIONS!
        // Different people can take any color anytime across different days
        // RED → GREEN and GREEN → RED are always allowed for same person
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