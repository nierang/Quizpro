CREATE DATABASE Kahoot;
use kahoot;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'e.g., student, teacher, admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., 'Class 4A'
    grade_level INT, -- optional
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., 'Class 4A'
    grade_level INT, -- optional
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE class_students
ADD CONSTRAINT unique_class_student UNIQUE (class_id, student_id);

SET SQL_SAFE_UPDATES = 1;

DELETE cs1 FROM class_students cs1
JOIN class_students cs2 
  ON cs1.class_id = cs2.class_id 
 AND cs1.student_id = cs2.student_id 
 AND cs1.id > cs2.id;



CREATE TABLE IF NOT EXISTS class_teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    teacher_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL -- e.g., Math, Science, English
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL -- e.g., Quiz, True/False, Spelling, Timeline
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    game_type_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL, -- typically a teacher
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (game_type_id) REFERENCES game_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT,
    options TEXT, -- JSON array if multiple choices
    metadata TEXT, -- can hold difficulty, language, tags, etc.
    created_at DATETIME,
    FOREIGN KEY (game_id) REFERENCES games(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email_verified_at DATETIME,
    remember_token VARCHAR(100),
    role_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

select * from users;

CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    assigned_by INT NOT NULL, -- teacher
    assigned_to_class INT, -- either class-based
    assigned_to_student INT, -- or individual
    due_date DATETIME,
    created_at DATETIME,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to_class) REFERENCES classes(id),
    FOREIGN KEY (assigned_to_student) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_game_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    game_id INT NOT NULL,
    score INT,
    started_at DATETIME,
    completed_at DATETIME,
    data TEXT, -- store answers or logs if needed
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- *************************************************************************************
INSERT INTO classes (school_id, name, grade_level) 
VALUES 
(1, 'Grade 6A', 6),
(1, 'Grade 9A', 9);

SELECT id FROM classes WHERE name IN ('Grade 6A', 'Grade 9A');

INSERT INTO class_teachers (class_id, teacher_id)
VALUES 
(13, 56),
(12, 56);

select * from class_teachers;

select * from classes;

select * from users;

SELECT * FROM users WHERE id = 56 AND role_id = (
  SELECT id FROM roles WHERE name = 'teacher'
);

SELECT c.id AS class_id, c.name AS class_name
FROM class_teachers ct
JOIN classes c ON c.id = ct.class_id
WHERE ct.teacher_id = 56;
SELECT COUNT(*) AS student_count
FROM class_students
WHERE class_id = 12;

SELECT cs.class_id, COUNT(cs.student_id) AS student_count
FROM class_students cs
WHERE cs.class_id IN (
  SELECT class_id FROM class_teachers WHERE teacher_id = 56
)
GROUP BY cs.class_id;
select * from roles;

INSERT INTO users (id, name, email, password, role_id)
VALUES (56, 'Swetha', 'Swethareccycv098@gmail.com', 'Banged1328', 2);




-- ___________-imp________________________________

INSERT INTO classes (id, school_id, name, grade_level)
VALUES (101, 1, 'Grade 6A', 6);

select *  from classes;

INSERT INTO class_teachers (class_id, teacher_id)
VALUES (101, 56);

select * from class_teachers;

select * from users;
INSERT INTO users (id, name, email, password, role_id)
VALUES 
  (19, 'Stella', 'Stella1@example.com', '123456', 1),
  (20, 'Maria', 'Maria2@example.com', '123456*', 1);

select * from users;
select * from roles;


INSERT INTO class_students (class_id, student_id)
VALUES 
  (101, 201),
  (101, 202);

SELECT c.id AS classId
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.id
      WHERE ct.teacher_id = 56;

-- ___________-imp________________________________

INSERT INTO assignments (game_id, assigned_by, assigned_to_class, due_date, created_at)
VALUES (1, 56, 101, DATE_ADD(NOW(), INTERVAL 3 DAY), NOW());

INSERT INTO assignments (game_id, assigned_by, assigned_to_class, due_date, created_at)
VALUES (2, 56, 101, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 HOUR));

SELECT * FROM games;
select * from assignments;

