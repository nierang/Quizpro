--  How to use SQLite (CLI)
-- Step1: 
-- Open terminal / command prompt.
-- step2: 
-- sqlite3 kahoot.db
-- Step3:
--  PRAGMA foreign_keys = ON;
------------------------------------ROLES----------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
--  Insert data
INSERT INTO roles (name)
VALUES ('student'),
    ('teacher'),
    ('admin');
-- Check data
SELECT *
FROM roles;
-------------------------------------SCHOOL--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Trigger
CREATE TRIGGER trg_schools_updated
AFTER
UPDATE ON schools FOR EACH ROW BEGIN
UPDATE schools
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
--  Insert data
INSERT INTO schools (name, address)
VALUES ('Greenwood High', '123 Main St');
-- Check data
SELECT *
FROM schools;
-------------------------------------USERS--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email_verified_at DATETIME,
    remember_token TEXT,
    role_id INTEGER NOT NULL,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
-- Trigger for updated_at
CREATE TRIGGER trg_users_updated
AFTER
UPDATE ON users FOR EACH ROW BEGIN
UPDATE users
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
--  Insert data
INSERT INTO users (name, email, password, role_id)
VALUES ('Alice', 'alice@example.com', 'password123', 1),
    (
        'Mr. Brown',
        'brown@example.com',
        'password456',
        2
    );
-- Check data
SELECT *
FROM users;
-------------------------------------CLASSES--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    grade_level INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id)
);
-- Trigger
CREATE TRIGGER trg_classes_updated
AFTER
UPDATE ON classes FOR EACH ROW BEGIN
UPDATE classes
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
--  Insert data
INSERT INTO classes (school_id, name, grade_level)
VALUES (1, 'Class 4A', 4);
-- Check data
SELECT *
FROM classes;
-------------------------------------CLASS_STUDENTS--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS class_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);
-- Assuming Alice has ID 1 (insert data)
INSERT INTO class_students (class_id, student_id)
VALUES (1, 1);
-------------------------------------CLASS_TEACHERS--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS class_teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);
-- Insert sample data
-- Assuming you have a teacher user with id = 2 (like Mr. Brown), and class with id = 1:
INSERT INTO class_teachers (class_id, teacher_id)
VALUES (1, 2);
-- Check inserted data
SELECT *
FROM class_teachers;
-------------------------------------SUBJECTS--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
--  Insert sample subjects
INSERT INTO subjects (name)
VALUES ('Math'),
    ('Science'),
    ('English');
--  Check data
SELECT *
FROM subjects;
-------------------------------------GAME_TYPE--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS game_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
--  Insert sample subjects
INSERT INTO game_types (name)
VALUES ('Quiz'),
    ('True/False'),
    ('Spelling'),
    ('Timeline');
-- Check data
SELECT *
FROM game_types;
-------------------------------------GAME--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    game_type_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    image TEXT,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (game_type_id) REFERENCES game_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
-- Trigger to update updated_at
CREATE TRIGGER trg_games_updated
AFTER
UPDATE ON games FOR EACH ROW BEGIN
UPDATE games
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;
-- Insert sample data
-- Assuming:
-- subject_id = 1 (Math),
-- game_type_id = 1 (Quiz),
-- created_by = 2 (Mr. Brown, teacher):
INSERT INTO games (
        subject_id,
        game_type_id,
        title,
        description,
        created_by
    )
VALUES (
        1,
        1,
        'Math Basics Quiz',
        'A quiz on basic math concepts',
        2
    );
--  Check inserted data
SELECT *
FROM games;
-------------------------------------Questions--------------------------------------------------------------
-- Create table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT,
    options TEXT,
    -- Store JSON string for multiple choices
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);
-- Insert sample question
-- Example for a math quiz (game_id = 1):
INSERT INTO questions (game_id, question_text, correct_answer, options)
VALUES (
        1,
        'What is 2 + 2?',
        '4',
        '["1", "2", "3", "4"]'
    );
--  Check data
SELECT *
FROM questions;
-------------------------------------assignments--------------------------------------------------------------
--  Create table
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_to_class INTEGER,
    assigned_to_student INTEGER,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to_class) REFERENCES classes(id),
    FOREIGN KEY (assigned_to_student) REFERENCES users(id)
);
-- Insert sample assignment
-- Assign game id=1 by teacher id=2 to class id=1:
INSERT INTO assignments (
        game_id,
        assigned_by,
        assigned_to_class,
        due_date
    )
VALUES (1, 2, 1, '2025-06-01 23:59:59');
-- Check data
SELECT *
FROM assignments;
-- Create table
-------------------------------------Likes--------------------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Insert sample data
-- User id=3 liked assignment id=1:
INSERT INTO likes (assignment_id, user_id)
VALUES (1, 3);
-- Check inserted data
SELECT *
FROM likes;