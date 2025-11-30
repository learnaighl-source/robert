"use client";
import React, { useState, useEffect } from "react";

const page = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = () => {
      fetch("/api/get-users")
        .then((r) => r.json())
        .then((data) => setUsers(data.users || []));
    };

    loadUsers();
    const interval = setInterval(loadUsers, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkedUsers = users.filter((u) => u.checked);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #000000 0%, #111111 100%)",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        color: "#e2e8f0",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        padding: "20px",
        margin: 0,
        overflow: "auto",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          paddingBottom: "15px",
          borderBottom: "2px solid #333333",
          marginBottom: "25px",
          color: "#ffffff",
          fontWeight: "600",
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        }}
      >
        Available Users
      </h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid #374151",
          paddingBottom: "20px",
          marginBottom: "20px",
        }}
      >
        {checkedUsers.map((user) => (
          <div
            key={user._id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 16px",
              background: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
              border: "1px solid #404040",
              borderRadius: "8px",
              whiteSpace: "nowrap",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
              fontSize: "14px",
              color: "#e2e8f0",
              fontWeight: "500",
            }}
          >
            {user.name}
          </div>
        ))}
        {checkedUsers.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "30px",
              color: "#94a3b8",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            No users available
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
