import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const CourseForm = () => {
  const [formData, setFormData] = useState({
    prefix: '',
    number: '',
    section: '',
    title: '',
    classroom: '',
    startTime: ''
  });
  
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('http://localhost:5000/api/courses', formData);
      navigate('/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the course');
      console.error('Error adding course:', err);
    }
  };

  return (
    <div>
      <h2>Add New Course</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Course Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  name="prefix"
                  value={formData.prefix}
                  onChange={handleChange}
                  placeholder="e.g. CSI"
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Course Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="number"
                  value={formData.number}
                  onChange={handleChange}
                  placeholder="e.g. 300"
                  required
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Section</label>
                <input
                  type="text"
                  className="form-control"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g. 01"
                  required
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Course Title</label>
              <input
                type="text"
                className="form-control"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Data Structures"
                required
              />
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Classroom</label>
                <input
                  type="text"
                  className="form-control"
                  name="classroom"
                  value={formData.classroom}
                  onChange={handleChange}
                  placeholder="e.g. Room 101"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-end">
              <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/courses')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Course
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseForm;
