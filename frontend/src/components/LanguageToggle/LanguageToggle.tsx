import React, { useState } from "react";
import styles from "./LanguageToggle.module.css";

const LanguageToggle = () => {
  const [language, setLanguage] = useState("en"); // Default to English

  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === "en" ? "sv" : "en"));
  };

  return (
    <button className={styles.languageToggle} onClick={toggleLanguage}>
      {language === "en" ? "Switch to Swedish" : "Switch to English"}
    </button>
  );
};

export default LanguageToggle;