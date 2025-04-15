import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses');
        setCourses(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Course List</h2>
        <Link to="/courses/new" className="btn btn-primary">
          Add New Course
        </Link>
      </div>

      {loading ? (
        <p>Loading courses...</p>
      ) : courses.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Title</th>
                <th>Classroom</th>
                <th>Start Time</th>
                <th>Instructor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>{course.prefix}-{course.number}-{course.section}</td>
                  <td>{course.title}</td>
                  <td>{course.classroom}</td>
                  <td>{course.start_time}</td>
                  <td>{course.instructor_name}</td>
                  <td>
                    <Link to={`/courses/${course.id}`} className="btn btn-sm btn-info me-2">
                      View
                    </Link>
                    <Link to={`/courses/${course.id}/materials`} className="btn btn-sm btn-secondary">
                      Materials
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No courses found. Add a course to get started.</p>
      )}
    </div>
  );
};

export default CourseList;
