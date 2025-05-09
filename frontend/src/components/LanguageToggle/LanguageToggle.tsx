import React, { useState } from "react";
import styles from "./LanguageToggle.module.css";
import { iconMap } from "../../utils/iconMap";

const LanguageToggle = () => {
  const [language, setLanguage] = useState("en"); // Default to English

  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === "en" ? "sv" : "en"));
  };

  return (
    <div className={styles.languageToggle} onClick={toggleLanguage}>
      <iconMap.language className={styles.icon} />
      <span>{language === "en" ? "English" : "Swedish"}</span>
    </div>
  );
};

export default LanguageToggle;