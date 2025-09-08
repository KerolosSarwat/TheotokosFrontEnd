import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';

const CreateAgbyaDocument = ({ show, onHide, onDocumentCreated }) => {
  const [formData, setFormData] = useState({
    ageLevel: [],
    content: '',
    description: '',
    term: '',
    title: '',
    yearNumber: ''
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
          ageLevel: [...prev.ageLevel, num].sort((a, b) => a - b) // Sort numbers
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.content || !formData.description || 
          !formData.term || !formData.yearNumber || formData.ageLevel.length === 0) {
        throw new Error('All fields are required');
      }

      // Prepare the request data
      const requestData = {
        ageLevel: formData.ageLevel,
        content: formData.content,
        description: formData.description,
        term: Number(formData.term),
        title: formData.title,
        yearNumber: Number(formData.yearNumber)
      };

      // Make POST request to your API endpoint
      const response = await fetch('http://localhost:5000/api/firestore/agbya', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create document');
      }

      const result = await response.json();
      
      setSuccess('Document created successfully!');
      setFormData({
        ageLevel: [],
        content: '',
        description: '',
        term: '',
        title: '',
        yearNumber: ''
      });
      
      // Notify parent component
      if (onDocumentCreated) {
        onDocumentCreated();
      }
    } catch (err) {
      setError(err.message || 'Failed to create document');
      console.error('Error creating document:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Create New Agbya Document</Modal.Title>
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
                placeholder="Enter document title"
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

          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description*</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Enter document description"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="content">
            <Form.Label>Content*</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              placeholder="Enter document content"
            />
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
              ) : 'Create Document'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateAgbyaDocument;