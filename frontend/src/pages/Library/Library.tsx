import React, { useState } from "react";
import styles from "./Library.module.css";
import { iconMap } from "../../utils/iconMap";
import Button from "../../components/ui/Button";

const Library = () => {
  const [activeTab, setActiveTab] = useState("All Content");

  const challenges = [
    {
      id: 1,
      image: "https://www.zoo-berlin.de/fileadmin/_processed_/0/4/csm_artenschutzweltweit_galerie2_panda_c322790646.jpg",
      title: "Math Challenge Colours: What colour is it?",
      grade: "Grade 5",
      subject: "Math",
      questions: 20,
      collectedBy: 150,
    },
    {
      id: 2,
      image: "https://www.wwf.at/wp-content/uploads/2021/05/20final_wwf-at_Panda_Ast_cStaffanWidstrand-1-980x980.jpg",
      title: "Colours: What colour is it?",
      grade: "Grade 6",
      subject: "Science",
      questions: 15,
      collectedBy: 200,
    },
    {
      id: 3,
      image: "https://www.zoo-berlin.de/fileadmin/_processed_/0/4/csm_artenschutzweltweit_galerie2_panda_c322790646.jpg",
      title: "Colours: What colour is it?",
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
  ]

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.libraryPage}>
      {/* Navigation Bar */}
      <nav className={styles.navBar}>
        {["All Content", "Previously Used", "Created By Me", "Collected"].map((tab) => (
          <button
            key={tab}
            className={`${styles.navButton} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

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
              <div className={styles.challengeActions}>
                <Button className={styles.detailButton}>Details</Button>
                <Button >Assign</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Library;