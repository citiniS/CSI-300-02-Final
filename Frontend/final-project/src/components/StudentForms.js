import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const StudentForm = ({ fetchStudents }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    major_id: '',
    graduating_year: ''
  });

  const [majors, setMajors] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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

    // Debugging: Log the form data being sent to the API
    console.log('Submitting student data:', formData);

    try {
      const response = await axios.post('http://localhost:5000/api/students', formData);

      // Debugging: Log the response from the API
      console.log('Response from adding student:', response);

      // After successfully adding the student, fetch the updated student list
      fetchStudents();

      navigate('/students');  // Navigate to the student list page
    } catch (err) {
      // Handle specific error messages from the backend
      const errorMessage = err.response?.data?.message || 'An error occurred while adding the student';
      setError(errorMessage);

      // Debugging: Log the full error response
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
                  name="first_name"  // Change to snake_case
                  value={formData.first_name}  // Update to snake_case
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="last_name"  // Change to snake_case
                  value={formData.last_name}  // Update to snake_case
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
                  name="major_id"  // Change to snake_case
                  value={formData.major_id}  // Update to snake_case
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Major --</option>
                  {majors.map((major) => (
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
                  name="graduating_year"  // Change to snake_case
                  value={formData.graduating_year}  // Update to snake_case
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
