import React from "react";
import { NavLink } from "react-router-dom"; // Import NavLink for navigation
import Button from "../ui/Button";
import styles from "./Sidebar.module.css";
import { iconMap } from "../../utils/iconMap";


const Sidebar = () => {
  return (
    <div className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>QuizPro</div>

      {/* Button */}
      <Button className={styles.mainAction}>+ Create</Button>

      {/* Menu */}
      <nav className={styles.menu}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem
          }
        >
          <iconMap.home className={styles.menuItemicon} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/browser"
          className={({ isActive }) =>
            isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem
          }
        >
          <iconMap.browser className={styles.menuItemicon} />
          <span>Browser</span>
        </NavLink>
        <NavLink
          to="/my-class"
          className={({ isActive }) =>
            isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem
          }
        >
          <iconMap.myclass className={styles.menuItemicon} />
          <span>My Class</span>
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem
          }
        >
          <iconMap.library className={styles.menuItemicon} />
          <span>Library</span>
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem
          }
        >
          <iconMap.notifications className={styles.menuItemicon} />
          <span>Notification</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? `${styles.menuItem} ${styles.active}` : styles.menuItem
          }
        >
          <iconMap.settings className={styles.menuItemicon} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* User Profile Section */}
      <div className={styles.userProfile}>
        <img
          src="https://img.freepik.com/premium-photo/profile-icon-white-background_941097-162353.jpg" // Replace with the user's image URL
          alt="User"
          className={styles.userImage}
        />
        <div className={styles.userInfo}>
          <span className={styles.userName}>John Doe</span>
          <span className={styles.userEmail} data-full-email="john.doe@example.com" >john.doe@example.com</span>
        </div>
        <iconMap.logoout className={styles.logoutIcon} />
      </div>
    </div>
    
  );
};

export default Sidebar;