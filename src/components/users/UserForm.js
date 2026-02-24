import { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';
import { FaUser, FaChurch, FaUserPlus, FaChevronLeft, FaRegAddressBook } from 'react-icons/fa';
import './UserForm.css';

const UserForm = () => {
  const { t } = useTranslation();
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
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
    memberLevel: 'Member',
    address: '',
    admin: false,
    active: false,
    degree: {
      firstTerm: {
        agbya: 0,
        coptic: 0,
        hymns: 0,
        taks: 0,
        attencance: 0,
        total: 0
      },
      secondTerm: {
        agbya: 0,
        attencance: 0,
        coptic: 0,
        hymns: 0,
        taks: 0,
        total: 0
      },
      thirdTerm: {
        agbya: 0,
        attencance: 0,
        coptic: 0,
        hymns: 0,
        taks: 0,
        total: 0
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
          const userData = await userService.getUserByCode(code, type);
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
  }, [code, isEditMode, type]);

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
        await userService.updateUser(code, formData, type);
        setSuccess(true);
        setTimeout(() => navigate(type === 'pending' ? '/penddingusers' : `/users/${code}`), 1500);
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
    return <div className="text-center mt-5"><div className="spinner-border text-danger" role="status"></div></div>;
  }

  const memberLevelOptions = [
    { id: 'Member', label: 'Member' },
    { id: 'Deacon', label: 'Deacon' },
    { id: 'Elder', label: 'Elder' },
    { id: 'Youth Leader', label: 'Youth Leader' }
  ];

  return (
    <div className="user-form-container">
      <div className="form-header">
        <Link to="/users" className="back-button">
          <FaChevronLeft className="me-1" /> {t('common.back')}
        </Link>
        <h2 className="form-title">{t('users.memberRegistration')}</h2>
      </div>

      <div className="progress-steps">
        <div className="progress-step active"></div>
        <div className="progress-step"></div>
        <div className="progress-step"></div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{isEditMode ? 'User updated successfully!' : 'User created successfully!'}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Personal Information Section */}
        <div className="form-section-card">
          <div className="section-header">
            <div className="section-icon">
              <FaUser />
            </div>
            {t('users.personalInfo')}
          </div>

          <Form.Group className="mb-4">
            <Form.Label className="form-label-custom">{t('users.fullName')} *</Form.Label>
            <Form.Control
              className="form-control-custom"
              type="text"
              name="fullName"
              placeholder="e.g. Johnathan Doe"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <div className="row mb-4">
            <div className="col-6">
              <Form.Group>
                <Form.Label className="form-label-custom">{t('users.code')}</Form.Label>
                <Form.Control
                  className="form-control-custom"
                  type="text"
                  name="code"
                  value={isEditMode ? formData.code : formatDateTime(new Date()).toString()}
                  onChange={handleChange}
                  required
                  disabled={true}
                />
              </Form.Group>
            </div>
            <div className="col-6">
              <Form.Group>
                <Form.Label className="form-label-custom">{t('common.gender')}</Form.Label>
                <Form.Select
                  className="form-control-custom"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="Male">{t('common.male')}</option>
                  <option value="Female">{t('common.female')}</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-6">
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">{t('users.educationLevel')}</Form.Label>
                <Form.Select
                  className="form-control-custom"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                >
                  <option value="">{t('common.select')}</option>
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
            </div>
            <div className="col-6">
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">{t('common.birthdate')}</Form.Label>
                <Form.Control
                  className="form-control-custom"
                  type="date"
                  name="birthdate"
                  value={formData.birthdate || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </div>
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="form-section-card">
          <div className="section-header">
            <div className="section-icon">
              <FaRegAddressBook />
            </div>
            {t('users.contactDetails')}
          </div>

          <Form.Group className="mb-4">
            <Form.Label className="form-label-custom">{t('users.phone')}</Form.Label>
            <Form.Control
              className="form-control-custom"
              type="text"
              name="phoneNumber"
              placeholder="+1 (555) 000-0000"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="form-label-custom">{t('common.address')}</Form.Label>
            <Form.Control
              className="form-control-custom"
              as="textarea"
              rows={3}
              name="address"
              placeholder="Street name, City, State..."
              value={formData.address || ''}
              onChange={handleChange}
            />
          </Form.Group>
        </div>

        {/* Church Details Section */}
        <div className="form-section-card">
          <div className="section-header">
            <div className="section-icon">
              <FaChurch />
            </div>
            {t('users.churchDetails')}
          </div>

          <Form.Group className="mb-4">
            <Form.Label className="form-label-custom">{t('users.selectChurch')}</Form.Label>
            <Form.Select
              className="form-control-custom"
              name="church"
              value={formData.church}
              onChange={handleChange}
            >
              <option value="">{t('common.select')}</option>
              <option value="العذراء مريم و الشهيد أبانوب">العذراء مريم و الشهيد أبانوب</option>
              <option value="الأنبا كاراس السائح">الأنبا كاراس السائح</option>
              <option value="الأنبا موسى الأسود">الأنبا موسى الأسود</option>
              <option value="القديس سمعان الخراز">القديس سمعان الخراز</option>
              <option value="العذراء مريم و الأنبا صموئيل">العذراء مريم و الأنبا صموئيل</option>
              <option value="الأنبا شنودة الهضبة العليا">الأنبا شنودة الهضبة العليا</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="form-label-custom">{t('users.memberLevel')}</Form.Label>
            <div className="member-level-options">
              {memberLevelOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={`member-level-btn ${formData.memberLevel === option.id ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, memberLevel: option.id }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Form.Group>

          <div className="mt-3">
            <Form.Check
              type="checkbox"
              label={t('common.active')}
              name="active"
              checked={formData.active || false}
              onChange={handleChange}
              className="mb-2"
            />
            <Form.Check
              type="checkbox"
              label={t('common.admin')}
              name="admin"
              checked={formData.admin || false}
              onChange={handleChange}
            />
          </div>
        </div>

        <p className="footer-text">
          By submitting this registration, you agree to our church membership policies and data privacy guidelines.
        </p>

        <Button className="submit-btn-custom" type="submit">
          <FaUserPlus />
          {isEditMode ? t('common.update') : t('users.submitRegistration')}
        </Button>
      </Form>
    </div>
  );
};

export default UserForm;

