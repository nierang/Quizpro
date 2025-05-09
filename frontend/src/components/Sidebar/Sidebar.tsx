import React from "react";
import Button from "../ui/Button";
import { Home, User, FileText, Calendar, BarChart2, Settings } from "lucide-react";
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
        <div className={styles.menuItem}>
          <iconMap.home className={styles.menuItemicon} />
          <span>Dashboard</span>
        </div>
        <div className={styles.menuItem}>
          <iconMap.browser className={styles.menuItemicon} />
          <span>Browser</span>
        </div>
        <div className={styles.menuItem}>
          <iconMap.myclass className={styles.menuItemicon} />
          <span>My Class</span>
        </div>
        <div className={styles.menuItem}>
          <iconMap.library className={styles.menuItemicon} />
          <span>Library</span>
        </div>
        <div className={styles.menuItem}>
          <iconMap.notifications className={styles.menuItemicon} />
          <span>Notification</span>
        </div>
        
        <div className={styles.menuItem}>
          <iconMap.settings className={styles.menuItemicon} />
          <span>Settings</span>
        </div>
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