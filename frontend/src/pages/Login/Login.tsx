import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email, "Password:", password, "Remember Me:", rememberMe);
    // Add login logic here
  };

  return (
    <div className={styles.loginPage}>
      {/* Left Section with Image and Text */}
      <div className={styles.leftSection}>
        <div className={styles.topleft}>
            <h1 className={styles.logo}>Quiz<span>Pro</span></h1>
        </div>
        <div className={styles.bottomleft}>
            <h2>Your all-in-one education platform</h2>
            <p>Create classes, play quizzes, and make learning fun. Teachers teach, students play—education made easy!</p>
        </div>
      </div>

      {/* Right Section with Login Form */}
      <div className={styles.rightSection}>
        <h1 className={styles.title}>Welcome Back to <span>Quiz</span>Pro!</h1>
        <p className={styles.subtitle}>Join & Connect the Fastest Growing Online Education Community</p>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className={styles.formGroupCheckbox}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">Remember sign in details</label>
          </div>
          <button type="submit" className={styles.loginButton}>
            Log In
          </button>
        </form>
        <p className={styles.signUpText}>
        Don’t have an Account yet?  <Link to="/signup">JUMP RIGHT IN</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;