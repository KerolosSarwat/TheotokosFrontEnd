import { useState, useEffect } from 'react';
import { Card, Table, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { firestoreService } from '../../services/services';
import { COLLECTIONS } from '../../services/api';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { saveAs } from 'file-saver';
import CreateTaks from './CreateTaks';

const TaksList = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedAgeLevel] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await firestoreService.getCollection(COLLECTIONS.TAKS);
        setDocuments(data);
        setFilteredDocuments(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching Taks documents. Please try again later.');
        setLoading(false);
        console.error('Error fetching documents:', err);
      }
    };

    fetchDocuments();
  }, []);

useEffect(() => {
  if (searchTerm.trim() === '') {
    setFilteredDocuments(documents);
  } else {
    const filtered = documents.filter(doc => {
      return Object.values(doc).some(value => {
        if (value === null || value === undefined) return false;
        
        // Handle arrays/objects by stringifying them
        if (typeof value === 'object') {
          return JSON.stringify(value).includes(searchTerm);
        }
        // Handle all other types by converting to string
        return String(value).includes(searchTerm);
      });
    });
    setFilteredDocuments(filtered);
  }
}, [searchTerm, documents]);

  // Export currently filtered documents (matching search + age level if selected)
  const exportFilteredToWord = async () => {
    // Get documents to export - filtered by search AND age level if selected
    let docsToExport = filteredDocuments;
    if (selectedAgeLevel) {
      docsToExport = filteredDocuments.filter(doc => doc.ageLevel === selectedAgeLevel);
    }

    if (docsToExport.length === 0) {
      alert('No documents to export with the current filters');
      return;
    }

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: selectedAgeLevel 
                  ? `Taks Documents for Age Level: ${selectedAgeLevel}`
                  : 'All Filtered Taks Documents',
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({ text: "Filter: " + (searchTerm || 'None') }),
          new Paragraph({ text: "" }),
          ...docsToExport.flatMap(doc => [
            new Paragraph({
              children: [
                new TextRun({
                  text: doc.title || 'Untitled',
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: doc.content || 'No content',
                  size: 22,
                }),
              ],
            }),
            new Paragraph({ text: "" }),
          ])
        ],
      }],
    });

    // Generate filename based on filters
    let filename = 'Taks_Documents';
    if (selectedAgeLevel) filename += `_AgeLevel_${selectedAgeLevel}`;
    if (searchTerm) filename += `_Search_${searchTerm.substring(0, 10)}`;
    filename += '.docx';

    // Download the file
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, filename);
    });
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  const renderDocumentTable = () => {
    if (filteredDocuments.length === 0) {
      return <Alert variant="info">No documents found matching your criteria.</Alert>;
    }

    const allKeys = new Set();
    filteredDocuments.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (key !== 'id') {
          allKeys.add(key);
        }
      });
    });
    const keys = Array.from(allKeys);

    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            {keys.map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredDocuments.map(doc => (
            <tr key={doc.id}>
              <td>{doc.id}</td>
              {keys.map(key => (
                <td key={`${doc.id}-${key}`}>
                  {renderCellValue(doc[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  const renderCellValue = (value) => {
    if (value === undefined || value === null) {
      return 'N/A';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  };

  return (
    <div className="taks-list">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Taks Collection</h1>
        <Button 
        variant="primary" 
        onClick={() => setShowCreateModal(true)}>
        New Lesson
      </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Form>
            <InputGroup className="mb-3">
              <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              <Form.Control
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x-lg"></i>
                </Button>
              )}
            </InputGroup>
          </Form>

          <div className="d-flex align-items-center mt-3">
            {/* <Dropdown className="me-2">
              <Dropdown.Toggle variant="primary" id="dropdown-age-level">
                {selectedAgeLevel ? `Age Level: ${selectedAgeLevel}` : "All Age Levels"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setSelectedAgeLevel(null)}>
                  All Age Levels
                </Dropdown.Item>
                <Dropdown.Divider />
                {getUniqueAgeLevels().map(level => (
                  <Dropdown.Item 
                    key={level} 
                    onClick={() => setSelectedAgeLevel(level)}
                    active={selectedAgeLevel === level}
                  >
                    {level}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown> */}

            <Button 
              variant="success" 
              onClick={exportFilteredToWord}
              disabled={filteredDocuments.length === 0}
            >
              <i className="bi bi-file-word me-2"></i>
              Export Visible Rows to Word
            </Button>
          </div>
        </Card.Body>
      </Card>

      <div className="table-responsive">
        {renderDocumentTable()}
      </div>
      <CreateTaks
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onDocumentCreated={() => {
          // Add refresh logic here if needed
          console.log('New Taks created');
        }}
      />
    </div>
  );
};

export default TaksList;