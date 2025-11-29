"use client";

import { useState, useEffect } from "react";
import React from "react";

export default function Home() {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [nextUpdateIn, setNextUpdateIn] = useState(300); // 5 minutes in seconds

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

  useEffect(() => {
    // Initial load
    fetchUsersAndEvents();

    // Setup SSE for immediate user change notifications
    const eventSource = new EventSource("/api/sse");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.name && typeof data.checked === "boolean") {
        console.log("User selection changed via SSE - fetching fresh data");
        fetchUsersAndEvents();
      }
    };

    // Countdown timer every second
    const timerInterval = setInterval(() => {
      setNextUpdateIn((prev) => {
        if (prev <= 1) {
          // Time's up - fetch fresh users and events (5-minute polling)
          console.log("5-minute timer: fetching fresh users and events");
          fetchUsersAndEvents();
          return 300; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      eventSource.close();
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    if (selectedUsers.length > 0) {
      updateTimeSlots();
    } else {
      setTimeSlots([]);
      setLoadingSlots(false);
    }
  }, [selectedUsers]);

  const fetchUsersAndEvents = async () => {
    try {
      const response = await fetch("/api/selected-users");
      const data = await response.json();

      if (data.selectedUsers) {
        setSelectedUsers(data.selectedUsers);
        setNextUpdateIn(300); // Reset timer to 5 minutes
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const refreshSlots = async () => {
    console.log("Manual refresh triggered");
    await fetchUsersAndEvents();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSlotAvailability = (hour, events) => {
    let busyMinutes = 0;

    for (const event of events) {
      const startTimeStr = event.startTime;
      const endTimeStr = event.endTime;

      const startTimePart = startTimeStr
        .split("T")[1]
        .split("+")[0]
        .split("-")[0];
      const endTimePart = endTimeStr.split("T")[1].split("+")[0].split("-")[0];

      const [startHour, startMin] = startTimePart.split(":").map(Number);
      const [endHour, endMin] = endTimePart.split(":").map(Number);

      if (startHour <= hour && endHour >= hour) {
        let overlapMinutes = 0;

        if (startHour === hour && endHour === hour) {
          overlapMinutes = endMin - startMin;
        } else if (startHour === hour) {
          overlapMinutes = 60 - startMin;
        } else if (endHour === hour) {
          overlapMinutes = endMin;
        } else {
          overlapMinutes = 60;
        }

        busyMinutes += Math.max(0, overlapMinutes);
      }
    }

    const freeMinutes = Math.max(0, 60 - busyMinutes);
    const freePercentage = (freeMinutes / 60) * 100;

    return {
      freePercentage: Math.max(0, Math.min(100, freePercentage)),
      busyPercentage: Math.max(0, Math.min(100, (busyMinutes / 60) * 100)),
    };
  };

  const updateTimeSlots = async () => {
    if (selectedUsers.length === 0) {
      setTimeSlots([]);
      return;
    }

    setLoadingSlots(true);

    try {
      const userEventsPromises = selectedUsers.map(async (user) => {
        const response = await fetch(`/api/events?userId=${user.id}`);
        const data = await response.json();
        return {
          userId: user.id,
          events: data.events || [],
        };
      });

      const allUserEvents = await Promise.all(userEventsPromises);

      const slotsData = times.map((time) => {
        const userSlots = selectedUsers.map((user) => {
          const userEvents =
            allUserEvents.find((ue) => ue.userId === user.id)?.events || [];
          const availability = getSlotAvailability(time.hour, userEvents);
          const freeMinutes = Math.round(
            (availability.freePercentage / 100) * 60
          );

          return {
            userId: user.id,
            userName: user.name,
            availability,
            freeMinutes,
          };
        });

        return {
          time,
          userSlots,
        };
      });

      setTimeSlots(slotsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const formatAvailableTime = (hour, freeMinutes) => {
    if (freeMinutes === 60) {
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? "AM" : "PM";
      return `${displayHour}:00 ${period}`;
    } else if (freeMinutes > 0) {
      const startMinute = 60 - freeMinutes;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? "AM" : "PM";
      return `${displayHour}:${startMinute
        .toString()
        .padStart(2, "0")} ${period}`;
    }
    return "";
  };

  const renderSlotContent = (slot, hour) => {
    // Check if hour is outside business hours (9 AM to 5:30 PM)
    if (hour < 9 || hour > 17) {
      return (
        <div className="slot-content vertical">
          <div className="not-available-slot" style={{ height: "100%" }}>
            <span className="not-available-text">Not Available</span>
          </div>
        </div>
      );
    }

    // Special case for 5 PM hour (17:00-17:59)
    // Only 5:00-5:30 PM is available, 5:30-6:00 PM is not available
    if (hour === 17) {
      // For 5 PM slot, only first 30 minutes are business hours
      const availableMinutes = Math.min(slot.freeMinutes, 30);

      if (availableMinutes === 0) {
        // Completely busy during business hours, rest is not available
        return (
          <div className="slot-content vertical">
            <div className="not-available-slot" style={{ height: "50%" }}>
              <span className="not-available-text">Not Available</span>
            </div>
            <div
              className="busy-portion-vertical"
              style={{ height: "50%" }}
            ></div>
          </div>
        );
      } else if (availableMinutes === 30) {
        // Fully available during business hours
        return (
          <div className="slot-content vertical">
            <div className="not-available-slot" style={{ height: "50%" }}>
              <span className="not-available-text">Not Available</span>
            </div>
            <div className="free-portion-vertical" style={{ height: "50%" }}>
              <span className="time-text">{formatAvailableTime(hour, 60)}</span>
            </div>
          </div>
        );
      } else {
        // Partially available during business hours
        const busyPercentage = ((30 - availableMinutes) / 30) * 50;
        const freePercentage = (availableMinutes / 30) * 50;

        return (
          <div className="slot-content vertical">
            <div className="not-available-slot" style={{ height: "50%" }}>
              <span className="not-available-text">Not Available</span>
            </div>
            <div
              className="busy-portion-vertical"
              style={{ height: `${busyPercentage}%` }}
            ></div>
            <div
              className="free-portion-vertical"
              style={{ height: `${freePercentage}%` }}
            >
              <span className="time-text">
                {formatAvailableTime(hour, availableMinutes)}
              </span>
            </div>
          </div>
        );
      }
    }

    // Regular business hours (9 AM - 4:59 PM)
    if (slot.availability.freePercentage === 100) {
      return (
        <div className="slot-content vertical">
          <div className="free-portion-vertical" style={{ height: "100%" }}>
            <span className="time-text">
              {formatAvailableTime(hour, slot.freeMinutes)}
            </span>
          </div>
        </div>
      );
    } else if (slot.availability.freePercentage === 0) {
      return (
        <div className="slot-content vertical">
          <div
            className="busy-portion-vertical"
            style={{ height: "100%" }}
          ></div>
        </div>
      );
    } else {
      return (
        <div className="slot-content vertical">
          <div
            className="busy-portion-vertical"
            style={{ height: `${slot.availability.busyPercentage}%` }}
          ></div>
          <div
            className="free-portion-vertical"
            style={{ height: `${slot.availability.freePercentage}%` }}
          >
            <span className="time-text">
              {formatAvailableTime(hour, slot.freeMinutes)}
            </span>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: linear-gradient(
            135deg,
            #000000 0%,
            #111111 100%
          ) !important;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif !important;
          color: #e2e8f0 !important;
        }
        .container {
          background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
          width: 100%;
          min-height: 100vh;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        h1 {
          font-size: 24px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333333;
          margin-bottom: 25px;
          color: #ffffff;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        .user-list {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid #374151;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .user-item {
          display: inline-flex;
          align-items: center;
          padding: 10px 16px;
          background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
          border: 1px solid #404040;
          border-radius: 8px;
          white-space: nowrap;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        .user-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
          border-color: #666666;
        }
        .user-item input {
          margin-right: 10px;
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #666666;
        }
        .user-name {
          font-size: 14px;
          cursor: pointer;
          color: #e2e8f0;
          font-weight: 500;
        }
        .loading {
          text-align: center;
          padding: 30px;
          color: #94a3b8;
          font-size: 16px;
          font-weight: 500;
        }
        .time-slots {
          margin-top: 25px;
          max-height: 500px;
          overflow-y: auto;
          border: 1px solid #333333;
          border-radius: 12px;
          background: rgba(20, 20, 20, 0.8);
          backdrop-filter: blur(10px);
        }
        .time-slots::-webkit-scrollbar {
          width: 6px;
        }
        .time-slots::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .time-slots::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #555555, #333333);
          border-radius: 3px;
        }
        .time-slots::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #666666, #444444);
        }
        .time-grid {
          display: grid;
          gap: 0;
        }
        .time-header {
          padding: 15px 10px;
          border-bottom: 2px solid #333333;
          font-weight: 600;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          color: #ffffff;
        }
        .user-header {
          padding: 15px;
          border-bottom: 2px solid #333333;
          border-left: 1px solid #333333;
          font-weight: 600;
          text-align: center;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }
        .time-label {
          padding: 12px 10px;
          font-weight: 500;
          color: #888888;
          font-size: 13px;
          border-bottom: 1px solid #333333;
          border-right: 1px solid #333333;
          background: linear-gradient(145deg, #1a1a1a, #0a0a0a);
        }
        .slot-cell {
          padding: 0 !important;
          border-bottom: 1px solid #333333 !important;
          border-left: 1px solid #333333 !important;
          min-height: 55px !important;
          position: relative !important;
          overflow: hidden !important;
          background: #0a0a0a !important;
        }
        .slot-content {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
          min-height: 50px !important;
        }
        .slot-content.vertical {
          flex-direction: column !important;
          justify-content: flex-end !important;
        }
        .free-portion-vertical {
          background: linear-gradient(180deg, #10b981, #059669) !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 11px !important;
          color: #ffffff !important;
          font-weight: 600 !important;
          padding: 3px !important;
          text-align: center !important;
          min-height: 22px !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
        }
        .free-portion-vertical:hover {
          background: linear-gradient(180deg, #059669, #047857) !important;
          transform: scale(1.02) !important;
        }
        .busy-portion-vertical {
          background: linear-gradient(180deg, #374151, #1f2937) !important;
          flex-shrink: 0 !important;
          border-bottom: 1px solid #4b5563 !important;
        }
        .time-text {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 60px;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7) !important;
          backdrop-filter: blur(8px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 10 !important;
          border-radius: 0 12px 12px 0 !important;
        }
        .slots-blur-overlay {
          position: absolute !important;
          top: 0 !important;
          left: 60px !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(4px) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 5 !important;
          border-radius: 0 12px 12px 0 !important;
        }
        .spinner {
          border: 4px solid #1a1a1a;
          border-top: 4px solid #666666;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .time-row-simple {
          display: flex;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #333333;
          min-height: 55px;
          background: linear-gradient(90deg, #1a1a1a, #0a0a0a);
        }
        .time-row-simple:last-child {
          border-bottom: none;
        }
        .time-label-simple {
          width: 70px;
          font-weight: 500;
          color: #888888;
          flex-shrink: 0;
          font-size: 13px;
          border-right: 1px solid #333333;
        }
        .slot-area {
          flex: 1;
          margin-left: 15px;
          border-left: 1px solid #333333;
          padding-left: 20px;
          color: #666666;
          font-style: italic;
        }
        .not-available-slot {
          background: linear-gradient(180deg, #4a4a4a, #2a2a2a) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          opacity: 0.6 !important;
        }
        .not-available-text {
          font-size: 10px !important;
          color: #999999 !important;
          font-weight: 500 !important;
          text-align: center !important;
        }
      `}</style>

      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <div>
            <h1>Available Time Slots</h1>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
              Last updated in: {formatTime(nextUpdateIn)}
            </div>
            <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
              Please make sure to refresh to get the latest slots available
            </div>
          </div>
          <button
            onClick={refreshSlots}
            style={{
              padding: "10px 20px",
              background: "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
              border: "1px solid #404040",
              borderRadius: "8px",
              color: "#e2e8f0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Refresh Slots
          </button>
        </div>

        <div className="time-slots">
          {selectedUsers.length === 0 ? (
            times.map((time) => (
              <div key={time.hour} className="time-row-simple">
                <div className="time-label-simple">{time.label}</div>
                <div className="slot-area"></div>
              </div>
            ))
          ) : (
            <div
              className="time-grid"
              style={{
                gridTemplateColumns: `60px repeat(${selectedUsers.length}, 1fr)`,
                position: "relative",
                minHeight: "500px",
              }}
            >
              {loadingSlots && (
                <div className="slots-blur-overlay">
                  <div className="spinner"></div>
                </div>
              )}

              <div className="time-header"></div>
              {selectedUsers.map((user) => (
                <div key={user.id} className="user-header">
                  {user.name}
                </div>
              ))}

              {loadingSlots
                ? times.map((time) => (
                    <React.Fragment key={time.hour}>
                      <div className="time-label">{time.label}</div>
                      {selectedUsers.map((user) => (
                        <div key={user.id} className="slot-cell"></div>
                      ))}
                    </React.Fragment>
                  ))
                : timeSlots.map((slot) => (
                    <React.Fragment key={slot.time.hour}>
                      <div className="time-label">{slot.time.label}</div>
                      {slot.userSlots.map((userSlot) => (
                        <div key={userSlot.userId} className="slot-cell">
                          {renderSlotContent(userSlot, slot.time.hour)}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