INSERT INTO games (title, description) VALUES ('Sample Quiz', 'This is a test quiz');

SELECT id FROM games WHERE title = 'Math Quiz';

SELECT id FROM subjects LIMIT 1;

SELECT id FROM game_types LIMIT 1;

SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'teacher') LIMIT 1;
INSERT INTO games (subject_id, game_type_id, title, description, created_by, created_at, updated_at)
VALUES (1, 1, 'Sample Quiz', 'This is a test quiz', 56, NOW(), NOW());

INSERT INTO games (title, description, subject_id)
VALUES ('Science Quiz', 'This is a basic Science quiz', 1);
select * from games;
INSERT INTO games (title, description, subject_id, game_type_id, created_by)
VALUES ('Science Quiz', 'This is a basic Science quiz', 1, 1, 56);
SHOW TABLES;
SELECT id, name FROM users LIMIT 10;

SELECT id FROM teachers;
select * from subjects;
select * from game_types;
INSERT INTO games (title, description, subject_id, game_type_id, created_by)
VALUES ('Science Quiz', 'This is a basic Science quiz', 1, 1, 1);  -- Replace 1 with a valid user ID

SELECT id FROM roles WHERE name = 'teacher';
SELECT id FROM users WHERE email = 'Swethareccycv098@gmail.com'; 
SELECT id FROM game_types WHERE name = 'Quiz'; 
SELECT id FROM subjects WHERE name = 'Math'; 
SELECT id, name FROM subjects;
SELECT id, name FROM game_types;
SELECT id, name FROM users;

INSERT INTO games (title, description, subject_id, game_type_id, created_by)
VALUES ('Chemistry Quiz', 'This is a Basic Chemistry formula quiz', 2, 1,56);


INSERT INTO games (subject_id, game_type_id, title, description, created_by, created_at, updated_at)
VALUES (1, 1, 'Sample Quiz', 'This is a test quiz', 56, NOW(), NOW());

select * from games;

SELECT COUNT(*) AS ongoing
FROM assignments
WHERE assigned_to_class IN (classIds)
  AND NOW() BETWEEN created_at AND due_date;

SELECT COUNT(*) AS upcoming
FROM assignments
WHERE assigned_to_class IN (classIds)
  AND created_at > NOW();

SELECT COUNT(*) AS ongoing
FROM assignments
WHERE assigned_to_class IN (101, 102)
  AND NOW() BETWEEN created_at AND due_date;

SELECT COUNT(*) AS upcoming
FROM assignments
WHERE assigned_to_class IN (101, 102)
  AND created_at > NOW();

INSERT INTO assignments (game_id, assigned_by, assigned_to_class, created_at, due_date)
VALUES (1, 56, 101, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY));



-- Ongoing quizzes for class 101
SELECT * FROM assignments
WHERE assigned_to_class = 101
  AND NOW() BETWEEN created_at AND due_date;


-- Upcoming quizzes assigned by teacher 56
SELECT * FROM assignments
WHERE assigned_by = 56
  AND created_at > NOW();

select * from u where teacher_id = 2;

select * from  users;






-- *************************IMP*******************************************************
SELECT c.id AS class_id, c.name AS class_name
FROM class_teachers ct
JOIN classes c ON ct.class_id = c.id
WHERE ct.teacher_id = 56;

SELECT u.id AS student_id, u.name AS student_name, c.name AS class_name
FROM class_students cs
JOIN users u ON u.id = cs.student_id
JOIN classes c ON cs.class_id = c.id
JOIN class_teachers ct ON ct.class_id = c.id
WHERE ct.teacher_id = 56;


-- Insert student into class 'Grade 6A' if it's taught by teacher ID 56
INSERT INTO class_students (class_id, student_id)
SELECT c.id, 20 -- 105 = student's user ID
FROM classes c
JOIN class_teachers ct ON ct.class_id = c.id
WHERE c.name = 'Grade 7A' AND ct.teacher_id = 56;


SELECT id, name, email
FROM users
WHERE role_id = (SELECT id FROM roles WHERE name = 'student');

select * from classes;
select * from users;

-- *************************IMP*******************************************************