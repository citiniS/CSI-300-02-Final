import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({});

  // Fetch course and students data
  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const courseResponse = await axios.get(`http://localhost:5000/api/courses/${id}`);
      setCourse(courseResponse.data);

      const studentsResponse = await axios.get(`http://localhost:5000/api/courses/${id}/students`);
      setStudents(studentsResponse.data);
      setSaveStatus({}); // Reset save status

      setLoading(false);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setLoading(false);
    }
  };

  // Handle grade change
  const handleGradeChange = (studentId, field, value) => {
    // Validate input
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      console.error('Invalid grade value');
      return;
    }

    // Find the student and update their grade
    const updatedStudents = students.map(student => {
      if (student.id === studentId) {
        return { ...student, [field]: numValue };
      }
      return student;
    });
    
    setStudents(updatedStudents);
    
    // Clear previous save status for this student
    if (saveStatus[studentId]) {
      setSaveStatus(prev => ({ ...prev, [studentId]: null }));
    }
  };

  // Save grades for a student
  const saveGrades = async (studentId) => {
    // Find the student
    const student = students.find(s => s.id === studentId);
    if (!student) {
      console.error("Student not found");
      return;
    }
    
    // Update status to saving
    setSaveStatus(prev => ({ ...prev, [studentId]: 'saving' }));
    
    // Make sure we have numeric values for all grades
    const updatedGrades = {
      quiz1: parseFloat(student.quiz1) || 0,
      quiz2: parseFloat(student.quiz2) || 0,
      project1: parseFloat(student.project1) || 0,
      project2: parseFloat(student.project2) || 0,
      final_exam: parseFloat(student.final_exam) || 0
    };
  
    try {
      console.log("Sending updated grades for student", studentId, "course", id, ":", updatedGrades);
      
      // Update grades on the backend
      const response = await axios.put(
        `http://localhost:5000/api/grades/${studentId}/${id}`, 
        updatedGrades
      );
      
      if (response.status === 200) {
        console.log("Grades saved successfully");
        setSaveStatus(prev => ({ ...prev, [studentId]: 'success' }));
        
        // Re-fetch the course data to reflect the updated grades after a short delay
        setTimeout(() => {
          fetchCourseData();
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [studentId]: null }));
          }, 3000);
        }, 500);
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      setSaveStatus(prev => ({ ...prev, [studentId]: 'error' }));
      
      // If we get a 404, it may be because the grades record doesn't exist yet
      if (error.response && error.response.status === 404) {
        try {
          const createResponse = await axios.post(
            `http://localhost:5000/api/grades`, 
            {
              student_id: studentId,
              course_id: id,
              ...updatedGrades
            }
          );
          
          if (createResponse.status === 201) {
            console.log("Grades created successfully");
            setSaveStatus(prev => ({ ...prev, [studentId]: 'success' }));
            fetchCourseData();
          }
        } catch (createError) {
          console.error("Error creating grades:", createError);
          setSaveStatus(prev => ({ ...prev, [studentId]: 'error' }));
        }
      }
    }
  };

  // Helper function to get status button class
  const getStatusButtonClass = (studentId) => {
    const status = saveStatus[studentId];
    if (status === 'saving') return 'btn-warning';
    if (status === 'success') return 'btn-success';
    if (status === 'error') return 'btn-danger';
    return 'btn-success'; // Default is success for the "Save Grades" button
  };

  // Helper function to get status button text
  const getStatusButtonText = (studentId) => {
    const status = saveStatus[studentId];
    if (status === 'saving') return 'Saving...';
    if (status === 'success') return 'Saved!';
    if (status === 'error') return 'Error!';
    return 'Save Grades';
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div> Loading course details...</div>;
  }

  if (!course) {
    return <div className="alert alert-danger m-3">Course not found</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{course.prefix}-{course.number}-{course.section}: {course.title}</h2>
        <div>
          <Link to={`/courses/${id}/materials`} className="btn btn-secondary me-2">
            Course Materials
          </Link>
          <Link to="/enroll" className="btn btn-primary">
            Enroll Student
          </Link>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3>Course Information</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Course Code:</strong> {course.prefix}-{course.number}-{course.section}</p>
              <p><strong>Title:</strong> {course.title}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Classroom:</strong> {course.classroom}</p>
              <p><strong>Start Time:</strong> {course.start_time}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between">
          <h3>Enrolled Students & Grades</h3>
          <button 
            className="btn btn-outline-secondary" 
            onClick={fetchCourseData}
          >
            🔄 Refresh
          </button>
        </div>
        <div className="card-body">
          {students.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Quiz 1</th>
                    <th>Quiz 2</th>
                    <th>Project 1</th>
                    <th>Project 2</th>
                    <th>Final Exam</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>
                        <Link to={`/students/${student.id}`}>
                          {student.first_name} {student.last_name}
                        </Link>
                      </td>
                      <td>{student.email}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-control form-control-sm"
                          value={student.quiz1 || 0}
                          onChange={(e) => handleGradeChange(student.id, 'quiz1', parseFloat(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-control form-control-sm"
                          value={student.quiz2 || 0}
                          onChange={(e) => handleGradeChange(student.id, 'quiz2', parseFloat(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-control form-control-sm"
                          value={student.project1 || 0}
                          onChange={(e) => handleGradeChange(student.id, 'project1', parseFloat(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-control form-control-sm"
                          value={student.project2 || 0}
                          onChange={(e) => handleGradeChange(student.id, 'project2', parseFloat(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="form-control form-control-sm"
                          value={student.final_exam || 0}
                          onChange={(e) => handleGradeChange(student.id, 'final_exam', parseFloat(e.target.value))}
                        />
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${getStatusButtonClass(student.id)}`}
                          onClick={() => saveGrades(student.id)}
                          disabled={saveStatus[student.id] === 'saving'}
                        >
                          {getStatusButtonText(student.id)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No students enrolled in this course yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;