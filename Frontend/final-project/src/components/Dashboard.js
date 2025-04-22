import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch students and their enrolled courses
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/students');
        const studentData = await Promise.all(
          res.data.map(async (student) => {
            const coursesRes = await axios.get(`http://localhost:5000/api/students/${student.id}/courses`);
            return { ...student, courses: coursesRes.data };
          })
        );
        setStudents(studentData);
      } catch (err) {
        console.error('Error fetching students and their courses:', err);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <Link to="/courses/new" className="btn btn-primary">
          Add New Course
        </Link>
      </div>

      <div className="row">
        {/* Students & Enrolled Courses Section */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h4>Students & Enrolled Courses</h4>
            </div>
            <div className="card-body">
              {loadingStudents ? (
                <p>Loading student enrollments...</p>
              ) : students.length > 0 ? (
                <ul className="list-group">
                  {students.map(student => (
                    <li key={student.id} className="list-group-item">
                      <strong>{student.first_name} {student.last_name}:</strong>{' '}
                      {student.courses && student.courses.length > 0
                        ? student.courses.map(course => `${course.prefix}-${course.number}-${course.section}`).join(', ')
                        : 'No enrolled courses'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No students found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4>Courses</h4>
              <Link to="/courses" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {loadingCourses ? (
                <p>Loading courses...</p>
              ) : courses.length > 0 ? (
                <ul className="list-group">
                  {courses.slice(0, 5).map(course => (
                    <li key={course.id} className="list-group-item">
                      <Link to={`/courses/${course.id}`}>
                        {course.prefix}-{course.number}-{course.section}: {course.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No courses available. Add one to get started.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
