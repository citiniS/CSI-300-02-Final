import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    majorId: '',
    graduatingYear: ''
  });
  
  const [majors, setMajors] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch majors for dropdown
    const fetchMajors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/majors');
        setMajors(response.data);
      } catch (error) {
        console.error('Error fetching majors:', error);
        setError('Failed to load majors. Please try again.');
      }
    };

    fetchMajors();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('http://localhost:5000/api/students', formData);
      navigate('/students');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the student');
      console.error('Error adding student:', err);
    }
  };

  return (
    <div>
      <h2>Add New Student</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Major</label>
                <select
                  className="form-select"
                  name="majorId"
                  value={formData.majorId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Major --</option>
                  {majors.map(major => (
                    <option key={major.id} value={major.id}>
                      {major.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Graduating Year</label>
                <input
                  type="number"
                  className="form-control"
                  name="graduatingYear"
                  value={formData.graduatingYear}
                  onChange={handleChange}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  required
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-end">
              <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/students')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Student
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;