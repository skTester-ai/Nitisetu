import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, FileText, CheckCircle2, Loader2, AlertCircle, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { scanDocument } from '../../services/api';

/**
 * Phase 4: Ephemeral Auto-Scan UI Component
 * Allows users to upload a document to auto-fill their profile.
 * Implements strict zero-retention consent logic.
 */
export default function DocumentScanner({ onDataExtracted }) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('7/12 Land Record');
  const [hasConsent, setHasConsent] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [landUnit, setLandUnit] = useState('Hectares'); // Default for Satbara
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [stream, setStream] = useState(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    setError('');
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(uploadedFile.type)) {
      setError('Only JPG and PNG images are supported.');
      return;
    }
    if (uploadedFile.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB.');
      return;
    }
    setFile(uploadedFile);
  };

  const clearFile = () => {
    setFile(null);
    setHasConsent(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!file || !hasConsent) return;
    
    setIsScanning(true);
    setError('');
    
    try {
      const response = await scanDocument(file, docType, landUnit);
      if (response.success && response.data) {
        onDataExtracted(response.data);
        clearFile();
      } else {
        setError(response.error || 'Failed to extract data.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Network error during scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const startLiveCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1280, height: 720 } 
      });
      setStream(mediaStream);
      setShowLiveCamera(true);
      // Wait for next tick to ensure ref is assigned if we just switched state
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setShowLiveCamera(false);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const capturedFile = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        setFile(capturedFile);
        stopLiveCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <div style={{ 
      margin: '24px 0', 
      padding: '24px', 
      background: 'rgba(99, 102, 241, 0.05)', 
      borderRadius: '16px', 
      border: '1px dashed var(--accent-indigo)' 
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} style={{ color: 'var(--accent-indigo)' }}/>
          Fast Fill via Document Scan (Optional)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Upload your 7/12 extract or ID card. Our AI will automatically extract your name, state, and land holding securely.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ marginBottom: error ? '12px' : '0' }}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <input 
              ref={fileInputRef} type="file" accept="image/jpeg, image/png" 
              onChange={handleChange} style={{ display: 'none' }} 
            />
            <input 
              ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              onChange={handleChange} style={{ display: 'none' }} 
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div 
                whileHover={{ y: -4 }}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={{ 
                  flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <FileImage size={24} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Gallery</span>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                onClick={(e) => { e.stopPropagation(); startLiveCamera(); }}
                style={{ 
                  flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px', 
                  background: 'var(--gradient-primary)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)',
                  cursor: 'pointer'
                }}
              >
                <Camera size={24} style={{ color: 'white' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>Live Camera</span>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4 }}
                onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                style={{ 
                  flex: 1, minWidth: '120px', padding: '16px', borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Upload size={24} style={{ color: 'var(--accent-indigo)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Native Cam</span>
              </motion.div>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
              Tap on an option to provide your document.
            </p>
          </motion.div>
        ) : showLiveCamera ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ 
              position: 'relative', borderRadius: '14px', overflow: 'hidden', 
              background: '#000', border: '1px solid var(--border-glass)',
              aspectRatio: '16/9'
            }}
          >
            <video 
              ref={videoRef} autoPlay playsInline 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div style={{ position: 'absolute', inset: 0, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={stopLiveCamera} 
                  style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '16px' }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={captureFrame}
                  style={{ 
                    width: '64px', height: '64px', borderRadius: '50%', background: 'white', 
                    border: '4px solid rgba(99, 102, 241, 0.5)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #333' }} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{
              padding: '16px',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} style={{ color: 'var(--accent-indigo)' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button onClick={clearFile} disabled={isScanning} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Document Type</label>
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value)}
                disabled={isScanning}
                className="select-dark"
                style={{ fontSize: '0.9rem', padding: '8px 12px', width: '100%' }}
              >
                <option value="7/12 Land Record">7/12 Land Record (Satbara)</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Kisan Credit Card">Kisan Credit Card</option>
                <option value="Other Official ID">Other Official ID</option>
              </select>
            </div>

            {docType === '7/12 Land Record' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Land Unit on Document</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['Hectares', 'Acres'].map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setLandUnit(unit)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: landUnit === unit ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.05)',
                        color: landUnit === unit ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${landUnit === unit ? 'var(--accent-indigo)' : 'var(--border-glass)'}`
                      }}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '12px', background: 'rgba(255,165,0,0.05)', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.2)' }}>
              <input 
                type="checkbox" 
                checked={hasConsent} 
                onChange={(e) => setHasConsent(e.target.checked)}
                disabled={isScanning}
                style={{ marginTop: '2px', accentColor: 'var(--accent-indigo)' }} 
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Privacy Consent:</strong> I agree to have this document temporarily scanned by AI to fill my profile. I understand the image will be <strong>permanently and immediately deleted</strong> from the server after scanning.
              </span>
            </label>

            <button
              onClick={handleScan}
              disabled={!hasConsent || isScanning}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                opacity: (!hasConsent || isScanning) ? 0.6 : 1,
                cursor: (!hasConsent || isScanning) ? 'not-allowed' : 'pointer'
              }}
            >
              {isScanning ? (
                <>
                  <Loader2 size={16} className="spin" /> Scanning Document securely...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Scan & Auto-Fill
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', margin: '12px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <AlertCircle size={14} /> {error}
        </motion.p>
      )}
    </div>
  );
}
