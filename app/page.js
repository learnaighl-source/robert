"use client";

import React, { useEffect } from "react";
import { useRealtimeData } from "../hooks/useRealtimeData";
import IframeManager from "../lib/iframeManager";

export default function Home() {
  const { data, loading, error, forceRefresh, checkedUsers, calendars } = useRealtimeData();

  // Initialize iframe management
  useEffect(() => {
    if (IframeManager.isInIframe()) {
      IframeManager.disableCache();
      IframeManager.preventHydrationMismatch();
    }
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
      <div style={{
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
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", marginBottom: "10px" }}>Loading...</div>
          <div style={{ fontSize: "14px", color: "#94a3b8" }}>Syncing with GHL...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
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
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "18px", marginBottom: "10px", color: "#ef4444" }}>Error: {error}</div>
          <button onClick={forceRefresh} style={{
            background: "linear-gradient(145deg, #10b981, #059669)",
            border: "1px solid #047857",
            borderRadius: "8px",
            color: "#ffffff",
            padding: "10px 16px",
            fontSize: "14px",
            cursor: "pointer"
          }}>
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
          <h1
            style={{
              fontSize: "24px",
              color: "#ffffff",
              fontWeight: "600",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
              margin: 0,
            }}
          >
            Available Slots
          </h1>
          <button
            onClick={forceRefresh}
            disabled={loading}
            style={{
              background: loading ? "#666666" : "linear-gradient(145deg, #10b981, #059669)",
              border: "1px solid #047857",
              borderRadius: "8px",
              color: "#ffffff",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background = "linear-gradient(145deg, #059669, #047857)";
                e.target.style.transform = "translateY(-2px)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.background = "linear-gradient(145deg, #10b981, #059669)";
                e.target.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? "🔄 Syncing..." : "🔄 Refresh"}
          </button>
        </div>

        {checkedUsers.length > 0 ? (
          <div
            style={{
              maxHeight: "500px",
              overflowY: "auto",
              border: "1px solid #333333",
              borderRadius: "12px",
              background: "rgba(20, 20, 20, 0.8)",
            }}
            className="custom-scrollbar"
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
                const { todayDate, dayName } = getTodayInfo();
                const { hours } = getUserOpeningHours(user.name);

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
                  {checkedUsers.map((user) => {
                    const { availableMinutes } = getHourAvailability(user.name, time.hour);
                    const isAvailable = availableMinutes > 0;
                    const availabilityPercentage = (availableMinutes / 60) * 100;

                    return (
                      <div
                        key={`${time.label}-${user._id}`}
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #333333",
                          borderLeft: "1px solid #333333",
                          minHeight: "55px",
                          background: isAvailable
                            ? `linear-gradient(90deg, #10b981 0%, #10b981 ${availabilityPercentage}%, #0a0a0a ${availabilityPercentage}%, #0a0a0a 100%)`
                            : "#0a0a0a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: isAvailable ? "#ffffff" : "#666666",
                          fontWeight: "500",
                        }}
                      >
                        {isAvailable ? `${availableMinutes}min` : "Closed"}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
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