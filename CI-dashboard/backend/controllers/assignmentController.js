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

      // FIX: Calculate date range properly using UTC to avoid month boundary issues
      const endDate = new Date(newDate);
      endDate.setHours(23, 59, 59, 999); // End of the target day

      const startDate = new Date(newDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0); // Start of 7 days ago

      // Also get the previous month's monthYear for cross-month queries
      const currentDate = new Date(newDate);
      const prevMonthDate = new Date(currentDate);
      prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
      const prevMonthYear = `${prevMonthDate.getFullYear()}-${prevMonthDate.getMonth() + 1}`;

      // Check if this is an update to an existing cell (same employee, same day)
      const existingToday = await Assignment.findOne({
        monthYear,
        day,
        type: "DATE",
        employeeId,
      });

      // ============================================
      // STEP 1: CHECK SAME DAY - OTHER EMPLOYEES
      // ============================================

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

        // KEEP THIS MESSAGE UNCHANGED
        return res.status(400).json({
          message: `Cannot assign already assigned to ${name}`
        });
      }

      // ============================================
      // STEP 2: CHECK SAME EMPLOYEE - LAST 7 DAYS (ANY COLOR)
      // ============================================

      // FIX: Query across both current and previous month using date range
      const recentAnyColor = await Assignment.findOne({
        role,
        type: "DATE",
        employeeId,
        date: { $gte: startDate, $lte: endDate }, // Using proper date range
        _id: { $ne: existingToday?._id }
      }).sort({ date: -1 });

      if (recentAnyColor) {
        const diffDays = Math.floor(
          (endDate - new Date(recentAnyColor.date)) /
          (1000 * 60 * 60 * 24)
        );
        const daysLeft = 7 - diffDays;

        const emp = await Employee.findById(employeeId);
        const name = emp ? emp.name : "this user";
        const color = recentAnyColor.status;

        // UPDATED: Generic message for any color
        return res.status(400).json({
          message: `Already assigned with ${color} to ${name} wait ${daysLeft} days`
        });
      }

      // ============================================
      // STEP 3: CHECK SAME EMPLOYEE - SPECIFIC COLOR RULES
      // ============================================

      // Check if SAME PERSON is trying to assign RED again within 7 days
      if (status === "red") {
        const recentRedSelf = await Assignment.findOne({
          role,
          type: "DATE",
          employeeId,
          status: "red",
          date: { $gte: startDate, $lte: endDate },
          _id: { $ne: existingToday?._id }
        }).sort({ date: -1 });

        if (recentRedSelf) {
          const diffDays = Math.floor(
            (endDate - new Date(recentRedSelf.date)) /
            (1000 * 60 * 60 * 24)
          );
          const daysLeft = 7 - diffDays;

          const emp = await Employee.findById(employeeId);
          const name = emp ? emp.name : "this user";

          // UPDATED: Red → Red message
          return res.status(400).json({
            message: `Already assigned with red to ${name} wait ${daysLeft} days`
          });
        }
      }

      // Check if SAME PERSON is trying to assign BLUE after having RED
      if (status === "blue") {
        const recentRedSelf = await Assignment.findOne({
          role,
          type: "DATE",
          employeeId,
          status: "red",
          date: { $gte: startDate, $lte: endDate },
          _id: { $ne: existingToday?._id }
        }).sort({ date: -1 });

        if (recentRedSelf) {
          const diffDays = Math.floor(
            (endDate - new Date(recentRedSelf.date)) /
            (1000 * 60 * 60 * 24)
          );
          const daysLeft = 7 - diffDays;

          const emp = await Employee.findById(employeeId);
          const name = emp ? emp.name : "this user";

          // UPDATED: Red → Blue message (same as Red → Red)
          return res.status(400).json({
            message: `Already assigned with red to ${name} wait ${daysLeft} days`
          });
        }
      }

      // ============================================
      // STEP 4: CHECK ALL EMPLOYEES - LAST 7 DAYS (GLOBAL)
      // ============================================

      // For GREEN - check if ANYONE had GREEN in last 7 days
      if (status === "green") {
        const recentGreenAnyone = await Assignment.findOne({
          role,
          type: "DATE",
          status: "green",
          date: { $gte: startDate, $lte: endDate }, // Using proper date range
          employeeId: { $ne: employeeId },
          _id: { $ne: existingToday?._id }
        });

        if (recentGreenAnyone) {
          const diffDays = Math.floor(
            (endDate - new Date(recentGreenAnyone.date)) /
            (1000 * 60 * 60 * 24)
          );
          const daysLeft = 7 - diffDays;

          const emp = await Employee.findById(recentGreenAnyone.employeeId);
          const name = emp ? emp.name : "another staff";

          return res.status(400).json({
            message: `Cannot assign already assigned to ${name} wait ${daysLeft} days`
          });
        }
      }

      // For BLUE - check if ANYONE had BLUE in last 7 days
      if (status === "blue") {
        const recentBlueAnyone = await Assignment.findOne({
          role,
          type: "DATE",
          status: "blue",
          date: { $gte: startDate, $lte: endDate }, // Using proper date range
          employeeId: { $ne: employeeId },
          _id: { $ne: existingToday?._id }
        });

        if (recentBlueAnyone) {
          const diffDays = Math.floor(
            (endDate - new Date(recentBlueAnyone.date)) /
            (1000 * 60 * 60 * 24)
          );
          const daysLeft = 7 - diffDays;

          const emp = await Employee.findById(recentBlueAnyone.employeeId);
          const name = emp ? emp.name : "another staff";

          return res.status(400).json({
            message: `Cannot assign already assigned to ${name} wait ${daysLeft} days`
          });
        }
      }

      // ============================================
      // STEP 5: SAVE THE ASSIGNMENT
      // ============================================

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