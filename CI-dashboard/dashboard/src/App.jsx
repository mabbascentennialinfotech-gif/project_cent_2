import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Briefcase,
  Activity,
  Search,
  Bell,
  Settings,
  Plus,
  X,
  Trash2,
  Edit2,
  AlertTriangle,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./index.css";

// const API_URL = "http://localhost:5000/api";
const API_URL = import.meta.env.VITE_API_URL;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

function App() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [warning, setWarning] = useState("");

  const [newStaff, setNewStaff] = useState({ name: "", count: "" });
  const [newRole, setNewRole] = useState("");
  const [editingCell, setEditingCell] = useState(null);

  // --- API Calls ---

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`);
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/employees`);
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const monthKey = `${selectedYear}-${selectedMonth}`;
      const res = await fetch(`${API_URL}/assignments/${monthKey}`);
      const assignments = await res.json();

      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0,
      ).getDate();
      const newGrid = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateCells = {};
        const acCells = {};
        assignments
          .filter((a) => a.day === d)
          .forEach((a) => {
            if (a.type === "DATE")
              dateCells[a.employeeId] = { role: a.role, status: a.status };
            else if (a.type === "AC")
              acCells[a.employeeId] = { value: a.value };
          });
        newGrid.push({ type: "DATE", date: d, cells: dateCells });
        newGrid.push({ type: "AC", label: "AC", cells: acCells });
      }
      setScheduleData(newGrid);
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [selectedMonth, selectedYear]);

  // --- Handlers ---

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name) return;
    try {
      await fetch(`${API_URL}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaff.name,
          totalCount: newStaff.count ? parseInt(newStaff.count) : 0,
        }),
      });
      fetchEmployees();
      setNewStaff({ name: "", count: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding staff:", err);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole) return;
    try {
      await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRole }),
      });
      fetchRoles();
      setNewRole("");
      setIsRoleModalOpen(false);
    } catch (err) {
      console.error("Error adding role:", err);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await fetch(`${API_URL}/employees/${id}`, { method: "DELETE" });
        fetchEmployees();
      } catch (err) {
        console.error("Error deleting staff:", err);
      }
    }
  };

  const handleSaveCell = async () => {
    const monthKey = `${selectedYear}-${selectedMonth}`;
    const { rowIndex, empId, role, status, value, type } = editingCell;
    const day = scheduleData[rowIndex].date || scheduleData[rowIndex - 1].date;

    if (type === "DATE" && role) {
      const currentRow = scheduleData[rowIndex].cells;
      if (
        Object.entries(currentRow).some(
          ([id, data]) => id !== empId.toString() && data.role === role,
        )
      ) {
        setWarning(`Warning: Already assigned today!`);
        return;
      }
      let violationDate = null;
      scheduleData.forEach((row, idx) => {
        if (idx !== rowIndex && row.type === "DATE" && row.date) {
          const cell = row.cells[empId];
          if (cell && cell.role === role && Math.abs(day - row.date) < 8)
            violationDate = row.date;
        }
      });
      if (violationDate !== null) {
        setWarning(`Wait at least 7 days! (Last: ${violationDate})`);
        return;
      }
    }

    try {
      await fetch(`${API_URL}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthYear: monthKey,
          day,
          type,
          employeeId: empId,
          role,
          status,
          value,
        }),
      });
      fetchAssignments();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error saving assignment:", err);
    }
  };

  const handleDeleteCellData = async () => {
    const monthKey = `${selectedYear}-${selectedMonth}`;
    const { rowIndex, empId, type } = editingCell;
    const day =
      scheduleData[rowIndex].date ||
      (scheduleData[rowIndex - 1] && scheduleData[rowIndex - 1].date);

    try {
      await fetch(`${API_URL}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthYear: monthKey,
          day,
          type,
          employeeId: empId,
        }),
      });
      fetchAssignments();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error deleting assignment:", err);
    }
  };

  const openEditCell = (rowIndex, empId) => {
    const row = scheduleData[rowIndex];
    const cell = row.cells[empId] || {};
    setEditingCell({
      rowIndex,
      empId,
      role: cell.role || "",
      status: cell.status || "blue",
      value: cell.value || "",
      type: row.type,
    });
    setWarning("");
    setIsEditModalOpen(true);
  };

  const filteredEmployees = employees.filter((emp) =>
    (emp.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="modern-table-container">
      <header className="dashboard-header">
        <div className="logo-section">
          <h1>
            Centennial <span>Infotech</span>
          </h1>
        </div>

        <div
          className="month-selector"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--bg-secondary)",
            padding: "0.4rem 1rem",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
          }}
        >
          <button
            onClick={() =>
              setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1))
            }
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontWeight: "bold",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {MONTHS.map((m, i) => (
              <option
                key={m}
                value={i}
                style={{ background: "var(--bg-secondary)" }}
              >
                {m}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              background: "none",
              border: "none",
              color: "white",
              fontWeight: "bold",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {YEARS.map((y) => (
              <option
                key={y}
                value={y}
                style={{ background: "var(--bg-secondary)" }}
              >
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1))
            }
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div
          className="header-actions"
          style={{ display: "flex", gap: "1rem", alignItems: "center" }}
        >
          <div className="search-bar" style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-secondary)",
              }}
            />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "0.6rem 1rem 0.6rem 2.5rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "rgba(15, 23, 42, 0.5)",
                color: "white",
                width: "180px",
              }}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setIsRoleModalOpen(true)}
          >
            <Briefcase size={18} /> Add Role
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} /> Add Staff
          </button>
        </div>
      </header>

      <div style={{ overflow: "auto", height: "calc(100vh - 65px)" }}>
        <main
          className="main-grid"
          style={{
            gridTemplateColumns: `100px repeat(${filteredEmployees.length}, 220px)`,
          }}
        >
          <div className="grid-header date-col">
            <Calendar size={18} color="var(--accent-blue)" />
            <span>Date</span>
          </div>
          {filteredEmployees.map((emp) => (
            <div key={emp._id || emp.id} className="grid-header employee-name">
              <Users size={18} color="#94a3b8" />
              <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>
                {emp.name || "Unknown"}
              </span>
              {emp.totalCount > 0 && (
                <span className="employee-badge">{emp.totalCount}</span>
              )}
              <div className="employee-actions">
                <Trash2
                  size={14}
                  className="action-icon delete"
                  onClick={() => handleDeleteEmployee(emp._id)}
                />
              </div>
            </div>
          ))}

          {scheduleData.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              <div
                className={`grid-cell date-label ${row.type === "AC" ? "ac-row" : ""}`}
              >
                {row.type === "DATE" ? row.date : row.label}
              </div>
              {filteredEmployees.map((emp) => {
                const cellData = row.cells[emp._id];
                const cellClass = cellData ? `cell-${cellData.status}` : "";
                return (
                  <div
                    key={emp._id}
                    className={`grid-cell ${row.type === "AC" ? "ac-row" : ""} ${cellClass}`}
                    onClick={() => openEditCell(rowIndex, emp._id)}
                  >
                    {cellData ? (
                      <>
                        {cellData.role && (
                          <span className="role-text">{cellData.role}</span>
                        )}
                        {cellData.value !== undefined && (
                          <span className="value-text">{cellData.value}</span>
                        )}
                      </>
                    ) : (
                      <span className="empty-cell">-</span>
                    )}
                    <div className="cell-edit-overlay">
                      <Edit2 size={16} />
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </main>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2>Add Staff</h2>
              <X
                className="action-icon"
                onClick={() => setIsModalOpen(false)}
              />
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Count</label>
                <input
                  type="number"
                  value={newStaff.count}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, count: e.target.value })
                  }
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {isRoleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2>Add New Role</h2>
              <X
                className="action-icon"
                onClick={() => setIsRoleModalOpen(false)}
              />
            </div>
            <form onSubmit={handleAddRole}>
              <div className="form-group">
                <label>Role Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Agent"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRoleModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Data Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}
            >
              <h2>Edit Data</h2>
              <X
                className="action-icon"
                onClick={() => setIsEditModalOpen(false)}
              />
            </div>
            {warning && (
              <div className="warning-box">
                <AlertTriangle size={18} /> {warning}
              </div>
            )}
            {editingCell.type === "DATE" ? (
              <>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={editingCell.role}
                    onChange={(e) =>
                      setEditingCell({ ...editingCell, role: e.target.value })
                    }
                  >
                    <option value="">-- None --</option>
                    {roles.map((r) => (
                      <option key={r._id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editingCell.status}
                    onChange={(e) =>
                      setEditingCell({ ...editingCell, status: e.target.value })
                    }
                  >
                    <option value="blue">Blue</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="gray">Gray</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label>AC Value</label>
                <input
                  type="number"
                  value={editingCell.value}
                  onChange={(e) =>
                    setEditingCell({ ...editingCell, value: e.target.value })
                  }
                />
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDeleteCellData}>
                <Trash2 size={16} /> Delete
              </button>
              <div style={{ flex: 1 }}></div>
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveCell}>
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
