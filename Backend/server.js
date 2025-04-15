// server.js - Main entry point for the backend

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseId = req.params.courseId;
    const dir = `./uploads/courses/${courseId}`;
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Initialize database
async function initializeDatabase() {
  const db = await open({
    filename: './university.db',
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    -- Drop existing tables if they exist
    DROP TABLE IF EXISTS course_materials;
    DROP TABLE IF EXISTS grades;
    DROP TABLE IF EXISTS enrollments;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS instructors;
    DROP TABLE IF EXISTS majors;
    
    -- Create tables based on the new schema
    CREATE TABLE IF NOT EXISTS instructors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS majors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      major_id INTEGER NOT NULL,
      graduating_year INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prefix TEXT NOT NULL,
      number INTEGER NOT NULL,
      section INTEGER NOT NULL,
      title TEXT NOT NULL,
      classroom TEXT NOT NULL,
      start_time TEXT NOT NULL,
      instructor_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(prefix, number, section),
      FOREIGN KEY (instructor_id) REFERENCES instructors(id)
    );
    
    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id),
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      quiz1 REAL DEFAULT 0,
      quiz2 REAL DEFAULT 0,
      project1 REAL DEFAULT 0,
      project2 REAL DEFAULT 0,
      final_exam REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS course_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);

  // Check if there are any instructors in the database
  const instructorCount = await db.get('SELECT COUNT(*) as count FROM instructors');
  
  // If no instructors exist, create a default admin account
  if (instructorCount.count === 0) {
    const hashedPassword = await bcrypt.hash('ADMIN', 10);
    await db.run(
      'INSERT INTO instructors (username, password) VALUES (?, ?)',
      ['ADMIN', hashedPassword]
    );
    console.log('Default admin account created');
  }

  // Initialize majors from the provided schema
  await db.run(`
    INSERT INTO majors (name) VALUES 
    ('Computer Science and Innovation'),
    ('Data Science'),
    ('Cybersecurity'),
    ('Digital Forensics')
  `);
  console.log('Majors initialized');

  return db;
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Start the server
let db;
(async () => {
  try {
    db = await initializeDatabase();
    console.log('Database initialized');

    // Routes
    
    // Instructor authentication routes
    app.post('/api/instructors/register', async (req, res) => {
      try {
        const { username, password } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.run(
          'INSERT INTO instructors (username, password) VALUES (?, ?)',
          [username, hashedPassword]
        );
        
        res.status(201).json({ message: 'Instructor registered successfully' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post('/api/instructors/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        
        const instructor = await db.get('SELECT * FROM instructors WHERE username = ?', [username]);
        
        if (!instructor) {
          return res.status(400).json({ message: 'Invalid username or password' });
        }
        
        const validPassword = await bcrypt.compare(password, instructor.password);
        
        if (!validPassword) {
          return res.status(400).json({ message: 'Invalid username or password' });
        }
        
        const token = jwt.sign({ id: instructor.id, username }, JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token, instructor: { id: instructor.id, username } });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Course routes
    app.post('/api/courses', authenticateToken, async (req, res) => {
      try {
        const { prefix, number, section, title, classroom, startTime } = req.body;
        const instructorId = req.user.id;
        
        const result = await db.run(
          'INSERT INTO courses (prefix, number, section, title, classroom, start_time, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [prefix, number, section, title, classroom, startTime, instructorId]
        );
        
        res.status(201).json({ 
          id: result.lastID,
          prefix,
          number,
          section,
          title,
          classroom,
          startTime,
          instructorId
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/courses', async (req, res) => {
      try {
        const courses = await db.all(`
          SELECT c.*, i.first_name || ' ' || i.last_name as instructor_name
          FROM courses c
          LEFT JOIN instructors i ON c.instructor_id = i.id
        `);
        
        res.json(courses);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/courses/:id', async (req, res) => {
      try {
        const course = await db.get(`
          SELECT c.*, i.first_name || ' ' || i.last_name as instructor_name
          FROM courses c
          LEFT JOIN instructors i ON c.instructor_id = i.id
          WHERE c.id = ?
        `, [req.params.id]);
        
        if (!course) {
          return res.status(404).json({ message: 'Course not found' });
        }
        
        res.json(course);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Student routes
    app.post('/api/students', authenticateToken, async (req, res) => {
      try {
        const { firstName, lastName, email, majorId, graduatingYear } = req.body;
        
        const result = await db.run(
          'INSERT INTO students (first_name, last_name, email, major_id, graduating_year) VALUES (?, ?, ?, ?, ?)',
          [firstName, lastName, email, majorId, graduatingYear]
        );
        
        res.status(201).json({ 
          id: result.lastID,
          firstName,
          lastName,
          email,
          majorId,
          graduatingYear
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/students', authenticateToken, async (req, res) => {
      try {
        const students = await db.all(`
          SELECT s.*, m.name as major_name 
          FROM students s
          JOIN majors m ON s.major_id = m.id
        `);
        res.json(students);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });
    
    // Get major list
    app.get('/api/majors', async (req, res) => {
      try {
        const majors = await db.all('SELECT * FROM majors');
        res.json(majors);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Enrollment routes
    app.post('/api/enrollments', authenticateToken, async (req, res) => {
      try {
        const { studentId, courseId } = req.body;
        
        // Check if student is already enrolled in a course with the same prefix and number but different section
        const course = await db.get('SELECT prefix, number, section FROM courses WHERE id = ?', [courseId]);
        
        const enrolledInSimilarCourse = await db.get(`
          SELECT e.id 
          FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE e.student_id = ? AND c.prefix = ? AND c.number = ? AND c.section != ?
        `, [studentId, course.prefix, course.number, course.section]);
        
        if (enrolledInSimilarCourse) {
          return res.status(400).json({ 
            message: `Student already enrolled in ${course.prefix}-${course.number} with a different section` 
          });
        }
        
        // Add the enrollment
        const result = await db.run(
          'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
          [studentId, courseId]
        );
        
        // Create grade record
        await db.run(
          'INSERT INTO grades (student_id, course_id) VALUES (?, ?)',
          [studentId, courseId]
        );
        
        res.status(201).json({ 
          id: result.lastID,
          studentId,
          courseId
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/courses/:courseId/students', authenticateToken, async (req, res) => {
      try {
        const { courseId } = req.params;
        
        const students = await db.all(`
          SELECT s.*, g.quiz1, g.quiz2, g.project1, g.project2, g.final_exam
          FROM students s
          JOIN enrollments e ON s.id = e.student_id
          LEFT JOIN grades g ON e.student_id = g.student_id AND e.course_id = g.course_id
          WHERE e.course_id = ?
        `, [courseId]);
        
        res.json(students);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/students/:studentId/courses', authenticateToken, async (req, res) => {
      try {
        const { studentId } = req.params;
        
        const courses = await db.all(`
          SELECT c.*, g.quiz1, g.quiz2, g.project1, g.project2, g.final_exam
          FROM courses c
          JOIN enrollments e ON c.id = e.course_id
          LEFT JOIN grades g ON e.student_id = g.student_id AND e.course_id = g.course_id
          WHERE e.student_id = ?
        `, [studentId]);
        
        res.json(courses);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Grades routes
    app.put('/api/grades/:studentId/:courseId', authenticateToken, async (req, res) => {
      try {
        const { studentId, courseId } = req.params;
        const { quiz1, quiz2, project1, project2, finalExam } = req.body;
        
        // Check if grade record exists
        const existingGrade = await db.get(
          'SELECT * FROM grades WHERE student_id = ? AND course_id = ?', 
          [studentId, courseId]
        );
        
        if (!existingGrade) {
          // Create new grade record if it doesn't exist
          await db.run(
            'INSERT INTO grades (student_id, course_id, quiz1, quiz2, project1, project2, final_exam) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [studentId, courseId, quiz1, quiz2, project1, project2, finalExam]
          );
        } else {
          // Update existing grade record
          await db.run(
            'UPDATE grades SET quiz1 = ?, quiz2 = ?, project1 = ?, project2 = ?, final_exam = ? WHERE student_id = ? AND course_id = ?',
            [quiz1, quiz2, project1, project2, finalExam, studentId, courseId]
          );
        }
        
        const updatedGrade = await db.get(
          'SELECT * FROM grades WHERE student_id = ? AND course_id = ?', 
          [studentId, courseId]
        );
        
        res.json(updatedGrade);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Course materials routes
    app.post('/api/courses/:courseId/materials', authenticateToken, upload.single('file'), async (req, res) => {
      try {
        const { courseId } = req.params;
        
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const result = await db.run(
          'INSERT INTO course_materials (course_id, file_name, file_path) VALUES (?, ?, ?)',
          [courseId, req.file.originalname, req.file.path]
        );
        
        res.status(201).json({
          id: result.lastID,
          courseId,
          fileName: req.file.originalname,
          filePath: req.file.path
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/courses/:courseId/materials', authenticateToken, async (req, res) => {
      try {
        const { courseId } = req.params;
        
        const materials = await db.all('SELECT * FROM course_materials WHERE course_id = ?', [courseId]);
        
        res.json(materials);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error initializing the database:', error);
  }
})();

module.exports = app;