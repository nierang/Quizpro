


// final code 

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));



// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'kahoot'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');
});

/** ======================= SCHOOL MANAGEMENT ======================= **/

app.get('/schools', (req, res) => {
    db.query('SELECT * FROM schools', (err, result) => {
        if (err) return res.status(500).json({ error: 'Error fetching schools' });
        res.json(result);
    });
});

app.post('/add-school', (req, res) => {
    const { name, address } = req.body;
    if (!name || !address) return res.status(400).json({ error: 'School name and address are required' });

    db.query('INSERT INTO schools (name, address) VALUES (?, ?)', [name, address], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error adding school' });
        res.json({ message: 'School added successfully!', id: result.insertId });
    });
});

/** ======================= CLASS MANAGEMENT ======================= **/

// Get all classes (with subjects)
app.get('/classes', (req, res) => {
    const sql = `
        SELECT c.id AS classId, c.name AS className, c.grade_level, s.name AS schoolName
        FROM classes c
        JOIN schools s ON c.school_id = s.id
    `;
    db.query(sql, (err, classes) => {
        if (err) return res.status(500).json({ error: 'Error fetching classes' });

        const classIds = classes.map(cls => cls.classId);
        if (classIds.length === 0) return res.json([]);

        const subjectSql = `
            SELECT cs.class_id, sub.name AS subjectName
            FROM class_subjects cs
            JOIN subjects sub ON cs.subject_name = sub.name
            WHERE cs.class_id IN (?)
        `;

        db.query(subjectSql, [classIds], (err2, subjects) => {
            if (err2) return res.status(500).json({ error: 'Error fetching subjects' });

            const map = {};
            classes.forEach(cls => {
                map[cls.classId] = {
                    id: cls.classId,
                    name: cls.className,
                    gradeLevel: cls.grade_level,
                    schoolName: cls.schoolName,
                    subjects: []
                };
            });

            subjects.forEach(sub => {
                if (map[sub.class_id]) {
                    map[sub.class_id].subjects.push(sub.subjectName);
                }
            });

            res.json(Object.values(map));
        });
    });
});

// Get students in a class
app.get('/classes/:id/students', (req, res) => {
    const classId = req.params.id;

    const sql = `
        SELECT u.id, u.name, u.email, 
               COUNT(ga.id) AS questionsAttempted, 
               ROUND(COALESCE(AVG(ga.score), 0), 2) AS average_accuracy
        FROM class_students cs
        JOIN users u ON cs.student_id = u.id
        LEFT JOIN student_game_attempts ga ON u.id = ga.student_id
        WHERE cs.class_id = ?
        AND u.role_id = 1
        GROUP BY u.id
    `;

    db.query(sql, [classId], (err, students) => {
        if (err) {
            console.error('Error fetching class students:', err);
            return res.status(500).json({ error: 'Error fetching students' });
        }

        res.json(students);
    });
});

// Get challenges in a class
app.get('/classes/:id/challenges', (req, res) => {
    const classId = req.params.id;

    const sql = `
        SELECT 
            a.id,
            g.title,
            g.subject,
            g.grade,
            g.number_of_questions,
            a.due_date,
            t.name AS teacher_name,
            COUNT(sga.id) AS submissions,
            ROUND(AVG(sga.score), 2) AS average_accuracy,
            MAX(sga.score) AS highest,
            MIN(sga.score) AS lowest,
            CASE 
                WHEN a.due_date > NOW() THEN 'ON'
                ELSE 'OFF'
            END AS status
        FROM assignments a
        JOIN games g ON a.game_id = g.id
        JOIN users t ON a.teacher_id = t.id
        LEFT JOIN student_game_attempts sga ON a.game_id = sga.game_id
        WHERE a.class_id = ?
        GROUP BY a.id
    `;

    db.query(sql, [classId], (err, results) => {
        if (err) {
            console.error('Error fetching challenges:', err);
            return res.status(500).json({ error: 'Failed to fetch challenges.' });
        }

        // Format results for frontend expectations
        const formatted = results.map(row => ({
            title: row.title,
            number_of_questions: row.number_of_questions,
            grade: row.grade,
            subject: row.subject,
            teacher_name: row.teacher_name,
            created_at: row.due_date,
            submitted: `${row.submissions}`,
            average_accuracy: `${row.average_accuracy || 0}%`,
            highest: `${row.highest || 0}%`,
            lowest: `${row.lowest || 0}%`,
            status: row.status
        }));

        res.json(formatted);
    });
});


