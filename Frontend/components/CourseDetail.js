import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseResponse = await axios.get(`http://localhost:5000/api/courses/${id}`);
        setCourse(courseResponse.data);
        
        const studentsResponse = await axios.get(`http://localhost:5000/api/courses/${id}/students`);
        setStudents(studentsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  const handleGradeChange = async (studentId, field, value) => {
    try {
      // Find the student and current grades
      const student = students.find(s => s.id === studentId);
      
      // Create updated grades object
      const updatedGrades = {
        quiz1: student.quiz1,
        quiz2: student.quiz2,
        project1: student.project1,
        project2: student.project2,
        finalExam: student.final_exam,
        [field]: value
      };
      
      // Update the backend
      await axios.put(`http://localhost:5000/api/grades/${studentId}/${id}`, updatedGrades);
      
      // Update local state
      setStudents(students.map(s => {
        if (s.id === studentId) {
          return { ...s, [field]: value };
        }
        return s;
      }));
    } catch (error) {
      console.error('Error updating grade:', error);
    }
  };

  if (loading) {
    return <div>Loading course details...</div>;
  }

  if (!course) {
    return <div>Course not found</div>;
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
        <div className="card-header">
          <h3>Enrolled Students & Grades</h3>
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
                          onChange={(e) => handleGradeChange(student.id, 'finalExam', parseFloat(e.target.value))}
                        />
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
