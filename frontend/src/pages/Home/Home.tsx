import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./Home.module.css"; // Import styles using CSS Modules

// Register required components for Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  // Mock data for the bar chart
  const recentResultsData = {
    labels: ["Challenge 1", "Challenge 2"],
    datasets: [
      {
        label: "Accuracy (%)",
        data: [85, 90],
        backgroundColor: ["#4caf50", "#2196f3"],
      },
    ],
  };

  return (
    <div className={styles.homePage}>
      {/* Main Content */}
      <div className={styles.header}>
        <h1>Welcome back, David!</h1>
      </div>
      <div className={styles.homeContainer}>
        <div className={styles.leftColumn}>
          {/* Section 1: Total Classroom and Students */}
          <div className={styles.statsSection}>
            <h2>Statistics</h2>
            <p>Total Classrooms: 10</p>
            <p>Total Students: 200</p>
          </div>

          {/* Section 2: Recent Finished Challenge Results */}
          <div className={styles.chartSection}>
            <h2>Recent Challenge Results</h2>
            <Bar data={recentResultsData} />
          </div>

          {/* Section 3: Popular Challenges Trends */}
          <div className={styles.trendsSection}>
            <h2>Popular Challenges in Math</h2>
            <ul>
              <li>Challenge A: Increasing participation</li>
              <li>Challenge B: High accuracy trend</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div className={styles.rightColumn}>
          <h2>Challenge Activities</h2>
          <Calendar />
          {/* Active and Upcoming Challenges */}
          <div className={styles.bottomSection}>
            <div className={styles.challengesList}>
              <div className={styles.challengeSection}>
                <h3>Active Challenges</h3>
                <ul>
                  <li>Challenge 1: Math Quiz</li>
                  <li>Challenge 2: Science Trivia</li>
                </ul>
              </div>
              <div className={styles.challengeSection}>
                <h3>Upcoming Challenges</h3>
                <ul>
                  <li>Challenge 3: History Quiz</li>
                  <li>Challenge 4: Coding Challenge</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;