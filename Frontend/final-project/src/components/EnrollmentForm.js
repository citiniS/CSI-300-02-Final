import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Global Axios Error Handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

const EnrollmentForm = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentCourses, setStudentCourses] = useState({});
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch students
        const studentsResponse = await axios.get('http://localhost:5000/api/students');
        console.log('Students response:', studentsResponse.data);

        // Ensure the response is an array
        if (Array.isArray(studentsResponse.data)) {
          setStudents(studentsResponse.data);
        } else {
          setError('Invalid data format for students');
        }

        // Fetch courses
        const coursesResponse = await axios.get('http://localhost:5000/api/courses');
        console.log('Courses response:', coursesResponse.data);

        setCourses(coursesResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        setError(error.response?.data?.message || 'Failed to load data for enrollment');
      }
    };

    fetchData();
  }, []);

  // Fetch a student's enrolled courses when selected
  useEffect(() => {
    const fetchStudentCourses = async () => {
      if (!selectedStudent) return;
      
      try {
        const response = await axios.get(`http://localhost:5000/api/students/${selectedStudent}/courses`);
        
        // Create a map for the student's enrolled courses
        const coursesData = response.data;
        setStudentCourses({
          ...studentCourses,
          [selectedStudent]: coursesData
        });
      } catch (error) {
        console.error('Error fetching student courses:', error);
      }
    };

    // Only fetch if we don't already have the data
    if (selectedStudent && !studentCourses[selectedStudent]) {
      fetchStudentCourses();
    }
  }, [selectedStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedCourse) {
      setError('Please select both a student and a course');
      return;
    }

    // Get the selected course details
    const selectedCourseObj = courses.find(course => course.id.toString() === selectedCourse.toString());
    if (!selectedCourseObj) {
      setError('Invalid course selection');
      return;
    }

    // Check if student is already enrolled in a section of this course
    const studentEnrolledCourses = studentCourses[selectedStudent] || [];
    const alreadyEnrolledInSamePrefix = studentEnrolledCourses.find(
      course => course.prefix === selectedCourseObj.prefix && 
               course.number === selectedCourseObj.number
    );

    if (alreadyEnrolledInSamePrefix) {
      setError(`This student is already enrolled in ${alreadyEnrolledInSamePrefix.prefix}-${alreadyEnrolledInSamePrefix.number}-${alreadyEnrolledInSamePrefix.section}. Cannot enroll in multiple sections of the same course.`);
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await axios.post('http://localhost:5000/api/enrollments', {
        studentId: selectedStudent,
        courseId: selectedCourse
      });
    
      setSuccess('Student successfully enrolled in the course!');
      
      // Update the student's courses in our local state
      if (selectedCourseObj) {
        setStudentCourses({
          ...studentCourses,
          [selectedStudent]: [...(studentCourses[selectedStudent] || []), selectedCourseObj]
        });
      }
      
      // Reset selections
      setSelectedStudent('');
      setSelectedCourse('');
    
      // Redirect to the student's detail page after a short delay
      setTimeout(() => {
        navigate(`/students/${selectedStudent}`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during enrollment');
      console.error('Enrollment error:', err);
    }
  };

  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
    setSelectedCourse(''); // Reset course selection when student changes
    setError(null);
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div> Loading enrollment data...</div>;
  }

  return (
    <div>
      <h2>Enroll Student in Course</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Select Student</label>
              <select
                className="form-select"
                value={selectedStudent}
                onChange={handleStudentChange}
                required
              >
                <option value="">-- Select Student --</option>
                {Array.isArray(students) && students.length > 0 ? (
                  students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.email})
                    </option>
                  ))
                ) : (
                  <option value="">No students available</option>
                )}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Select Course</label>
              <select
                className="form-select"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setError(null);
                }}
                required
                disabled={!selectedStudent}
              >
                <option value="">-- Select Course --</option>
                {Array.isArray(courses) && courses.length > 0 ? (
                  courses.map(course => {
                    // Get the student's enrolled courses
                    const studentEnrolledCourses = studentCourses[selectedStudent] || [];
                    
                    // Check if student is already enrolled in any section of this course
                    const alreadyEnrolledInSamePrefix = studentEnrolledCourses.some(
                      enrolledCourse => 
                        enrolledCourse.prefix === course.prefix && 
                        enrolledCourse.number === course.number
                    );

                    // If already enrolled in a section, disable this option
                    return (
                      <option 
                        key={course.id} 
                        value={course.id}
                        disabled={alreadyEnrolledInSamePrefix}
                      >
                        {course.prefix}-{course.number}-{course.section}: {course.title} ({alreadyEnrolledInSamePrefix ? 'Already enrolled in a section' : course.classroom + ' at ' + course.start_time})
                      </option>
                    );
                  })
                ) : (
                  <option value="">No courses available</option>
                )}
              </select>
              {selectedStudent && (
                <small className="form-text text-muted">
                  Note: You cannot enroll in multiple sections of the same course.
                </small>
              )}
            </div>

            <div className="d-flex justify-content-end">
              <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/dashboard')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Enroll Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentForm;