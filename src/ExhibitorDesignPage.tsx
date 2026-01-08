import React, { useState, useEffect } from 'react';
import { ExhibitorManager } from './ExhibitorManager';
import type { Exhibitor } from './ExhibitorManager';

interface ExhibitorDesignPageProps {
  token: string;
}

/**
 * ExhibitorDesignPage - Dedicated landing page for exhibitors
 * Displays customer info and allows monterdesign selection with locked dimensions
 */
export const ExhibitorDesignPage: React.FC<ExhibitorDesignPageProps> = ({ token }) => {
  const [exhibitor, setExhibitor] = useState<Exhibitor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'design'>('design');

  useEffect(() => {
    // Hämta utställardata baserat på token
    const foundExhibitor = ExhibitorManager.getExhibitorByToken(token);
    
    if (!foundExhibitor) {
      setError('Ogiltig eller utgången inbjudningslänk');
      setIsLoading(false);
      return;
    }

    setExhibitor(foundExhibitor);
    setIsLoading(false);
  }, [token]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2>Laddar monterdesignern...</h2>
        </div>
      </div>
    );
  }

  if (error || !exhibitor) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ margin: '0 0 8px 0' }}>Länk är ogiltig</h2>
          <p style={{ color: '#666', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 100
      }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600' }}>
            🏗️ Monterdesign för {exhibitor!.companyName}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            📏 Monterspecifikation: {exhibitor!.monterDimensions.width}m × {exhibitor!.monterDimensions.depth}m × {exhibitor!.monterDimensions.height}m höjd
          </p>
        </div>
        <div style={{ fontSize: '24px' }}>🎨</div>
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '0'
      }}>
        <button
          onClick={() => setActiveTab('design')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'design' ? '#667eea' : 'transparent',
            color: activeTab === 'design' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'design' ? '600' : '500',
            transition: 'all 0.2s'
          }}
        >
          🎨 Designa monter
        </button>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'info' ? '#667eea' : 'transparent',
            color: activeTab === 'info' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'info' ? '600' : '500',
            transition: 'all 0.2s'
          }}
        >
          👤 Kunduppgifter
        </button>
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex'
      }}>
        {activeTab === 'design' ? (
          <DesignArea exhibitor={exhibitor!} />
        ) : (
          <CustomerInfoTab exhibitor={exhibitor!} />
        )}
      </div>
    </div>
  );
};

/**
 * Design Area - Shows monterdesign styles and customization
 */
