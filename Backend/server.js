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

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Make sure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

// Configure multer for file uploads with improved configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseId = req.params.courseId;
    const dir = `./uploads/courses/${courseId}`;
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename by adding a timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Get the original file extension
    const ext = path.extname(file.originalname);
    // Create the filename: original name + timestamp + extension
    cb(null, file.originalname.replace(ext, '') + '-' + uniqueSuffix + ext);
  }
});

// File filter function to allow only certain file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedFileTypes = [
    'application/pdf', // PDF
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-powerpoint', // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/vnd.ms-excel', // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/zip', // ZIP
    'application/x-rar-compressed', // RAR
    'image/jpeg', // JPG/JPEG
    'image/png', // PNG
    'image/gif', // GIF
    'text/plain' // TXT
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file
    cb(new Error('File type not allowed. Please upload a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, or image file.'), false);
  }
};

// Create the multer upload middleware with file size limit (e.g., 10MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Add middleware to handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Initialize database
async function initializeDatabase() {
  const db = await open({
    filename: './university.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    DROP TABLE IF EXISTS course_materials;
    DROP TABLE IF EXISTS grades;
    DROP TABLE IF EXISTS enrollments;
    DROP TABLE IF EXISTS students;
    DROP TABLE IF EXISTS courses;
    DROP TABLE IF EXISTS majors;

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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(prefix, number, section)
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

  // Preload some courses if the courses table is empty
  const courseCount = await db.get('SELECT COUNT(*) as count FROM courses');
  if (courseCount.count === 0) {
    const predefinedCourses = [
      { prefix: 'CSI', number: 300, section: '01', title: 'Database Management Systems', classroom: 'Joyce 201', start_time: '10:00:00' },
      { prefix: 'CSI', number: 300, section: '02', title: 'Database Management Systems', classroom: 'Joyce 201', start_time: '11:30:00' },
      { prefix: 'DAT', number: 210, section: '01', title: 'Data Analytics', classroom: 'Joyce 210', start_time: '10:00:00' },
      { prefix: 'DAT', number: 410, section: '01', title: 'Machine Learning', classroom: 'Joyce 210', start_time: '11:30:00' }
    ];
    const insertCourses = predefinedCourses.map(course =>
      db.run(
        'INSERT INTO courses (prefix, number, section, title, classroom, start_time) VALUES (?, ?, ?, ?, ?, ?)',
        [course.prefix, course.number, course.section, course.title, course.classroom, course.start_time]
      )
    );
    await Promise.all(insertCourses);
    console.log('Default courses have been initialized');
  }

  await db.run(`
    INSERT INTO majors (name) VALUES 
    ('Computer Science and Innovation'),
    ('Data Science'),
    ('Cybersecurity'),
    ('Digital Forensics')
  `);
  console.log('Majors initialized');

  // Create grades records for existing enrollments
  const existingEnrollments = await db.all('SELECT student_id, course_id FROM enrollments');
  for (const enrollment of existingEnrollments) {
    const gradeExists = await db.get(
      'SELECT * FROM grades WHERE student_id = ? AND course_id = ?',
      [enrollment.student_id, enrollment.course_id]
    );
    
    if (!gradeExists) {
      await db.run(
        `INSERT INTO grades (student_id, course_id, quiz1, quiz2, project1, project2, final_exam)
         VALUES (?, ?, 0, 0, 0, 0, 0)`,
        [enrollment.student_id, enrollment.course_id]
      );
      console.log(`Created grade record for student ${enrollment.student_id} in course ${enrollment.course_id}`);
    }
  }

  return db;
}

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

let db;
(async () => {
  try {
    db = await initializeDatabase();
    console.log('Database initialized');

    // Routes
    app.post('/api/instructors/register', async (req, res) => {
      try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO instructors (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'Instructor registered successfully' });
      } catch (error) {
        console.error('Error registering instructor:', error.message);
        res.status(500).json({ message: error.message });
      }
    });

    app.post('/api/instructors/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const instructor = await db.get('SELECT * FROM instructors WHERE username = ?', [username]);
        if (!instructor) return res.status(400).json({ message: 'Invalid username or password' });

        const validPassword = await bcrypt.compare(password, instructor.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid username or password' });

        const token = jwt.sign({ id: instructor.id, username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, instructor: { id: instructor.id, username } });
      } catch (error) {
        console.error('Error logging in instructor:', error.message);
        res.status(500).json({ message: error.message });
      }
    });

    app.get('/api/courses', async (req, res) => {
      try {
        const courses = await db.all('SELECT * FROM courses');
        if (courses.length === 0) {
          return res.status(200).json({ message: 'No courses available' });
        }
        res.json(courses);
      } catch (error) {
        console.error('Error fetching courses:', error.message);
        res.status(500).json({ message: 'Error fetching courses from the database' });
      }
    });

    app.get('/api/courses/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [id]);
    
        if (!course) {
          return res.status(404).json({ message: 'Course not found' });
        }
    
        res.json(course);
      } catch (error) {
        console.error('Error fetching course details:', error.message);
        res.status(500).json({ message: 'Error fetching course details' });
      }
    });    

    app.get('/api/courses/:courseId/students', async (req, res) => {
      const { courseId } = req.params;
      try {
        const students = await db.all(`
          SELECT s.id, s.first_name, s.last_name, s.email, 
                 g.quiz1, g.quiz2, g.project1, g.project2, g.final_exam
          FROM students s
          JOIN enrollments e ON s.id = e.student_id
          LEFT JOIN grades g ON s.id = g.student_id AND e.course_id = g.course_id
          WHERE e.course_id = ?`, [courseId]);

        if (!students || students.length === 0) {
          return res.status(404).json({ message: 'No students enrolled in this course' });
        }
        res.json(students);
      } catch (error) {
        console.error('Error fetching enrolled students:', error.message);
        res.status(500).json({ message: 'Error fetching enrolled students' });
      }
    });

    // Updated enrollment endpoint that creates grades record
    app.post('/api/enrollments', authenticateToken, async (req, res) => {
      const { studentId, courseId } = req.body;
      if (!studentId || !courseId) return res.status(400).json({ message: 'Student ID and Course ID are required' });

      try {
        // Begin transaction
        await db.run('BEGIN TRANSACTION');

        const existingEnrollment = await db.get(
          'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
          [studentId, courseId]
        );
        if (existingEnrollment) {
          await db.run('ROLLBACK');
          return res.status(400).json({ message: 'Student is already enrolled in this course' });
        }

        // Check if student is already enrolled in another section of the same course
        const selectedCourse = await db.get('SELECT prefix, number FROM courses WHERE id = ?', [courseId]);
        if (selectedCourse) {
          const enrolledInSameCourse = await db.get(`
            SELECT e.id 
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.student_id = ? 
            AND c.prefix = ? 
            AND c.number = ?
          `, [studentId, selectedCourse.prefix, selectedCourse.number]);

          if (enrolledInSameCourse) {
            await db.run('ROLLBACK');
            return res.status(400).json({ 
              message: `Student is already enrolled in another section of ${selectedCourse.prefix}-${selectedCourse.number}` 
            });
          }
        }

        // Create enrollment record
        await db.run('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)', [studentId, courseId]);
        
        // Check if grades record exists
        const existingGrades = await db.get(
          'SELECT * FROM grades WHERE student_id = ? AND course_id = ?',
          [studentId, courseId]
        );
        
        // If no grades record exists, create one
        if (!existingGrades) {
          await db.run(
            `INSERT INTO grades (student_id, course_id, quiz1, quiz2, project1, project2, final_exam)
             VALUES (?, ?, 0, 0, 0, 0, 0)`,
            [studentId, courseId]
          );
        }
        
        // Commit transaction
        await db.run('COMMIT');
        
        res.status(201).json({ message: 'Enrollment successful' });
      } catch (error) {
        // Rollback on error
        await db.run('ROLLBACK');
        console.error('Error enrolling student:', error.message);
        res.status(500).json({ message: error.message });
      }
    });

    // Get All Majors
    app.get('/api/majors', async (req, res) => {
      try {
        const majors = await db.all('SELECT * FROM majors');
        if (majors.length === 0) {
          return res.status(200).json({ message: 'No majors available' });
        }
        res.json(majors);
      } catch (error) {
        console.error('Error fetching majors:', error.message);
        res.status(500).json({ message: 'Failed to fetch majors' });
      }
    });

    app.post('/api/students', async (req, res) => {
      try {
        const { first_name, last_name, email, major_id, graduating_year } = req.body;
    
        // Basic validation
        if (!first_name || !last_name || !email || !major_id || !graduating_year) {
          return res.status(400).json({ message: 'All fields are required.' });
        }
    
        const result = await db.run(
          `INSERT INTO students (first_name, last_name, email, major_id, graduating_year)
           VALUES (?, ?, ?, ?, ?)`,
          [first_name, last_name, email, major_id, graduating_year]
        );
    
        const newStudent = {
          id: result.lastID,
          first_name,
          last_name,
          email,
          major_id,
          graduating_year
        };
    
        res.status(201).json(newStudent);
      } catch (error) {
        console.error('🔥 Error adding student:', error);
        res.status(500).json({ message: error.message });
      }
    });
    
    app.get('/api/students', async (req, res) => {
      try {
        const students = await db.all(`
          SELECT students.*, majors.name AS major_name
          FROM students
          JOIN majors ON students.major_id = majors.id
        `);
        res.json(students);
      } catch (error) {
        console.error('🔥 Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students' });
      }
    });
    
    app.get('/api/students/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const student = await db.get(`
          SELECT students.*, majors.name AS major_name
          FROM students
          JOIN majors ON students.major_id = majors.id
          WHERE students.id = ?
        `, [id]);
    
        if (!student) {
          return res.status(404).json({ message: 'Student not found' });
        }
    
        res.json(student);
      } catch (error) {
        console.error('Error fetching student data:', error.message);
        res.status(500).json({ message: 'Error fetching student data' });
      }
    });

    app.get('/api/students/:id/courses', async (req, res) => {
      const { id } = req.params;
      try {
        const courses = await db.all(`
          SELECT 
            courses.id, 
            courses.prefix, 
            courses.number, 
            courses.section, 
            courses.title, 
            courses.classroom, 
            courses.start_time,
            grades.quiz1,
            grades.quiz2,
            grades.project1,
            grades.project2,
            grades.final_exam
          FROM courses
          JOIN enrollments ON courses.id = enrollments.course_id
          LEFT JOIN grades ON enrollments.course_id = grades.course_id 
                           AND enrollments.student_id = grades.student_id
          WHERE enrollments.student_id = ?
        `, [id]);
    
        res.json(courses);
      } catch (error) {
        console.error('Error fetching courses for student:', error.message);
        res.status(500).json({ message: 'Error fetching courses for student' });
      }
    });
    
    // Updated PUT endpoint for grades
    app.put('/api/grades/:studentId/:courseId', async (req, res) => {
      console.log('PUT request received for grades update');
      const { studentId, courseId } = req.params;
      const { quiz1, quiz2, project1, project2, final_exam } = req.body;

      try {
        // Check if grade record exists
        const gradeExists = await db.get(
          'SELECT * FROM grades WHERE student_id = ? AND course_id = ?',
          [studentId, courseId]
        );

        if (!gradeExists) {
          // If record doesn't exist, insert a new one
          console.log('Creating new grade record for student', studentId, 'in course', courseId);
          await db.run(
            `INSERT INTO grades (student_id, course_id, quiz1, quiz2, project1, project2, final_exam)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, courseId, quiz1 || 0, quiz2 || 0, project1 || 0, project2 || 0, final_exam || 0]
          );
          return res.json({ message: 'Grades created successfully' });
        }

        // If record exists, update it
        const result = await db.run(
          `UPDATE grades
           SET quiz1 = ?, quiz2 = ?, project1 = ?, project2 = ?, final_exam = ?
           WHERE student_id = ? AND course_id = ?`,
          [quiz1 || 0, quiz2 || 0, project1 || 0, project2 || 0, final_exam || 0, studentId, courseId]
        );

        res.json({ message: 'Grades updated successfully' });
      } catch (error) {
        console.error('Error updating grades:', error.message);
        res.status(500).json({ message: 'Error updating grades' });
      }
    });
    
    // New POST endpoint for grades
    app.post('/api/grades', async (req, res) => {
      const { student_id, course_id, quiz1, quiz2, project1, project2, final_exam } = req.body;

      if (!student_id || !course_id) {
        return res.status(400).json({ message: 'Student ID and Course ID are required' });
      }

      try {
        // Check if a grade record already exists
        const existingGrade = await db.get(
          'SELECT * FROM grades WHERE student_id = ? AND course_id = ?',
          [student_id, course_id]
        );

        if (existingGrade) {
          return res.status(400).json({ message: 'Grade record already exists for this student and course' });
        }

        // Insert new grade record
        await db.run(
          `INSERT INTO grades (student_id, course_id, quiz1, quiz2, project1, project2, final_exam)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [student_id, course_id, quiz1 || 0, quiz2 || 0, project1 || 0, project2 || 0, final_exam || 0]
        );

        res.status(201).json({ message: 'Grades created successfully' });
      } catch (error) {
        console.error('Error creating grades:', error.message);
        res.status(500).json({ message: 'Error creating grades' });
      }
    });

    // NEW ENDPOINTS FOR COURSE MATERIALS

    // Get course materials
    app.get('/api/courses/:courseId/materials', async (req, res) => {
      const { courseId } = req.params;
      
      try {
        // Check if course exists
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) {
          return res.status(404).json({ message: 'Course not found' });
        }
        
        // Get materials for the course
        const materials = await db.all(
          'SELECT * FROM course_materials WHERE course_id = ? ORDER BY uploaded_at DESC',
          [courseId]
        );
        
        res.json(materials);
      } catch (error) {
        console.error('Error fetching course materials:', error.message);
        res.status(500).json({ message: 'Error fetching course materials' });
      }
    });

    // Upload course material
    app.post('/api/courses/:courseId/materials', upload.single('file'), async (req, res) => {
      const { courseId } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      try {
        // Check if course exists
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) {
          // Delete the uploaded file if the course doesn't exist
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ message: 'Course not found' });
        }
        
        // Create a relative path for storage in the database
        const relativePath = req.file.path.replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes if needed
        
        // Insert material information into the database
        const result = await db.run(
          'INSERT INTO course_materials (course_id, file_name, file_path) VALUES (?, ?, ?)',
          [courseId, req.file.originalname, relativePath]
        );
        
        // Return the created material
        const material = {
          id: result.lastID,
          course_id: parseInt(courseId),
          file_name: req.file.originalname,
          file_path: relativePath,
          uploaded_at: new Date().toISOString()
        };
        
        res.status(201).json(material);
      } catch (error) {
        console.error('Error uploading course material:', error.message);
        
        // Delete the uploaded file if there was an error
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting file after failed upload:', unlinkError);
          }
        }
        
        res.status(500).json({ message: 'Error uploading course material' });
      }
    });

    // Delete course material
    app.delete('/api/courses/:courseId/materials/:materialId', authenticateToken, async (req, res) => {
      const { courseId, materialId } = req.params;
      
      try {
        // Get the material to check if it exists and get the file path
        const material = await db.get(
          'SELECT * FROM course_materials WHERE id = ? AND course_id = ?',
          [materialId, courseId]
        );
        
        if (!material) {
          return res.status(404).json({ message: 'Material not found' });
        }
        
        // Delete from database
        await db.run('DELETE FROM course_materials WHERE id = ?', [materialId]);
        
        // Delete the file from the filesystem
        try {
          if (fs.existsSync(material.file_path)) {
            fs.unlinkSync(material.file_path);
          }
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
          // Continue anyway, as we've already deleted from the database
        }
        
        res.json({ message: 'Material deleted successfully' });
      } catch (error) {
        console.error('Error deleting course material:', error.message);
        res.status(500).json({ message: 'Error deleting course material' });
      }
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Error initializing the database:', error);
  }
})();

module.exports = app;