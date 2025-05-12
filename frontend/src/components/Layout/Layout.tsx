import React from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import Sidebar from "../Sidebar/Sidebar";
import LanguageToggle from "../LanguageToggle/LanguageToggle";
import styles from "./Layout.module.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation(); // Get the current route

  // Define routes where the Sidebar should not be displayed
  const noSidebarRoutes = ["/login"];

  const isSidebarHidden = noSidebarRoutes.includes(location.pathname);

  return (
    <div className={`${styles.layout} ${isSidebarHidden ? styles.sidebarHidden : ""}`}>
      {/* Conditionally render Sidebar */}
      {!isSidebarHidden && <Sidebar />}
      <div className={styles.content}>
        <LanguageToggle />
        {children}
      </div>
    </div>
  );
};

export default Layout;