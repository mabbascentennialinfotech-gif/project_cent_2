const Assignment = require("../models/Assignment");
const Employee = require("../models/Employee");

// GET assignments for a month
exports.getAssignments = async (req, res) => {
  try {
    const { monthYear } = req.params;
    const assignments = await Assignment.find({ monthYear });
    res.json(assignments);
    console.log('hey')
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

// SAVE or UPDATE assignment
// exports.saveAssignment = async (req, res) => {
//   const { monthYear, day, type, employeeId, role, status, value, date } = req.body;

//   try {
//     const newDate = new Date(date);
//     newDate.setHours(0, 0, 0, 0);

//     if (type === "DATE" && role) {
//       const currentEmployee = await Employee.findById(employeeId);
//       const currentEmployeeName = currentEmployee ? currentEmployee.name : "Staff";

//       // 1. Check if role already assigned TODAY (to anyone)
//       const existingTodayAssignment = await Assignment.findOne({
//         monthYear,
//         day,
//         type: "DATE",
//         role,
//       });

//       if (existingTodayAssignment) {
//         // If same employee trying to update, allow it
//         if (existingTodayAssignment.employeeId === employeeId) {
//           // Allow update for same employee
//           existingTodayAssignment.status = status;
//           existingTodayAssignment.value = value;
//           const updated = await existingTodayAssignment.save();
//           return res.json(updated);
//         } else {
//           // Different employee trying to take same role today
//           const occupiedBy = await Employee.findById(existingTodayAssignment.employeeId);
//           const occupiedName = occupiedBy ? occupiedBy.name : "another staff";

//           // ALL STATUSES: Same message
//           return res.status(400).json({
//             message: `Cannot assign — already assigned to ${occupiedName}`
//           });
//         }
//       }

//       // 2. Check 7-day rule for ALL STATUSES
//       const recentAssignment = await Assignment.findOne({
//         role,
//         type: "DATE",
//       }).sort({ date: -1 });

//       if (recentAssignment) {
//         const lastDate = new Date(recentAssignment.date);
//         lastDate.setHours(0, 0, 0, 0);

//         const diffDays = Math.floor((newDate - lastDate) / (1000 * 60 * 60 * 24));

//         if (diffDays >= 0 && diffDays <= 6) {
//           const assignedEmployee = await Employee.findById(recentAssignment.employeeId);
//           const assignedName = assignedEmployee ? assignedEmployee.name : "another staff";

//           const isSamePerson = recentAssignment.employeeId === employeeId;

//           // Special handling for RED ↔ GREEN switching
//           if ((status === "red" && recentAssignment.status === "green") ||
//             (status === "green" && recentAssignment.status === "red")) {

//             if (isSamePerson) {
//               return res.status(400).json({
//                 message: `Cannot assign — already assigned to you as ${recentAssignment.status}`
//               });
//             } else {
//               return res.status(400).json({
//                 message: `Cannot assign — already assigned to ${assignedName} as ${recentAssignment.status}`
//               });
//             }
//           }

//           // For all other cases (same status or BLUE)
//           if (isSamePerson) {
//             return res.status(400).json({
//               message: `Cannot assign — already assigned to you`
//             });
//           } else {
//             return res.status(400).json({
//               message: `Cannot assign — already assigned to ${assignedName}`
//             });
//           }
//         }
//       }

//       // 3. Save assignment (no conflicts)
//       const updateData = {
//         role,
//         status,
//         value,
//         date: newDate,
//         monthYear,
//         day,
//         type,
//         employeeId,
//         restricted: false
//       };

//       const updated = await Assignment.findOneAndUpdate(
//         { monthYear, day, type, employeeId },
//         updateData,
//         { upsert: true, new: true, setDefaultsOnInsert: true }
//       );

//       return res.json(updated);
//     }

//     // For AC type or no role
//     const updated = await Assignment.findOneAndUpdate(
//       { monthYear, day, type, employeeId },
//       { role, status, value, date: newDate, monthYear, day, type, employeeId, restricted: false },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     return res.json(updated);
//   } catch (err) {
//     console.error("Save assignment error:", err);
//     res.status(500).json({ message: "Error saving assignment" });
//   }
// };



// SAVE or UPDATE assignment
// exports.saveAssignment = async (req, res) => {
//   const { monthYear, day, type, employeeId, role, status, value, date } = req.body;

//   try {
//     const newDate = new Date(date);
//     newDate.setHours(0, 0, 0, 0);

//     if (type === "DATE" && role) {
//       const currentEmployee = await Employee.findById(employeeId);
//       const currentEmployeeName = currentEmployee ? currentEmployee.name : "Staff";

//       // 1. Check if role already assigned TODAY (to anyone)
//       const existingTodayAssignment = await Assignment.findOne({
//         monthYear,
//         day,
//         type: "DATE",
//         role,
//       });

//       if (existingTodayAssignment) {
//         // If same employee trying to update, allow it
//         if (existingTodayAssignment.employeeId === employeeId) {
//           // Allow update for same employee
//           existingTodayAssignment.status = status;
//           existingTodayAssignment.value = value;
//           const updated = await existingTodayAssignment.save();
//           return res.json(updated);
//         } else {
//           // Different employee trying to take same role today
//           const occupiedBy = await Employee.findById(existingTodayAssignment.employeeId);
//           const occupiedName = occupiedBy ? occupiedBy.name : "another staff";

//           // ALL STATUSES: Same message
//           return res.status(400).json({
//             message: `Cannot assign — already assigned to ${occupiedName}`
//           });
//         }
//       }

//       // 2. Check 7-day rule for BLUE only (GREEN/RED can override)
//       const recentAssignment = await Assignment.findOne({
//         role,
//         type: "DATE",
//       }).sort({ date: -1 });

//       if (recentAssignment) {
//         const lastDate = new Date(recentAssignment.date);
//         lastDate.setHours(0, 0, 0, 0);

//         const diffDays = Math.floor((newDate - lastDate) / (1000 * 60 * 60 * 24));

//         if (diffDays >= 0 && diffDays <= 6) {
//           const assignedEmployee = await Employee.findById(recentAssignment.employeeId);
//           const assignedName = assignedEmployee ? assignedEmployee.name : "another staff";
//           const isSamePerson = recentAssignment.employeeId === employeeId;

//           // 🔴🟢 REMOVED: RED ↔ GREEN mutual exclusion - now always allowed

//           // BLUE: Always blocked within 7 days
//           if (status === "blue") {
//             if (isSamePerson) {
//               return res.status(400).json({
//                 message: `Cannot assign — already assigned to you`
//               });
//             } else {
//               return res.status(400).json({
//                 message: `Cannot assign — already assigned to ${assignedName}`
//               });
//             }
//           }

//           // GREEN/RED: Always allowed within 7 days (no restrictions)
//           // No block here - continue to save
//         }
//       }

//       // 3. Save assignment (no conflicts)
//       const updateData = {
//         role,
//         status,
//         value,
//         date: newDate,
//         monthYear,
//         day,
//         type,
//         employeeId,
//         restricted: false
//       };

//       const updated = await Assignment.findOneAndUpdate(
//         { monthYear, day, type, employeeId },
//         updateData,
//         { upsert: true, new: true, setDefaultsOnInsert: true }
//       );

//       return res.json(updated);
//     }

//     // For AC type or no role
//     const updated = await Assignment.findOneAndUpdate(
//       { monthYear, day, type, employeeId },
//       { role, status, value, date: newDate, monthYear, day, type, employeeId, restricted: false },
//       { upsert: true, new: true, setDefaultsOnInsert: true }
//     );

//     return res.json(updated);
//   } catch (err) {
//     console.error("Save assignment error:", err);
//     res.status(500).json({ message: "Error saving assignment" });
//   }
// };


// SAVE or UPDATE assignment
exports.saveAssignment = async (req, res) => {
  const { monthYear, day, type, employeeId, role, status, value, date } = req.body;

  try {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);

    if (type === "DATE" && role) {
      const currentEmployee = await Employee.findById(employeeId);
      const currentEmployeeName = currentEmployee ? currentEmployee.name : "Staff";

      // 1. Check if role already assigned TODAY (to anyone)
      const existingTodayAssignment = await Assignment.findOne({
        monthYear,
        day,
        type: "DATE",
        role,
      });

      if (existingTodayAssignment) {
        // If same employee trying to update, allow it
        if (existingTodayAssignment.employeeId === employeeId) {
          // Allow update for same employee
          existingTodayAssignment.status = status;
          existingTodayAssignment.value = value;
          const updated = await existingTodayAssignment.save();
          return res.json(updated);
        } else {
          // Different employee trying to take same role today
          const occupiedBy = await Employee.findById(existingTodayAssignment.employeeId);
          const occupiedName = occupiedBy ? occupiedBy.name : "another staff";

          // ALL STATUSES: Same message
          return res.status(400).json({
            message: `Cannot assign — already assigned to ${occupiedName}`
          });
        }
      }

      // 2. Check 7-day rule for ALL STATUSES
      const recentAssignment = await Assignment.findOne({
        role,
        type: "DATE",
      }).sort({ date: -1 });

      if (recentAssignment) {
        const lastDate = new Date(recentAssignment.date);
        lastDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((newDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 6) {
          const assignedEmployee = await Employee.findById(recentAssignment.employeeId);
          const assignedName = assignedEmployee ? assignedEmployee.name : "another staff";

          const isSamePerson = recentAssignment.employeeId === employeeId;

          // Special handling for RED ↔ GREEN switching
          if ((status === "red" && recentAssignment.status === "green") ||
            (status === "green" && recentAssignment.status === "red")) {

            if (isSamePerson) {
              return res.status(400).json({
                message: `Cannot assign — already assigned to you as ${recentAssignment.status}`
              });
            } else {
              return res.status(400).json({
                message: `Cannot assign — already assigned to ${assignedName} as ${recentAssignment.status}`
              });
            }
          }

          // For all other cases (same status or BLUE)
          if (isSamePerson) {
            return res.status(400).json({
              message: `Cannot assign — already assigned to you`
            });
          } else {
            return res.status(400).json({
              message: `Cannot assign — already assigned to ${assignedName}`
            });
          }
        }
      }

      // 3. Save assignment (no conflicts)
      const updateData = {
        role,
        status,
        value,
        date: newDate,
        monthYear,
        day,
        type,
        employeeId,
        restricted: false
      };

      const updated = await Assignment.findOneAndUpdate(
        { monthYear, day, type, employeeId },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.json(updated);
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









exports.deleteAssignment = async (req, res) => {
  const { monthYear, day, type, employeeId } = req.body;
  try {
    await Assignment.findOneAndDelete({ monthYear, day, type, employeeId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error deleting assignment" });
  }
};


