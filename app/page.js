"use client";
import React, { useState, useEffect } from "react";

const page = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Load initial users
    fetch("/api/get-users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []));

    // Real-time updates
    const eventSource = new EventSource("/api/websocket");
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "userUpdate") {
        setUsers((prev) =>
          prev.map((user) =>
            user.name === data.userName
              ? { ...user, checked: data.checked }
              : user
          )
        );
      }
    };

    return () => eventSource.close();
  }, []);

  const checkedUsers = users.filter((u) => u.checked);
  const uncheckedUsers = users.filter((u) => !u.checked);

  return (
    <div className="h-screen bg-black text-white p-4 overflow-hidden">
      <h1 className="text-4xl font-bold mb-6 text-center">
        User Status Dashboard
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
        <div className="bg-green-900 p-6 rounded-xl overflow-hidden flex flex-col">
          <h2 className="text-3xl font-bold mb-4 text-green-300">
            Checked Users ({checkedUsers.length})
          </h2>
          <div className="space-y-3 overflow-y-auto flex-1">
            {checkedUsers.map((user) => (
              <div
                key={user._id}
                className="bg-green-800 p-4 rounded-lg text-green-100 text-xl font-semibold"
              >
                ✅ {user.name}
              </div>
            ))}
            {checkedUsers.length === 0 && (
              <div className="text-green-400 text-2xl">No users checked</div>
            )}
          </div>
        </div>

        <div className="bg-red-900 p-6 rounded-xl overflow-hidden flex flex-col">
          <h2 className="text-3xl font-bold mb-4 text-red-300">
            Unchecked Users ({uncheckedUsers.length})
          </h2>
          <div className="space-y-3 overflow-y-auto flex-1">
            {uncheckedUsers.map((user) => (
              <div
                key={user._id}
                className="bg-red-800 p-4 rounded-lg text-red-100 text-xl font-semibold"
              >
                ❌ {user.name}
              </div>
            ))}
            {uncheckedUsers.length === 0 && (
              <div className="text-red-400 text-2xl">All users checked</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
