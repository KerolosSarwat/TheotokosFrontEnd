import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Styles for the ID Card
const styles = {
    cardContainer: {
        width: '85.6mm', // Credit card width
        height: '53.98mm', // Credit card height
        position: 'relative',
        backgroundColor: '#fff',
        fontFamily: '"Cairo", sans-serif', // Assuming Cairo font is used, otherwise fallback
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        border: '1px solid #ddd', // Light border for screen visibility
        margin: '0 auto',
    },
    headerFooter: {
        height: '10mm',
        background: 'linear-gradient(90deg, #0d9488 0%, #84cc16 100%)', // Teal to Lime gradient
        width: '100%',
    },
    content: {
        flex: 1,
        display: 'flex',
        padding: '0 5mm',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
    },
    watermark: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.1,
        width: '50%',
        zIndex: 0,
        pointerEvents: 'none',
    },
    details: {
        flex: 1,
        marginRight: '5mm', // Space between QR and text
        zIndex: 1,
        textAlign: 'right',
    },
    name: {
        color: '#3b82f6', // Blue color
        fontWeight: 'bold',
        fontSize: '12pt',
        marginBottom: '2mm',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1.5mm',
    },
    label: {
        color: '#1e40af', // Darker blue for labels
        fontWeight: 'bold',
        fontSize: '10pt',
        minWidth: '25mm',
    },
    value: {
        color: '#000',
        fontSize: '9pt',
        fontWeight: '500',
    },
    qrContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    code: {
        marginTop: '1mm',
        fontSize: '9pt',
        fontWeight: 'bold',
    }
};

const StudentIDCard = ({ user, additionalInfo }) => {
    // const { t } = useTranslation();

    // Format data
    // Assuming user.fullName, user.level, user.church are available

    return (
        <div className="id-card" style={styles.cardContainer}>
            <div style={styles.headerFooter}></div>

            <div style={styles.content}>
                {/* Helper image for watermark - simplistic placeholder if no actual image asset specifically for watermark */}
                {/* <img src="/logo.png" style={styles.watermark} alt="" /> */}

                <div style={styles.details}>
                    <div style={styles.name}>{user.fullName}</div>

                    <div style={styles.row}>
                        <span style={styles.label}>المرحلة</span>
                        <span style={styles.value}>{user.level}</span>
                    </div>

                    {(additionalInfo?.location) && (
                        <div style={styles.row}>
                            <span style={styles.label}>مكان الفصل</span>
                            <span style={styles.value} dir="ltr">{additionalInfo.location}</span>
                        </div>
                    )}
                    {(additionalInfo?.time) && (
                        <div style={styles.row}>
                            <span style={styles.label}>الميعاد</span>
                            <span style={styles.value} dir="ltr">{additionalInfo.time}</span>
                        </div>
                    )}

                    {(additionalInfo?.saint) && (
                        <div style={styles.row}>
                            <span style={styles.label}>شفيع الفصل</span>
                            <span style={styles.value}>{additionalInfo.saint}</span>
                        </div>
                    )}
                </div>

                <div style={styles.qrContainer}>
                    <QRCodeSVG
                        value={user.code || "0000"}
                        size={80}
                        level={"H"}
                    />
                    <span style={styles.code}>{user.code}</span>
                </div>
            </div>

            <div style={styles.headerFooter}></div>

            {/* Print specific styles to hide browser UI */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white; /* Ensure background is white for printing */
          }
          .id-card {
             border: none !important; /* Remove border for print if desired */
             box-shadow: none !important;
          }
        }
      `}</style>
        </div>
    );
};

export default StudentIDCard;
