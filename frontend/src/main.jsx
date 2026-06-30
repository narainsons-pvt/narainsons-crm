import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const branches = [
  {
    name: "Delhi",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
    line: "Central operations and customer data control"
  },
  {
    name: "Assam",
    image: "https://images.unsplash.com/photo-1627894485200-76296c9e5f71?auto=format&fit=crop&w=1200&q=80",
    line: "Regional customer validation and collections"
  },
  {
    name: "Jaunpur",
    image: "https://images.unsplash.com/photo-1598324789736-4861f89564a0?auto=format&fit=crop&w=1200&q=80",
    line: "Branch data import and correction workflow"
  },
  {
    name: "Kolkata",
    image: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80",
    line: "CIBIL records, reports and activity tracking"
  }
];

function App() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [message, setMessage] = useState("");
  const savedToken = localStorage.getItem("token");
const savedUser = JSON.parse(localStorage.getItem("user") || "null");
const savedBranch = localStorage.getItem("branch");
const [activePage, setActivePage] = useState("Dashboard");

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("Logging in...");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("branch", selectedBranch.name);

      window.location.reload();
    } catch {
      setMessage("Backend is not reachable. Please keep backend running.");
    }
  }
if (savedToken && savedUser) {
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand-mark">NF</div>
        <h2>Narainsons CRM</h2>
        <p>{savedBranch} Branch</p>

        <nav>
           <button onClick={() => setActivePage("Dashboard")}>Dashboard</button>
  <button onClick={() => setActivePage("Upload Data")}>Upload Data</button>
  <button onClick={() => setActivePage("Customers")}>Customers</button>
  <button onClick={() => setActivePage("Reports")}>Reports</button>
  <button onClick={() => setActivePage("Tasks")}>Tasks</button>
  <button onClick={() => setActivePage("Notes")}>Notes</button>
        </nav>

        <button
          className="logout-button"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          Logout
        </button>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Welcome, {savedUser.name}</p>
            <h1>{savedBranch} CIBIL Dashboard</h1>
          </div>
          <div className="user-pill">{savedUser.role}</div>
        </header>

        <div className="stats-grid">
          <div className="stat-card blue">
            <span>Total Records</span>
            <strong>0</strong>
          </div>
          <div className="stat-card green">
            <span>Today's Uploads</span>
            <strong>0</strong>
          </div>
          <div className="stat-card orange">
            <span>Invalid Records</span>
            <strong>0</strong>
          </div>
          <div className="stat-card red">
            <span>Duplicate Records</span>
            <strong>0</strong>
          </div>
        </div>

        <section className="work-panel">
          <div>
            <p className="eyebrow">Next Work Area</p>
            <h2>CSV / Excel Import</h2>
            <p>
              Upload customer files, detect columns, map fields, validate PAN and mobile numbers,
              reject duplicates and save clean records.
            </p>
          </div>

          <button className="primary-button">Start Upload</button>
        </section>

        <section className="activity-panel">
          <h2>Branch Activity</h2>
          <div className="activity-row">
            <span>Validation module</span>
            <strong>Ready</strong>
          </div>
          <div className="activity-row">
            <span>Duplicate PAN checking</span>
            <strong>Ready</strong>
          </div>
          <div className="activity-row">
            <span>Reports download</span>
            <strong>Next</strong>
          </div>
        </section>
      </section>
    </main>
  );
}
  if (selectedBranch) {
    return (
      <main className="login-page">
        <section className="login-visual" style={{ backgroundImage: `url(${selectedBranch.image})` }}>
          <button className="back-button" onClick={() => setSelectedBranch(null)}>
            Back
          </button>
          <div className="login-shade">
            <p className="eyebrow">Selected Branch</p>
            <h1>{selectedBranch.name}</h1>
            <p>{selectedBranch.line}</p>
          </div>
        </section>

        <section className="login-panel">
          <div className="brand-mark">NF</div>
          <p className="eyebrow">Narainsons Finance</p>
          <h2>CIBIL Management CRM</h2>
          <p className="login-copy">
            Secure access for upload, validation, duplicate control, corrections and reports.
          </p>

          <form onSubmit={handleLogin}>
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />

            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <button className="primary-button" type="submit">
              Login to {selectedBranch.name}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Narainsons Finance</p>
          <h1>Narainsons CIBIL Management CRM</h1>
          <p>
            A centralized system for customer imports, PAN validation, duplicate control,
            corrections, audit logs and branch-wise reporting.
          </p>
        </div>

        <div className="floating-locations">
          {branches.map((branch, index) => (
            <span key={branch.name} style={{ animationDelay: `${index * 0.35}s` }}>
              {branch.name}
            </span>
          ))}
        </div>
      </section>

      <section className="branch-section">
        <div className="section-heading">
          <p className="eyebrow">Choose Your Branch</p>
          <h2>Select location to continue</h2>
        </div>

        <div className="branch-grid">
          {branches.map((branch) => (
            <button
              key={branch.name}
              className="branch-card"
              onClick={() => setSelectedBranch(branch)}
              style={{ backgroundImage: `url(${branch.image})` }}
            >
              <span className="branch-overlay"></span>
              <span className="branch-content">
                <strong>{branch.name}</strong>
                <small>{branch.line}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);