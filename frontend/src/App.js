import { useState, useEffect, useRef } from "react";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div style={{ margin: 0, padding: 0, background: "#030712", minHeight: "100vh" }}>
      <Dashboard />
    </div>
  );
}

export default App;