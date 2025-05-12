import React, { useState } from "react";
import styles from "./Settings.module.css";

const Settings = () => {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [name, setName] = useState("David");
  const [username, setUsername] = useState("david123");
  const [password, setPassword] = useState("********");
  const [email, setEmail] = useState("david@example.com");
  const [preferredSubject, setPreferredSubject] = useState("Math");
  const [organization, setOrganization] = useState("QuizPro Academy");
  const [language, setLanguage] = useState("English");

  const handleSettingClick = (setting: string) => {
    alert(`Are you sure you want change ${setting}?`);
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1>Settings</h1>
      </div>

      {/* General Settings Section */}
      <div className={styles.section}>
        <h2>General Settings</h2>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Profile Image")}>
          <span>Profile Image</span>
          <span className={styles.settingValue}>
            {profileImage ? profileImage.name : "No image selected"} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Name")}>
          <span>Name</span>
          <span className={styles.settingValue}>
            {name} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Username")}>
          <span>Username</span>
          <span className={styles.settingValue}>
            {username} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Password")}>
          <span>Password</span>
          <span className={styles.settingValue}>
            {password} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Email Address")}>
          <span>Email Address</span>
          <span className={styles.settingValue}>
            {email} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
      </div>

      {/* Account Settings Section */}
      <div className={styles.section}>
        <h2>Account Settings</h2>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Preferred Subject")}>
          <span>Preferred Subject</span>
          <span className={styles.settingValue}>
            {preferredSubject} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Organization")}>
          <span>Organization</span>
          <span className={styles.settingValue}>
            {organization} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
        <div className={styles.settingRow} onClick={() => handleSettingClick("student account")}>
          <span>Convert to student account</span>
          <span className={styles.settingValue}>
            <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
      </div>

      {/* Language and Account Settings Section */}
      <div className={styles.section}>
        <h2>Other Settings</h2>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Language")}>
          <span>Language</span>
          <span className={styles.settingValue}>
            {language} <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
        <div className={styles.settingRow} onClick={() => handleSettingClick("Delete Account")}>
          <span>Delete Account</span>
          <span className={`${styles.settingValue} ${styles.danger}`}>
            <span className={styles.arrow}>&#x276F;</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Settings;