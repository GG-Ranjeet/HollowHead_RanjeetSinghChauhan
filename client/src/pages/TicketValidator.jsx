import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Hash, Camera, CameraOff, CheckCircle2, XCircle, AlertTriangle, RotateCcw, ScanLine, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TicketValidator.css';

const MODES = {
  QR_SCAN: 'qr_scan',
  MANUAL_ID: 'manual_id',
};

const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ALREADY_CHECKED: 'already_checked',
  NOT_STARTED: 'not_started',
  ERROR: 'error',
};

function ResultBanner({ status, message, onReset }) {
  if (status === STATUS.IDLE || status === STATUS.LOADING) return null;

  const cfg = {
    [STATUS.SUCCESS]:       { icon: CheckCircle2,  cls: 'result-success',     label: 'Ticket Accepted ✓' },
    [STATUS.ALREADY_CHECKED]: { icon: AlertTriangle, cls: 'result-warn',        label: 'Already Used' },
    [STATUS.NOT_STARTED]:   { icon: Clock,          cls: 'result-not-started', label: 'Event Not Started Yet' },
    [STATUS.ERROR]:         { icon: XCircle,        cls: 'result-error',       label: 'Invalid Ticket' },
  }[status];

  const Icon = cfg.icon;

  return (
    <div className={`result-banner ${cfg.cls}`}>
      <Icon size={40} />
      <div className="result-label">{cfg.label}</div>
      <div className="result-message">{message}</div>
      <button className="btn btn-secondary result-reset-btn" onClick={onReset}>
        <RotateCcw size={16} /> Try Again
      </button>
    </div>
  );
}

export default function TicketValidator() {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState(MODES.QR_SCAN);

  // QR Scanner state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [scanStatus, setScanStatus] = useState(STATUS.IDLE);
  const [scanMessage, setScanMessage] = useState('');
  const scannerRef = useRef(null);
  const scanLockRef = useRef(false); // prevent double-firing

  // Manual ID state
  const [manualInput, setManualInput] = useState('');
  const [manualType, setManualType] = useState('ticketId'); // 'ticketId' | 'qrToken'
  const [manualStatus, setManualStatus] = useState(STATUS.IDLE);
  const [manualMessage, setManualMessage] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // ─── Auth helper ────────────────────────────────────────────────
  const getAuthHeaders = useCallback(async () => {
    const token = await currentUser.getIdToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [currentUser]);

  // ─── Call backend check-in / validate APIs ──────────────────────
  const callCheckin = useCallback(async (qrToken) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/tickets/checkin', {
      method: 'POST',
      headers,
      body: JSON.stringify({ qrToken }),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  }, [getAuthHeaders]);

  const callValidateById = useCallback(async (ticketId) => {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/tickets/validate-by-id', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ticketId }),
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  }, [getAuthHeaders]);

  // ─── Process a scanned QR code string ──────────────────────────
  const handleQRScan = useCallback(async (decodedText) => {
    if (scanLockRef.current || scanStatus !== STATUS.IDLE) return;
    scanLockRef.current = true;
    setScanStatus(STATUS.LOADING);
    setScanMessage('Validating ticket…');

    try {
      const { ok, status, data } = await callCheckin(decodedText.trim());
      if (ok) {
        setScanStatus(STATUS.SUCCESS);
        setScanMessage(data.message || 'Ticket checked in successfully!');
      } else if (data.alreadyCheckedIn) {
        setScanStatus(STATUS.ALREADY_CHECKED);
        setScanMessage(data.error);
      } else if (data.eventNotStarted) {
        setScanStatus(STATUS.NOT_STARTED);
        const startsAt = data.startsAt ? new Date(data.startsAt).toLocaleString() : '';
        setScanMessage(startsAt ? `Doors open at ${startsAt}` : data.error);
      } else {
        setScanStatus(STATUS.ERROR);
        setScanMessage(data.error || 'This QR code is not valid.');
      }
    } catch {
      setScanStatus(STATUS.ERROR);
      setScanMessage('Network error. Please try again.');
      scanLockRef.current = false;
    }
  }, [callCheckin, scanStatus]);

  // ─── Camera lifecycle ───────────────────────────────────────────
  const startCamera = useCallback(async () => {
    const qrRegionId = 'qr-reader-region';
    if (scannerRef.current) return; // already running

    const scanner = new Html5Qrcode(qrRegionId);
    scannerRef.current = scanner;
    setScanStatus(STATUS.IDLE);
    setScanMessage('');
    scanLockRef.current = false;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleQRScan(decodedText),
        () => {} // errors are expected frames — ignore
      );
      setIsCameraOn(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setScanStatus(STATUS.ERROR);
      setScanMessage('Could not access camera. Check permissions.');
      scannerRef.current = null;
    }
  }, [handleQRScan]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setIsCameraOn(false);
  }, []);

  // Stop camera when switching modes
  useEffect(() => {
    if (mode !== MODES.QR_SCAN) {
      stopCamera();
    }
  }, [mode, stopCamera]);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const resetScanState = () => {
    setScanStatus(STATUS.IDLE);
    setScanMessage('');
    scanLockRef.current = false;
  };

  // ─── Manual submission ──────────────────────────────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const value = manualInput.trim();
    if (!value) return;

    setManualLoading(true);
    setManualStatus(STATUS.LOADING);
    setManualMessage('');

    try {
      let result;
      if (manualType === 'ticketId') {
        result = await callValidateById(value);
      } else {
        result = await callCheckin(value);
      }

      const { ok, data } = result;
      if (ok) {
        setManualStatus(STATUS.SUCCESS);
        setManualMessage(data.message || 'Ticket validated successfully!');
      } else if (data.alreadyCheckedIn) {
        setManualStatus(STATUS.ALREADY_CHECKED);
        setManualMessage(data.error);
      } else if (data.eventNotStarted) {
        setManualStatus(STATUS.NOT_STARTED);
        const startsAt = data.startsAt ? new Date(data.startsAt).toLocaleString() : '';
        setManualMessage(startsAt ? `Doors open at ${startsAt}` : data.error);
      } else {
        setManualStatus(STATUS.ERROR);
        setManualMessage(data.error || 'Could not validate this ticket.');
      }
    } catch {
      setManualStatus(STATUS.ERROR);
      setManualMessage('Network error. Please try again.');
    } finally {
      setManualLoading(false);
    }
  };

  const resetManualState = () => {
    setManualInput('');
    setManualStatus(STATUS.IDLE);
    setManualMessage('');
  };

  return (
    <div className="tv-page container" style={{ paddingTop: '2rem', maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div className="tv-header">
        <div>
          <h1 className="tv-title"><ScanLine className="tv-title-icon" size={32} /> Ticket Validator</h1>
          <p className="tv-subtitle">Validate attendee tickets at the venue entrance.</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="tv-mode-toggle">
        <button
          className={`tv-mode-btn ${mode === MODES.QR_SCAN ? 'active' : ''}`}
          onClick={() => setMode(MODES.QR_SCAN)}
        >
          <Camera size={18} /> QR Camera Scanner
        </button>
        <button
          className={`tv-mode-btn ${mode === MODES.MANUAL_ID ? 'active' : ''}`}
          onClick={() => setMode(MODES.MANUAL_ID)}
        >
          <Hash size={18} /> Manual ID Entry
        </button>
      </div>

      {/* ── QR SCANNER PANEL ── */}
      {mode === MODES.QR_SCAN && (
        <div className="tv-panel animate-fade-in">
          <div className="tv-scanner-wrap">
            {/* The html5-qrcode mounts into this div by ID */}
            <div id="qr-reader-region" className={`qr-region ${isCameraOn ? 'active' : ''}`} />

            {!isCameraOn && scanStatus !== STATUS.SUCCESS && scanStatus !== STATUS.ALREADY_CHECKED && scanStatus !== STATUS.NOT_STARTED && scanStatus !== STATUS.ERROR && (
              <div className="qr-placeholder">
                <QrCode size={72} className="qr-placeholder-icon" />
                <p>Point camera at attendee's QR code</p>
                <button className="btn btn-primary tv-cam-btn" onClick={startCamera}>
                  <Camera size={18} /> Start Camera
                </button>
              </div>
            )}

            {isCameraOn && scanStatus === STATUS.IDLE && (
              <div className="qr-overlay-bar">
                <span className="scanning-pulse" /> Scanning…
                <button className="btn btn-secondary tv-cam-stop" onClick={stopCamera}>
                  <CameraOff size={16} /> Stop
                </button>
              </div>
            )}

            {isCameraOn && scanStatus === STATUS.LOADING && (
              <div className="qr-overlay-bar loading">Validating ticket…</div>
            )}

            {/* Result overlay on top of scanner */}
            {(scanStatus === STATUS.SUCCESS || scanStatus === STATUS.ALREADY_CHECKED || scanStatus === STATUS.NOT_STARTED || scanStatus === STATUS.ERROR) && (
              <div className="qr-result-overlay">
                <ResultBanner
                  status={scanStatus}
                  message={scanMessage}
                  onReset={() => { resetScanState(); }}
                />
              </div>
            )}
          </div>

          {isCameraOn && (scanStatus === STATUS.SUCCESS || scanStatus === STATUS.ALREADY_CHECKED || scanStatus === STATUS.NOT_STARTED || scanStatus === STATUS.ERROR) && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={stopCamera}><CameraOff size={16} /> Close Camera</button>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL ENTRY PANEL ── */}
      {mode === MODES.MANUAL_ID && (
        <div className="tv-panel animate-fade-in">
          <div className="tv-manual-wrap">
            <h3 className="tv-manual-title">Enter Ticket Details</h3>

            {/* Type selector */}
            <div className="tv-type-selector">
              <label className={`tv-type-opt ${manualType === 'ticketId' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="manualType"
                  value="ticketId"
                  checked={manualType === 'ticketId'}
                  onChange={() => { setManualType('ticketId'); resetManualState(); }}
                />
                <Hash size={16} /> Ticket ID
              </label>
              <label className={`tv-type-opt ${manualType === 'qrToken' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="manualType"
                  value="qrToken"
                  checked={manualType === 'qrToken'}
                  onChange={() => { setManualType('qrToken'); resetManualState(); }}
                />
                <QrCode size={16} /> QR Token
              </label>
            </div>

            {manualStatus === STATUS.IDLE || manualStatus === STATUS.LOADING ? (
              <form className="tv-manual-form" onSubmit={handleManualSubmit}>
                <div className="form-group">
                  <label className="tv-input-label">
                    {manualType === 'ticketId' ? 'Ticket Document ID' : 'QR Token (UUID)'}
                  </label>
                  <input
                    type="text"
                    className="form-input tv-manual-input"
                    placeholder={
                      manualType === 'ticketId'
                        ? 'e.g. 4xZkA81Lmn7Qrp2Wtv9...'
                        : 'e.g. 550e8400-e29b-41d4-a716-446655440000'
                    }
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    disabled={manualLoading}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <small className="tv-input-hint">
                    {manualType === 'ticketId'
                      ? 'Found on the ticket card or PDF under "Ticket ID".'
                      : 'The UUID embedded in the QR code on the attendee\'s ticket.'}
                  </small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary tv-validate-btn"
                  disabled={manualLoading || !manualInput.trim()}
                >
                  {manualLoading ? (
                    <><span className="spinner" /> Validating…</>
                  ) : (
                    <><CheckCircle2 size={18} /> Validate Ticket</>
                  )}
                </button>
              </form>
            ) : (
              <div className="tv-manual-result">
                <ResultBanner status={manualStatus} message={manualMessage} onReset={resetManualState} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="tv-help-card">
        <h4>How it works</h4>
        <ul>
          <li><strong>QR Camera Scanner</strong> — Open camera and point at the QR code on the attendee's e-ticket. Validation is instant.</li>
          <li><strong>Ticket ID</strong> — Type or paste the Firestore document ID from the attendee's ticket card.</li>
          <li><strong>QR Token</strong> — Enter the UUID from the QR code manually if the camera is unavailable.</li>
          <li><strong>Event must be active</strong> — Tickets can only be validated after the event's scheduled start time.</li>
          <li>Each ticket is single-use. Once validated it is permanently marked as used and cannot be scanned again.</li>
        </ul>
      </div>
    </div>
  );
}
