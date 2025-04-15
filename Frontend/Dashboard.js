import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses');
        setCourses(response.data.filter(course => course.instructor_id === user.id));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Instructor Dashboard</h2>
        <Link to="/courses/new" className="btn btn-primary">
          Add New Course
        </Link>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h4>Welcome, {user?.firstName} {user?.lastName}!</h4>
            </div>
            <div className="card-body">
              <p>Use the navigation above to manage your courses, students, and enrollments.</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4>My Courses</h4>
              <Link to="/courses" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {loading ? (
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
                <p>No courses found. Add a course to get started.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
