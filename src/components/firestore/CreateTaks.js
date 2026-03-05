import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { firestoreService } from '../../services/services';
import { COLLECTIONS } from '../../services/api';
import { AGE_LEVEL_MAP } from '../../utils/constants';

const CreateTaks = ({ show, onHide, onDocumentCreated, editDocument }) => {
  const isEditMode = !!editDocument;

  const getInitialFormData = () => ({
    ageLevel: [],
    content: '',
    homework: '',
    term: '',
    title: '',
    yearNumber: ''
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editDocument) {
      setFormData({
        ageLevel: editDocument.ageLevel || [],
        content: editDocument.content || '',
        homework: editDocument.homework || '',
        term: editDocument.term?.toString() || '',
        title: editDocument.title || '',
        yearNumber: editDocument.yearNumber?.toString() || ''
      });
    } else {
      setFormData(getInitialFormData());
    }
    setError(null);
    setSuccess(null);
  }, [editDocument, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgeLevelToggle = (level) => {
    setFormData(prev => {
      const isSelected = prev.ageLevel.includes(level);
      const newLevels = isSelected
        ? prev.ageLevel.filter(l => l !== level)
        : [...prev.ageLevel, level].sort((a, b) => a - b);
      return { ...prev, ageLevel: newLevels };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.title || !formData.content || !formData.homework ||
        !formData.term || !formData.yearNumber || formData.ageLevel.length === 0) {
        throw new Error('All fields are required');
      }

      const requestData = {
        ageLevel: formData.ageLevel,
        content: formData.content,
        homework: formData.homework,
        term: Number(formData.term),
        title: formData.title,
        yearNumber: Number(formData.yearNumber)
      };

      if (isEditMode) {
        await firestoreService.updateDocument(COLLECTIONS.TAKS, editDocument.id, requestData);
        setSuccess('Taks document updated successfully!');
      } else {
        await firestoreService.addDocument(COLLECTIONS.TAKS, requestData);
        setSuccess('Taks document created successfully!');
        setFormData(getInitialFormData());
      }

      if (onDocumentCreated) {
        onDocumentCreated();
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} document`);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} document:`, err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Taks Document' : 'Create New Taks Document'}</Modal.Title>
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
              <div className="border rounded p-3 bg-light">
                <Row xs={2} md={2} className="g-2">
                  {Object.entries(AGE_LEVEL_MAP).map(([val, label]) => {
                    const levelNum = parseInt(val);
                    return (
                      <Col key={val}>
                        <Form.Check
                          type="checkbox"
                          id={`level-${val}`}
                          label={label}
                          checked={formData.ageLevel.includes(levelNum)}
                          onChange={() => handleAgeLevelToggle(levelNum)}
                          className="small fw-bold"
                        />
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </Form.Group>
          </Row>

          <Form.Group className="mb-3" controlId="content">
            <Form.Label>Content*</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              placeholder="Enter document content"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="homework">
            <Form.Label>Homework*</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="homework"
              value={formData.homework}
              onChange={handleInputChange}
              required
              placeholder="Enter homework details"
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
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (isEditMode ? 'Update Document' : 'Create Document')}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreateTaks;