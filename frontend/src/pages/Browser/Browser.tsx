import React from "react";
import styles from "./Browser.module.css"; // Import styles using CSS Modules
import { iconMap } from "../../utils/iconMap";

const Browser = () => {
  const challenges = [
    {
      id: 1,
      image: "https://www.zoo-berlin.de/fileadmin/_processed_/0/4/csm_artenschutzweltweit_galerie2_panda_c322790646.jpg",
      title: "Colours: What colour is it?",
      grade: "Grade 5",
      subject: "Math",
      questions: 20,
      collectedBy: 150,
    },
    {
      id: 2,
      image: "https://www.wwf.at/wp-content/uploads/2021/05/20final_wwf-at_Panda_Ast_cStaffanWidstrand-1-980x980.jpg",
      title: "Science Quiz Colours: What colour is it?",
      grade: "Grade 6",
      subject: "Science",
      questions: 15,
      collectedBy: 200,
    },
    {
      id: 3,
      image: "https://www.zoo-berlin.de/fileadmin/_processed_/0/4/csm_artenschutzweltweit_galerie2_panda_c322790646.jpg",
      title: "History Trivia Colours: What colour is it?",
      grade: "Grade 7",
      subject: "History",
      questions: 25,
      collectedBy: 120,
    },
    {
      id: 4,
      image: "https://www.wwf.at/wp-content/uploads/2021/05/20final_wwf-at_Panda_Ast_cStaffanWidstrand-1-980x980.jpg",
      title: "Science Quiz",
      grade: "Grade 6",
      subject: "Science",
      questions: 15,
      collectedBy: 200,
    },
    {
      id: 5,
      image: "https://www.wwf.at/wp-content/uploads/2021/05/20final_wwf-at_Panda_Ast_cStaffanWidstrand-1-980x980.jpg",
      title: "Science Quiz",
      grade: "Grade 6",
      subject: "Science",
      questions: 15,
      collectedBy: 200,
    },
    {
      id: 6,
      image: "https://www.wwf.at/wp-content/uploads/2021/05/20final_wwf-at_Panda_Ast_cStaffanWidstrand-1-980x980.jpg",
      title: "Science Quiz",
      grade: "Grade 6",
      subject: "Science",
      questions: 15,
      collectedBy: 200,
    },
    {
      id: 7,
      image: "https://www.wwf.at/wp-content/uploads/2021/05/20final_wwf-at_Panda_Ast_cStaffanWidstrand-1-980x980.jpg",
      title: "Science Quiz",
      grade: "Grade 6",
      subject: "Science",
      questions: 15,
      collectedBy: 200,
    },
    // Add more challenges as needed
  ];

  return (
    <div className={styles.browserPage}>
      {/* Title */}
      <h1 className={styles.browserTitle}>Browser</h1>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <iconMap.search className={styles.searchIcon} />
        <input
          type="text"
          id="searchInput"
          name="search"
          placeholder="Search by keyword or paste a YouTube link"
        />
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {/* Subject Filter */}
        <div className={styles.filterItem}>
          <iconMap.subjects className={styles.filterIcon} />
          <select id="subjectFilter" name="subject">
            <option value="">Subject</option>
            <option value="math">Math</option>
            <option value="science">Science</option>
            <option value="history">History</option>
          </select>
        </div>

        {/* Grade Level Filter */}
        <div className={styles.filterItem}>
          <iconMap.grade className={styles.filterIcon} />
          <select id="gradeFilter" name="grade">
            <option value="">Grade Level</option>
            <option value="grade-5">Grade 5</option>
            <option value="grade-6">Grade 6</option>
            <option value="grade-7">Grade 7</option>
          </select>
        </div>

        {/* Language Filter */}
        <div className={styles.filterItem}>
          <iconMap.language className={styles.filterIcon} />
          <select id="languageFilter" name="language">
            <option value="">Language</option>
            <option value="english">English</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>

        {/* Question Type Filter */}
        <div className={styles.filterItem}>
          <iconMap.questiontype className={styles.filterIcon} />
          <select id="questionTypeFilter" name="questionType">
            <option value="">Question Type</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="true-false">True/False</option>
          </select>
        </div>
      </div>

      {/* Popular Challenges */}
      <div className={styles.challengesGrid}>
        {challenges.map((challenge) => (
          <div key={challenge.id} className={styles.challengeCard}>
            <img src={challenge.image} alt={challenge.title} />
            <div className={styles.cardtext}>
              <h3>{challenge.title}</h3>
              <div className={styles.detailsRow}>
                <p>{challenge.grade}</p>
                <p>{challenge.subject}</p>
                <p>{challenge.questions}</p>
              </div>
              <div className={styles.collectedBy}>
                <iconMap.star className={styles.collectedByIcon} />
                <span>{challenge.collectedBy} people liked</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      
    </div>
  );
};

export default Browser;