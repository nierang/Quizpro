// Final corrected version of your Node.js backend with Express, SQLite, Swagger, and Multer

import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { promisify } from 'util';
import multer from 'multer';
import fs from 'fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// SQLite connection with full mutex
sqlite3.verbose();
const db = new sqlite3.Database(
  './Database.db',
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX,
  (err) => {
    if (err) return console.error('❌ DB connection error:', err.message);
    console.log('✅ Connected to SQLite database');
  }
);

db.serialize(() => {
  db.run('PRAGMA busy_timeout = 10000'); // 10 seconds timeout
  db.run('PRAGMA journal_mode = WAL');    // Enable WAL mode for concurrency
});

// Promisified methods
const dbAll = promisify(db.all).bind(db);
const dbGet = promisify(db.get).bind(db);

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  });


// Retry wrapper for dbRun to handle SQLITE_BUSY
async function dbRunWithRetry(sql, params = [], retries = 5, delayMs = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      return await dbRun(sql, params);
    } catch (err) {
      if (err.code === 'SQLITE_BUSY') {
        console.warn(`⚠️ SQLITE_BUSY - retrying (${i + 1}/${retries})...`);
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('DB is locked, retries exceeded');
}
// Setup tables if not exist
function setupTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
  `);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        username TEXT,
        language TEXT,
        email_verified_at DATETIME,
        remember_token TEXT,
        role_id INTEGER NOT NULL,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      game_type_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      language TEXT NOT NULL,              
      description TEXT,
      created_by INTEGER NOT NULL,
      image TEXT
    );
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      assigned_to_class INTEGER NOT NULL,
      due_date TEXT NOT NULL
    );
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      options TEXT NOT NULL
    );
  `);

    console.log('✅ Tables are ready');
  });
};

setupTables();

// Multer setup
const uploadPath = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QuizApp API',
      version: '1.0.0',
      description: 'Teacher API endpoints',
    },
    servers: [{ url: `http://localhost:${port}` }],
  },
  apis: [__filename],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ----------------------------------------REGISTER------------------------------------------------------
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               role_id:
 *                 type: integer
 *                 example: 2
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile image file
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     role_id:
 *                       type: integer
 *                     image:
 *                       type: string
 *                       nullable: true
 *                       example: uploads/resized-image.jpg
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All fields are required
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email already registered
 *       500:
 *         description: Server error
 */