// ******************************************************************************************
// ADD CLASS (POST /add-class)
app.post('/add-class', (req, res) => {
    const { schoolId, name, gradeLevel, subjects, teacherId } = req.body;
  
    db.query(
      'INSERT INTO classes (school_id, name, grade_level) VALUES (?, ?, ?)',
      [schoolId, name, gradeLevel],
      (err, result) => {
        if (err) {
          console.error('Error inserting into classes:', err);
          return res.status(500).json({ error: 'Database error' });
        }
  
        const classId = result.insertId;
  
        db.query(
          'INSERT INTO class_teachers (class_id, teacher_id) VALUES (?, ?)',
          [classId, teacherId],
          (err2) => {
            if (err2) {
              console.error('Error inserting into class_teachers:', err2);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Class created successfully!' });
          }
        );
      }
    );
  });


app.put('/update-class/:id', (req, res) => {
    const classId = req.params.id;
    const { schoolId, name, gradeLevel } = req.body;
    if (!schoolId || !name || !gradeLevel) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.query('UPDATE classes SET school_id = ?, name = ?, grade_level = ? WHERE id = ?', 
        [schoolId, name, gradeLevel, classId], 
        (err) => {
            if (err) return res.status(500).json({ error: 'Error updating class' });
            res.json({ message: 'Class updated successfully!' });
        }
    );
});

app.delete('/delete-class/:id', (req, res) => {
    const classId = req.params.id;
    db.query('DELETE FROM classes WHERE id = ?', [classId], (err) => {
        if (err) return res.status(500).json({ error: 'Error deleting class' });
        res.json({ message: 'Class deleted successfully!' });
    });
});

/** ======================= STUDENT MANAGEMENT ======================= **/


// Get a single student's detailed info by ID

app.get('/get-student-details/:id', (req, res) => {
    const { id } = req.params;  // Capture the 'id' from the URL path
    if (!id) return res.status(400).json({ error: 'Student ID is required' });

    const sql = `
        SELECT 
            u.id AS id,
            u.name, 
            u.email, 
            COUNT(ga.id) AS questionsAttempted, 
            ROUND(COALESCE(AVG(ga.score), 0), 2) AS average_accuracy
        FROM users u
        LEFT JOIN student_game_attempts ga ON u.id = ga.student_id
        WHERE u.role_id = 1 AND u.id = ?
        GROUP BY u.id, u.name, u.email
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error fetching student details' });
        if (results.length === 0) return res.status(404).json({ error: 'Student not found' });

        res.json(results[0]);
    });
});



// Get all challenges
app.get('/get-challenges', (req, res) => {
    const query = `
      SELECT * FROM assignments
      JOIN games ON assignments.game_id = games.id
      WHERE assignments.due_date > NOW()
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching challenges:', err);
        return res.status(500).json({ error: 'Failed to fetch challenges.' });
      }
      res.json(results);
    });
  });


  app.get('/get-challenge-details/:id', (req, res) => {
    const challengeId = req.params.id; // Capture the challenge ID from the URL
    console.log(`Fetching challenge details for ID: ${challengeId}`); // Debugging log
  
    const query = `
      SELECT * FROM assignments
      JOIN games ON assignments.game_id = games.id
      WHERE assignments.id = ?
    `;
    
    db.query(query, [challengeId], (err, results) => {
      if (err) {
        console.error('Error fetching challenge details:', err);
        return res.status(500).json({ error: 'Failed to fetch challenge details.' });
      }
  
      console.log('Query results:', results); // Log the results to see what's returned
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'Challenge not found.' });
      }
  
      res.json(results[0]);
    });
  });
  
  
/** ======================= SUBJECT MANAGEMENT ======================= **/

app.post('/submit_subject', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).send('Subject name is required');

    const checkQuery = 'SELECT * FROM subjects WHERE name = ?';
    db.query(checkQuery, [name], (err, result) => {
        if (err) return res.status(500).send('Error checking subject existence');
        if (result.length > 0) return res.status(400).json({ message: 'Subject already exists.' });

        const insertQuery = 'INSERT INTO subjects (name) VALUES (?)';
        db.query(insertQuery, [name], (err, insertResult) => {
            if (err) return res.status(500).send('Error inserting subject');
            res.json({ message: 'Subject added successfully!' });
        });
    });
});

app.get('/get_subjects', (req, res) => {
    db.query('SELECT * FROM subjects', (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch subjects' });
        res.json(results);
    });
});

/** ======================= ROLE MANAGEMENT ======================= **/

app.get('/roles', (req, res) => {
    db.query('SELECT * FROM roles', (err, result) => {
        if (err) return res.status(500).json({ error: 'Error fetching roles' });
        res.json(result);
    });
});

app.post('/add-role', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });

    db.query('INSERT INTO roles (name) VALUES (?)', [name.trim()], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error adding role' });
        res.json({ message: 'Role added successfully!', id: result.insertId });
    });
});

/** ======================= USER MANAGEMENT ======================= **/

app.get('/users', (req, res) => {
    const sql = `
        SELECT users.id, users.name, users.email, roles.name AS roleName
        FROM users
        JOIN roles ON users.role_id = roles.id`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

app.post('/add-user', (req, res) => {
    const { name, email, password, role_id } = req.body;
    if (!name || !email || !password || !role_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.query(
        'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)', 
        [name, email, password, role_id], 
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'User added successfully!', id: result.insertId });
        }
    );
});

// // Update user by ID
// app.put('/users/:id', (req, res) => {
//     const userId = req.params.id;
//     const { name, email } = req.body;

//     const sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
//     db.query(sql, [name, email, userId], (err, result) => {
//         if (err) {
//             console.error("Error updating user:", err);
//             return res.status(500).json({ error: "Error updating user" });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: "User not found" });
//         }
//         res.json({ message: "User updated successfully" });
//     });
// });

  
// // DELETE route
// app.delete('/users/:id', (req, res) => {
//     const userId = req.params.id;
//     const sql = "DELETE FROM users WHERE id = ?";
    
//     db.query(sql, [userId], (err, result) => {
//       if (err) {
//         console.error("Error deleting user:", err);
//         return res.status(500).json({ error: "Error deleting user" });
//       }
//       if (result.affectedRows === 0) {
//         return res.status(404).json({ error: "User not found" });
//       }
//       res.json({ message: "User deleted successfully" });
//     });
//   });





  
// ------------------------------------------------------------------------------------------------------------

 // Get student details based on student ID
app.get('/get-student-details', (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Student ID is required' });
  
    const sql = `
      SELECT name, email, questions_answered, average_accuracy
      FROM students
      WHERE id = ?
    `;
  
    db.query(sql, [id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error fetching student details' });
      if (results.length === 0) return res.status(404).json({ error: 'Student not found' });
  
      res.json(results[0]);
    });
  });


app.get('/get-students-by-class/:classId', (req, res) => {
    const classId = req.params.classId;
    const sql = `
      SELECT s.id, s.name, s.email, s.questionsAttempted, s.average_accuracy
      FROM students s
      JOIN class_students cs ON s.id = cs.student_id
      WHERE cs.class_id = ?
    `;
  
    db.query(sql, [classId], (err, results) => {
      if (err) {
        console.error('Error fetching students by class:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    });
  });
  

  
  
  
  
  
  
  
  
  

/** ======================= ADD STUDENT TO CLASS ======================= **/

app.post('/add-student-to-class', (req, res) => {
    const { name, email, classId } = req.body;

    if (!name || !email || !classId) {
        return res.status(400).json({ error: 'Name, email, and classId are required' });
    }

    // First, insert the student into the users table
    const defaultPassword = 'student123'; // You can hash this later for security
    const roleId = 1; // Assuming 1 is for 'student'

    const insertUserSql = `
        INSERT INTO users (name, email, password, role_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(insertUserSql, [name, email, defaultPassword, roleId], (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ error: 'Error adding student to users table' });
        }

        const studentId = result.insertId;

        // Now link the student to the class
        const insertClassStudentSql = `
            INSERT INTO class_students (class_id, student_id)
            VALUES (?, ?)
        `;

        db.query(insertClassStudentSql, [classId, studentId], (err2) => {
            if (err2) {
                console.error('Error linking student to class:', err2);
                return res.status(500).json({ error: 'Error assigning student to class' });
            }

            res.json({ 
                message: 'Student added and assigned to class successfully',
                studentId,
                classId
            });
        });
    });
});


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


// Route: Recent Games (limit 3)
app.get('/recent-games', (req, res) => {
    const teacherId = req.query.teacherId;
  
    if (!teacherId) {
      return res.status(400).json({ error: 'teacherId is required' });
    }
  
    const query = `
      SELECT 
        g.id AS game_id,
        g.title,
        DATE_FORMAT(MAX(sga.completed_at), '%m/%d') AS date_range,
        COUNT(DISTINCT sga.student_id) AS total_students,
        ROUND(AVG(sga.score), 0) AS average_accuracy
      FROM games g
      JOIN assignments a ON g.id = a.game_id
      JOIN student_game_attempts sga ON sga.game_id = g.id
      WHERE a.assigned_by = ?
      GROUP BY g.id
      ORDER BY MAX(sga.completed_at) DESC
      LIMIT 3
    `;
  
    db.query(query, [teacherId], (err, results) => {
      if (err) {
        console.error("Error querying recent games:", err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      return res.json({ games: results });
    });
  });
  
  
  // Route: Game Distribution (score buckets)
  app.get('/game-distribution', (req, res) => {
    const gameId = req.query.gameId;
  
    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }
  
    const query = `
      SELECT 
        score,
        COUNT(*) as student_count
      FROM student_game_attempts
      WHERE game_id = ?
      GROUP BY score
      ORDER BY score DESC
    `;
  
    db.query(query, [gameId], (err, results) => {
      if (err) {
        console.error("Error querying game distribution:", err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      return res.json({ distribution: results });
    });
  });
// ----------------------------------------------------------------------------------------------------------------

// Login API
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length > 0) {
      // Fix: send `teacher` instead of `user`
      res.json({ message: 'Login successful', teacher: results[0] });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  });
});

/** ======================= DASHBOARD ======================= **/

app.get('/dashboard', (req, res) => {
    const teacherId = req.query.teacherId;
  
    if (!teacherId) {
      return res.status(400).json({ error: 'teacherId is required' });
    }
  
    console.log("Received request for teacherId:", teacherId);
  
    db.query(
      `
      SELECT c.id AS classId
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.id
      WHERE ct.teacher_id = ?
      `,
      [teacherId],
      (err, classRows) => {
        if (err) {
          console.error("Error querying classes:", err);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        const classIds = classRows.map(row => row.classId);
        const totalClassrooms = classIds.length;
  
        if (totalClassrooms === 0) {
          return res.json({
            totalClassrooms: 0,
            totalStudents: 0,
            upcomingQuizzes: 0,
            ongoingQuizzes: 0
          });
        }
  
        const placeholders = classIds.map(() => '?').join(',');
  
        // Step 1: Count total students
        db.query(
          `
          SELECT COUNT(DISTINCT cs.student_id) AS totalStudents
          FROM class_students cs
          WHERE cs.class_id IN (${placeholders})
          `,
          classIds,
          (err, studentRows) => {
            if (err) {
              console.error("Error querying students:", err);
              return res.status(500).json({ error: 'Internal Server Error' });
            }
  
            // Step 2: Count quizzes
            db.query(
              `
              SELECT 
                SUM(CASE WHEN a.due_date > NOW() THEN 1 ELSE 0 END) AS upcomingQuizzes,
                SUM(CASE WHEN NOW() BETWEEN a.created_at AND a.due_date THEN 1 ELSE 0 END) AS ongoingQuizzes
              FROM assignments a
              WHERE a.assigned_to_class IN (${placeholders})
              `,
              classIds,
              (err, quizRows) => {
                if (err) {
                  console.error("Error querying quizzes:", err);
                  return res.status(500).json({ error: 'Internal Server Error' });
                }
  
                const quizStats = quizRows[0] || {};
                const upcomingQuizzes = quizStats.upcomingQuizzes ?? 0;
                const ongoingQuizzes = quizStats.ongoingQuizzes ?? 0;
  
                return res.json({
                  totalClassrooms,
                  totalStudents: studentRows[0].totalStudents || 0,
                  upcomingQuizzes,
                  ongoingQuizzes
                });
              }
            );
          }
        );
      }
    );
  });
  
  
  
  

/** ======================= SERVER START ======================= **/

app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
});



















