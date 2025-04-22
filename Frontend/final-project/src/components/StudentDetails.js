import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const StudentDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch student and course data
  const fetchStudentAndCoursesData = async () => {
    try {
      setLoading(true);
      const studentResponse = await axios.get(`http://localhost:5000/api/students/${id}`);
      setStudent(studentResponse.data);

      const coursesResponse = await axios.get(`http://localhost:5000/api/students/${id}/courses`);
      setCourses(coursesResponse.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching student or course data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentAndCoursesData();
  }, [id, location.key]);

  // Helper function to calculate GPA for a course
  const calculateCourseGrade = (course) => {
    // Define weights for each component (adjust as needed)
    const weights = {
      quiz1: 0.15,
      quiz2: 0.15,
      project1: 0.2,
      project2: 0.2,
      final_exam: 0.3
    };

    // Calculate weighted total
    let totalScore = 0;
    let totalWeight = 0;

    for (const [component, weight] of Object.entries(weights)) {
      if (course[component] !== null && course[component] !== undefined) {
        totalScore += parseFloat(course[component]) * weight;
        totalWeight += weight;
      }
    }

    // Return the weighted average if there are any grades
    if (totalWeight > 0) {
      return (totalScore / totalWeight).toFixed(1);
    }
    
    return "N/A";
  };

  // Get letter grade from numeric grade
  const getLetterGrade = (numericGrade) => {
    if (numericGrade === "N/A") return "N/A";
    
    const grade = parseFloat(numericGrade);
    if (grade >= 93) return "A";
    if (grade >= 90) return "A-";
    if (grade >= 87) return "B+";
    if (grade >= 83) return "B";
    if (grade >= 80) return "B-";
    if (grade >= 77) return "C+";
    if (grade >= 73) return "C";
    if (grade >= 70) return "C-";
    if (grade >= 67) return "D+";
    if (grade >= 63) return "D";
    if (grade >= 60) return "D-";
    return "F";
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div> Loading student details...</div>;
  }

  if (!student) {
    return <div className="alert alert-danger m-3">Student not found</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Student Profile</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={fetchStudentAndCoursesData}>
            🔄 Refresh Data
          </button>
          <Link to="/students" className="btn btn-secondary">
            Back to Students
          </Link>
        </div>
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
              <p><strong>Major:</strong> {student.major_name}</p>
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
                    <th>Overall Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => {
                    const numericGrade = calculateCourseGrade(course);
                    const letterGrade = getLetterGrade(numericGrade);
                    
                    return (
                      <tr key={course.id}>
                        <td>
                          <Link to={`/courses/${course.id}`}>
                            {course.prefix}-{course.number}-{course.section}
                          </Link>
                        </td>
                        <td>{course.title}</td>
                        <td>{course.classroom}</td>
                        <td>{course.start_time}</td>
                        <td>{course.quiz1 || 'N/A'}</td>
                        <td>{course.quiz2 || 'N/A'}</td>
                        <td>{course.project1 || 'N/A'}</td>
                        <td>{course.project2 || 'N/A'}</td>
                        <td>{course.final_exam || 'N/A'}</td>
                        <td>
                          <span className="badge bg-primary">
                            {numericGrade} ({letterGrade})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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