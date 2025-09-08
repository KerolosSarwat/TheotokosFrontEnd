import React, { useState } from 'react';
import { Modal, Form, Button, Alert, Row, Col, Badge } from 'react-bootstrap';

const CreateCopticContent = ({ show, onHide, onDocumentCreated }) => {
    const [formData, setFormData] = useState({
        id: '',
        bigLetter: '',
        smallLetter: '',
        letterName: '',
        letterRole: ['', '', ''],
        title: '',
        term: '',
        sortOrder: '',
        copticWords: ['', '', ''],
        arabicCoptic: ['', '', ''],
        images: ['', '', ''],
        arabicWords: ['', '', '']
    });
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

    const handleArrayInputChange = (field, index, value) => {
        setFormData(prev => {
            const newArray = [...prev[field]];
            newArray[index] = value;
            return {
                ...prev,
                [field]: newArray
            };
        });
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate required fields
            if (!formData.bigLetter || !formData.smallLetter || !formData.letterName ||
                !formData.title || !formData.term || !formData.sortOrder) {
                throw new Error('Required fields are missing');
            }

            // Prepare the request data
            const requestData = {
                id: formData.id,
                bigLetter: formData.bigLetter,
                smallLetter: formData.smallLetter,
                letterName: formData.letterName,
                letterRole: formData.letterRole.filter(item => item !== ''),
                title: formData.title,
                term: Number(formData.term),
                sortOrder: Number(formData.sortOrder),
                copticWords: formData.copticWords.filter(item => item !== ''),
                arabicCoptic: formData.arabicCoptic.filter(item => item !== ''),
                images: formData.images.filter(item => item !== ''),
                arabicWords: formData.arabicWords.filter(item => item !== '')
            };

            // Make POST request to your API endpoint
            const response = await fetch('http://localhost:5000/api/firestore/coptic', {
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

            setSuccess('Coptic content document created successfully!');
            setFormData({
                id: '',
                bigLetter: '',
                smallLetter: '',
                letterName: '',
                letterRole: ['', '', ''],
                title: '',
                term: '',
                sortOrder: '',
                copticWords: ['', '', ''],
                arabicCoptic: ['', '', ''],
                images: ['', '', ''],
                arabicWords: ['', '', '']
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
                <Modal.Title>Create New Coptic Content Document</Modal.Title>
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
                    <Row className="mb-6">
                        <Form.Group as={Col} controlId="id">
                            <Form.Label>ID*</Form.Label>
                            <Form.Control
                                type="text"
                                name="id"
                                value={formData.id}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter document ID"
                            />
                        </Form.Group>
                    </Row>
                    <Row className="mb-3">
                        <Form.Group as={Col} controlId="bigLetter">
                            <Form.Label>Big Letter*</Form.Label>
                            <Form.Control
                                type="text"
                                name="bigLetter"
                                value={formData.bigLetter}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter big letter"
                            />
                        </Form.Group>

                        <Form.Group as={Col} controlId="smallLetter">
                            <Form.Label>Small Letter*</Form.Label>
                            <Form.Control
                                type="text"
                                name="smallLetter"
                                value={formData.smallLetter}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter small letter"
                            />
                        </Form.Group>
                    </Row>

                    <Row className="mb-3">
                        <Form.Group as={Col} controlId="letterName">
                            <Form.Label>Letter Name*</Form.Label>
                            <Form.Control
                                type="text"
                                name="letterName"
                                value={formData.letterName}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter letter name"
                            />
                        </Form.Group>

                        <Form.Group as={Col} controlId="title">
                            <Form.Label>Title*</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter title"
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

                        <Form.Group as={Col} controlId="sortOrder">
                            <Form.Label>Sort Order*</Form.Label>
                            <Form.Control
                                type="number"
                                name="sortOrder"
                                value={formData.sortOrder}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter sort order"
                                min="1"
                            />
                        </Form.Group>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Letter Roles</Form.Label>
                        {formData.letterRole.map((role, index) => (
                            <div key={index} className="d-flex mb-2">
                                <Form.Control
                                    type="text"
                                    value={role}
                                    onChange={(e) => handleArrayInputChange('letterRole', index, e.target.value)}
                                    placeholder={`Letter role ${index + 1}`}
                                />
                                <Button
                                    variant="outline-danger"
                                    onClick={() => removeArrayItem('letterRole', index)}
                                    className="ms-2"
                                    disabled={formData.letterRole.length <= 1}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline-primary"
                            onClick={() => addArrayItem('letterRole')}
                        >
                            Add Role
                        </Button>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Coptic Words</Form.Label>
                        {formData.copticWords.map((word, index) => (
                            <div key={index} className="d-flex mb-2">
                                <Form.Control
                                    type="text"
                                    value={word}
                                    onChange={(e) => handleArrayInputChange('copticWords', index, e.target.value)}
                                    placeholder={`Coptic word ${index + 1}`}
                                />
                                <Button
                                    variant="outline-danger"
                                    onClick={() => removeArrayItem('copticWords', index)}
                                    className="ms-2"
                                    disabled={formData.copticWords.length <= 1}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline-primary"
                            onClick={() => addArrayItem('copticWords')}
                        >
                            Add Coptic Word
                        </Button>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Arabic Coptic</Form.Label>
                        {formData.arabicCoptic.map((item, index) => (
                            <div key={index} className="d-flex mb-2">
                                <Form.Control
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleArrayInputChange('arabicCoptic', index, e.target.value)}
                                    placeholder={`Arabic Coptic ${index + 1}`}
                                />
                                <Button
                                    variant="outline-danger"
                                    onClick={() => removeArrayItem('arabicCoptic', index)}
                                    className="ms-2"
                                    disabled={formData.arabicCoptic.length <= 1}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline-primary"
                            onClick={() => addArrayItem('arabicCoptic')}
                        >
                            Add Arabic Coptic
                        </Button>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Arabic Words</Form.Label>
                        {formData.arabicWords.map((word, index) => (
                            <div key={index} className="d-flex mb-2">
                                <Form.Control
                                    type="text"
                                    value={word}
                                    onChange={(e) => handleArrayInputChange('arabicWords', index, e.target.value)}
                                    placeholder={`Arabic word ${index + 1}`}
                                />
                                <Button
                                    variant="outline-danger"
                                    onClick={() => removeArrayItem('arabicWords', index)}
                                    className="ms-2"
                                    disabled={formData.arabicWords.length <= 1}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline-primary"
                            onClick={() => addArrayItem('arabicWords')}
                        >
                            Add Arabic Word
                        </Button>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Images (URLs)</Form.Label>
                        {formData.images.map((url, index) => (
                            <div key={index} className="d-flex mb-2">
                                <Form.Control
                                    type="text"
                                    value={url}
                                    onChange={(e) => handleArrayInputChange('images', index, e.target.value)}
                                    placeholder={`Image URL ${index + 1}`}
                                />
                                <Button
                                    variant="outline-danger"
                                    onClick={() => removeArrayItem('images', index)}
                                    className="ms-2"
                                    disabled={formData.images.length <= 1}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline-primary"
                            onClick={() => addArrayItem('images')}
                        >
                            Add Image URL
                        </Button>
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

export default CreateCopticContent;