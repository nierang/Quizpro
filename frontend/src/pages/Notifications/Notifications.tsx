import React, { useState } from "react";
import styles from "./Notifications.module.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "System",
      message: "Your account password was updated successfully.",
      timestamp: "2025-05-14 10:00 AM",
    },
    {
      id: 2,
      type: "Teacher",
      message: "John Doe shared a new quiz with you.",
      timestamp: "2025-05-13 3:45 PM",
    },
    {
      id: 3,
      type: "Student",
      message: "Jane Smith submitted the assignment for review.",
      timestamp: "2025-05-13 1:30 PM",
    },
    {
      id: 3,
      type: "Student",
      message: "Jane Smith submitted the assignment for review.",
      timestamp: "2025-05-13 1:30 PM",
    },
    {
      id: 2,
      type: "Teacher",
      message: "John Doe shared a new quiz with you.",
      timestamp: "2025-05-13 3:45 PM",
    },
    {
      id: 4,
      type: "System",
      message: "A new feature has been added to the dashboard.",
      timestamp: "2025-05-12 9:00 AM",
    },
  ]);

  return (
    <div className={styles.notificationsPage}>
      <h1 className={styles.notificationsTitle}>Notifications</h1>
      {notifications.length > 0 ? (
        <ul className={styles.notificationsList}>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`${styles.notificationItem} ${
                notification.type === "System"
                  ? styles.system
                  : notification.type === "Teacher"
                  ? styles.teacher
                  : styles.student
              }`}
            >
              <p className={styles.notificationType}>
                {notification.type} Notification
              </p>
              <p className={styles.notificationMessage}>{notification.message}</p>
              <p className={styles.notificationTimestamp}>{notification.timestamp}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No new notifications at this time.</p>
      )}
    </div>
  );
};

export default Notifications;