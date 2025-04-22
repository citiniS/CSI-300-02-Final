import React, { useState } from 'react';  // Import useState
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';  // Import axios

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import StudentList from './components/StudentLists';
import StudentDetail from './components/StudentDetails';
import EnrollmentForm from './components/EnrollmentForm';
import CourseMaterials from './components/CourseMaterials';
import CourseForm from './components/CourseForm';
import StudentForm from './components/StudentForms';

// Context
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  const [students, setStudents] = useState([]);  // Define students and setStudents using useState

  // Fetch students function
  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/students');
      setStudents(response.data);  // Set the students state after fetching
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container mt-4">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Protected Routes wrapped with PrivateRoute */}
              <Route 
                path="/courses" 
                element={ 
                  <PrivateRoute>
                    <CourseList />
                  </PrivateRoute> 
                } 
              />
              <Route 
                path="/courses/new" 
                element={ 
                  <PrivateRoute>
                    <CourseForm />
                  </PrivateRoute> 
                } 
              />
              <Route 
                path="/courses/:id" 
                element={ 
                  <PrivateRoute>
                    <CourseDetail />
                  </PrivateRoute> 
                } 
              />
              <Route 
                path="/courses/:id/materials" 
                element={ 
                  <PrivateRoute>
                    <CourseMaterials />
                  </PrivateRoute> 
                } 
              />
              <Route 
                path="/students" 
                element={ 
                  <PrivateRoute>
                    <StudentList />
                  </PrivateRoute> 
                } 
              />
              <Route 
                path="/students/new" 
                element={ 
                  <PrivateRoute>
                    <StudentForm fetchStudents={fetchStudents} />  {/* Pass fetchStudents to StudentForm */}
                  </PrivateRoute> 
                } 
              />
              <Route 
                path="/students/:id" 
                element={ 
                  <PrivateRoute>
                    <StudentDetail />
                  </PrivateRoute> 
                } 
              />
              <Route 
                path="/enroll" 
                element={ 
                  <PrivateRoute>
                    <EnrollmentForm />
                  </PrivateRoute> 
                } 
              />

              {/* Default route redirects to /dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
