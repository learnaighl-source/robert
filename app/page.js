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
  const uncheckedUsers = users.filter((u) => !u.checked);

  return (
    <div className="w-full h-screen bg-black text-white flex flex-col">
      <h1 className="text-2xl font-bold py-4 text-center">
        User Status Dashboard
      </h1>

      <div className="flex-1 flex gap-4 px-4 pb-4">
        <div className="flex-1 bg-green-900 rounded-lg p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-3 text-green-300">
            Checked Users ({checkedUsers.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {checkedUsers.map((user) => (
              <div
                key={user._id}
                className="bg-green-800 p-2 rounded text-green-100 text-sm font-semibold"
              >
                ✅ {user.name}
              </div>
            ))}
            {checkedUsers.length === 0 && (
              <div className="text-green-400 text-sm text-center mt-4">
                No users checked
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-red-900 rounded-lg p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-3 text-red-300">
            Unchecked Users ({uncheckedUsers.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {uncheckedUsers.map((user) => (
              <div
                key={user._id}
                className="bg-red-800 p-2 rounded text-red-100 text-sm font-semibold"
              >
                ❌ {user.name}
              </div>
            ))}
            {uncheckedUsers.length === 0 && (
              <div className="text-red-400 text-sm text-center mt-4">
                All users checked
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
