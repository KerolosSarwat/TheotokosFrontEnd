import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

// Conversion: 1mm ≈ 3.7795px at 96dpi
const MM_TO_PX = 3.7795;

// Available fields metadata for label mapping
const FIELD_LABELS = {
    fullName: 'idCard.fields.fullName',
    code: 'idCard.fields.code',
    level: 'idCard.fields.level',
    phoneNumber: 'idCard.fields.phoneNumber',
    church: 'idCard.fields.church',
    address: 'idCard.fields.address',
    gender: 'idCard.fields.gender',
    birthdate: 'idCard.fields.birthdate',
};

const DynamicIDCard = ({ user, config, id }) => {
    const { t } = useTranslation();

    if (!user || !config) return null;

    const widthMM = config.width || 85.6;
    const heightMM = config.height || 53.98;
    const widthPx = widthMM * MM_TO_PX;
    const heightPx = heightMM * MM_TO_PX;

    // Fields to display (excluding fullName and code which are shown specially)
    const selectedFields = config.selectedFields || ['fullName', 'code', 'level', 'church'];
    const detailFields = selectedFields.filter(f => f !== 'fullName' && f !== 'code');
    const showName = selectedFields.includes('fullName');
    const showCode = selectedFields.includes('code');

    // Calculate responsive sizes based on card dimensions
    const baseFontScale = Math.min(widthPx, heightPx) / 200;
    const nameFontSize = Math.max(10, 14 * baseFontScale);
    const labelFontSize = Math.max(7, 10 * baseFontScale);
    const valueFontSize = Math.max(6, 9 * baseFontScale);
    const qrSize = Math.max(50, Math.min(90, heightPx * 0.35));

    const cardStyles = {
        container: {
            width: `${widthPx}px`,
            height: `${heightPx}px`,
            position: 'relative',
            overflow: 'hidden',
            fontFamily: '"Cairo", "Segoe UI", sans-serif',
            direction: 'rtl',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            border: '1px solid #e0e0e0',
        },
        backgroundImage: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
        },
        // Fallback gradient header/footer when no background is set
        headerFooter: {
            height: `${heightPx * 0.15}px`,
            background: 'linear-gradient(90deg, #0d9488 0%, #84cc16 100%)',
            width: '100%',
            zIndex: 1,
            flexShrink: 0,
        },
        content: {
            flex: 1,
            display: 'flex',
            padding: `0 ${widthPx * 0.04}px`,
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
        },
        details: {
            flex: 1,
            marginRight: `${widthPx * 0.03}px`,
            zIndex: 1,
            textAlign: 'right',
            overflow: 'hidden',
        },
        name: {
            color: '#1e40af',
            fontWeight: 'bold',
            fontSize: `${nameFontSize}pt`,
            marginBottom: `${heightPx * 0.02}px`,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        row: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: `${heightPx * 0.012}px`,
        },
        label: {
            color: '#1e40af',
            fontWeight: 'bold',
            fontSize: `${labelFontSize}pt`,
            minWidth: `${widthPx * 0.15}px`,
            flexShrink: 0,
        },
        value: {
            color: '#1f2937',
            fontSize: `${valueFontSize}pt`,
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
        qrContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            flexShrink: 0,
        },
        codeText: {
            marginTop: `${heightPx * 0.01}px`,
            fontSize: `${valueFontSize}pt`,
            fontWeight: 'bold',
            color: '#374151',
        },
    };

    // Format field value for display
    const formatFieldValue = (field, value) => {
        if (!value) return '—';
        if (field === 'gender') {
            return value === 'Male' ? t('common.male') : t('common.female');
        }
        return String(value);
    };

    // Get Arabic/English label for a field
    const getFieldLabel = (field) => {
        return t(FIELD_LABELS[field] || field);
    };

    const hasBackground = !!config.backgroundUrl;

    return (
        <div className="dynamic-id-card" id={id} style={cardStyles.container}>
            {/* Background Image or Fallback */}
            {hasBackground ? (
                <img
                    src={config.backgroundUrl}
                    alt=""
                    style={cardStyles.backgroundImage}
                    crossOrigin="anonymous"
                />
            ) : (
                <div style={cardStyles.headerFooter}></div>
            )}

            <div style={cardStyles.content}>
                {/* User Details */}
                <div style={cardStyles.details}>
                    {showName && (
                        <div style={cardStyles.name}>{user.fullName || '—'}</div>
                    )}

                    {detailFields.map((field) => (
                        <div key={field} style={cardStyles.row}>
                            <span style={cardStyles.label}>{getFieldLabel(field)}</span>
                            <span style={cardStyles.value}>
                                {formatFieldValue(field, user[field])}
                            </span>
                        </div>
                    ))}
                </div>

                {/* QR Code */}
                <div style={cardStyles.qrContainer}>
                    <QRCodeSVG
                        value={user.code || '0000'}
                        size={qrSize}
                        level="H"
                        bgColor="transparent"
                    />
                    {showCode && (
                        <span style={cardStyles.codeText}>{user.code}</span>
                    )}
                </div>
            </div>

            {/* Footer gradient fallback (only when no background) */}
            {!hasBackground && (
                <div style={cardStyles.headerFooter}></div>
            )}

            {/* Print-specific styles */}
            <style>{`
                @media print {
                    .dynamic-id-card {
                        border: none !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
};

export default DynamicIDCard;
