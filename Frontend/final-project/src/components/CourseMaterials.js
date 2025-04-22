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
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}`);
        setCourse(courseResponse.data);
        
        // Fetch course materials
        try {
          const materialsResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}/materials`);
          setMaterials(materialsResponse.data);
        } catch (materialError) {
          // If the endpoint doesn't exist or returns no materials, set empty array
          console.warn('Could not fetch materials:', materialError);
          setMaterials([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course data:', error);
        setLoading(false);
        setError('Failed to load course data');
      }
    };

    fetchData();
  }, [courseId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/materials`,
        formData,
        config
      );

      // Add the new material to the list
      if (response.data) {
        setMaterials(prev => [...prev, response.data]);
        setUploadSuccess(true);
      }
      
      // Reset the file input
      setSelectedFile(null);
      document.getElementById('file-upload').value = '';
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.status === 401) {
        setError('You must be logged in as an instructor to upload materials');
      } else {
        setError(error.response?.data?.message || 'Failed to upload file. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'bi-file-earmark-pdf';
      case 'doc':
      case 'docx':
        return 'bi-file-earmark-word';
      case 'xls':
      case 'xlsx':
        return 'bi-file-earmark-excel';
      case 'ppt':
      case 'pptx':
        return 'bi-file-earmark-slides';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'bi-file-earmark-image';
      case 'zip':
      case 'rar':
        return 'bi-file-earmark-zip';
      default:
        return 'bi-file-earmark';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading course materials...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="alert alert-danger my-3">
        Course not found. <Link to="/courses">Return to Courses</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Course Materials: {course.prefix}-{course.number}-{course.section}</h2>
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
          {uploadSuccess && <div className="alert alert-success">File uploaded successfully!</div>}
          
          <div className="mb-3">
            <label htmlFor="file-upload" className="form-label">Select File</label>
            <input
              type="file"
              className="form-control"
              id="file-upload"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <small className="form-text text-muted">
              Supported file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, JPG, PNG
            </small>
          </div>
          
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : 'Upload Material'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h3>Available Materials</h3>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh
          </button>
        </div>
        <div className="card-body">
          {materials && materials.length > 0 ? (
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
                      <i className={`bi ${getFileIcon(material.file_name)} me-2`}></i>
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