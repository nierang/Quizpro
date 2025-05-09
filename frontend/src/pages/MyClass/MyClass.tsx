import React from "react";
import styles from "./MyClass.module.css";

const MyClass = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Class</h1>
      <p className={styles.description}>This is the My Class page where you can view your classes and related information.</p>
      {/* Additional content related to user classes can be added here */}
    </div>
  );
};

export default MyClass;