import React from "react";
import styles from "./ChallengeDetail.module.css"; // Adjust the path as necessary
import Button from "../../components/ui/Button";

const challenge = {
  coverImage: "https://www.wwf.at/wp-content/uploads/2021/05/20final_wwf-at_Panda_Ast_cStaffanWidstrand-1-980x980.jpg",
  name: "Math Challenge: What colour is it?",
  description: "Test your knowledge of colors in math problems. This challenge is designed for Grade 5 students.",
  subject: "Math",
  language: "English",
  author: "John Doe",
  grade: "Grade 5",
  questions: [
    {
      id: 1,
      text: "What is the color of the sky?",
      options: ["Blue", "Green", "Red", "Yellow"],
      correct: 0,
    },
    {
      id: 2,
      text: "What color do you get when you mix red and yellow?",
      options: ["Orange", "Purple", "Brown", "Pink"],
      correct: 0,
    },
  ],
};

const ChallengeDetails = () => {
  return (
    <div className={styles.challengeDetailsPage}>
      {/* Challenge Info Section */}
      <div className={styles.challengeHeader}>
        <img className={styles.coverImage} src={challenge.coverImage} alt={challenge.name} />
        <div className={styles.challengeInfo}>
          <h1 className={styles.challengeName}>{challenge.name}</h1>
          <p className={styles.challengeDescription}>{challenge.description}</p>
          <div className={styles.challengeMeta}>
            <span><strong>Subject:</strong> {challenge.subject}</span>
            <span><strong>Language:</strong> {challenge.language}</span>
            <span><strong>Author:</strong> {challenge.author}</span>
            <span><strong>Grade:</strong> {challenge.grade}</span>
          </div>
          <div className={styles.challengeActions}>
            <Button className={styles.tryButton}>Try as Student</Button>
            <Button className={styles.assignButton}>Assign</Button>
            <Button className={styles.editButton}>Edit</Button>
            <Button className={styles.publishButton}>Publish</Button>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className={styles.questionsSection}>
        <h2>Questions</h2>
        <ul className={styles.questionsList}>
          {challenge.questions.map((q, idx) => (
            <li key={q.id} className={styles.questionItem}>
              <div className={styles.questionText}>{idx + 1}. {q.text}</div>
              <ul className={styles.optionsList}>
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className={`${styles.option} ${i === q.correct ? styles.correct : ""}`}
                  >
                    {opt}
                    {i === q.correct && <span className={styles.correctMark}>✔</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChallengeDetails;