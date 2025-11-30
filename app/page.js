"use client";
import React, { useState, useEffect } from "react";

const page = () => {
  const [users, setUsers] = useState([]);
  const [calendars, setCalendars] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, calendarsRes] = await Promise.all([
          fetch("/api/get-users"),
          fetch("/api/get-calendars"),
        ]);

        const usersData = await usersRes.json();
        const calendarsData = await calendarsRes.json();

        setUsers(usersData.users || []);
        setCalendars(calendarsData.calendars || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkedUsers = users.filter((u) => u.checked);

  const times = [
    { label: "12 AM", hour: 0 },
    { label: "1 AM", hour: 1 },
    { label: "2 AM", hour: 2 },
    { label: "3 AM", hour: 3 },
    { label: "4 AM", hour: 4 },
    { label: "5 AM", hour: 5 },
    { label: "6 AM", hour: 6 },
    { label: "7 AM", hour: 7 },
    { label: "8 AM", hour: 8 },
    { label: "9 AM", hour: 9 },
    { label: "10 AM", hour: 10 },
    { label: "11 AM", hour: 11 },
    { label: "12 PM", hour: 12 },
    { label: "1 PM", hour: 13 },
    { label: "2 PM", hour: 14 },
    { label: "3 PM", hour: 15 },
    { label: "4 PM", hour: 16 },
    { label: "5 PM", hour: 17 },
    { label: "6 PM", hour: 18 },
    { label: "7 PM", hour: 19 },
    { label: "8 PM", hour: 20 },
    { label: "9 PM", hour: 21 },
    { label: "10 PM", hour: 22 },
    { label: "11 PM", hour: 23 },
  ];

  const getUserCalendar = (userName) => {
    return calendars.find((cal) =>
      cal.name.toLowerCase().includes(userName.toLowerCase())
    );
  };

  const getTodayInfo = () => {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Australia/Brisbane",
    });
    const brisbaneDate = new Date(now);
    const dayOfWeek = brisbaneDate.getDay();
    const todayDate = brisbaneDate.toLocaleDateString("en-AU");

    return { dayOfWeek, todayDate };
  };

  const getUserOpeningHours = (userName) => {
    const calendar = getUserCalendar(userName);
    if (!calendar) return null;

    const { dayOfWeek } = getTodayInfo();

    const daySchedule = calendar.openHours?.find((schedule) =>
      schedule.daysOfTheWeek.includes(dayOfWeek)
    );

    if (!daySchedule) return null;

    return daySchedule.hours
      .map(
        (h) =>
          `${h.openHour}:${h.openMinute.toString().padStart(2, "0")}-${
            h.closeHour
          }:${h.closeMinute.toString().padStart(2, "0")}`
      )
      .join(", ");
  };

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
        Choose the slot that are available for you
      </h1>

      {checkedUsers.length > 0 ? (
        <div
          style={{
            maxHeight: "500px",
            overflowY: "auto",
            border: "1px solid #333333",
            borderRadius: "12px",
            background: "rgba(20, 20, 20, 0.8)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `60px repeat(${checkedUsers.length}, 1fr)`,
              gap: 0,
            }}
          >
            <div
              style={{
                padding: "15px 10px",
                borderBottom: "2px solid #333333",
                fontWeight: "600",
                background: "linear-gradient(145deg, #1a1a1a, #0a0a0a)",
                color: "#ffffff",
              }}
            ></div>
            {checkedUsers.map((user) => {
              const { todayDate } = getTodayInfo();
              const openingHours = getUserOpeningHours(user.name);

              return (
                <div
                  key={user._id}
                  style={{
                    padding: "10px",
                    borderBottom: "2px solid #333333",
                    borderLeft: "1px solid #333333",
                    fontWeight: "600",
                    textAlign: "center",
                    background: "linear-gradient(145deg, #1a1a1a, #0a0a0a)",
                    color: "#ffffff",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <div style={{ fontSize: "14px" }}>{user.name}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {todayDate}
                  </div>
                  <div style={{ fontSize: "9px", color: "#10b981" }}>
                    {openingHours || "No schedule"}
                  </div>
                </div>
              );
            })}

            {times.map((time) => (
              <React.Fragment key={time.label}>
                <div
                  style={{
                    padding: "12px 10px",
                    fontWeight: "500",
                    color: "#888888",
                    fontSize: "13px",
                    borderBottom: "1px solid #333333",
                    borderRight: "1px solid #333333",
                    background: "linear-gradient(145deg, #1a1a1a, #0a0a0a)",
                  }}
                >
                  {time.label}
                </div>
                {checkedUsers.map((user) => (
                  <div
                    key={`${time.label}-${user._id}`}
                    style={{
                      padding: 0,
                      borderBottom: "1px solid #333333",
                      borderLeft: "1px solid #333333",
                      minHeight: "55px",
                      background: "#0a0a0a",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(180deg, #10b981, #059669)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        color: "#ffffff",
                        fontWeight: "600",
                        padding: "3px",
                        textAlign: "center",
                        height: "100%",
                        minHeight: "50px",
                      }}
                    >
                      <span>60min</span>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            color: "#94a3b8",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          Loading users...
        </div>
      )}
    </div>
  );
};

export default page;
