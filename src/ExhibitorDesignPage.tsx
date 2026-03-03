import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
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
  
  // 3D State
  const [wallShape, setWallShape] = useState<'straight' | 'l' | 'u' | ''>('straight');
  const [carpet, setCarpet] = useState(0);
  const [furniture, setFurniture] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);

  useEffect(() => {
    // Hämta utställardata baserat på token
    const foundExhibitor = ExhibitorManager.getExhibitorByToken(token);
    
    if (!foundExhibitor) {
      setError('Ogiltig eller utgången inbjudningslänk');
      setIsLoading(false);
      return;
    }

    setExhibitor(foundExhibitor);
    
    // Load existing boothConfig if available
    if (foundExhibitor.boothConfig) {
      setFurniture(foundExhibitor.boothConfig.furniture || []);
      // You can load more config here
    }
    
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
          <DesignArea 
            exhibitor={exhibitor!}
            wallShape={wallShape}
            setWallShape={setWallShape}
            carpet={carpet}
            setCarpet={setCarpet}
            furniture={furniture}
            setFurniture={setFurniture}
            counters={counters}
            setCounters={setCounters}
          />
        ) : (
          <CustomerInfoTab exhibitor={exhibitor!} />
        )}
      </div>
    </div>
  );
};

/**
 * Design Area - Shows 3D booth configuration
 */
