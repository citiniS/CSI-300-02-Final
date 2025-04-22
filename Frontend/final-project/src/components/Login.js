import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('ADMIN');
  const [password, setPassword] = useState('ADMIN');
  const { login, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login(username, password);
      navigate('/dashboard');  // Redirect to dashboard on successful login
    } catch (err) {
      console.error('Login failed:', err);  // Log error to console
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-center">Instructor Login</h3>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>} {/* Show error if present */}
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label>Username:</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <small className="text-muted">Default: ADMIN</small>
              </div>
              <div className="form-group mb-3">
                <label>Password:</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <small className="text-muted">Default: ADMIN</small>
              </div>
              <button type="submit" className="btn btn-primary w-100">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
