"use client";

import React, { useEffect } from "react";
import { useRealtimeData } from "../hooks/useRealtimeData";
import IframeManager from "../lib/iframeManager";
import {
  calculateAvailableSlots,
  getBrisbaneTimestamps,
} from "../lib/timeSlotCalculator";

export default function Home() {
  const { data, loading, error, forceRefresh, checkedUsers, calendars } =
    useRealtimeData();
  const [showInput, setShowInput] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [adminMode, setAdminMode] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState([]);
  const [userSchedules, setUserSchedules] = React.useState({});
  const [userEvents, setUserEvents] = React.useState({});
  const [lastRefreshTime, setLastRefreshTime] = React.useState(Date.now());
  const [countdown, setCountdown] = React.useState(300); // 5 minutes in seconds
  const refreshDataRef = React.useRef();

  // Initialize iframe management
  useEffect(() => {
    if (IframeManager.isInIframe()) {
      IframeManager.disableCache();
      IframeManager.preventHydrationMismatch();
    }
  }, []);

  // Consolidated refresh function
  const refreshData = React.useCallback(async () => {
    forceRefresh();
    const timestamp = Date.now();
    const usersResponse = await fetch(`/api/ghl/users?_t=${timestamp}`, {
      cache: "no-store",
    });
    const users = await usersResponse.json();
    const checkedUsers = users.filter((u) => u.checked);
    setAllUsers(users);

    const schedules = {};
    const events = {};
    const { startTime, endTime } = getBrisbaneTimestamps();

    for (const user of checkedUsers) {
      try {
        const scheduleResponse = await fetch(
          `/api/schedules/${user.userId}?_t=${timestamp}`,
          {
            cache: "no-store",
          }
        );
        const scheduleData = await scheduleResponse.json();
        schedules[user.userId] = scheduleData;

        const eventsResponse = await fetch(
          `/api/events/${user.userId}?startTime=${startTime}&endTime=${endTime}&_t=${timestamp}`,
          { cache: "no-store" }
        );
        const eventsData = await eventsResponse.json();
        events[user.userId] = eventsData.events || [];
      } catch (error) {
        console.error(`Error fetching data for ${user.name}:`, error);
      }
    }
    setUserSchedules(schedules);
    setUserEvents(events);
    setLastRefreshTime(Date.now());
    setCountdown(300); // Reset to 5 minutes
  }, [forceRefresh]);

  // Store refreshData in ref
  refreshDataRef.current = refreshData;

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshData]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshDataRef.current(); // Trigger refresh when countdown reaches 0
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load checked users on page load
  useEffect(() => {
    refreshData();
  }, []);

  const times = [
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
    const calendar = calendars.find((cal) =>
      cal.name.toLowerCase().includes(userName.toLowerCase())
    );
    return calendar;
  };

  const getTodayInfo = () => {
    const now = new Date().toLocaleString("en-US", {
      timeZone: "Australia/Brisbane",
    });
    const brisbaneDate = new Date(now);
    const dayOfWeek = brisbaneDate.getDay();
    const todayDate = brisbaneDate.toLocaleDateString("en-AU");
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[dayOfWeek];

    return { dayOfWeek, todayDate, dayName };
  };

  const getUserOpeningHours = (userName) => {
    const calendar = getUserCalendar(userName);
    if (!calendar) {
      return { hours: "No calendar", schedule: null };
    }

    const { dayOfWeek } = getTodayInfo();
    const daySchedule = calendar.openHours?.find((schedule) =>
      schedule.daysOfTheWeek.includes(dayOfWeek)
    );

    if (!daySchedule) {
      return { hours: "Closed today", schedule: null };
    }

    const hours = daySchedule.hours
      .map(
        (h) =>
          `${h.openHour}:${h.openMinute.toString().padStart(2, "0")}-${
            h.closeHour
          }:${h.closeMinute.toString().padStart(2, "0")}`
      )
      .join(", ");

    return { hours, schedule: daySchedule };
  };

  const getHourAvailability = (userName, hour) => {
    const calendar = getUserCalendar(userName);
    if (!calendar) return { availableMinutes: 0, totalMinutes: 60 };

    const { dayOfWeek } = getTodayInfo();
    const daySchedule = calendar.openHours?.find((schedule) =>
      schedule.daysOfTheWeek.includes(dayOfWeek)
    );

    if (!daySchedule) return { availableMinutes: 0, totalMinutes: 60 };

    let availableMinutes = 0;
    const hourStart = hour * 60;
    const hourEnd = (hour + 1) * 60;

    for (const timeSlot of daySchedule.hours) {
      const openTimeMinutes = timeSlot.openHour * 60 + timeSlot.openMinute;
      const closeTimeMinutes = timeSlot.closeHour * 60 + timeSlot.closeMinute;

      const overlapStart = Math.max(hourStart, openTimeMinutes);
      const overlapEnd = Math.min(hourEnd, closeTimeMinutes);

      if (overlapStart < overlapEnd) {
        availableMinutes += overlapEnd - overlapStart;
      }
    }

    return { availableMinutes, totalMinutes: 60 };
  };

  if (loading) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #000000 0%, #111111 100%)",
          color: "#e2e8f0",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>
            Loading...
          </div>
          <div style={{ fontSize: "14px", color: "#94a3b8" }}>
            Syncing with GHL...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #000000 0%, #111111 100%)",
          color: "#e2e8f0",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "18px", marginBottom: "10px", color: "#ef4444" }}
          >
            Error: {error}
          </div>
          <button
            onClick={forceRefresh}
            style={{
              background: "linear-gradient(145deg, #10b981, #059669)",
              border: "1px solid #047857",
              borderRadius: "8px",
              color: "#ffffff",
              padding: "10px 16px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #555555, #333333);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #666666, #444444);
        }
      `}</style>

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
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "15px",
            borderBottom: "2px solid #333333",
            marginBottom: "25px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "24px",
                color: "#ffffff",
                fontWeight: "600",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Available Slots
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: 0,
              }}
            >
              These slots offered today, for tomorrow's slots{" "}
              <a
                href="https://cutnfade.com.au/booking"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#10b981",
                  textDecoration: "underline",
                }}
              >
                visit the booking page
              </a>
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
            }}
          >
            <button
              onClick={refreshData}
              disabled={loading}
              style={{
                background: loading
                  ? "#666666"
                  : "linear-gradient(145deg, #10b981, #059669)",
                border: "1px solid #047857",
                borderRadius: "8px",
                color: "#ffffff",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.background =
                    "linear-gradient(145deg, #059669, #047857)";
                  e.target.style.transform = "translateY(-2px)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.background =
                    "linear-gradient(145deg, #10b981, #059669)";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              <span style={{ fontSize: "16px" }}>↻</span>
              {loading ? "Syncing..." : "Refresh"}
            </button>
            <div
              style={{
                fontSize: "12px",
                color: "#10b981",
                fontWeight: "500",
              }}
            >
              Last updated: {Math.floor(countdown / 60)}:
              {(countdown % 60).toString().padStart(2, "0")} ago
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid #10b981",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{ fontSize: "18px", color: "#10b981", fontWeight: "600" }}
          >
            {new Date().toLocaleDateString("en-AU", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          {/* <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "5px" }}>
            Brisbane Time
          </div> */}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setShowInput(!showInput)}
            style={{
              background: "transparent",
              border: "none",
              color: "#e2e8f0",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                transform: showInput ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              ▶
            </span>
          </button>
          {showInput && (
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    try {
                      const response = await fetch("/api/admin", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password: inputValue }),
                      });
                      const { valid } = await response.json();
                      if (valid) {
                        setAdminMode(true);
                        await refreshData();
                      }
                    } catch (error) {
                      console.error("Error:", error);
                    }
                    setInputValue("");
                  }
                }}
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #333333",
                  borderRadius: "6px",
                  color: "#e2e8f0",
                  padding: "8px 12px",
                  fontSize: "14px",
                  outline: "none",
                }}
                placeholder="Enter value..."
              />
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/admin", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ password: inputValue }),
                    });
                    const { valid } = await response.json();
                    if (valid) {
                      setAdminMode(true);
                      await refreshData();
                    }
                  } catch (error) {
                    console.error("Error:", error);
                  }
                  setInputValue("");
                }}
                style={{
                  background: "linear-gradient(145deg, #10b981, #059669)",
                  border: "1px solid #047857",
                  borderRadius: "6px",
                  color: "#ffffff",
                  padding: "8px 16px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </div>
          )}
        </div>

        {adminMode && (
          <div
            style={{
              marginBottom: "25px",
              padding: "20px",
              background: "rgba(30, 30, 30, 0.8)",
              border: "1px solid #333333",
              borderRadius: "12px",
            }}
          >
            <h3
              style={{
                color: "#10b981",
                marginBottom: "20px",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Select Users:
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "15px",
              }}
            >
              {allUsers.map((user) => (
                <label
                  key={user._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#e2e8f0",
                    padding: "12px 16px",
                    background: user.checked
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(20, 20, 20, 0.6)",
                    border: user.checked
                      ? "1px solid #10b981"
                      : "1px solid #333333",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={user.checked}
                    onChange={async (e) => {
                      const updatedUsers = allUsers.map((u) =>
                        u._id === user._id
                          ? { ...u, checked: e.target.checked }
                          : u
                      );
                      setAllUsers(updatedUsers);

                      await fetch(`/api/users/update`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: user.userId,
                          checked: e.target.checked,
                        }),
                      });

                      if (e.target.checked) {
                        const timestamp = Date.now();
                        const scheduleResponse = await fetch(
                          `/api/schedules/${user.userId}?_t=${timestamp}`,
                          { cache: "no-store" }
                        );
                        const scheduleData = await scheduleResponse.json();
                        setUserSchedules((prev) => ({
                          ...prev,
                          [user.userId]: scheduleData,
                        }));

                        const { startTime, endTime } = getBrisbaneTimestamps();
                        const eventsResponse = await fetch(
                          `/api/events/${user.userId}?startTime=${startTime}&endTime=${endTime}&_t=${timestamp}`,
                          { cache: "no-store" }
                        );
                        const eventsData = await eventsResponse.json();
                        setUserEvents((prev) => ({
                          ...prev,
                          [user.userId]: eventsData.events || [],
                        }));
                      } else {
                        setUserSchedules((prev) => {
                          const newSchedules = { ...prev };
                          delete newSchedules[user.userId];
                          return newSchedules;
                        });
                        setUserEvents((prev) => {
                          const newEvents = { ...prev };
                          delete newEvents[user.userId];
                          return newEvents;
                        });
                      }
                    }}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#10b981",
                    }}
                  />
                  {user.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {allUsers.filter((u) => u.checked).length > 0 ? (
          <div
            style={{
              border: "1px solid #333333",
              borderRadius: "12px",
              background: "rgba(20, 20, 20, 0.8)",
              position: "relative",
            }}
          >
            {/* Sticky Header */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                display: "grid",
                gridTemplateColumns: `60px repeat(${
                  allUsers.filter((u) => u.checked).length
                }, 1fr)`,
                gap: 0,
                background: "rgba(20, 20, 20, 0.95)",
                backdropFilter: "blur(10px)",
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
              {allUsers
                .filter((u) => u.checked)
                .map((user) => {
                  const { todayDate, dayName } = getTodayInfo();
                  const schedule = userSchedules[user.userId];
                  const dayNames = [
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ];
                  const today = dayNames[getTodayInfo().dayOfWeek];
                  const todaySchedule = schedule?.find((s) =>
                    s.rules?.some((rule) => rule.day === today)
                  );
                  const todayRule = todaySchedule?.rules?.find(
                    (rule) => rule.day === today
                  );

                  let hours = "No Schedule";
                  if (todayRule?.intervals) {
                    const timeRanges = todayRule.intervals.map((interval) => {
                      const formatTime = (time) => {
                        const [hour, minute] = time.split(":");
                        const h = parseInt(hour);
                        const ampm = h >= 12 ? "PM" : "AM";
                        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                        return `${displayHour}:${minute} ${ampm}`;
                      };
                      return `${formatTime(interval.from)}-${formatTime(
                        interval.to
                      )}`;
                    });
                    hours = timeRanges.join(", ");
                  }

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
                        {todayDate} - {dayName}
                      </div>
                      <div style={{ fontSize: "9px", color: "#10b981" }}>
                        {hours}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Scrollable Content */}
            <div
              style={{
                maxHeight: "500px",
                overflowY: "auto",
              }}
              className="custom-scrollbar"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `60px repeat(${
                    allUsers.filter((u) => u.checked).length
                  }, 1fr)`,
                  gap: 0,
                }}
              >
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
                    {allUsers
                      .filter((u) => u.checked)
                      .map((user) => {
                        const schedule = userSchedules[user.userId];
                        const events = userEvents[user.userId] || [];

                        // Filter events for this specific user only
                        const userSpecificEvents = events.filter(
                          (event) => event.assignedUserId === user.userId
                        );

                        const dayNames = [
                          "sunday",
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                          "saturday",
                        ];
                        const today = dayNames[getTodayInfo().dayOfWeek];
                        const todaySchedule = schedule?.find((s) =>
                          s.rules?.some((rule) => rule.day === today)
                        );
                        const todayRule = todaySchedule?.rules?.find(
                          (rule) => rule.day === today
                        );

                        let openingHours = null;
                        if (todayRule?.intervals) {
                          // For simplicity, use first interval as main opening hours
                          const interval = todayRule.intervals[0];
                          openingHours = {
                            openTime: interval.from,
                            closeTime: interval.to,
                          };
                        }

                        // Log user data
                        console.log(`\n=== ${user.name} (${user.userId}) ===`);
                        console.log("Opening Hours:", openingHours);
                        console.log(
                          "User Events:",
                          userSpecificEvents.map((e) => ({
                            title: e.title,
                            start: e.startTime.split("T")[1].split("+")[0],
                            end: e.endTime.split("T")[1].split("+")[0],
                            assignedUserId: e.assignedUserId,
                          }))
                        );

                        // Calculate available slots for this hour
                        const hourSlots = [];
                        if (openingHours) {
                          const hourStart = `${time.hour
                            .toString()
                            .padStart(2, "0")}:00`;
                          const hourEnd = `${(time.hour + 1)
                            .toString()
                            .padStart(2, "0")}:00`;

                          // Check if this hour falls within opening hours
                          const hourStartMin = time.hour * 60;
                          const openMin =
                            parseInt(openingHours.openTime.split(":")[0]) * 60 +
                            parseInt(openingHours.openTime.split(":")[1]);
                          const closeMin =
                            parseInt(openingHours.closeTime.split(":")[0]) *
                              60 +
                            parseInt(openingHours.closeTime.split(":")[1]);

                          // Check if hour is within opening hours or partially overlaps
                          const hourEndMin = (time.hour + 1) * 60;
                          const isWithinHours =
                            hourStartMin < closeMin && hourEndMin > openMin;

                          if (isWithinHours) {
                            // Find events that overlap with this hour
                            const hourStartMinute = time.hour * 60;
                            const hourEndMinute = (time.hour + 1) * 60;

                            // Build time blocks for this hour
                            const blocks = [];
                            let currentMin = 0;

                            // Sort events by start time
                            const sortedEvents = [...userSpecificEvents]
                              .map((event) => {
                                const [startHour, startMin] = event.startTime
                                  .split("T")[1]
                                  .split("+")[0]
                                  .split(":")
                                  .map(Number);
                                const [endHour, endMin] = event.endTime
                                  .split("T")[1]
                                  .split("+")[0]
                                  .split(":")
                                  .map(Number);
                                return {
                                  startMinute: startHour * 60 + startMin,
                                  endMinute: endHour * 60 + endMin,
                                };
                              })
                              .filter(
                                (e) =>
                                  e.startMinute < hourEndMinute &&
                                  e.endMinute > hourStartMinute
                              )
                              .sort((a, b) => a.startMinute - b.startMinute);

                            for (const event of sortedEvents) {
                              const eventStartInHour = Math.max(
                                0,
                                event.startMinute - hourStartMinute
                              );
                              const eventEndInHour = Math.min(
                                60,
                                event.endMinute - hourStartMinute
                              );

                              // Add available block before event
                              if (currentMin < eventStartInHour) {
                                blocks.push({
                                  type: "available",
                                  start: currentMin,
                                  end: eventStartInHour,
                                });
                              }

                              // Add booked block
                              blocks.push({
                                type: "booked",
                                start: eventStartInHour,
                                end: eventEndInHour,
                              });
                              currentMin = eventEndInHour;
                            }

                            // Handle remaining time based on closing hour
                            const effectiveEnd = Math.min(
                              60,
                              closeMin - hourStartMinute
                            );

                            if (currentMin < effectiveEnd) {
                              blocks.push({
                                type: "available",
                                start: currentMin,
                                end: effectiveEnd,
                              });
                            }

                            // Add closed block if hour extends past closing time
                            if (effectiveEnd < 60) {
                              blocks.push({
                                type: "closed",
                                start: effectiveEnd,
                                end: 60,
                              });
                            }

                            // Build gradient string
                            let gradientStops = [];
                            let currentPercent = 0;
                            for (const block of blocks) {
                              const blockPercent =
                                ((block.end - block.start) / 60) * 100;
                              let color;
                              if (block.type === "available") color = "#10b981";
                              else if (block.type === "booked")
                                color = "#ef4444";
                              else color = "#0a0a0a"; // closed

                              gradientStops.push(`${color} ${currentPercent}%`);
                              currentPercent += blockPercent;
                              gradientStops.push(`${color} ${currentPercent}%`);
                            }

                            // Create labels for each block segment
                            const blockLabels = blocks.map((block, index) => {
                              const startMin = time.hour * 60 + block.start;
                              const hours = Math.floor(startMin / 60);
                              const mins = startMin % 60;
                              const displayHour =
                                hours === 0
                                  ? 12
                                  : hours > 12
                                  ? hours - 12
                                  : hours;
                              const ampm = hours >= 12 ? "PM" : "AM";
                              const timeStr = `${displayHour}:${mins
                                .toString()
                                .padStart(2, "0")} ${ampm}`;

                              let label;
                              if (block.type === "available") {
                                label = `Available at ${timeStr}`;
                              } else if (block.type === "booked") {
                                label = `Booked at ${timeStr}`;
                              } else {
                                label = `Closed`;
                              }

                              const topPosition = (block.start / 60) * 100;
                              const blockHeight =
                                ((block.end - block.start) / 60) * 100;
                              return {
                                label,
                                topPosition,
                                blockHeight,
                                type: block.type,
                              };
                            });

                            return (
                              <div
                                key={`${time.label}-${user._id}`}
                                style={{
                                  padding: "0",
                                  borderBottom: "1px solid #333333",
                                  borderLeft: "1px solid #333333",
                                  minHeight: "55px",
                                  background:
                                    blocks.length === 1 &&
                                    blocks[0].type === "available"
                                      ? "linear-gradient(145deg, #10b981, #059669)"
                                      : blocks.length === 1 &&
                                        blocks[0].type === "booked"
                                      ? "linear-gradient(145deg, #ef4444, #dc2626)"
                                      : blocks.length === 1 &&
                                        blocks[0].type === "closed"
                                      ? "linear-gradient(145deg, #0a0a0a, #000000)"
                                      : `linear-gradient(180deg, ${gradientStops.join(
                                          ", "
                                        )})`,
                                  position: "relative",
                                }}
                              >
                                {blockLabels.map((blockLabel, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      position: "absolute",
                                      top: `${blockLabel.topPosition}%`,
                                      left: "2px",
                                      right: "2px",
                                      height: `${blockLabel.blockHeight}%`,
                                      fontSize: "12px",
                                      color: "#ffffff",
                                      fontWeight: "600",
                                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      textAlign: "center",
                                      lineHeight: "1.2",
                                    }}
                                  >
                                    {blockLabel.label}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        }

                        return (
                          <div
                            key={`${time.label}-${user._id}`}
                            style={{
                              paddingTop: "4px",
                              paddingRight: "0",
                              paddingBottom: "0",
                              paddingLeft: "0",
                              borderBottom: "1px solid #333333",
                              borderLeft: "1px solid #333333",
                              minHeight: "55px",
                              background:
                                "linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              color: "#666666",
                              fontWeight: "600",
                            }}
                          >
                            <div
                              style={{
                                textAlign: "center",
                                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                                lineHeight: "1.2",
                              }}
                            >
                              Closed
                            </div>
                          </div>
                        );
                      })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#94a3b8",
              fontSize: "16px",
            }}
          >
            No users selected. Check users in GHL to see their availability.
          </div>
        )}
      </div>
    </>
  );
}
