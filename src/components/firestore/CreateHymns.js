import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';

const CreateHymns = ({ show, onHide, onDocumentCreated }) => {
  const [formData, setFormData] = useState({
    ageLevel: [],
    copticArabicContent: '',
    copticContent: '',
    term: '',
    title: '',
    yearNumber: '',
    arabicContent: '',
    audio: ''
  });
  const [ageLevelInput, setAgeLevelInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgeLevelAdd = () => {
    if (ageLevelInput && !isNaN(ageLevelInput)) {
      const num = parseInt(ageLevelInput);
      if (!formData.ageLevel.includes(num)) {
        setFormData(prev => ({
          ...prev,
          ageLevel: [...prev.ageLevel, num].sort((a, b) => a - b)
        }));
        setAgeLevelInput('');
      }
    }
  };

  const handleAgeLevelRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      ageLevel: prev.ageLevel.filter((_, i) => i !== index)
    }));
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Here you would typically upload to storage and get URL
      // For now we'll just store the file name
      setFormData(prev => ({
        ...prev,
        audio: file.name
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.copticContent || !formData.copticArabicContent || 
          !formData.term || !formData.yearNumber || formData.ageLevel.length === 0) {
        throw new Error('All fields except audio are required');
      }

      // Prepare the request data
      const requestData = {
        ageLevel: formData.ageLevel,
        copticArabicContent: formData.copticArabicContent,
        copticContent: formData.copticContent,
        term: Number(formData.term),
        title: formData.title,
        yearNumber: Number(formData.yearNumber),
        arabicContent: formData.arabicContent,
        audio: formData.audio
      };

      // Make POST request to your API endpoint
      const response = await fetch('http://localhost:5000/api/firestore/hymns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create hymn');
      }
      
      setSuccess('Hymn created successfully!');
      setFormData({
        ageLevel: [],
        copticArabicContent: '',
        copticContent: '',
        term: '',
        title: '',
        yearNumber: '',
        arabicContent: '',
        audio: ''
      });
      
      // Notify parent component
      if (onDocumentCreated) {
        onDocumentCreated();
      }
    } catch (err) {
      setError(err.message || 'Failed to create hymn');
      console.error('Error creating hymn:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create New Hymn</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col} controlId="title">
              <Form.Label>Title*</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter hymn title"
              />
            </Form.Group>

            <Form.Group as={Col} controlId="yearNumber">
              <Form.Label>Year Number*</Form.Label>
              <Form.Control
                type="number"
                name="yearNumber"
                value={formData.yearNumber}
                onChange={handleInputChange}
                required
                placeholder="Enter year number"
                min="1"
              />
            </Form.Group>
          </Row>

          <Row className="mb-3">
            <Form.Group as={Col} controlId="term">
              <Form.Label>Term*</Form.Label>
              <Form.Control
                type="number"
                name="term"
                value={formData.term}
                onChange={handleInputChange}
                required
                placeholder="Enter term number"
                min="1"
              />
            </Form.Group>

            <Form.Group as={Col} controlId="ageLevel">
              <Form.Label>Age Levels*</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="number"
                  value={ageLevelInput}
                  onChange={(e) => setAgeLevelInput(e.target.value)}
                  placeholder="Add age level"
                  min="1"
                />
                <Button 
                  variant="outline-primary" 
                  onClick={handleAgeLevelAdd}
                  className="ms-2"
                  disabled={!ageLevelInput}
                >
                  Add
                </Button>
              </div>
              <div className="mt-2">
                {formData.ageLevel.map((age, index) => (
                  <Badge key={index} pill bg="primary" className="me-2 fs-6">
                    {age}
                    <button 
                      type="button" 
                      className="ms-2 btn-close btn-close-white" 
                      aria-label="Remove"
                      onClick={() => handleAgeLevelRemove(index)}
                      style={{ fontSize: '0.5rem' }}
                    />
                  </Badge>
                ))}
              </div>
            </Form.Group>
          </Row>

          <Form.Group className="mb-3" controlId="copticContent">
            <Form.Label>Coptic Content*</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="copticContent"
              value={formData.copticContent}
              onChange={handleInputChange}
              required
              placeholder="Enter Coptic content"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="copticArabicContent">
            <Form.Label>Coptic-Arabic Content*</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="copticArabicContent"
              value={formData.copticArabicContent}
              onChange={handleInputChange}
              required
              placeholder="Enter Coptic-Arabic content"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="arabicContent">
            <Form.Label>Arabic Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="arabicContent"
              value={formData.arabicContent}
              onChange={handleInputChange}
              placeholder="Enter Arabic content"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="audio">
            <Form.Label>Audio File</Form.Label>
            <Form.Control
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
            />
            {formData.audio && (
              <div className="mt-2">
                <small>Selected file: {formData.audio}</small>
              </div>
            )}
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button 
              variant="secondary" 
              onClick={onHide} 
              className="me-2"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : 'Create Hymn'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateHymns;