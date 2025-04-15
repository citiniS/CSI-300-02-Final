// First, let's set up the main App.js file

// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import EnrollmentForm from './components/EnrollmentForm';
import CourseMaterials from './components/CourseMaterials';
import CourseForm from './components/CourseForm';
import StudentForm from './components/StudentForm';

// Context
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <div className="container mt-4">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
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
                    <StudentForm />
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
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
