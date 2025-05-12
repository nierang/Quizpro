import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import styles from "./MyClass.module.css";
import Button from "../../components/ui/Button";
import { iconMap } from "../../utils/iconMap";

const MyClass = () => {
  const [selectedClass, setSelectedClass] = useState("Class A");
  const [activeTab, setActiveTab] = useState("quizzes");

  const classes = ["Class A", "Class B", "Class C"];
  const quizzes = [
    { id: 1, name: "Quiz 1", date: "2025-05-01" },
    { id: 2, name: "Quiz 2", date: "2025-05-03" },
  ];
  const students = [
    { id: 1, name: "Student 1" },
    { id: 2, name: "Student 2" },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Hide grid lines on the x-axis
        },
        ticks: {
          font: {
            size: 12, // Adjust font size for x-axis labels
          },
          color: "#333", // Change label color
        },
        barPercentage: 0.5, // Adjust bar width (smaller value = thinner bars)
        categoryPercentage: 0.8, // Adjust spacing between bars
      },
      y: {
        grid: {
          color: "#e0e0e0", // Light gray grid lines
        },
        ticks: {
          font: {
            size: 12, // Adjust font size for y-axis labels
          },
          color: "#333", // Change label color
          beginAtZero: true, // Ensure the y-axis starts at 0
        },
      },
    },
  };

  const chartData = {
    labels: ["", "", "", "", "", "", "", "", "", ""], // Labels for the x-axis (empty for no labels)
    datasets: [
      {
        label: "Average Accuracy (%)",
        data: [85, 90, 78, 88, 92, 94, 73, 85, 90, 100], // Example data for the bar chart
        backgroundColor: "#582EED", // Bar color
      },
    ],
  };

  return (
    <div className={styles.myClassPage}>
      <div className={styles.header}>
        <h1>My Class</h1>
        <div className={styles.headerButtons}>
          <Button className={styles.button}>Create Class</Button>
          <Button className={styles.button}>Archived Classes</Button>
        </div>
      </div>
      {/* Class Tabs */}
      <div className={styles.classTabs}>
        {classes.map((className) => (
          <div
            key={className}
            className={`${styles.tab} ${selectedClass === className ? styles.activeTab : ""}`}
            onClick={() => setSelectedClass(className)}
          >
            {className}
          </div>
        ))}
      </div>

      {/* Class stats */}
      <div className={styles.classInfo}>
        <div className={styles.classItem}>
          <p>Total Students: <span>25</span></p>
          <p>Total Quizzes: <span>10</span></p>
        </div>
        <div className={styles.classItem}>
          <iconMap.management className={styles.managementIcon} />
        </div>
      </div>

      {/* Class info */}
      <div className={styles.stats}>
        <div className={styles.accuracy}>
          <div className={styles.accuracyItem}>
            <h3>Average Accuracy</h3>
            <p>85%</p>
          </div>
          <div className={styles.accuracyItem}>
            <div>
              <h3>Highest Accuracy</h3>
              <p>95%</p>
            </div>
            <div>
              <h3>Lowest Accuracy</h3>
              <p>70%</p>
            </div>
          </div>
        </div>
        <div className={styles.chart}>
          <h2>Recent Quiz Accuracy</h2>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className={styles.bottomTabs}>
        <div
          className={`${styles.tab} ${activeTab === "quizzes" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("quizzes")}
        >
          Quizzes
        </div>
        <div
          className={`${styles.tab} ${activeTab === "students" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("students")}
        >
          Students
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "quizzes" ? (
          <div className={styles.list}>
            <h2>Quizzes</h2>
            <ul>
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  {quiz.name} - {quiz.date}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={styles.list}>
            <h2>Students</h2>
            <ul>
              {students.map((student) => (
                <li key={student.id}>{student.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClass;