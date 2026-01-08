import React, { useState, useEffect } from 'react';
import { ExhibitorManager } from './ExhibitorManager';
import type { Exhibitor } from './ExhibitorManager';
import ExhibitorDesignPage from './ExhibitorDesignPage';

interface ExhibitorPortalProps {
  onClose?: () => void;
}

export const ExhibitorPortal: React.FC<ExhibitorPortalProps> = ({ onClose }) => {
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');

    if (!token) {
      setError('Ingen giltig inbjudningslänk. Vänligen kontakta administratören.');
      setLoading(false);
      return;
    }

    // Find exhibitor by token
    const foundExhibitor = ExhibitorManager.getExhibitorByToken(token);
    
    if (!foundExhibitor) {
      setError('Utställaren hittades inte. Vänligen kontakta administratören.');
      setLoading(false);
      return;
    }

    setExhibitor(foundExhibitor);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Laddar utställarinformation...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#e74c3c',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h2>Fel</h2>
          <p>{error}</p>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Tillbaka
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!exhibitor) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Utställare hittades inte
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header med utställarinfo */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
            {exhibitor.companyName || exhibitor.name}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            {exhibitor.contactPerson && `Kontakt: ${exhibitor.contactPerson}`}
            {exhibitor.email && ` • ${exhibitor.email}`}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ✕ Stäng
          </button>
        )}
      </div>

      {/* Booth Design Page */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ExhibitorDesignPage
          token={exhibitor.token}
        />
      </div>
    </div>
  );
};

export default ExhibitorPortal;