const DesignArea: React.FC<{ exhibitor: Exhibitor }> = () => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [step, setStep] = useState<'style-select' | 'customize'>('style-select');

  const monterStyles = [
    {
      id: 'tech-startup',
      name: '💻 Tech Startup',
      description: 'Modern och minimalistisk design för tech-företag',
      preview: '🔷 Blå & silver accent'
    },
    {
      id: 'fashion-brand',
      name: '👗 Fashion Brand',
      description: 'Elegant design med fokus på styling',
      preview: '⚫ Svart & guld accent'
    },
    {
      id: 'food-company',
      name: '🍔 Mat & Dryck',
      description: 'Varm och välkomnande design',
      preview: '🟠 Orange & naturligt'
    },
    {
      id: 'wellness-spa',
      name: '🧘 Wellness & Spa',
      description: 'Lugn och harmonisk design',
      preview: '🟢 Grön & vit'
    },
    {
      id: 'minimal-design',
      name: '⬜ Minimal Design',
      description: 'Rent & sofistikerat',
      preview: '⚪ Vit & grå'
    }
  ];

  if (step === 'style-select') {
    return (
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Välj monterdesign-stil
        </h2>
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '14px',
          color: '#666'
        }}>
          Välj en design-stil för din monter som passar ditt varumärke
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {monterStyles.map((style) => (
            <div
              key={style.id}
              onClick={() => {
                setSelectedStyle(style.id);
                setStep('customize');
              }}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: selectedStyle === style.id ? '2px solid #667eea' : '1px solid #e0e0e0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedStyle === style.id ? '0 4px 12px rgba(102, 126, 234, 0.2)' : 'none'
              }}
            >
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {style.name}
              </h3>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '13px',
                color: '#666',
                lineHeight: '1.5'
              }}>
                {style.description}
              </p>
              <div style={{
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#555',
                fontWeight: '500'
              }}>
                {style.preview}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Customize step
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Left - Controls */}
      <div style={{
        width: '25%',
        backgroundColor: 'white',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '15px',
          fontWeight: '700',
          color: '#2c3e50'
        }}>
          🎨 Anpassning
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#555'
          }}>
            Väggfärg
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {['#ffffff', '#f0f0f0', '#e0e0e0', '#2c3e50', '#3498db', '#e74c3c', '#f39c12', '#27ae60'].map(color => (
              <button
                key={color}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  backgroundColor: color,
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#555'
          }}>
            Golvtyp
          </label>
          <select style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            <option>Ljus grå</option>
            <option>Mörk grå</option>
            <option>Svart</option>
            <option>Trä</option>
          </select>
        </div>

        <div style={{
          marginTop: 'auto',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setStep('style-select')}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#e0e0e0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            Tillbaka
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            💾 Spara
          </button>
        </div>
      </div>

      {/* Right - Preview */}
      <div style={{
        flex: 1,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: '16px'
      }}>
        📐 3D monterpreview kommer här
      </div>
    </div>
  );
};

/**
 * Customer Info Tab
 */
const CustomerInfoTab: React.FC<{ exhibitor: Exhibitor }> = ({ exhibitor }) => {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      maxWidth: '600px'
    }}>
      <h2 style={{
        margin: '0 0 24px 0',
        fontSize: '18px',
        fontWeight: '600',
        color: '#2c3e50'
      }}>
        👤 Kunduppgifter
      </h2>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '700',
            color: '#666',
            textTransform: 'uppercase',
            marginBottom: '6px'
          }}>
            Företag
          </label>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#2c3e50',
            fontWeight: '600'
          }}>
            {exhibitor.companyName}
          </p>
        </div>

        {exhibitor.contactPerson && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              Kontaktperson
            </label>
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: '#2c3e50'
            }}>
              {exhibitor.contactPerson}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '700',
            color: '#666',
            textTransform: 'uppercase',
            marginBottom: '6px'
          }}>
            E-post
          </label>
          <a href={`mailto:${exhibitor.email}`} style={{
            fontSize: '16px',
            color: '#3498db',
            textDecoration: 'none'
          }}>
            {exhibitor.email}
          </a>
        </div>

        {exhibitor.phone && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}>
              Telefon
            </label>
            <a href={`tel:${exhibitor.phone}`} style={{
              fontSize: '16px',
              color: '#3498db',
              textDecoration: 'none'
            }}>
              {exhibitor.phone}
            </a>
          </div>
        )}

        {/* Monterspecifikation */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            fontWeight: '700',
            color: '#2c3e50',
            textTransform: 'uppercase'
          }}>
            📏 Monterspecifikation
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px'
            }}>
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '11px',
                fontWeight: '700',
                color: '#666',
                textTransform: 'uppercase'
              }}>
                Bredd
              </p>
              <p style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {exhibitor.monterDimensions.width}m
              </p>
            </div>

            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px'
            }}>
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '11px',
                fontWeight: '700',
                color: '#666',
                textTransform: 'uppercase'
              }}>
                Djup
              </p>
              <p style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {exhibitor.monterDimensions.depth}m
              </p>
            </div>

            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px'
            }}>
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '11px',
                fontWeight: '700',
                color: '#666',
                textTransform: 'uppercase'
              }}>
                Höjd
              </p>
              <p style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {exhibitor.monterDimensions.height}m
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExhibitorDesignPage;
