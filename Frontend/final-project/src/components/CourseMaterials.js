import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CourseMaterials = () => {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        setCourse(courseResponse.data);
        
        const materialsResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}/materials`);
        setMaterials(materialsResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course materials:', error);
        setLoading(false);
        setError('Failed to load course materials');
      }
    };

    fetchData();
  }, [courseId]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/materials`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMaterials([...materials, response.data]);
      setSelectedFile(null);
      // Reset the file input
      document.getElementById('file-upload').value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div>Loading course materials...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Course Materials: {course?.prefix}-{course?.number}-{course?.section}</h2>
        <Link to={`/courses/${courseId}`} className="btn btn-secondary">
          Back to Course
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h3>Upload New Material</h3>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="mb-3">
            <label htmlFor="file-upload" className="form-label">Select File</label>
            <input
              type="file"
              className="form-control"
              id="file-upload"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Material'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Available Materials</h3>
        </div>
        <div className="card-body">
          {materials.length > 0 ? (
            <div className="list-group">
              {materials.map(material => (
                <a
                  key={material.id}
                  href={`http://localhost:5000/${material.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="list-group-item list-group-item-action"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-file-earmark me-2"></i>
                      {material.file_name}
                    </div>
                    <small>Uploaded: {new Date(material.uploaded_at).toLocaleString()}</small>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p>No materials have been uploaded for this course yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseMaterials;