const DesignArea: React.FC<{ 
  exhibitor: Exhibitor;
  wallShape: string;
  setWallShape: (shape: any) => void;
  carpet: number;
  setCarpet: (carpet: number) => void;
  furniture: any[];
  setFurniture: (furniture: any[]) => void;
  counters: any[];
  setCounters: (counters: any[]) => void;
}> = ({ exhibitor, wallShape, setWallShape, carpet, setCarpet, furniture, setFurniture, counters, setCounters }) => {
  // Get locked dimensions from exhibitor
  const boothWidth = exhibitor.monterDimensions.width;
  const boothDepth = exhibitor.monterDimensions.depth;
  const boothHeight = exhibitor.monterDimensions.height;

  const handleSave = () => {
    // Save configuration back to ExhibitorManager
    ExhibitorManager.updateExhibitorBoothConfig(exhibitor.token, {
      wallShape,
      carpet,
      furniture,
      counters,
      customizations: {}
    });
    
    alert('✅ Monterdesign sparad!');
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left Sidebar - Controls */}
      <div style={{
        width: '280px',
        backgroundColor: 'white',
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '700',
          color: '#2c3e50'
        }}>
          🎨 Monterdesign
        </h3>
        
        {/* Locked Dimensions Display */}
        <div style={{
          padding: '12px',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
            📏 Låsta mått
          </div>
          <div style={{ fontSize: '14px', color: '#2c3e50' }}>
            <div><strong>Bredd:</strong> {boothWidth}m</div>
            <div><strong>Djup:</strong> {boothDepth}m</div>
            <div><strong>Höjd:</strong> {boothHeight}m</div>
          </div>
        </div>

        {/* Wall Shape Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#555'
          }}>
            Väggform
          </label>
          <select
            value={wallShape}
            onChange={(e) => setWallShape(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '13px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Ingen vägg</option>
            <option value="straight">Rak vägg</option>
            <option value="l">L-form</option>
            <option value="u">U-form</option>
          </select>
        </div>

        {/* Carpet Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#555'
          }}>
            Matta / Golv
          </label>
          <select
            value={carpet}
            onChange={(e) => setCarpet(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '13px',
              backgroundColor: 'white'
            }}
          >
            <option value={0}>Ingen matta</option>
            <option value={1}>Grå matta</option>
            <option value={2}>Svart matta</option>
            <option value={3}>Mönstrad matta</option>
          </select>
        </div>

        {/* Quick Furniture Buttons */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#555'
          }}>
            Snabbtillägg möbler
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => {
                setFurniture([...furniture, {
                  id: Date.now(),
                  type: 'table',
                  position: { x: 0, z: 0 },
                  rotation: 0
                }]);
              }}
              style={{
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              🪑 Bord
            </button>
            <button
              onClick={() => {
                setFurniture([...furniture, {
                  id: Date.now(),
                  type: 'chair',
                  position: { x: 0.5, z: 0 },
                  rotation: 0
                }]);
              }}
              style={{
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              💺 Stol
            </button>
            <button
              onClick={() => {
                setFurniture([...furniture, {
                  id: Date.now(),
                  type: 'sofa',
                  position: { x: 0, z: 0.5 },
                  rotation: 0
                }]);
              }}
              style={{
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              🛋️ Soffa
            </button>
            <button
              onClick={() => {
                setFurniture([]);
              }}
              style={{
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #fee2e2',
                borderRadius: '6px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer'
              }}
            >
              🗑️ Rensa
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            marginTop: 'auto',
            padding: '14px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          💾 Spara monterdesign
        </button>
      </div>

      {/* Right - 3D Preview */}
      <div style={{
        flex: 1,
        backgroundColor: '#f8f8f8',
        position: 'relative'
      }}>
        <Canvas
          camera={{ position: [boothWidth * 1.5, boothHeight * 1.5, boothDepth * 1.5], fov: 50 }}
          shadows
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          
          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
            <planeGeometry args={[boothWidth, boothDepth]} />
            <meshStandardMaterial color={carpet === 0 ? '#e0e0e0' : carpet === 1 ? '#888888' : carpet === 2 ? '#333333' : '#aaaaaa'} />
          </mesh>

          {/* Walls based on shape */}
          {wallShape === 'straight' && (
            <mesh position={[0, boothHeight / 2, -boothDepth / 2]} castShadow receiveShadow>
              <boxGeometry args={[boothWidth, boothHeight, 0.1]} />
              <meshStandardMaterial color="#f5f5f5" />
            </mesh>
          )}
          
          {wallShape === 'l' && (
            <>
              <mesh position={[0, boothHeight / 2, -boothDepth / 2]} castShadow receiveShadow>
                <boxGeometry args={[boothWidth, boothHeight, 0.1]} />
                <meshStandardMaterial color="#f5f5f5" />
              </mesh>
              <mesh position={[-boothWidth / 2, boothHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.1, boothHeight, boothDepth]} />
                <meshStandardMaterial color="#f5f5f5" />
              </mesh>
            </>
          )}
          
          {wallShape === 'u' && (
            <>
              <mesh position={[0, boothHeight / 2, -boothDepth / 2]} castShadow receiveShadow>
                <boxGeometry args={[boothWidth, boothHeight, 0.1]} />
                <meshStandardMaterial color="#f5f5f5" />
              </mesh>
              <mesh position={[-boothWidth / 2, boothHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.1, boothHeight, boothDepth]} />
                <meshStandardMaterial color="#f5f5f5" />
              </mesh>
              <mesh position={[boothWidth / 2, boothHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.1, boothHeight, boothDepth]} />
                <meshStandardMaterial color="#f5f5f5" />
              </mesh>
            </>
          )}

          {/* Render Furniture */}
          {furniture.map((item) => (
            <SimpleFurniture key={item.id} item={item} />
          ))}

          <Grid args={[boothWidth * 2, boothDepth * 2]} />
          <OrbitControls makeDefault />
        </Canvas>
        
        {/* Instructions overlay */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          🖱️ Dra för att rotera • 🔍 Scroll för att zooma
        </div>
      </div>
    </div>
  );
};

/**
 * Simple Furniture Component for 3D rendering
 */
const SimpleFurniture: React.FC<{ item: any }> = ({ item }) => {
  const configs: Record<string, any> = {
    table: { width: 0.8, depth: 0.8, height: 1.1, color: '#8B4513' },
    chair: { width: 0.5, depth: 0.5, height: 0.9, color: '#4169E1' },
    sofa: { width: 1.8, depth: 0.8, height: 0.7, color: '#696969' },
    stool: { width: 0.4, depth: 0.4, height: 0.75, color: '#C0C0C0' }
  };

  const config = configs[item.type] || configs.table;
  
  return (
    <mesh 
      position={[item.position.x, config.height / 2, item.position.z]} 
      rotation={[0, item.rotation * Math.PI / 180, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[config.width, config.height, config.depth]} />
      <meshStandardMaterial color={config.color} />
    </mesh>
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
