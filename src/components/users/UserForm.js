import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';

const UserForm = () => {
  const { t } = useTranslation();
  const { code } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!code;

  const [formData, setFormData] = useState({
    code: isEditMode ? "" : formatDateTime(new Date()).toString(),
    fullName: '',
    gender: 'Male',
    birthdate: '',
    phoneNumber: '',
    church: 'العذراء مريم و الشهيد أبانوب',
    level: 'حضانة',
    address: '',
    admin: false,
    active: false,
    admin: false,
    degree: {
      firstTerm: {
        agbya: 0,
        coptic: 0,
        hymns: 0,
        taks: 0
      },
      secondTerm: {
        agbya: 0,
        attencance: 0,
        coptic: 0,
        hymns: 0,
        result: 0,
        taks: 0
      },
      thirdTerm: {
        agbya: 0,
        attencance: 0,
        coptic: 0,
        hymns: 0,
        result: 0,
        taks: 0
      }
    }
  });

  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = `${isEditMode ? t('users.edit') : t('users.new')} | Firebase Portal`;
  }, [t, isEditMode]);

  useEffect(() => {
    const fetchUser = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          const userData = await userService.getUserByCode(code);
          setFormData(userData);
          setLoading(false);
        } catch (err) {
          console.log(err)
          setError('Error fetching user data. Please try again.');
          setLoading(false);
          console.error('Error fetching user:', err);
        }
      }
    };

    fetchUser();
  }, [code, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested properties (e.g., degree.firstTerm.agbya)
      const parts = name.split('.');
      setFormData(prevData => {
        const newData = { ...prevData };
        let current = newData;

        // Navigate to the nested property
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }

        // Set the value
        current[parts[parts.length - 1]] = type === 'number' ? Number(value) : value;
        return newData;
      });
    } else {
      // Handle top-level properties
      setFormData(prevData => ({
        ...prevData,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      if (isEditMode) {
        // Update existing user
        await userService.updateUser(code, formData);
        setSuccess(true);
        setTimeout(() => navigate(`/users/${code}`), 1500);
      } else {
        // Create new user
        await userService.createUser(formData);
        setSuccess(true);
        setTimeout(() => navigate('/users'), 1500);
      }
    } catch (err) {
      setError('Error saving user data. Please check your inputs and try again.');
      console.error('Error saving user:', err);
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div className="user-form">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{isEditMode ? t('users.edit') : t('users.new')}</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{isEditMode ? 'User updated successfully!' : 'User created successfully!'}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('users.code')} *</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={isEditMode ? formData.code : formatDateTime(new Date()).toString()}
                    onChange={handleChange}
                    required
                    disabled={true}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('users.fullName')} *</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('common.gender')}</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="Male">{t('common.male')}</option>
                    <option value="Female">{t('common.female')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('common.birthdate')}</Form.Label>
                  <Form.Control
                    type="date"
                    name="birthdate"
                    value={formData.birthdate || ''}
                    onChange={handleChange}
                    placeholder="DD-MM-YYYY"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('users.phone')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('users.church')}</Form.Label>
                  <Form.Select
                    name="church"
                    value={formData.church}
                    onChange={handleChange}>
                    <option value="العذراء مريم و الشهيد أبانوب">العذراء مريم و الشهيد أبانوب</option>
                    <option value="الأنبا كاراس السائح">الأنبا كاراس السائح</option>
                    <option value="الأنبا موسى الأسود">الأنبا موسى الأسود</option>
                    <option value="القديس سمعان الخراز">القديس سمعان الخراز</option>
                    <option value="العذراء مريم و الأنبا صموئيل">العذراء مريم و الأنبا صموئيل</option>
                    <option value="الأنبا شنودة الهضبة العليا">الأنبا شنودة الهضبة العليا</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('users.level')}</Form.Label>
                  <Form.Select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}>
                    <option value="حضانة">حضانة</option>
                    <option value="أولى ابتدائى">أولى ابتدائى</option>
                    <option value="ثانية ابتدائى">ثانية ابتدائى</option>
                    <option value="ثالثة ابتدائى">ثالثة ابتدائى</option>
                    <option value="رابعة ابتدائى">رابعة ابتدائى</option>
                    <option value="خامسة ابتدائى">خامسة ابتدائى</option>
                    <option value="سادسة ابتدائى">سادسة ابتدائى</option>
                    <option value="اعدادى">اعدادى</option>
                    <option value="ثانوى ">ثانوى</option>
                    <option value="جامعة أو خريج">جامعة أو خريج</option>
                  </Form.Select>

                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('common.address')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label={t('common.active')}
                name="active"
                checked={formData.active || false}
                onChange={handleChange}
              />

              <Form.Check
                type="checkbox"
                label={t('common.admin')}
                name="admin"
                checked={formData.admin || false}
                onChange={handleChange}
              />
            </Form.Group>


            <h4 className="mt-4">{t('terms.degreeInfo')}</h4>

            <Card className="mb-3">
              <Card.Header>{t('terms.first')}</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.agbya')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.firstTerm.agbya"
                        value={formData.degree.firstTerm.agbya}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.coptic')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.firstTerm.coptic"
                        value={formData.degree.firstTerm.coptic}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.hymns')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.firstTerm.hymns"
                        value={formData.degree.firstTerm.hymns}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.taks')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.firstTerm.taks"
                        value={formData.degree.firstTerm.taks}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>{t('terms.second')}</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.agbya')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.secondTerm.agbya"
                        value={formData.degree.secondTerm.agbya}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.coptic')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.secondTerm.coptic"
                        value={formData.degree.secondTerm.coptic}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.hymns')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.secondTerm.hymns"
                        value={formData.degree.secondTerm.hymns}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.taks')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.secondTerm.taks"
                        value={formData.degree.secondTerm.taks}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.attendance')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.secondTerm.attencance"
                        value={formData.degree.secondTerm.attencance || 0}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.result')}</Form.Label>

                      <Form.Control
                        type="number"
                        name="degree.secondTerm.result"
                        disabled={true}
                        value={formData.degree.secondTerm.result}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>{t('terms.third')}</Card.Header>
              <Card.Body>
                <Row>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.agbya')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.thirdTerm.agbya"
                        value={formData.degree.thirdTerm.agbya}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.coptic')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.thirdTerm.coptic"
                        value={formData.degree.thirdTerm.coptic}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.hymns')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.thirdTerm.hymns"
                        value={formData.degree.thirdTerm.hymns}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.taks')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.thirdTerm.taks"
                        value={formData.degree.thirdTerm.taks}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.attendance')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.thirdTerm.attencance"
                        value={formData.degree.thirdTerm.attencance}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('subjects.result')}</Form.Label>
                      <Form.Control
                        type="number"
                        name="degree.thirdTerm.result"
                        disabled={true}
                        value={formData.degree.thirdTerm.result}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={() => navigate('/users')}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" type="submit">
                {isEditMode ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserForm;

