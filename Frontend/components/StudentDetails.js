import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const StudentDetail = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentResponse = await axios.get(`http://localhost:5000/api/students/${id}`);
        setStudent(studentResponse.data);
        
        const coursesResponse = await axios.get(`http://localhost:5000/api/students/${id}/courses`);
        setCourses(coursesResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching student data:', error);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  if (loading) {
    return <div>Loading student details...</div>;
  }

  if (!student) {
    return <div>Student not found</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Student Profile</h2>
        <Link to="/students" className="btn btn-secondary">
          Back to Students
        </Link>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h3>Student Information</h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Name:</strong> {student.first_name} {student.last_name}</p>
              <p><strong>Email:</strong> {student.email}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Major:</strong> {student.major}</p>
              <p><strong>Graduating Year:</strong> {student.graduating_year}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3>Enrolled Courses</h3>
          <Link to="/enroll" className="btn btn-sm btn-primary">
            Enroll in Course
          </Link>
        </div>
        <div className="card-body">
          {courses.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Title</th>
                    <th>Classroom</th>
                    <th>Start Time</th>
                    <th>Quiz 1</th>
                    <th>Quiz 2</th>
                    <th>Project 1</th>
                    <th>Project 2</th>
                    <th>Final Exam</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course.id}>
                      <td>
                        <Link to={`/courses/${course.id}`}>
                          {course.prefix}-{course.number}-{course.section}
                        </Link>
                      </td>
                      <td>{course.title}</td>
                      <td>{course.classroom}</td>
                      <td>{course.start_time}</td>
                      <td>{course.quiz1 || 0}</td>
                      <td>{course.quiz2 || 0}</td>
                      <td>{course.project1 || 0}</td>
                      <td>{course.project2 || 0}</td>
                      <td>{course.final_exam || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>This student is not enrolled in any courses yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;

