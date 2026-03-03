 import React from 'react';
import type { Event, EventPricing } from './services/ExhibitorService';

interface EventSettingsProps {
  event: Event;
  // White Label state
  whiteLabelLogoUrl: string;
  setWhiteLabelLogoUrl: (val: string) => void;
  whiteLabelPrimaryColor: string;
  setWhiteLabelPrimaryColor: (val: string) => void;
  whiteLabelSecondaryColor: string;
  setWhiteLabelSecondaryColor: (val: string) => void;
  whiteLabelCompanyName: string;
  setWhiteLabelCompanyName: (val: string) => void;
  whiteLabelContactEmail: string;
  setWhiteLabelContactEmail: (val: string) => void;
  whiteLabelContactPhone: string;
  setWhiteLabelContactPhone: (val: string) => void;
  whiteLabelFooterText: string;
  setWhiteLabelFooterText: (val: string) => void;
  // Pricing state
  pricing: EventPricing;
  setPricing: (val: EventPricing) => void;
  // Actions
  onSaveWhiteLabel: () => void;
  onSavePricing: () => void;
}

export default function EventSettings(props: EventSettingsProps) {
  const { event, pricing, setPricing } = props;
  const [activeSettingsTab, setActiveSettingsTab] = React.useState<'basic' | 'whiteLabel' | 'pricing'>('basic');
  const [pricingPassword, setPricingPassword] = React.useState('');
  const [pricingUnlocked, setPricingUnlocked] = React.useState(false);

  const handlePricingPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pricingPassword === '2026') {
      setPricingUnlocked(true);
    } else {
      alert('❌ Fel lösenord!');
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#2c3e50'
      }}>
        ⚙️ Event-inställningar
      </h2>

      {/* Settings Sub-tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '8px'
      }}>
        {[
          { id: 'basic' as const, label: '📋 Grundläggande', icon: '📋' },
          { id: 'whiteLabel' as const, label: '🎨 White Label', icon: '🎨' },
          { id: 'pricing' as const, label: '💰 Prissättning', icon: '💰' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              borderBottom: activeSettingsTab === tab.id ? '3px solid #3b82f6' : 'none',
              backgroundColor: activeSettingsTab === tab.id ? '#f0f9ff' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: activeSettingsTab === tab.id ? '600' : '400',
              fontSize: '14px',
              color: activeSettingsTab === tab.id ? '#3b82f6' : '#666'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeSettingsTab === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Eventnamn
            </label>
            <input
              type="text"
              value={event.name}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                background: '#f8f9fa'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Beskrivning
            </label>
            <textarea
              value={event.description || ''}
              disabled
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                background: '#f8f9fa',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Startdatum
              </label>
              <input
                type="text"
                value={event.startDate ? new Date(event.startDate).toLocaleDateString('sv-SE') : '-'}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  background: '#f8f9fa'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Slutdatum
              </label>
              <input
                type="text"
                value={event.endDate ? new Date(event.endDate).toLocaleDateString('sv-SE') : '-'}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  background: '#f8f9fa'
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Plats
            </label>
            <input
              type="text"
              value={event.location || '-'}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                background: '#f8f9fa'
              }}
            />
          </div>
        </div>
      )}

      {/* White Label Tab */}
      {activeSettingsTab === 'whiteLabel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Anpassa branding och white label-inställningar för detta event.
          </p>
          
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Företagsnamn
            </label>
            <input
              type="text"
              value={props.whiteLabelCompanyName}
              onChange={(e) => props.setWhiteLabelCompanyName(e.target.value)}
              placeholder="T.ex. Acme Mässor AB"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Primärfärg
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={props.whiteLabelPrimaryColor}
                  onChange={(e) => props.setWhiteLabelPrimaryColor(e.target.value)}
                  style={{ width: '60px', height: '40px', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <input
                  type="text"
                  value={props.whiteLabelPrimaryColor}
                  onChange={(e) => props.setWhiteLabelPrimaryColor(e.target.value)}
                  style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Sekundärfärg
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={props.whiteLabelSecondaryColor}
                  onChange={(e) => props.setWhiteLabelSecondaryColor(e.target.value)}
                  style={{ width: '60px', height: '40px', borderRadius: '8px', border: '1px solid #e0e0e0' }}
                />
                <input
                  type="text"
                  value={props.whiteLabelSecondaryColor}
                  onChange={(e) => props.setWhiteLabelSecondaryColor(e.target.value)}
                  style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Logotyp
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 500 * 1024) {
                        alert('Bilden är för stor! Max 500kb.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          let width = img.width;
                          let height = img.height;
                          const maxWidth = 400;
                          if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx?.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL('image/png', 0.8);
                          props.setWhiteLabelLogoUrl(compressedBase64);
                        };
                        img.src = reader.result as string;
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
                <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                  Max 500kb • PNG/JPG • Komprimeras automatiskt
                </small>
              </div>
              {props.whiteLabelLogoUrl && (
                <button
                  onClick={() => props.setWhiteLabelLogoUrl('')}
                  style={{
                    padding: '12px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  🗑️ Ta bort
                </button>
              )}
            </div>
            {props.whiteLabelLogoUrl && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Förhandsvisning:</div>
                <img
                  src={props.whiteLabelLogoUrl}
                  alt="Logo preview"
                  style={{ maxHeight: '100px', borderRadius: '8px' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Kontakt Email
              </label>
              <input
                type="email"
                value={props.whiteLabelContactEmail}
                onChange={(e) => props.setWhiteLabelContactEmail(e.target.value)}
                placeholder="info@företag.se"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                Kontakt Telefon
              </label>
              <input
                type="tel"
                value={props.whiteLabelContactPhone}
                onChange={(e) => props.setWhiteLabelContactPhone(e.target.value)}
                placeholder="+46 70 123 45 67"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
              Footertext
            </label>
            <textarea
              value={props.whiteLabelFooterText}
              onChange={(e) => props.setWhiteLabelFooterText(e.target.value)}
              placeholder="© 2026 Företagsnamn AB. Alla rättigheter förbehållna."
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={props.onSaveWhiteLabel}
            style={{
              padding: '14px 28px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            ✓ Spara White Label-inställningar
          </button>
        </div>
      )}

      {/* Pricing Tab */}
      {activeSettingsTab === 'pricing' && (
        <div style={{ maxWidth: '1000px' }}>
          {!pricingUnlocked ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '20px',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px' }}>🔒</div>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>Prislista är låst</h3>
              <p style={{ color: '#666', textAlign: 'center', margin: 0 }}>
                Ange lösenord för att visa och redigera prislistan
              </p>
              <form onSubmit={handlePricingPasswordSubmit} style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <input
                  type="password"
                  placeholder="Ange lösenord"
                  value={pricingPassword}
                  onChange={(e) => setPricingPassword(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    width: '200px'
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  🔓 Lås upp
                </button>
              </form>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#666', margin: 0 }}>
                  Anpassa alla priser specifikt för denna mässa. Dessa priser används istället för standardpriser när utställare designar sin monter.
                </p>
                <button
                  onClick={() => setPricingUnlocked(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#666'
                  }}
                >
                  🔒 Lås
                </button>
              </div>

          <div style={{ display: 'grid', gap: '24px' }}>
            
            {/* Golv */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>🏢 Golv</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Baspris per m²</label>
                  <input type="number" value={pricing.floor?.basePricePerSqm ?? 450} 
                    onChange={(e) => setPricing({...pricing, floor: {...pricing.floor, basePricePerSqm: Number(e.target.value), minSize: pricing.floor?.minSize ?? 6}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 450 kr</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Min fakturerbar storlek (m²)</label>
                  <input type="number" value={pricing.floor?.minSize ?? 6}
                    onChange={(e) => setPricing({...pricing, floor: {...pricing.floor, minSize: Number(e.target.value), basePricePerSqm: pricing.floor?.basePricePerSqm ?? 450}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 6 m²</small>
                </div>
              </div>
            </div>

            {/* Väggar */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>🧱 Väggar</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Rak vägg (kr/lpm)</label>
                  <input type="number" value={pricing.walls?.straight ?? 900}
                    onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, straight: Number(e.target.value), lShape: pricing.walls?.lShape ?? 900, uShape: pricing.walls?.uShape ?? 900, heightSurcharge: pricing.walls?.heightSurcharge ?? {2.5: 0, 3.0: 230, 3.5: 440}}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 900 kr</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>L-form (kr/lpm)</label>
                  <input type="number" value={pricing.walls?.lShape ?? 900}
                    onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, lShape: Number(e.target.value), straight: pricing.walls?.straight ?? 900, uShape: pricing.walls?.uShape ?? 900, heightSurcharge: pricing.walls?.heightSurcharge ?? {2.5: 0, 3.0: 230, 3.5: 440}}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 900 kr</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>U-form (kr/lpm)</label>
                  <input type="number" value={pricing.walls?.uShape ?? 900}
                    onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, uShape: Number(e.target.value), straight: pricing.walls?.straight ?? 900, lShape: pricing.walls?.lShape ?? 900, heightSurcharge: pricing.walls?.heightSurcharge ?? {2.5: 0, 3.0: 230, 3.5: 440}}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 900 kr</small>
                </div>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Höjdtillägg (kr/lpm)</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>2.5m</label>
                    <input type="number" value={pricing.walls?.heightSurcharge?.[2.5] ?? 0}
                      onChange={(e) => {
                        const newSurcharge = {...(pricing.walls?.heightSurcharge ?? {2.5: 0, 3.0: 230, 3.5: 440}), 2.5: Number(e.target.value)};
                        setPricing({...pricing, walls: {...pricing.walls, heightSurcharge: newSurcharge as any, straight: pricing.walls?.straight ?? 900, lShape: pricing.walls?.lShape ?? 900, uShape: pricing.walls?.uShape ?? 900}});
                      }}
                      style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>3.0m</label>
                    <input type="number" value={pricing.walls?.heightSurcharge?.[3.0] ?? 230}
                      onChange={(e) => {
                        const newSurcharge = {...(pricing.walls?.heightSurcharge ?? {2.5: 0, 3.0: 230, 3.5: 440}), 3.0: Number(e.target.value)};
                        setPricing({...pricing, walls: {...pricing.walls, heightSurcharge: newSurcharge as any, straight: pricing.walls?.straight ?? 900, lShape: pricing.walls?.lShape ?? 900, uShape: pricing.walls?.uShape ?? 900}});
                      }}
                      style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>3.5m</label>
                    <input type="number" value={pricing.walls?.heightSurcharge?.[3.5] ?? 440}
                      onChange={(e) => {
                        const newSurcharge = {...(pricing.walls?.heightSurcharge ?? {2.5: 0, 3.0: 230, 3.5: 440}), 3.5: Number(e.target.value)};
                        setPricing({...pricing, walls: {...pricing.walls, heightSurcharge: newSurcharge as any, straight: pricing.walls?.straight ?? 900, lShape: pricing.walls?.lShape ?? 900, uShape: pricing.walls?.uShape ?? 900}});
                      }}
                      style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Matta */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>🎨 Matta (kr/m²)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Ingen</label>
                  <input type="number" value={pricing.carpet?.none ?? 0}
                    onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, none: Number(e.target.value), colored: pricing.carpet?.colored ?? 180, salsa: pricing.carpet?.salsa ?? 240, patterned: pricing.carpet?.patterned ?? 250}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Färgad (EXPO)</label>
                  <input type="number" value={pricing.carpet?.colored ?? 180}
                    onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, colored: Number(e.target.value), none: pricing.carpet?.none ?? 0, salsa: pricing.carpet?.salsa ?? 240, patterned: pricing.carpet?.patterned ?? 250}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>SALSA</label>
                  <input type="number" value={pricing.carpet?.salsa ?? 240}
                    onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, salsa: Number(e.target.value), none: pricing.carpet?.none ?? 0, colored: pricing.carpet?.colored ?? 180, patterned: pricing.carpet?.patterned ?? 250}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Rutmönster</label>
                  <input type="number" value={pricing.carpet?.patterned ?? 250}
                    onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, patterned: Number(e.target.value), none: pricing.carpet?.none ?? 0, colored: pricing.carpet?.colored ?? 180, salsa: pricing.carpet?.salsa ?? 240}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Grafik */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>🖼️ Grafik & Tryck (kr/m²)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Ingen</label>
                  <input type="number" value={pricing.graphics?.none ?? 0}
                    onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, none: Number(e.target.value), hyr: pricing.graphics?.hyr ?? 880, forex: pricing.graphics?.forex ?? 1450, vepa: pricing.graphics?.vepa ?? 775}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Hyr</label>
                  <input type="number" value={pricing.graphics?.hyr ?? 880}
                    onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, hyr: Number(e.target.value), none: pricing.graphics?.none ?? 0, forex: pricing.graphics?.forex ?? 1450, vepa: pricing.graphics?.vepa ?? 775}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Forex</label>
                  <input type="number" value={pricing.graphics?.forex ?? 1450}
                    onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, forex: Number(e.target.value), none: pricing.graphics?.none ?? 0, hyr: pricing.graphics?.hyr ?? 880, vepa: pricing.graphics?.vepa ?? 775}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Vepa</label>
                  <input type="number" value={pricing.graphics?.vepa ?? 775}
                    onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, vepa: Number(e.target.value), none: pricing.graphics?.none ?? 0, hyr: pricing.graphics?.hyr ?? 880, forex: pricing.graphics?.forex ?? 1450}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Möbler */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>🪑 Möbler (kr/st)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Barbord</label>
                  <input type="number" value={pricing.furniture?.table ?? 650}
                    onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, table: Number(e.target.value), chair: pricing.furniture?.chair ?? 450, stool: pricing.furniture?.stool ?? 650, sofa: pricing.furniture?.sofa ?? 1500, armchair: pricing.furniture?.armchair ?? 850, side_table: pricing.furniture?.side_table ?? 350, podium: pricing.furniture?.podium ?? 850}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Barstol</label>
                  <input type="number" value={pricing.furniture?.chair ?? 450}
                    onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, chair: Number(e.target.value), table: pricing.furniture?.table ?? 650, stool: pricing.furniture?.stool ?? 650, sofa: pricing.furniture?.sofa ?? 1500, armchair: pricing.furniture?.armchair ?? 850, side_table: pricing.furniture?.side_table ?? 350, podium: pricing.furniture?.podium ?? 850}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Pall</label>
                  <input type="number" value={pricing.furniture?.stool ?? 650}
                    onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, stool: Number(e.target.value), table: pricing.furniture?.table ?? 650, chair: pricing.furniture?.chair ?? 450, sofa: pricing.furniture?.sofa ?? 1500, armchair: pricing.furniture?.armchair ?? 850, side_table: pricing.furniture?.side_table ?? 350, podium: pricing.furniture?.podium ?? 850}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Soffa</label>
                  <input type="number" value={pricing.furniture?.sofa ?? 1500}
                    onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, sofa: Number(e.target.value), table: pricing.furniture?.table ?? 650, chair: pricing.furniture?.chair ?? 450, stool: pricing.furniture?.stool ?? 650, armchair: pricing.furniture?.armchair ?? 850, side_table: pricing.furniture?.side_table ?? 350, podium: pricing.furniture?.podium ?? 850}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Fåtölj</label>
                  <input type="number" value={pricing.furniture?.armchair ?? 850}
                    onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, armchair: Number(e.target.value), table: pricing.furniture?.table ?? 650, chair: pricing.furniture?.chair ?? 450, stool: pricing.furniture?.stool ?? 650, sofa: pricing.furniture?.sofa ?? 1500, side_table: pricing.furniture?.side_table ?? 350, podium: pricing.furniture?.podium ?? 850}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Sidobord</label>
                  <input type="number" value={pricing.furniture?.side_table ?? 350}
                    onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, side_table: Number(e.target.value), table: pricing.furniture?.table ?? 650, chair: pricing.furniture?.chair ?? 450, stool: pricing.furniture?.stool ?? 650, sofa: pricing.furniture?.sofa ?? 1500, armchair: pricing.furniture?.armchair ?? 850, podium: pricing.furniture?.podium ?? 850}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Podie</label>
                  <input type="number" value={pricing.furniture?.podium ?? 850}
                    onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, podium: Number(e.target.value), table: pricing.furniture?.table ?? 650, chair: pricing.furniture?.chair ?? 450, stool: pricing.furniture?.stool ?? 650, sofa: pricing.furniture?.sofa ?? 1500, armchair: pricing.furniture?.armchair ?? 850, side_table: pricing.furniture?.side_table ?? 350}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Diskar */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>🏪 Diskar</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Per löpmeter</label>
                  <input type="number" value={pricing.counters?.perMeter ?? 800}
                    onChange={(e) => setPricing({...pricing, counters: {...pricing.counters, perMeter: Number(e.target.value), lShape: pricing.counters?.lShape ?? 1000, lShapeMirrored: pricing.counters?.lShapeMirrored ?? 1000}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 800 kr/lpm</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>L-disk</label>
                  <input type="number" value={pricing.counters?.lShape ?? 1000}
                    onChange={(e) => setPricing({...pricing, counters: {...pricing.counters, lShape: Number(e.target.value), perMeter: pricing.counters?.perMeter ?? 800, lShapeMirrored: pricing.counters?.lShapeMirrored ?? 1000}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 1000 kr</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>L-disk (spegelvänd)</label>
                  <input type="number" value={pricing.counters?.lShapeMirrored ?? 1000}
                    onChange={(e) => setPricing({...pricing, counters: {...pricing.counters, lShapeMirrored: Number(e.target.value), perMeter: pricing.counters?.perMeter ?? 800, lShape: pricing.counters?.lShape ?? 1000}})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <small style={{ color: '#666' }}>Std: 1000 kr</small>
                </div>
              </div>
            </div>

            {/* Tillbehör, TV, Lagring, Växter, Ljus, Truss, Extras, Services - kortare version för utrymme */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>☕ Disktillbehör • 📺 TV • 📦 Lagring (SEK)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px' }}>Espressomaskin</label>
                  <input type="number" value={pricing.counterItems?.espressoMachine ?? 4500}
                    onChange={(e) => setPricing({...pricing, counterItems: {...pricing.counterItems, espressoMachine: Number(e.target.value), flowerVase: pricing.counterItems?.flowerVase ?? 850, candyBowl: pricing.counterItems?.candyBowl ?? 500}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>43" TV</label>
                  <input type="number" value={pricing.tvs?.[43] ?? 2700}
                    onChange={(e) => setPricing({...pricing, tvs: {...pricing.tvs, 43: Number(e.target.value), 55: pricing.tvs?.[55] ?? 3500, 70: pricing.tvs?.[70] ?? 10000}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>Lagring (kr/m²)</label>
                  <input type="number" value={pricing.storage?.perSqm ?? 380}
                    onChange={(e) => setPricing({...pricing, storage: {perSqm: Number(e.target.value)}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>🌿 Växter • 💡 Ljus • 🏗️ Truss (SEK)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px' }}>Liten växt</label>
                  <input type="number" value={pricing.plants?.small ?? 550}
                    onChange={(e) => setPricing({...pricing, plants: {...pricing.plants, small: Number(e.target.value), medium: pricing.plants?.medium ?? 850, large: pricing.plants?.large ?? 1200}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>LED Strips</label>
                  <input type="number" value={pricing.lighting?.ledStrips ?? 2000}
                    onChange={(e) => setPricing({...pricing, lighting: {...pricing.lighting, ledStrips: Number(e.target.value), samLed: pricing.lighting?.samLed ?? 300}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>Front Straight Truss</label>
                  <input type="number" value={pricing.truss?.frontStraight ?? 400}
                    onChange={(e) => setPricing({...pricing, truss: {...pricing.truss, frontStraight: Number(e.target.value), none: pricing.truss?.none ?? 0, hangingRound: pricing.truss?.hangingRound ?? 5500, hangingSquare: pricing.truss?.hangingSquare ?? 5500}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
              <h4>⚡ Extras • 🛠️ Tjänster (SEK)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px' }}>Eluttag</label>
                  <input type="number" value={pricing.extras?.powerOutlet ?? 300}
                    onChange={(e) => setPricing({...pricing, extras: {...pricing.extras, powerOutlet: Number(e.target.value), clothingRacks: pricing.extras?.clothingRacks ?? 200, speakers: pricing.extras?.speakers ?? 3500, wallShelves: pricing.extras?.wallShelves ?? 350, baseplate: pricing.extras?.baseplate ?? 450, colorPainting: pricing.extras?.colorPainting ?? 500}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>Timkostnad</label>
                  <input type="number" value={pricing.services?.hourlyRate ?? 750}
                    onChange={(e) => setPricing({...pricing, services: {...pricing.services, hourlyRate: Number(e.target.value), sketchFeeSmall: pricing.services?.sketchFeeSmall ?? 5000, sketchFeeLarge: pricing.services?.sketchFeeLarge ?? 10000, projectManagementPercent: pricing.services?.projectManagementPercent ?? 15, consumablesSmall: pricing.services?.consumablesSmall ?? 750, consumablesMedium: pricing.services?.consumablesMedium ?? 1350, consumablesLarge: pricing.services?.consumablesLarge ?? 2000}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>Projektledning %</label>
                  <input type="number" value={pricing.services?.projectManagementPercent ?? 15}
                    onChange={(e) => setPricing({...pricing, services: {...pricing.services, projectManagementPercent: Number(e.target.value), hourlyRate: pricing.services?.hourlyRate ?? 750, sketchFeeSmall: pricing.services?.sketchFeeSmall ?? 5000, sketchFeeLarge: pricing.services?.sketchFeeLarge ?? 10000, consumablesSmall: pricing.services?.consumablesSmall ?? 750, consumablesMedium: pricing.services?.consumablesMedium ?? 1350, consumablesLarge: pricing.services?.consumablesLarge ?? 2000}})}
                    style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

          </div>

          <button
            onClick={props.onSavePricing}
            style={{
              padding: '14px 28px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '24px'
            }}
          >
            ✓ Spara Prissättning
          </button>
          </>
          )}
        </div>
      )}
    </div>
  );
}
