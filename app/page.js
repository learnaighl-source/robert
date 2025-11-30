"use client";
import React, { useState, useEffect } from "react";

const page = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/get-users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []));

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
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <div className="h-full flex flex-col">
        <h1 className="text-8xl font-bold py-12 text-center">
          User Status Dashboard
        </h1>

        <div className="flex-1 flex gap-12 px-12 pb-12">
          <div className="flex-1 bg-green-900 rounded-3xl p-12 flex flex-col">
            <h2 className="text-6xl font-bold mb-8 text-green-300">
              Checked Users ({checkedUsers.length})
            </h2>
            <div className="flex-1 overflow-y-auto space-y-6">
              {checkedUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-green-800 p-8 rounded-3xl text-green-100 text-4xl font-bold"
                >
                  ✅ {user.name}
                </div>
              ))}
              {checkedUsers.length === 0 && (
                <div className="text-green-400 text-5xl text-center mt-32">
                  No users checked
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-red-900 rounded-3xl p-12 flex flex-col">
            <h2 className="text-6xl font-bold mb-8 text-red-300">
              Unchecked Users ({uncheckedUsers.length})
            </h2>
            <div className="flex-1 overflow-y-auto space-y-6">
              {uncheckedUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-red-800 p-8 rounded-3xl text-red-100 text-4xl font-bold"
                >
                  ❌ {user.name}
                </div>
              ))}
              {uncheckedUsers.length === 0 && (
                <div className="text-red-400 text-5xl text-center mt-32">
                  All users checked
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
