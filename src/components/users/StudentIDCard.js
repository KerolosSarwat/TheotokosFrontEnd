import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// ⚠️ IMPORTANT: ALL styles must be inline JS objects — NO Tailwind / CSS classes.
// html-to-image captures DOM snapshots WITHOUT loading external stylesheets.
// Any class-based style will be invisible in exported PNG images.

const StudentIDCard = ({ user, additionalInfo, designConfig = {} }) => {
    const gradient = `linear-gradient(90deg, ${designConfig.headerBgStart || '#0d9488'} 0%, ${designConfig.headerBgEnd || '#84cc16'} 100%)`;

    return (
        <div
            className="id-card"
            style={{
                width: '85.6mm',
                height: '53.98mm',
                position: 'relative',
                backgroundColor: designConfig.cardBg || '#ffffff',
                fontFamily: '"Cairo", "Segoe UI", sans-serif',
                direction: 'rtl',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #d1d5db',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                boxSizing: 'border-box',
            }}
        >
            {/* Background Image Layer */}
            {designConfig.bgImageUrl && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: `url(${designConfig.bgImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: designConfig.bgImageOpacity ?? 0.1,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />
            )}

            {/* Header Bar */}
            <div style={{ height: '10mm', background: gradient, width: '100%', flexShrink: 0, position: 'relative', zIndex: 1 }} />

            {/* Content Area */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 4mm',
                    position: 'relative',
                    zIndex: 1,
                    overflow: 'hidden',
                }}
            >
                {/* Text Details (right side in RTL) */}
                <div style={{ flex: 1, textAlign: 'right', overflow: 'hidden' }}>
                    {/* Student Name */}
                    <div
                        style={{
                            color: designConfig.primaryText || '#3b82f6',
                            fontWeight: 'bold',
                            fontSize: '11pt',
                            marginBottom: '1.5mm',
                            lineHeight: 1.2,
                        }}
                    >
                        {user.fullName}
                    </div>

                    {/* Level Row */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1mm' }}>
                        <span style={{ color: designConfig.labelColor || '#1e40af', fontWeight: 'bold', fontSize: '9pt', minWidth: '22mm', flexShrink: 0 }}>المرحلة</span>
                        <span style={{ color: designConfig.valueColor || '#111827', fontSize: '8.5pt', fontWeight: '500' }}>{user.level}</span>
                    </div>

                    {/* Location Row */}
                    {additionalInfo?.location && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1mm' }}>
                            <span style={{ color: designConfig.labelColor || '#1e40af', fontWeight: 'bold', fontSize: '9pt', minWidth: '22mm', flexShrink: 0 }}>مكان الفصل</span>
                            <span dir="auto" style={{ color: designConfig.valueColor || '#111827', fontSize: '8.5pt', fontWeight: '500', lineHeight: 1.3 }}>{additionalInfo.location}</span>
                        </div>
                    )}

                    {/* Time Row */}
                    {additionalInfo?.time && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1mm' }}>
                            <span style={{ color: designConfig.labelColor || '#1e40af', fontWeight: 'bold', fontSize: '9pt', minWidth: '22mm', flexShrink: 0 }}>الميعاد</span>
                            <span dir="ltr" style={{ color: designConfig.valueColor || '#111827', fontSize: '8.5pt', fontWeight: '500' }}>{additionalInfo.time}</span>
                        </div>
                    )}

                    {/* Saint Row */}
                    {additionalInfo?.saint && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1mm' }}>
                            <span style={{ color: designConfig.labelColor || '#1e40af', fontWeight: 'bold', fontSize: '9pt', minWidth: '22mm', flexShrink: 0 }}>شفيع الفصل</span>
                            <span style={{ color: designConfig.valueColor || '#111827', fontSize: '8.5pt', fontWeight: '500' }}>{additionalInfo.saint}</span>
                        </div>
                    )}
                </div>

                {/* QR Code (left side in RTL) */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '3mm',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        padding: '2mm',
                        borderRadius: '2mm',
                        flexShrink: 0,
                    }}
                >
                    <QRCodeSVG
                        value={user.code || '0000'}
                        size={75}
                        level="H"
                        bgColor="rgba(255,255,255,0)"
                    />
                    <span style={{ marginTop: '1mm', fontSize: '8pt', fontWeight: 'bold', color: '#111827', letterSpacing: '0.5px' }}>
                        {user.code}
                    </span>
                </div>
            </div>

            {/* Footer Bar */}
            <div style={{ height: '10mm', background: gradient, width: '100%', flexShrink: 0, position: 'relative', zIndex: 1 }} />

            {/* Print styles — only affect browser print, not html-to-image */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section, #print-section * { visibility: visible; }
                    #print-section {
                        position: absolute; left: 0; top: 0;
                        width: 100%; height: 100%;
                        display: flex; align-items: center; justify-content: center;
                        background-color: white;
                    }
                    .id-card { border: none !important; box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
};

export default StudentIDCard;