app.post('/register', upload.single('image'), async (req, res) => {
  const { name, email, password, role_id } = req.body;
  const imageFile = req.file;

  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password.trim(), 10);

  let finalImagePath = null;

  if (imageFile) {
    const resizedPath = path.join(uploadPath, 'resized-' + imageFile.filename); // ✅ NEW: Resizing image
    await sharp(imageFile.path)
      .resize(300, 300)
      .toFile(resizedPath);
    finalImagePath = `uploads/resized-${imageFile.filename}`;
    // Delete original file after resizing
    fs.unlink(imageFile.path, (err) => {
      if (err) console.warn('Failed to delete original uploaded image:', err.message);
    });
  }

  try {
    const existing = await db.getAsync('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const result = await db.runAsync(
      'INSERT INTO users (name, email, password, role_id, image) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, hashedPassword, role_id, finalImagePath]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.lastID,
        name,
        email: normalizedEmail,
        role_id,
        image: finalImagePath,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// ----------------------------------------LOGIN------------------------------------------------------
/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     role_id:
 *                       type: integer
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email and password are required
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       500:
 *         description: Internal server error
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  try {
    // Use dbGet instead of db.getAsync
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(cleanPassword, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ----------------------------------------SETTINGS------------------------------------------------------
/**
 * @swagger
 * /settings/{userId}:
 *   get:
 *     summary: Get user settings by user ID
 *     tags:
 *       - Settings
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the user to get settings for
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 general:
 *                   type: object
 *                   properties:
 *                     image:
 *                       type: string
 *                       nullable: true
 *                     name:
 *                       type: string
 *                     username:
 *                       type: string
 *                       nullable: true
 *                     password:
 *                       type: string
 *                       nullable: true
 *                       description: Always null for security reasons
 *                     email:
 *                       type: string
 *                 accountSetting:
 *                   type: object
 *                   properties:
 *                     preferredSubject:
 *                       type: array
 *                       items:
 *                         type: string
 *                       nullable: true
 *                     organisation:
 *                       type: string
 *                       nullable: true
 *                     convertToStudentAccount:
 *                       type: boolean
 *                 language:
 *                   type: object
 *                   properties:
 *                     preferredLanguage:
 *                       type: string
 *                 deleteAccount:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 */
app.get('/settings/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Get user info + role
    const user = await db.getAsync(`
      SELECT 
        users.id,
        users.name,
        users.username,
        users.email,
        users.role_id,
        roles.name AS role,
        users.image,
        users.language
      FROM users
      LEFT JOIN roles ON users.role_id = roles.id
      WHERE users.id = ?
    `, [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Get preferred subjects + school name if teacher
    let preferredSubjects = [];
    let schoolName = null;

    if (user.role === 'teacher') {
      const subjects = await db.allAsync(`
        SELECT DISTINCT subjects.name
        FROM subjects
        JOIN games ON subjects.id = games.subject_id
        WHERE games.created_by = ?
      `, [userId]);

      preferredSubjects = subjects.map(s => s.name);

      const school = await db.getAsync(`
        SELECT schools.name AS schoolName
        FROM class_teachers
        JOIN classes ON class_teachers.class_id = classes.id
        JOIN schools ON classes.school_id = schools.id
        WHERE class_teachers.teacher_id = ?
        LIMIT 1
      `, [userId]);

      if (school) {
        schoolName = school.schoolName;
      }
    }

    // 3. Compose response JSON
    const response = {
      general: {
        image: user.image || null,
        name: user.name,
        username: user.username || null,
        password: null,
        email: user.email,
      },
      accountSetting: {
        preferredSubject: preferredSubjects.length ? preferredSubjects : null,
        organisation: schoolName,
        convertToStudentAccount: false, // Hardcoded false since column doesn't exist
      },
      language: {
        preferredLanguage: user.language || 'en',
      },
      deleteAccount: {
        message: 'Are you sure you want to delete your account?',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    };

    res.json(response);
  } catch (err) {
    console.error('GET /settings/:userId error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ----------------------------------Browser--------------------------------------------------------
/**
 * @swagger
 * /search/games:
 *   get:
 *     summary: Search games with multiple filters
 *     tags:
 *       - Browser
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Keyword to search in title or description
 *       - in: query
 *         name: subject_id
 *         schema:
 *           type: integer
 *         description: Filter by subject ID
 *       - in: query
 *         name: game_type_id
 *         schema:
 *           type: integer
 *         description: Filter by game type ID
 *       - in: query
 *         name: grade_level
 *         schema:
 *           type: integer
 *         description: Filter by class grade level
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter games by language (searched in description)
 *       - in: query
 *         name: min_likes
 *         schema:
 *           type: integer
 *         description: Minimum number of likes required
 *       - in: query
 *         name: sort_by_likes
 *         schema:
 *           type: string
 *           enum: [desc]
 *         description: Sort by likes if 'desc', otherwise sort by creation date
 *     responses:
 *       200:
 *         description: List of filtered games
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   subject:
 *                     type: string
 *                   gameType:
 *                     type: string
 *                   questionCount:
 *                     type: integer
 *                   likeCount:
 *                     type: integer
 *       500:
 *         description: Internal server error
 */
app.get('/search/games', (req, res) => {
  const {
    query,
    subject_id,
    grade_level,
    language,
    game_type_id,
    min_likes,
    sort_by_likes
  } = req.query;

  let sql = `
    SELECT 
      g.id,
      g.title,
      g.description,
      s.name AS subject,
      gt.name AS gameType,
      COUNT(q.id) AS questionCount,
      COALESCE(l.likeCount, 0) AS likeCount
    FROM games g
    JOIN subjects s ON g.subject_id = s.id
    JOIN game_types gt ON g.game_type_id = gt.id
    LEFT JOIN questions q ON g.id = q.game_id
    LEFT JOIN (
      SELECT a.game_id, COUNT(l.id) AS likeCount
      FROM assignments a
      LEFT JOIN likes l ON l.assignment_id = a.id
      GROUP BY a.game_id
    ) l ON g.id = l.game_id
    LEFT JOIN assignments a ON a.game_id = g.id
    LEFT JOIN classes c ON a.assigned_to_class = c.id
  `;

  let conditions = [];
  let params = [];

  // Keyword in title/description
  if (query) {
    conditions.push("(LOWER(g.title) LIKE ? OR LOWER(g.description) LIKE ?)");
    const keyword = `%${query.toLowerCase()}%`;
    params.push(keyword, keyword);
  }

  if (subject_id) {
    conditions.push("g.subject_id = ?");
    params.push(subject_id);
  }

  if (game_type_id) {
    conditions.push("g.game_type_id = ?");
    params.push(game_type_id);
  }

  if (grade_level) {
    conditions.push("c.grade_level = ?");
    params.push(grade_level);
  }

  if (language) {
    conditions.push("LOWER(g.description) LIKE ?");
    params.push(`%${language.toLowerCase()}%`);
  }

  if (min_likes) {
    conditions.push("COALESCE(l.likeCount, 0) >= ?");
    params.push(min_likes);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += `
    GROUP BY g.id
    ORDER BY ${sort_by_likes === 'desc' ? 'likeCount DESC' : 'g.created_at DESC'}
  `;

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error in /search/games:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});
/**
 * @swagger
 * /submit_subject:
 *   post:
 *     summary: Create a new subject
 *     tags:
 *       - Subjects
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - teacher_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mathematics
 *               teacher_id:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       200:
 *         description: Subject added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject added successfully!
 *                 subjectId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Bad request or subject already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Subject name and teacher_id are required
 *                 message:
 *                   type: string
 *                   example: Subject already exists for this teacher.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error inserting subject
 */
app.post('/submit_subject', (req, res) => {
  const { name, teacher_id } = req.body;

  if (!name || !teacher_id) {
    return res.status(400).json({ error: 'Subject name and teacher_id are required' });
  }

  const checkQuery = 'SELECT * FROM subjects WHERE name = ? AND created_by = ?';
  db.get(checkQuery, [name, teacher_id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking subject existence' });
    }
    if (row) {
      return res.status(400).json({ message: 'Subject already exists for this teacher.' });
    }

    const insertQuery = 'INSERT INTO subjects (name, created_by) VALUES (?, ?)';
    db.run(insertQuery, [name, teacher_id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Error inserting subject' });
      }
      res.json({ message: 'Subject added successfully!', subjectId: this.lastID });
    });
  });
});
/**
 * @swagger
 * /update_subject/{id}:
 *   put:
 *     summary: Update a subject's name
 *     tags:
 *       - Subjects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the subject to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - teacher_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Science
 *               teacher_id:
 *                 type: integer
 *                 example: 42
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject updated successfully
 *       400:
 *         description: Bad request or subject name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Subject name and teacher_id are required
 *                 message:
 *                   type: string
 *                   example: Subject name already exists for this teacher.
 *       404:
 *         description: Subject not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject not found or unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error updating subject
 */
app.put('/update_subject/:id', (req, res) => {
  const subjectId = req.params.id;
  const { name, teacher_id } = req.body;

  if (!name || !teacher_id) {
    return res.status(400).json({ error: 'Subject name and teacher_id are required' });
  }

  // Check if the new name exists for this teacher but with a different subject ID
  const checkQuery = `
    SELECT * FROM subjects 
    WHERE name = ? AND created_by = ? AND id != ?
  `;

  db.get(checkQuery, [name, teacher_id, subjectId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error checking subject existence' });

    if (row) {
      return res.status(400).json({ message: 'Subject name already exists for this teacher.' });
    }

    const updateQuery = `
      UPDATE subjects 
      SET name = ? 
      WHERE id = ? AND created_by = ?
    `;

    db.run(updateQuery, [name, subjectId, teacher_id], function (err) {
      if (err) return res.status(500).json({ error: 'Error updating subject' });

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Subject not found or unauthorized' });
      }

      res.json({ message: 'Subject updated successfully' });
    });
  });
});

/**
 * @swagger
 * /get_subjects:
 *   get:
 *     summary: Get all subjects created by a specific teacher
 *     tags:
 *       - Subjects
 *     parameters:
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the teacher whose subjects are being fetched
 *     responses:
 *       200:
 *         description: List of subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   created_by:
 *                     type: integer
 *       400:
 *         description: Missing teacher_id query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: teacher_id query parameter is required
 *       500:
 *         description: Failed to fetch subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch subjects
 */

app.get('/get_subjects', (req, res) => {
  const teacherId = req.query.teacher_id;
  if (!teacherId) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  const sql = 'SELECT * FROM subjects WHERE created_by = ?';
  db.all(sql, [teacherId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch subjects' });
    }
    res.json(rows);
  });
});
/**
 * @swagger
 * /delete_subject/{id}:
 *   delete:
 *     summary: Delete a subject by ID (must belong to the teacher)
 *     tags:
 *       - Subjects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the subject to delete
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the teacher attempting to delete the subject
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject deleted successfully
 *       400:
 *         description: Missing teacher_id query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: teacher_id query parameter is required
 *       404:
 *         description: Subject not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject not found or unauthorized
 *       500:
 *         description: Error deleting subject
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error deleting subject
 */
app.delete('/delete_subject/:id', (req, res) => {
  const subjectId = req.params.id;
  const teacher_id = req.query.teacher_id;

  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  const deleteQuery = `
    DELETE FROM subjects 
    WHERE id = ? AND created_by = ?
  `;

  db.run(deleteQuery, [subjectId, teacher_id], function (err) {
    if (err) return res.status(500).json({ error: 'Error deleting subject' });

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Subject not found or unauthorized' });
    }

    res.json({ message: 'Subject deleted successfully' });
  });
});

/**
 * @swagger
 * /game-types:
 *   post:
 *     summary: Create a new game type
 *     tags:
 *       - Game Types
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - teacher_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Quiz Challenge
 *               teacher_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Game type added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game type added successfully!
 *                 gameTypeId:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: Missing required fields or game type already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Game type name and teacher_id are required
 *                 message:
 *                   type: string
 *                   example: Game type already exists for this teacher.
 *       500:
 *         description: Internal server error while inserting game type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error inserting game type
 */
app.post('/game-types', (req, res) => {
  const { name, teacher_id } = req.body;

  if (!name || !teacher_id) {
    return res.status(400).json({ error: 'Game type name and teacher_id are required' });
  }

  // Check if the game type already exists for this teacher
  const checkQuery = `SELECT * FROM game_types WHERE name = ? AND created_by = ?`;
  db.get(checkQuery, [name, teacher_id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error checking game type existence' });

    if (row) return res.status(400).json({ message: 'Game type already exists for this teacher.' });

    // Insert new game type with teacher_id
    const insertQuery = `INSERT INTO game_types (name, created_by) VALUES (?, ?)`;
    db.run(insertQuery, [name, teacher_id], function (err) {
      if (err) return res.status(500).json({ error: 'Error inserting game type' });

      res.json({ message: 'Game type added successfully!', gameTypeId: this.lastID });
    });
  });
});
/**
 * @swagger
 * /game-types:
 *   get:
 *     summary: Get all game types created by a specific teacher
 *     tags:
 *       - Game Types
 *     parameters:
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the teacher
 *         example: 1
 *     responses:
 *       200:
 *         description: List of game types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Quiz Challenge
 *                   created_by:
 *                     type: integer
 *                     example: 1
 *       400:
 *         description: Missing teacher_id query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: teacher_id query parameter is required
 *       500:
 *         description: Internal server error while fetching game types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch game types
 */
app.get('/game-types', (req, res) => {
  const teacherId = req.query.teacher_id;
  if (!teacherId) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  const sql = 'SELECT * FROM game_types WHERE created_by = ?';
  db.all(sql, [teacherId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch game types' });
    }
    res.json(rows);
  });
});
/**
 * @swagger
 * /game-types/{id}:
 *   put:
 *     summary: Update a game type by ID for a specific teacher
 *     tags:
 *       - Game Types
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the game type to update
 *         schema:
 *           type: integer
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - teacher_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Flashcards
 *               teacher_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Game type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game type updated successfully
 *       400:
 *         description: Missing name or teacher_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Name and teacher_id are required
 *       404:
 *         description: Game type not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game type not found or unauthorized
 *       500:
 *         description: Internal server error during update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error updating game type
 */
app.put('/game-types/:id', (req, res) => {
  const gameTypeId = req.params.id;
  const { name, teacher_id } = req.body;

  if (!name || !teacher_id) {
    return res.status(400).json({ error: 'Name and teacher_id are required' });
  }

  const updateQuery = `
    UPDATE game_types 
    SET name = ? 
    WHERE id = ? AND created_by = ?
  `;

  db.run(updateQuery, [name, gameTypeId, teacher_id], function (err) {
    if (err) return res.status(500).json({ error: 'Error updating game type' });

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Game type not found or unauthorized' });
    }

    res.json({ message: 'Game type updated successfully' });
  });
});
/**
 * @swagger
 * /game-types/{id}:
 *   delete:
 *     summary: Delete a game type by ID for a specific teacher
 *     tags:
 *       - Game Types
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the game type to delete
 *         schema:
 *           type: integer
 *           example: 5
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         description: ID of the teacher who created the game type
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Game type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game type deleted successfully
 *       400:
 *         description: Missing teacher_id query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: teacher_id query parameter is required
 *       404:
 *         description: Game type not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game type not found or unauthorized
 *       500:
 *         description: Internal server error during deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error deleting game type
 */
app.delete('/game-types/:id', (req, res) => {
  const gameTypeId = req.params.id;
  const teacher_id = req.query.teacher_id;

  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  const deleteQuery = `
    DELETE FROM game_types
    WHERE id = ? AND created_by = ?
  `;

  db.run(deleteQuery, [gameTypeId, teacher_id], function (err) {
    if (err) return res.status(500).json({ error: 'Error deleting game type' });

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Game type not found or unauthorized' });
    }

    res.json({ message: 'Game type deleted successfully' });
  });
});

/// ----------------------------------------DASHBOARD------------------------------------------------------

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard stats for a teacher
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dashboard data
 */
app.get('/dashboard', async (req, res) => {
  const teacherId = req.query.teacherId;
  if (!teacherId) return res.status(400).json({ error: 'teacherId is required' });

  try {
    // 1. Get class IDs for the teacher
    const classRows = await db.allAsync(`
      SELECT c.id AS classId
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.id
      WHERE ct.teacher_id = ?
    `, [teacherId]);

    const classIds = classRows.map(row => row.classId);
    const totalClassrooms = classIds.length;

    if (totalClassrooms === 0) {
      return res.json({
        totalClassrooms: 0,
        totalStudents: 0,
        upcomingQuizzes: 0,
        ongoingQuizzes: 0,
      });
    }

    const placeholders = classIds.map(() => '?').join(',');

    // 2. Count distinct students in those classes
    const studentRow = await db.getAsync(`
      SELECT COUNT(DISTINCT student_id) AS totalStudents
      FROM class_students
      WHERE class_id IN (${placeholders})
    `, classIds);

    // 3. Count upcoming and ongoing quizzes
    const quizStats = await db.getAsync(`
      SELECT 
        SUM(CASE WHEN due_date > datetime('now') THEN 1 ELSE 0 END) AS upcomingQuizzes,
        SUM(CASE WHEN datetime('now') BETWEEN created_at AND due_date THEN 1 ELSE 0 END) AS ongoingQuizzes
      FROM assignments
      WHERE assigned_to_class IN (${placeholders})
    `, classIds);

    res.json({
      totalClassrooms,
      totalStudents: studentRow.totalStudents || 0,
      upcomingQuizzes: quizStats.upcomingQuizzes ?? 0,
      ongoingQuizzes: quizStats.ongoingQuizzes ?? 0,
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//----------------------- Final FIND Classes ------------------------------------------------------------------------------------
/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get classes assigned to a teacher
 *     tags:
 *       - Classes
 *     parameters:
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the teacher
 *     responses:
 *       200:
 *         description: List of classes assigned to the teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   classId:
 *                     type: integer
 *                   className:
 *                     type: string
 *                   grade_level:
 *                     type: integer
 *                   schoolName:
 *                     type: string
 *       400:
 *         description: teacher_id query parameter is required
 *       500:
 *         description: Internal server error
 */

app.get('/classes', (req, res) => {
  const { teacher_id } = req.query;

  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  const sql = `
    SELECT 
      c.id AS classId, 
      c.name AS className, 
      c.grade_level, 
      s.name AS schoolName
    FROM classes c
    JOIN schools s ON c.school_id = s.id
    JOIN class_teachers ct ON ct.class_id = c.id
    WHERE ct.teacher_id = ?
  `;

  db.all(sql, [teacher_id], (err, rows) => {
    if (err) {
      console.error('Error in /classes:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(rows);
  });
});
/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a class and assign it to a teacher
 *     tags:
 *       - Classes
 *     description: Creates a new class for a teacher by using their school automatically.
 *     parameters:
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the teacher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - grade_level
 *             properties:
 *               name:
 *                 type: string
 *                 example: Class 5B
 *               grade_level:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Class created and linked to teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 classId:
 *                   type: integer
 *                 schoolId:
 *                   type: integer
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Teacher does not belong to any school
 *       500:
 *         description: Server error
 */

app.post('/classes', (req, res) => {
  const { teacher_id } = req.query;
  const { name, grade_level } = req.body;

  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }
  if (!name || !grade_level) {
    return res.status(400).json({ error: 'name and grade_level are required in the body' });
  }

  // Step 1: Find school_id for this teacher
  const getSchoolSql = `
    SELECT c.school_id 
    FROM class_teachers ct
    JOIN classes c ON ct.class_id = c.id
    WHERE ct.teacher_id = ?
    LIMIT 1
  `;

  db.get(getSchoolSql, [teacher_id], (err, row) => {
    if (err) {
      console.error('Error fetching school_id:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'No school found for this teacher' });
    }

    const school_id = row.school_id;

    // Step 2: Insert the new class with this school_id
    const insertClassSql = `
      INSERT INTO classes (name, grade_level, school_id)
      VALUES (?, ?, ?)
    `;

    db.run(insertClassSql, [name, grade_level, school_id], function (err2) {
      if (err2) {
        console.error('Error inserting class:', err2);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const newClassId = this.lastID;

      // Step 3: Link new class to teacher
      const insertClassTeacherSql = `
        INSERT INTO class_teachers (class_id, teacher_id)
        VALUES (?, ?)
      `;

      db.run(insertClassTeacherSql, [newClassId, teacher_id], (err3) => {
        if (err3) {
          console.error('Error linking class to teacher:', err3);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(201).json({
          message: 'Class created and assigned to teacher successfully',
          classId: newClassId,
          schoolId: school_id
        });
      });
    });
  });
});
/**
 * @swagger
 * /classes/{classId}:
 *   put:
 *     summary: Update a class by a teacher
 *     tags:
 *       - Classes
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the class to update
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the teacher performing the update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - grade_level
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Class Name
 *               grade_level:
 *                 type: integer
 *                 example: 6
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required parameters
 *       403:
 *         description: Teacher does not have permission to update this class
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */

app.put('/classes/:classId', (req, res) => {
  const { teacher_id } = req.query;
  const { classId } = req.params;
  const { name, grade_level } = req.body;

  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }
  if (!name || !grade_level) {
    return res.status(400).json({ error: 'name and grade_level are required in the body' });
  }

  // Verify the class belongs to the teacher
  const verifySql = `
    SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?
  `;

  db.get(verifySql, [classId, teacher_id], (err, row) => {
    if (err) {
      console.error('Error verifying class ownership:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(403).json({ error: 'Teacher does not have permission to update this class' });
    }

    // Update the class details
    const updateSql = `
      UPDATE classes
      SET name = ?, grade_level = ?
      WHERE id = ?
    `;

    db.run(updateSql, [name, grade_level, classId], function (err2) {
      if (err2) {
        console.error('Error updating class:', err2);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Class not found' });
      }

      res.json({ message: 'Class updated successfully' });
    });
  });
});
/**
 * @swagger
 * /classes/{classId}:
 *   delete:
 *     summary: Delete a class by a teacher
 *     tags:
 *       - Classes
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the class to delete
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the teacher performing the delete
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: teacher_id query parameter is required
 *       403:
 *         description: Teacher does not have permission to delete this class
 *       404:
 *         description: Class not found
 *       500:
 *         description: Server error
 */

app.delete('/classes/:classId', (req, res) => {
  const { teacher_id } = req.query;
  const { classId } = req.params;

  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  // Verify the class belongs to the teacher
  const verifySql = `
    SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ?
  `;

  db.get(verifySql, [classId, teacher_id], (err, row) => {
    if (err) {
      console.error('Error verifying class ownership:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!row) {
      return res.status(403).json({ error: 'Teacher does not have permission to delete this class' });
    }

    // Delete the class_teachers link first (if your DB requires)
    const deleteLinkSql = `
      DELETE FROM class_teachers WHERE class_id = ? AND teacher_id = ?
    `;

    db.run(deleteLinkSql, [classId, teacher_id], (err2) => {
      if (err2) {
        console.error('Error deleting class-teacher link:', err2);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Delete the class itself
      const deleteClassSql = `
        DELETE FROM classes WHERE id = ?
      `;

      db.run(deleteClassSql, [classId], function (err3) {
        if (err3) {
          console.error('Error deleting class:', err3);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Class not found' });
        }

        res.json({ message: 'Class deleted successfully' });
      });
    });
  });
});
/**
 * @swagger
 * /classes/{id}/students:
 *   get:
 *     summary: Get students of a class with performance stats
 *     tags:
 *       - Classes
 *     description: Returns the list of students enrolled in a class if the requesting teacher owns the class.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *         example: 5
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher ID (used to verify class ownership)
 *         example: 12
 *     responses:
 *       200:
 *         description: List of students with their stats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 12
 *                   name:
 *                     type: string
 *                     example: Alice Johnson
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: alice@example.com
 *                   questionsAttempted:
 *                     type: integer
 *                     example: 42
 *                   average_accuracy:
 *                     type: number
 *                     format: float
 *                     example: 87.33
 *       400:
 *         description: Invalid class ID or teacher_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid class ID or teacher_id
 *       403:
 *         description: Access denied or class not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Class not found or access denied
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Server error verifying class
 *                 details:
 *                   type: string
 *                   example: Some error message
 */

app.get('/classes/:id/students', (req, res) => {
  const classId = parseInt(req.params.id, 10);
  const teacherId = parseInt(req.query.teacher_id, 10);

  if (isNaN(classId) || isNaN(teacherId)) {
    return res.status(400).json({ error: 'Invalid class ID or teacher_id' });
  }

  console.log('Verifying class ownership:', { classId, teacherId });

  const checkClassSql = `SELECT 1 FROM class_teachers WHERE class_id = ? AND teacher_id = ? LIMIT 1`;

  db.get(checkClassSql, [classId, teacherId], (err, row) => {
    if (err) {
      console.error('Error verifying class ownership:', err);
      return res.status(500).json({ error: 'Server error verifying class', details: err.message });
    }

    console.log('Ownership check result:', row);

    if (!row) {
      return res.status(403).json({ error: 'Class not found or access denied' });
    }

    const studentsSql = `
      SELECT u.id, u.name, u.email,
             COUNT(ga.id) AS questionsAttempted,
             ROUND(COALESCE(AVG(ga.score), 0), 2) AS average_accuracy
      FROM class_students cs
      JOIN users u ON cs.student_id = u.id
      LEFT JOIN student_game_attempts ga ON u.id = ga.student_id
      WHERE cs.class_id = ? AND u.role_id = 1
      GROUP BY u.id
    `;

    db.all(studentsSql, [classId], (err, students) => {
      if (err) {
        console.error('Error fetching students:', err);
        return res.status(500).json({ error: 'Server error fetching students', details: err.message });
      }
      res.json(students);
    });
  });
});

/**
 * @swagger
 * /classes/{id}/challenge-stats:
 *   get:
 *     summary: Get average accuracy, highest, and lowest scores for a specific class and teacher
 *     tags:
 *       - Classes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class ID
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Teacher ID
 *     responses:
 *       200:
 *         description: Challenge statistics for the class and teacher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 average_accuracy:
 *                   type: string
 *                 highest_score:
 *                   type: string
 *                 lowest_score:
 *                   type: string
 *       400:
 *         description: Missing teacher_id
 *       500:
 *         description: Internal server error
 */

app.get('/classes/:id/challenge-stats', (req, res) => {
  const classId = req.params.id;
  const teacherId = req.query.teacher_id;

  if (!teacherId) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  const sql = `
    SELECT 
      ROUND(AVG(sga.score), 2) AS average_accuracy,
      MAX(sga.score) AS highest_score,
      MIN(sga.score) AS lowest_score
    FROM assignments a
    JOIN student_game_attempts sga ON a.game_id = sga.game_id
    WHERE a.assigned_to_class = ?
      AND a.assigned_by = ?
  `;

  db.get(sql, [classId, teacherId], (err, row) => {
    if (err) {
      console.error('Error fetching challenge stats:', err.message);
      return res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
    }

    const response = {
      average_accuracy: row?.average_accuracy ? `${row.average_accuracy}%` : '0%',
      highest_score: row?.highest_score ? `${row.highest_score}%` : '0%',
      lowest_score: row?.lowest_score ? `${row.lowest_score}%` : '0%',
    };

    res.json(response);
  });
});






// http://localhost:3000/class/summary?class_id=4&teacher_id=4
// {
//     "total_students": 2,
//     "total_challenges": 0
// }

// Endpoint: Get class summary (student count + assignment count)
/**
 * @swagger
 * /class/summary:
 *   get:
 *     summary: Get class summary (students and challenges)
 *     tags:
 *       - Classes
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the class
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the teacher (for authorization)
 *     responses:
 *       200:
 *         description: Class summary with total students and challenges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_students:
 *                   type: integer
 *                 total_challenges:
 *                   type: integer
 *       400:
 *         description: Missing class_id or teacher_id
 *       403:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
app.get('/class/summary', async (req, res) => {
  try {
    const { class_id, teacher_id } = req.query;
    if (!class_id || !teacher_id) {
      return res.status(400).json({ error: 'class_id and teacher_id required' });
    }

    const authorized = await verifyTeacherAccess(class_id, teacher_id);
    if (!authorized) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const sql = `
      SELECT
        (SELECT COUNT(*) FROM class_students WHERE class_id = ?) AS total_students,
        (SELECT COUNT(*) FROM assignments WHERE assigned_to_class = ?) AS total_challenges
    `;

    const summary = await db.getAsync(sql, [class_id, class_id]);
    res.json(summary);
  } catch (err) {
    console.error('Error in /class/summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get accuracy trend - last 10 challenges
/**
 * @swagger
 * /class/accuracy-trend:
 *   get:
 *     summary: Get the average accuracy trend for the last 10 challenges
 *     tags:
 *       - Classes
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the class
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the teacher (for authorization)
 *     responses:
 *       200:
 *         description: List of recent challenges with average score
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Assignment ID
 *                   challenge_name:
 *                     type: string
 *                     description: Title of the challenge
 *                   average_score:
 *                     type: number
 *                     description: Average score (0-100)
 *       400:
 *         description: Missing class_id or teacher_id
 *       403:
 *         description: Unauthorized access
 *       500:
 *         description: Query failed or server error
 */
app.get('/class/accuracy-trend', (req, res) => {
  const { class_id, teacher_id } = req.query;
  if (!class_id || !teacher_id)
    return res.status(400).json({ error: 'class_id and teacher_id required' });

  verifyTeacherAccess(class_id, teacher_id, (authorized) => {
    if (!authorized) return res.status(403).json({ error: 'Unauthorized' });

    const sql = `
      SELECT a.id, g.title AS challenge_name, ROUND(AVG(cs.score), 0) AS average_score
      FROM assignments a
      JOIN games g ON g.id = a.game_id
      LEFT JOIN challenge_submissions cs ON cs.assignment_id = a.id
      WHERE a.assigned_to_class = ?
      GROUP BY a.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `;

    db.all(sql, [class_id], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Query failed' });
      res.json(rows);
    });
  });
});
// *********************** End classes*******************************************************


// -----------------------------CREATE QUESTIONS(POST,GET,UPDATE,DELETE)--------------------------------
/**
 * @swagger
 * /games:
 *   post:
 *     summary: Create a new game with image, questions, and assignment
 *     tags: [Games]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - subject_id
 *               - game_type_id
 *               - title
 *               - language
 *               - assigned_to_class
 *               - assigned_by
 *               - due_date
 *             properties:
 *               subject_id:
 *                 type: integer
 *               game_type_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               language:
 *                 type: string
 *               description:
 *                 type: string
 *               assigned_to_class:
 *                 type: integer
 *               assigned_by:
 *                 type: integer
 *               due_date:
 *                 type: string
 *                 format: date
 *               questions:
 *                 type: string
 *                 description: JSON string array of questions
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Game created successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
// Assuming you already have multer configured as `upload`
app.post('/games', upload.single('image'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('File:', req.file);

    const {
      subject_id,
      game_type_id,
      title,
      language,
      description = '',
      assigned_to_class,
      assigned_by,
      due_date,
      questions
    } = req.body;

    if (
      !subject_id || !game_type_id || !title || !language ||
      !assigned_by || !assigned_to_class || !due_date
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert to integers (assuming DB expects integers)
    const subjectId = parseInt(subject_id);
    const gameTypeId = parseInt(game_type_id);
    const assignedById = parseInt(assigned_by);
    const assignedToClassId = parseInt(assigned_to_class);

    if (
      isNaN(subjectId) || isNaN(gameTypeId) ||
      isNaN(assignedById) || isNaN(assignedToClassId)
    ) {
      return res.status(400).json({ error: 'ID fields must be valid numbers' });
    }

    let questionsArray = [];
    try {
      questionsArray = Array.isArray(questions) ? questions : JSON.parse(questions);
      if (!Array.isArray(questionsArray)) throw new Error();
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid questions format, must be an array' });
    }

    const imageFilename = req.file ? req.file.filename : null;

    console.log('Inserting game...');
    const gameResult = await dbRunWithRetry(
      `INSERT INTO games (subject_id, game_type_id, title, language, description, created_by, image) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [subjectId, gameTypeId, title, language, description, assignedById, imageFilename]
    );

    console.log('Game inserted, id:', gameResult.lastID);

    const game_id = gameResult.lastID;

    console.log('Inserting assignment...');
    await dbRunWithRetry(
      `INSERT INTO assignments (game_id, assigned_by, assigned_to_class, due_date) VALUES (?, ?, ?, ?)`,
      [game_id, assignedById, assignedToClassId, due_date]
    );

    console.log('Inserting questions...');
    for (const q of questionsArray) {
      if (!q.question_text || !q.correct_answer || !Array.isArray(q.options)) {
        console.warn('Skipping invalid question:', q);
        continue;
      }

      await dbRunWithRetry(
        `INSERT INTO questions (game_id, question_text, correct_answer, options) VALUES (?, ?, ?, ?)`,
        [game_id, q.question_text, q.correct_answer, JSON.stringify(q.options)]
      );
    }

    res.status(201).json({ message: 'Game created and assigned successfully', game_id, image: imageFilename });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});
/**
 * @swagger
 * /games/{id}:
 *   get:
 *     summary: Get a game by ID with questions and assignment
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Game ID
 *     responses:
 *       200:
 *         description: Game details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
app.get('/games/:id', async (req, res) => {
  const gameId = parseInt(req.params.id);
  if (isNaN(gameId)) return res.status(400).json({ error: 'Invalid game ID' });

  try {
    const game = await dbGet(`
      SELECT 
        g.id AS game_id,
        g.title,
        g.language,
        g.description,
        g.image,
        g.created_at,
        g.updated_at,
        s.name AS subject,
        u.name AS teacher,
        u.id AS teacher_id
      FROM games g
      LEFT JOIN subjects s ON g.subject_id = s.id
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ?
    `, [gameId]);

    if (!game) {
      console.log('Game not found for id:', gameId);
      return res.status(404).json({ message: 'Game not found' });
    }

    const assignment = await dbGet(`SELECT * FROM assignments WHERE game_id = ?`, [gameId]);
    const questions = await dbAll(`SELECT id, question_text, correct_answer, options FROM questions WHERE game_id = ?`, [gameId]);

    const formattedQuestions = questions.map(q => {
      try {
        return { ...q, options: JSON.parse(q.options) };
      } catch {
        return { ...q, options: [] };
      }
    });

    res.json({ ...game, assignment, questions: formattedQuestions });
  } catch (err) {
    console.error('Error fetching game details:', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
});

/**
 * @swagger
 * /teachers/{teacherId}/questions/count:
 *   get:
 *     summary: Get the total number of questions created by a specific teacher
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the teacher
 *     responses:
 *       200:
 *         description: Total questions count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teacher_id:
 *                   type: integer
 *                   example: 1
 *                 total_questions_created:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: Invalid teacher ID supplied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid teacher ID
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */
app.get('/teachers/:teacherId/questions/count', async (req, res) => {
  const teacherId = Number(req.params.teacherId);

  if (isNaN(teacherId)) {
    return res.status(400).json({ error: 'Invalid teacher ID' });
  }

  try {
    // Use the promisified dbGet here, NOT db.getAsync
    const result = await dbGet(`
      SELECT COUNT(q.id) AS total_questions_created
      FROM questions q
      JOIN games g ON q.game_id = g.id
      WHERE g.created_by = ?
    `, [teacherId]);

    res.json({ teacher_id: teacherId, total_questions_created: result?.total_questions_created || 0 });
  } catch (err) {
    console.error('❌ DB error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @swagger
 * /games/{id}:
 *   put:
 *     summary: Update an existing game with image, questions, and assignment
 *     tags: [Games]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - subject_id
 *               - game_type_id
 *               - title
 *               - language
 *               - assigned_to_class
 *               - assigned_by
 *               - due_date
 *               - questions
 *             properties:
 *               subject_id:
 *                 type: integer
 *               game_type_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               language:
 *                 type: string
 *               description:
 *                 type: string
 *               assigned_to_class:
 *                 type: integer
 *               assigned_by:
 *                 type: integer
 *               due_date:
 *                 type: string
 *                 format: date
 *               questions:
 *                 type: string
 *                 description: JSON string array of question objects
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional new image file to replace the existing one
 *     responses:
 *       200:
 *         description: Game updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game updated successfully with image
 *                 game_id:
 *                   type: integer
 *                   example: 14
 *                 image:
 *                   type: string
 *                   example: "updated-image.jpg"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Missing required fields
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */

app.put('/games/:id', upload.single('image'), async (req, res) => {
  const gameId = req.params.id;

  const {
    subject_id,
    game_type_id,
    title,
    language,
    description,
    assigned_to_class,
    assigned_by,
    due_date,
    questions
  } = req.body;

  if (
    !subject_id || !game_type_id || !title || !language ||
    !assigned_by || !assigned_to_class || !due_date
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let questionsArray = [];
  try {
    questionsArray = Array.isArray(questions) ? questions : JSON.parse(questions);
    if (!Array.isArray(questionsArray)) throw new Error();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid questions format, must be an array' });
  }

  try {
    // Fetch old image if exists
    const oldGame = await dbGet(`SELECT image FROM games WHERE id = ?`, [gameId]);
    const oldImage = oldGame?.image;

    // Handle new image (if any)
    const newImageFilename = req.file ? req.file.filename : oldImage;

    // Optional: delete old image if new one is uploaded
    if (req.file && oldImage) {
      const oldImagePath = path.join(__dirname, 'public', 'uploads', oldImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update the game
    await dbRunWithRetry(
      `UPDATE games 
       SET subject_id = ?, game_type_id = ?, title = ?, language = ?, description = ?, created_by = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [subject_id, game_type_id, title, language, description, assigned_by, newImageFilename, gameId]
    );

    // Update the assignment
    await dbRunWithRetry(
      `UPDATE assignments 
       SET assigned_by = ?, assigned_to_class = ?, due_date = ? 
       WHERE game_id = ?`,
      [assigned_by, assigned_to_class, due_date, gameId]
    );

    // Delete existing questions
    await dbRunWithRetry(`DELETE FROM questions WHERE game_id = ?`, [gameId]);

    // Insert new questions
    for (const q of questionsArray) {
      if (!q.question_text || !q.correct_answer || !Array.isArray(q.options)) {
        console.warn('Skipping invalid question:', q);
        continue;
      }

      await dbRunWithRetry(
        `INSERT INTO questions (game_id, question_text, correct_answer, options) VALUES (?, ?, ?, ?)`,
        [gameId, q.question_text, q.correct_answer, JSON.stringify(q.options)]
      );
    }

    res.json({ message: 'Game updated successfully with image', game_id: gameId, image: newImageFilename });

  } catch (err) {
    console.error('Error updating game with image:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});
/**
 * @swagger
 * /games/{id}:
 *   delete:
 *     summary: Delete a game by ID, including its image, questions, and assignment
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game to delete
 *     responses:
 *       200:
 *         description: Game and related data deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game and related data deleted successfully
 *                 game_id:
 *                   type: integer
 *                   example: 14
 *       400:
 *         description: Invalid game ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid game ID
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Game not found
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 */
app.delete('/games/:id', async (req, res) => {
  const gameId = Number(req.params.id);

  if (!Number.isInteger(gameId)) {
    return res.status(400).json({ error: 'Invalid game ID' });
  }

  try {
    // Get the image filename to delete later
    const game = await dbGet(`SELECT image FROM games WHERE id = ?`, [gameId]);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const imageFilename = game.image;

    // Delete related questions
    await dbRunWithRetry(`DELETE FROM questions WHERE game_id = ?`, [gameId]);

    // Delete related assignment
    await dbRunWithRetry(`DELETE FROM assignments WHERE game_id = ?`, [gameId]);

    // Delete the game
    const result = await dbRunWithRetry(`DELETE FROM games WHERE id = ?`, [gameId]);

    // Delete image file if exists
    if (imageFilename) {
      const imagePath = path.join(__dirname, 'public', 'uploads', imageFilename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(200).json({ message: 'Game and related data deleted successfully', game_id: gameId });
  } catch (err) {
    console.error('❌ Error deleting game:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});
// ----------------------------------------END CREATE QUESTIONS------------------------------------------------------


/** ======================= SCHOOL MANAGEMENT ======================= **/
/**
 * @swagger
 * /schools:
 *   get:
 *     summary: Get all schools
 *     tags:
 *       - Schools
 *     responses:
 *       200:
 *         description: A list of schools
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Springfield Elementary
 *                   address:
 *                     type: string
 *                     example: 742 Evergreen Terrace
 *       500:
 *         description: Error fetching schools
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error fetching schools
 */

app.get('/schools', async (req, res) => {
  try {
    const schools = await db.allAsync('SELECT * FROM schools');
    res.json(schools);
  } catch (err) {
    console.error('Error fetching schools:', err);
    res.status(500).json({ error: 'Error fetching schools' });
  }
});

/**
 * @swagger
 * /add-school:
 *   post:
 *     summary: Add a new school
 *     tags:
 *       - Schools
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Springfield Elementary
 *               address:
 *                 type: string
 *                 example: 742 Evergreen Terrace
 *     responses:
 *       200:
 *         description: School added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School added successfully!
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: School name and address are required
 *       500:
 *         description: Error adding school
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error adding school
 */
app.post('/add-school', async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'School name and address are required' });
  }

  try {
    await db.runAsync('INSERT INTO schools (name, address) VALUES (?, ?)', [name.trim(), address.trim()]);
    res.json({ message: 'School added successfully!' });
  } catch (err) {
    console.error('Error adding school:', err);
    res.status(500).json({ error: 'Error adding school' });
  }
});

/**
 * @swagger
 * /update-school/{id}:
 *   put:
 *     summary: Update a school's details by ID
 *     tags:
 *       - Schools
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: School ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Springfield Elementary
 *               address:
 *                 type: string
 *                 example: 742 Evergreen Terrace
 *     responses:
 *       200:
 *         description: School updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School updated successfully!
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Name and address are required
 *       404:
 *         description: School not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: School not found
 *       500:
 *         description: Error updating school
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error updating school
 */
app.put('/update-school/:id', (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Name and address are required' });
  }

  const sql = 'UPDATE schools SET name = ?, address = ? WHERE id = ?';

  db.run(sql, [name.trim(), address.trim(), id], function (err) {
    if (err) {
      console.error('Error updating school:', err.message);
      return res.status(500).json({ error: 'Error updating school' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ message: 'School updated successfully!' });
  });
});

/**
 * @swagger
 * /delete-school/{id}:
 *   delete:
 *     summary: Delete a school by ID
 *     tags:
 *       - Schools
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: School ID to delete
 *     responses:
 *       200:
 *         description: School deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School deleted successfully!
 *       404:
 *         description: School not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: School not found
 *       500:
 *         description: Error deleting school
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error deleting school
 */

app.delete('/delete-school/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM schools WHERE id = ?';

  db.run(sql, [id], function (err) {
    if (err) {
      console.error('Error deleting school:', err.message);
      return res.status(500).json({ error: 'Error deleting school' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ message: 'School deleted successfully!' });
  });
});

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Retrieve all roles
 *     tags: 
 *       - Roles
 *     responses:
 *       200:
 *         description: List of all roles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Teacher
 *       500:
 *         description: Error fetching roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error fetching roles
 */

app.get('/roles', (req, res) => {
  const sql = 'SELECT * FROM roles';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error fetching roles' });
    res.json(rows);
  });
});

// POST add role (SQLite)
/**
 * @swagger
 * /add-role:
 *   post:
 *     summary: Add a new role
 *     tags: 
 *       - Roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name to add
 *                 example: Teacher
 *     responses:
 *       200:
 *         description: Role added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role added successfully!
 *                 id:
 *                   type: integer
 *                   description: ID of the newly created role
 *       400:
 *         description: Role name is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Role name is required
 *       500:
 *         description: Error adding role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error adding role
 */

app.post('/add-role', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Role name is required' });

  const sql = 'INSERT INTO roles (name) VALUES (?)';
  db.run(sql, [name.trim()], function (err) {
    if (err) return res.status(500).json({ error: 'Error adding role' });
    res.json({ message: 'Role added successfully!', id: this.lastID });
  });
});

/**
 * @swagger
 * /update-role/{id}:
 *   put:
 *     summary: Update a role by ID
 *     tags: 
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: New role name
 *                 example: Administrator
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role updated successfully!
 *       400:
 *         description: Missing role name in request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Role name is required
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Role not found
 *       500:
 *         description: Error updating role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error updating role
 */

app.put('/update-role/:id', (req, res) => {
  const roleId = req.params.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Role name is required' });

  const sql = 'UPDATE roles SET name = ? WHERE id = ?';
  db.run(sql, [name.trim(), roleId], function (err) {
    if (err) return res.status(500).json({ error: 'Error updating role' });
    if (this.changes === 0) return res.status(404).json({ error: 'Role not found' });
    res.json({ message: 'Role updated successfully!' });
  });
});

/**
 * @swagger
 * /delete-role/{id}:
 *   delete:
 *     summary: Delete a role by ID
 *     tags: 
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID to delete
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Role deleted successfully!
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Role not found
 *       500:
 *         description: Error deleting role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error deleting role
 */

app.delete('/delete-role/:id', (req, res) => {
  const roleId = req.params.id;
  const sql = 'DELETE FROM roles WHERE id = ?';

  db.run(sql, [roleId], function (err) {
    if (err) return res.status(500).json({ error: 'Error deleting role' });
    if (this.changes === 0) return res.status(404).json({ error: 'Role not found' });
    res.json({ message: 'Role deleted successfully!' });
  });
});


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   email_verified_at:
 *                     type: string
 *                     format: date-time
 *                   role_id:
 *                     type: integer
 *                   role_name:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   updated_at:
 *                     type: string
 *                     format: date-time
 *                   image:
 *                     type: string
 *                   language:
 *                     type: string
 *                   username:
 *                     type: string
 */
app.get('/users', (req, res) => {
  const sql = `
    SELECT 
      users.name, 
      users.email, 
      users.email_verified_at, 
      users.role_id, 
      users.created_at, 
      users.updated_at, 
      users.image, 
      users.language, 
      users.username, 
      roles.name AS role_name
    FROM users
    JOIN roles ON users.role_id = roles.id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❌ Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user details by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the user to get
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 email_verified_at:
 *                   type: string
 *                   format: date-time
 *                 role_id:
 *                   type: integer
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 image:
 *                   type: string
 *                 language:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role_name:
 *                   type: string
 *       404:
 *         description: User not found
 */
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      users.name, 
      users.email, 
      users.email_verified_at, 
      users.role_id, 
      users.created_at, 
      users.updated_at, 
      users.image, 
      users.language, 
      users.username, 
      roles.name AS role_name
    FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = ?
  `;

  db.get(sql, [userId], (err, row) => {  // Use db.get for a single row
    if (err) {
      console.error('❌ Database error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(row);
  });
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role_id
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               username:
 *                 type: string
 *               language:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: integer
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Database insert error
 */
app.post('/users', upload.single('image'), async (req, res) => {
  try {
    const { name, email, password, role_id, username, language } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    // Cloudinary upload URL is in req.file.path
    const imageUrl = req.file ? req.file.path : null;

    const sql = `
      INSERT INTO users (name, email, password, username, language, role_id, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // ✅ Declare params once
    const params = [
      name,
      email,
      hashedPassword,
      username || null,
      language || null,
      role_id,
      imageUrl,
    ];

    // ✅ Use params here instead of rewriting
    const result = await dbRunWithRetry(sql, params);

    res.status(201).json({ message: 'User created', userId: result.lastID, image: imageUrl });
  } catch (err) {
    console.error('❌ Error inserting user:', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Database insert error' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update an existing user
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: User ID to update
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               username:
 *                 type: string
 *               language:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       503:
 *         description: Database busy error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Database update error
 */
app.put('/users/:id', upload.single('image'), async (req, res) => {
  const userId = req.params.id;
  try {
    const { name, email, password, role_id, username, language } = req.body;

    // Build the update query dynamically, depending on which fields are provided
    const fields = [];
    const params = [];

    if (name) {
      fields.push('name = ?');
      params.push(name);
    }
    if (email) {
      fields.push('email = ?');
      params.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      params.push(hashedPassword);
    }
    if (username !== undefined) {
      fields.push('username = ?');
      params.push(username || null);
    }
    if (language !== undefined) {
      fields.push('language = ?');
      params.push(language || null);
    }
    if (role_id) {
      fields.push('role_id = ?');
      params.push(role_id);
    }
    if (req.file) {
      const imagePath = `/uploads/${req.file.filename}`;
      fields.push('image = ?');
      params.push(imagePath);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update' });
    }

    // Always update updated_at timestamp
    fields.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
    `;
    params.push(userId);

    const result = await dbRunWithRetry(sql, params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (err.message === 'DB is locked, retries exceeded') {
      return res.status(503).json({ error: 'Database is busy, please try again' });
    }
    res.status(500).json({ error: 'Database update error' });
  }
});
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the user to delete
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       503:
 *         description: Database is busy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Database is busy, please try again
 *       500:
 *         description: Database delete error
 */
app.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const sql = `DELETE FROM users WHERE id = ?`;
    const result = await dbRunWithRetry(sql, [userId]);

    if (result.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    if (err.code === 'SQLITE_BUSY') {
      return res.status(503).json({ error: 'Database is busy, please try again' });
    }
    res.status(500).json({ error: 'Database delete error' });
  }
});


/**
 * @swagger
 * /grade-levels:
 *   get:
 *     summary: Get distinct grade levels of classes taught by a specific teacher
 *     tags:
 *       - Default
 *     parameters:
 *       - in: query
 *         name: teacher_id
 *         required: true
 *         description: ID of the teacher
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: List of grade levels formatted as "Class {grade_level}"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: Class 5
 *       400:
 *         description: Missing teacher_id query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: teacher_id query parameter is required
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal error
 */
app.get('/grade-levels', (req, res) => {
  const teacherId = req.query.teacher_id;

  if (!teacherId) {
    return res.status(400).json({ error: 'teacher_id query parameter is required' });
  }

  // Query to get distinct grade levels of classes taught by the teacher
  const sql = `
    SELECT DISTINCT c.grade_level 
    FROM classes c
    JOIN class_teachers ct ON c.id = ct.class_id
    WHERE ct.teacher_id = ?
    ORDER BY c.grade_level
  `;

  db.all(sql, [teacherId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Internal error' });

    // Map numeric grade_level to "Class {grade_level}"
    const result = rows.map(r => `Class ${r.grade_level}`);

    res.json(result);
  });
});

// -------------------------------------CODE RUNNING CODE --------------------------------------------------
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
  console.log(`📘 Swagger docs available at http://localhost:${port}/api-docs`);
});

// -------------------------------------END CODE RUNNING CODE ----------------------------------------------

































































































































