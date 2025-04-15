import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const EnrollmentForm = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentsResponse = await axios.get('http://localhost:5000/api/students');
        setStudents(studentsResponse.data);
        
        const coursesResponse = await axios.get('http://localhost:5000/api/courses');
        setCourses(coursesResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        setError('Failed to load data for enrollment');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedCourse) {
      setError('Please select both a student and a course');
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
      setSelectedStudent('');
      setSelectedCourse('');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during enrollment');
      console.error('Enrollment error:', err);
    }
  };

  if (loading) {
    return <div>Loading enrollment data...</div>;
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
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">-- Select Student --</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Select Course</label>
              <select
                className="form-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                required
              >
                <option value="">-- Select Course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.prefix}-{course.number}-{course.section}: {course.title}
                  </option>
                ))}
              </select>
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