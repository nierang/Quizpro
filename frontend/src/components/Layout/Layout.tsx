import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import LanguageToggle from "../LanguageToggle/LanguageToggle";
import styles from "./Layout.module.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <LanguageToggle />
        {children}
      </div>
    </div>
  );
};

export default Layout;