import React, { useState } from 'react';
import { ExhibitorManager, type MonterSize, type Event, type Exhibitor, type EventBranding, type EventPricing } from './ExhibitorManager';

interface ExhibitorAdminProps {
  onClose?: () => void;
  onOpenEventAdmin?: (eventId: string) => void;
}

export const ExhibitorAdmin: React.FC<ExhibitorAdminProps> = ({ onClose, onOpenEventAdmin }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'exhibitors' | 'branding' | 'pricing' | 'data'>('events');
  const [events, setEvents] = useState<Event[]>(ExhibitorManager.getEvents());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(events.length > 0 ? events[0] : null);
  
  // Event creation form
  const [newEventName, setNewEventName] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');

  // Branding form states
  const [brandingLogo, setBrandingLogo] = useState('');
  const [brandingCompanyName, setBrandingCompanyName] = useState('');
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState('#3498db');
  const [brandingSecondaryColor, setBrandingSecondaryColor] = useState('#2c3e50');
  const [brandingContactEmail, setBrandingContactEmail] = useState('');
  const [brandingContactPhone, setBrandingContactPhone] = useState('');

  // Pricing form states - complete pricing structure
  // @ts-ignore - EventPricing har extended properties runtime
  const [pricing, setPricing] = useState<EventPricing>({
    floor: { basePricePerSqm: 450, minSize: 6 },
    walls: { straight: 900, lShape: 900, uShape: 900, heightSurcharge: { 2.5: 0, 3.0: 230, 3.5: 440 } },
    carpet: { none: 0, colored: 180, salsa: 240, patterned: 250 },
    frames: { '1x2.5': 886 },
    graphics: { none: 0, hyr: 880, forex: 1450, vepa: 775 },
    furniture: { table: 650, chair: 450, stool: 650, sofa: 1500, armchair: 850, side_table: 350, podium: 850 },
    counters: { perMeter: 800, lShape: 1000, lShapeMirrored: 1000 },
    counterItems: { espressoMachine: 4500, flowerVase: 850, candyBowl: 500 },
    tvs: { 43: 2700, 55: 3500, 70: 10000 },
    storage: { perSqm: 380 },
    plants: { small: 550, medium: 850, large: 1200 },
    lighting: { ledStrips: 2000, samLed: 300 },
    truss: { none: 0, frontStraight: 400, hangingRound: 5500, hangingSquare: 5500 },
    extras: { powerOutlet: 300, clothingRacks: 200, speakers: 3500, wallShelves: 350, baseplate: 450, colorPainting: 500 },
    services: { hourlyRate: 750, sketchFeeSmall: 5000, sketchFeeLarge: 10000, projectManagementPercent: 15, consumablesSmall: 750, consumablesMedium: 1350, consumablesLarge: 2000 }
  });

  // Exhibitor creation form
  const [newExhibitorCompany, setNewExhibitorCompany] = useState('');
  const [newExhibitorPerson, setNewExhibitorPerson] = useState('');
  const [newExhibitorEmail, setNewExhibitorEmail] = useState('');
  const [newExhibitorPhone, setNewExhibitorPhone] = useState('');
  const [newExhibitorWidth, setNewExhibitorWidth] = useState('3');
  const [newExhibitorDepth, setNewExhibitorDepth] = useState('3');
  const [newExhibitorHeight, setNewExhibitorHeight] = useState('2.5');

  // Exhibitor edit form
  const [editingExhibitorId, setEditingExhibitorId] = useState<string | null>(null);
  const [editWidth, setEditWidth] = useState('3');
  const [editDepth, setEditDepth] = useState('3');
  const [editHeight, setEditHeight] = useState('2.5');

  const startEditingExhibitor = (exhibitor: Exhibitor) => {
    setEditingExhibitorId(exhibitor.id);
    // @ts-ignore - monterDimensions finns runtime men inte i typdefinitionen
    setEditWidth(exhibitor.monterDimensions.width.toString());
    // @ts-ignore
    setEditDepth(exhibitor.monterDimensions.depth.toString());
    // @ts-ignore
    setEditHeight(exhibitor.monterDimensions.height.toString());
  };

  const handleSaveExhibitorDimensions = () => {
    if (!editingExhibitorId) return;
    
    const dimensions = {
      width: parseFloat(editWidth),
      depth: parseFloat(editDepth),
      height: parseFloat(editHeight)
    };

    ExhibitorManager.updateExhibitorDimensions(editingExhibitorId, dimensions);
    setEvents(ExhibitorManager.getEvents());
    setSelectedEvent(selectedEvent ? ExhibitorManager.getEvent(selectedEvent.id) || null : null);
    setEditingExhibitorId(null);
  };

  const handleCancelEditExhibitor = () => {
    setEditingExhibitorId(null);
  };

  const handleCreateEvent = () => {
    if (!newEventName.trim()) {
      alert('Fyll i eventnamn');
      return;
    }
    const event = ExhibitorManager.createEvent(
      newEventName,
      newEventDesc,
      newEventStart,
      newEventEnd
    );
    setEvents(ExhibitorManager.getEvents());
    setSelectedEvent(event);
    setNewEventName('');
    setNewEventDesc('');
    setNewEventStart('');
    setNewEventEnd('');
    
    // Visa lösenordet för användaren
    alert(`✅ Event skapades!\n\nEvent: ${event.name}\n\n🔐 Lösenord för EventAdminPortal:\n${event.password}\n\n(Spara detta lösenord!)`);
  };

  const handleAddExhibitor = () => {
    if (!selectedEvent) {
      alert('Välj en event först');
      return;
    }
    if (!newExhibitorCompany.trim() || !newExhibitorEmail.trim()) {
      alert('Fyll i företagsnamn och e-post');
      return;
    }

    // Determine monterSize based on dimensions
    const width = parseFloat(newExhibitorWidth);
    const depth = parseFloat(newExhibitorDepth);
    const height = parseFloat(newExhibitorHeight);
    
    let monterSize: MonterSize = 'medium';
    if (width <= 2 && depth <= 2) {
      monterSize = 'small';
    } else if (width >= 4 || depth >= 4) {
      monterSize = 'large';
    }

    const monterDimensions = {
      width: width,
      depth: depth,
      height: height
    };

    ExhibitorManager.addExhibitor(
      selectedEvent.id,
      newExhibitorPerson || newExhibitorCompany,
      newExhibitorEmail,
      newExhibitorCompany,
      monterSize,
      monterDimensions,
      newExhibitorPerson,
      newExhibitorPhone
    );

    setEvents(ExhibitorManager.getEvents());
    setSelectedEvent(ExhibitorManager.getEvent(selectedEvent.id) || null);
    
    // Reset form
    setNewExhibitorCompany('');
    setNewExhibitorPerson('');
    setNewExhibitorEmail('');
    setNewExhibitorPhone('');
    setNewExhibitorWidth('3');
    setNewExhibitorDepth('3');
    setNewExhibitorHeight('2.5');
  };

  const handleDeleteExhibitor = (exhibitorId: string) => {
    if (window.confirm('Är du säker?')) {
      ExhibitorManager.deleteExhibitor(exhibitorId);
      setEvents(ExhibitorManager.getEvents());
      setSelectedEvent(ExhibitorManager.getEvent(selectedEvent?.id || '') || null);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Radera denna event? Detta kan inte ångras.')) {
      ExhibitorManager.deleteEvent(eventId);
      const newEvents = ExhibitorManager.getEvents();
      setEvents(newEvents);
      setSelectedEvent(newEvents.length > 0 ? newEvents[0] : null);
    }
  };

  const copyInviteLink = (exhibitor: Exhibitor) => {
    const link = ExhibitorManager.getInviteLink(exhibitor);
    navigator.clipboard.writeText(link);
    alert('Invite-länk kopierad!');
  };

  const handleSaveBranding = () => {
    if (!selectedEvent) {
      alert('Välj en event först');
      return;
    }

    // @ts-ignore - EventBranding har extended properties runtime
    const branding: EventBranding = {
      logo: brandingLogo,
      companyName: brandingCompanyName,
      primaryColor: brandingPrimaryColor,
      secondaryColor: brandingSecondaryColor,
      contactEmail: brandingContactEmail,
      contactPhone: brandingContactPhone
    };

    ExhibitorManager.updateEventBranding(selectedEvent.id, branding);
    const updatedEvents = ExhibitorManager.getEvents();
    setEvents(updatedEvents);
    setSelectedEvent(ExhibitorManager.getEvent(selectedEvent.id) || null);
    alert('Branding sparad!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 200kb)
      if (file.size > 200 * 1024) {
        alert('Bilden är för stor! Max 200kb. Försök med en mindre bild eller komprimera den.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Compress image if needed
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large (max 400px width)
          const maxWidth = 400;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setBrandingLogo(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    const data = {
      events: ExhibitorManager.getEvents(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monterhyra-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.events && Array.isArray(data.events)) {
            // Import all events
            localStorage.setItem('exhibitorManager_events', JSON.stringify(data.events));
            const updatedEvents = ExhibitorManager.getEvents();
            setEvents(updatedEvents);
            alert(`Importerade ${data.events.length} events!`);
          } else {
            alert('Ogiltig data-fil');
          }
        } catch (error) {
          alert('Kunde inte läsa filen: ' + error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Load branding when event is selected
  React.useEffect(() => {
    if (selectedEvent?.branding) {
      // @ts-ignore - EventBranding har extended properties runtime
      setBrandingLogo(selectedEvent.branding.logo || '');
      setBrandingCompanyName(selectedEvent.branding.companyName || '');
      setBrandingPrimaryColor(selectedEvent.branding.primaryColor || '#3498db');
      // @ts-ignore
      setBrandingSecondaryColor(selectedEvent.branding.secondaryColor || '#2c3e50');
      setBrandingContactEmail(selectedEvent.branding.contactEmail || '');
      setBrandingContactPhone(selectedEvent.branding.contactPhone || '');
    }
  }, [selectedEvent]);

  // Load pricing when event is selected
  React.useEffect(() => {
    if (selectedEvent?.pricing) {
      setPricing(selectedEvent.pricing);
    } else {
      // Reset to defaults
      setPricing({
        floor: { basePricePerSqm: 450, minSize: 6 },
        walls: { straight: 900, lShape: 900, uShape: 900, heightSurcharge: { 2.5: 0, 3.0: 230, 3.5: 440 } },
        carpet: { none: 0, colored: 180, salsa: 240, patterned: 250 },
        frames: { '1x2.5': 886 },
        graphics: { none: 0, hyr: 880, forex: 1450, vepa: 775 },
        furniture: { table: 650, chair: 450, stool: 650, sofa: 1500, armchair: 850, side_table: 350, podium: 850 },
        counters: { perMeter: 800, lShape: 1000, lShapeMirrored: 1000 },
        counterItems: { espressoMachine: 4500, flowerVase: 850, candyBowl: 500 },
        tvs: { 43: 2700, 55: 3500, 70: 10000 },
        storage: { perSqm: 380 },
        plants: { small: 550, medium: 850, large: 1200 },
        lighting: { ledStrips: 2000, samLed: 300 },
        truss: { none: 0, frontStraight: 400, hangingRound: 5500, hangingSquare: 5500 },
        extras: { powerOutlet: 300, clothingRacks: 200, speakers: 3500, wallShelves: 350, baseplate: 450, colorPainting: 500 },
        services: { hourlyRate: 750, sketchFeeSmall: 5000, sketchFeeLarge: 10000, projectManagementPercent: 15, consumablesSmall: 750, consumablesMedium: 1350, consumablesLarge: 2000 }
      });
    }
  }, [selectedEvent]);

  const handleSavePricing = () => {
    if (!selectedEvent) {
      alert('Välj en event först');
      return;
    }

    ExhibitorManager.updateEventPricing(selectedEvent.id, pricing);
    const updatedEvents = ExhibitorManager.getEvents();
    setEvents(updatedEvents);
    setSelectedEvent(ExhibitorManager.getEvent(selectedEvent.id) || null);
    alert('Prissättning sparad!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🎪 Exhibitor Portal - Admin</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleExportData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            📥 Exportera Data
          </button>
          <label
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            📤 Importera Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              style={{ display: 'none' }}
            />
          </label>
          {onClose && (
            <button onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}>
              Stäng
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('events')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'events' ? '3px solid #3b82f6' : 'none',
            backgroundColor: activeTab === 'events' ? '#f0f9ff' : 'transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            color: activeTab === 'events' ? '#3b82f6' : '#666'
          }}
        >
          📅 Events
        </button>
        <button
          onClick={() => setActiveTab('exhibitors')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'exhibitors' ? '3px solid #3b82f6' : 'none',
            backgroundColor: activeTab === 'exhibitors' ? '#f0f9ff' : 'transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            color: activeTab === 'exhibitors' ? '#3b82f6' : '#666'
          }}
        >
          🏢 Exhibitors
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'branding' ? '3px solid #3b82f6' : 'none',
            backgroundColor: activeTab === 'branding' ? '#f0f9ff' : 'transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            color: activeTab === 'branding' ? '#3b82f6' : '#666'
          }}
        >
          🎨 White Label
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: activeTab === 'pricing' ? '3px solid #3b82f6' : 'none',
            backgroundColor: activeTab === 'pricing' ? '#f0f9ff' : 'transparent',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            color: activeTab === 'pricing' ? '#3b82f6' : '#666'
          }}
        >
          💰 Prissättning
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ marginTop: 0 }}>Skapa ny event</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Event namn (ex: Göteborgsvarvet Mässa 2025)"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
              <input
                type="text"
                placeholder="Beskrivning"
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
              <input
                type="date"
                value={newEventStart}
                onChange={(e) => setNewEventStart(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
              <input
                type="date"
                value={newEventEnd}
                onChange={(e) => setNewEventEnd(e.target.value)}
                style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
              />
            </div>
            <button
              onClick={handleCreateEvent}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              ➕ Skapa Event
            </button>
          </div>

          <div>
            <h3>Events ({events.length})</h3>
            {events.length === 0 ? (
              <p style={{ color: '#999' }}>Inga events skapade än</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {events.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      padding: '16px',
                      border: selectedEvent?.id === event.id ? '2px solid #3b82f6' : '1px solid #dee2e6',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedEvent?.id === event.id ? '#f0f9ff' : '#fff',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0 }}>{event.name}</h4>
                          {event.branding && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {event.branding.logo && (
                                <img 
                                  src={event.branding.logo} 
                                  alt="Event logo"
                                  style={{ 
                                    height: '24px', 
                                    maxWidth: '60px',
                                    objectFit: 'contain',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    padding: '2px',
                                    backgroundColor: '#fff'
                                  }} 
                                />
                              )}
                              {(event.branding.primaryColor || event.branding.secondaryColor) && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {event.branding.primaryColor && (
                                    <div 
                                      style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        backgroundColor: event.branding.primaryColor,
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '3px'
                                      }} 
                                      title={`Primary: ${event.branding.primaryColor}`}
                                    />
                                  )}
                                  {event.branding.secondaryColor && (
                                    <div 
                                      style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        backgroundColor: event.branding.secondaryColor,
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '3px'
                                      }}
                                      title={`Secondary: ${event.branding.secondaryColor}`}
                                    />
                                  )}
                                </div>
                              )}
                              {event.branding.companyName && (
                                <span style={{ 
                                  fontSize: '12px', 
                                  color: '#059669',
                                  backgroundColor: '#d1fae5',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}>
                                  🏷️ {event.branding.companyName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                          📍 {event.startDate} - {event.endDate}
                        </p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                          👥 {event.exhibitors.length} exhibitors
                        </p>
                        {event.password && (
                          <p style={{ 
                            margin: '0', 
                            fontSize: '12px', 
                            color: '#059669',
                            backgroundColor: '#d1fae5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}>
                            🔑 Lösenord: {event.password}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const baseUrl = window.location.origin;
                              const adminUrl = `${baseUrl}/app.html?eventAdmin=${event.id}`;
                              const message = `Event Admin Portal\n\nURL: ${adminUrl}\nLösenord: ${event.password}\n\nLogga in för att administrera ditt event.`;
                              navigator.clipboard.writeText(message);
                              alert('Event Admin-länk och lösenord kopierat!');
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#10b981',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            📋 Kopiera inlogg
                          </button>
                          {onOpenEventAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEventAdmin(event.id);
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#667eea',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              🏢 Event Admin
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🗑️ Radera
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exhibitors Tab */}
      {activeTab === 'exhibitors' && (
        <div>
          {!selectedEvent ? (
            <p style={{ color: '#999' }}>Välj en event först</p>
          ) : (
            <>
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #dee2e6'
              }}>
                <h3 style={{ marginTop: 0 }}>Lägg till exhibitor - {selectedEvent.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Företagsnamn *"
                    value={newExhibitorCompany}
                    onChange={(e) => setNewExhibitorCompany(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="text"
                    placeholder="Kontaktperson"
                    value={newExhibitorPerson}
                    onChange={(e) => setNewExhibitorPerson(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="email"
                    placeholder="E-post *"
                    value={newExhibitorEmail}
                    onChange={(e) => setNewExhibitorEmail(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="tel"
                    placeholder="Telefon"
                    value={newExhibitorPhone}
                    onChange={(e) => setNewExhibitorPhone(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="number"
                    placeholder="Monterbredd (m)"
                    value={newExhibitorWidth}
                    onChange={(e) => setNewExhibitorWidth(e.target.value)}
                    step="0.5"
                    min="1"
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="number"
                    placeholder="Monterdjup (m)"
                    value={newExhibitorDepth}
                    onChange={(e) => setNewExhibitorDepth(e.target.value)}
                    step="0.5"
                    min="1"
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                  <input
                    type="number"
                    placeholder="Vägg höjd (m)"
                    value={newExhibitorHeight}
                    onChange={(e) => setNewExhibitorHeight(e.target.value)}
                    step="0.5"
                    min="1"
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
                <button
                  onClick={handleAddExhibitor}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  ➕ Lägg till Exhibitor
                </button>
              </div>

              <div>
                <h3>Exhibitors ({selectedEvent.exhibitors.length})</h3>
                {selectedEvent.exhibitors.length === 0 ? (
                  <p style={{ color: '#999' }}>Inga exhibitors än</p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedEvent.exhibitors.map(exhibitor => (
                      <div
                        key={exhibitor.id}
                        style={{
                          padding: '16px',
                          border: '1px solid #dee2e6',
                          borderRadius: '8px',
                          backgroundColor: editingExhibitorId === exhibitor.id ? '#f0f9ff' : '#fff'
                        }}
                      >
                        {editingExhibitorId === exhibitor.id ? (
                          // Edit mode
                          <div>
                            <h4 style={{ margin: '0 0 12px 0', fontWeight: 600 }}>Redigera monterspecifikation</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Bredd (m)</label>
                                <input
                                  type="number"
                                  value={editWidth}
                                  onChange={(e) => setEditWidth(e.target.value)}
                                  step="0.5"
                                  min="1"
                                  max="10"
                                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Djup (m)</label>
                                <input
                                  type="number"
                                  value={editDepth}
                                  onChange={(e) => setEditDepth(e.target.value)}
                                  step="0.5"
                                  min="1"
                                  max="10"
                                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Höjd (m)</label>
                                <input
                                  type="number"
                                  value={editHeight}
                                  onChange={(e) => setEditHeight(e.target.value)}
                                  step="0.25"
                                  min="2"
                                  max="4"
                                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={handleSaveExhibitorDimensions}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#10b981',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                ✅ Spara
                              </button>
                              <button
                                onClick={handleCancelEditExhibitor}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#6b7280',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                ❌ Avbryt
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                              <div>
                                <h4 style={{ margin: '0 0 4px 0' }}>{exhibitor.companyName}</h4>
                                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                                  👤 {exhibitor.contactPerson || 'N/A'} | 📧 {exhibitor.email}
                                </p>
                                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                                  📏 {exhibitor.monterDimensions.width}m × {exhibitor.monterDimensions.depth}m × {exhibitor.monterDimensions.height}m
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteExhibitor(exhibitor.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#ef4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                            <div style={{
                              padding: '10px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              marginBottom: '8px'
                            }}>
                              {ExhibitorManager.getInviteLink(exhibitor)}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => copyInviteLink(exhibitor)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#3b82f6',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                📋 Kopiera länk
                              </button>
                              <button
                                onClick={() => startEditingExhibitor(exhibitor)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#f59e0b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}
                              >
                                ✏️ Redigera
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* White Label / Branding Tab */}
      {activeTab === 'branding' && (
        <div>
          {!selectedEvent ? (
            <p style={{ color: '#999' }}>Välj en event först</p>
          ) : (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px', fontWeight: '700' }}>
                🎨 White Label Branding - {selectedEvent.name}
              </h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#666' }}>
                Anpassa utseende och branding för denna mässa. Utställare ser denna branding när de använder sina invite-länkar.
              </p>

              {/* Logo Upload */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#333'
                }}>
                  📸 Logotyp
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: '100%',
                    marginBottom: '8px'
                  }}
                />
                {brandingLogo && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    display: 'inline-block'
                  }}>
                    <img 
                      src={brandingLogo} 
                      alt="Logo preview" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '80px',
                        display: 'block'
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: '#333'
                }}>
                  🏢 White Label Företagsnamn
                </label>
                <input
                  type="text"
                  placeholder="T.ex. Stockholm Expo AB"
                  value={brandingCompanyName}
                  onChange={(e) => setBrandingCompanyName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#666' }}>
                  Detta namn visas istället för "Monterhyra" för utställare
                </p>
              </div>

              {/* Colors */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    🎨 Primärfärg
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={brandingPrimaryColor}
                      onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={brandingPrimaryColor}
                      onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    🎨 Sekundärfärg
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={brandingSecondaryColor}
                      onChange={(e) => setBrandingSecondaryColor(e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={brandingSecondaryColor}
                      onChange={(e) => setBrandingSecondaryColor(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    📧 Kontakt E-post
                  </label>
                  <input
                    type="email"
                    placeholder="info@företag.se"
                    value={brandingContactEmail}
                    onChange={(e) => setBrandingContactEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    📞 Kontakt Telefon
                  </label>
                  <input
                    type="tel"
                    placeholder="08-123 456 78"
                    value={brandingContactPhone}
                    onChange={(e) => setBrandingContactPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Preview */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700', color: '#666' }}>
                  👁️ Förhandsvisning
                </h4>
                <div style={{
                  background: `linear-gradient(135deg, ${brandingPrimaryColor} 0%, ${brandingSecondaryColor} 100%)`,
                  padding: '20px',
                  borderRadius: '8px',
                  color: 'white',
                  marginBottom: '12px'
                }}>
                  {brandingLogo && (
                    <img 
                      src={brandingLogo} 
                      alt="Logo" 
                      style={{ 
                        maxWidth: '150px', 
                        maxHeight: '60px',
                        marginBottom: '12px',
                        display: 'block',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        padding: '8px',
                        borderRadius: '4px'
                      }} 
                    />
                  )}
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>
                    {brandingCompanyName || 'Monterhyra'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
                    {brandingContactEmail && `📧 ${brandingContactEmail}`}
                    {brandingContactEmail && brandingContactPhone && ' • '}
                    {brandingContactPhone && `📞 ${brandingContactPhone}`}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveBranding}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  width: '100%'
                }}
              >
                💾 Spara White Label Branding
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div>
          {!selectedEvent ? (
            <p style={{ color: '#666' }}>Välj en event först för att ställa in prissättning</p>
          ) : (
            <div style={{ maxWidth: '1000px' }}>
              <h3>💰 Prissättning för {selectedEvent.name}</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Anpassa alla priser specifikt för denna mässa. Dessa priser används istället för standardpriser när utställare designar sin monter.
              </p>

              <div style={{ display: 'grid', gap: '24px' }}>
                
                {/* Golv */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <h4>🏢 Golv</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Baspris per m²</label>
                      <input type="number" value={pricing.floor?.basePricePerSqm ?? 450} 
                        onChange={(e) => setPricing({...pricing, floor: {...pricing.floor, basePricePerSqm: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <small style={{ color: '#666' }}>Std: 450 kr</small>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Min fakturerbar storlek (m²)</label>
                      <input type="number" value={pricing.floor?.minSize ?? 6}
                        onChange={(e) => setPricing({...pricing, floor: {...pricing.floor, minSize: Number(e.target.value)}})}
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
                        onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, straight: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <small style={{ color: '#666' }}>Std: 900 kr</small>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>L-form (kr/lpm)</label>
                      <input type="number" value={pricing.walls?.lShape ?? 900}
                        onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, lShape: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <small style={{ color: '#666' }}>Std: 900 kr</small>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>U-form (kr/lpm)</label>
                      <input type="number" value={pricing.walls?.uShape ?? 900}
                        onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, uShape: Number(e.target.value)}})}
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
                          onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, heightSurcharge: {...pricing.walls?.heightSurcharge, 2.5: Number(e.target.value)}}})}
                          style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>3.0m</label>
                        <input type="number" value={pricing.walls?.heightSurcharge?.[3.0] ?? 230}
                          onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, heightSurcharge: {...pricing.walls?.heightSurcharge, 3.0: Number(e.target.value)}}})}
                          style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>3.5m</label>
                        <input type="number" value={pricing.walls?.heightSurcharge?.[3.5] ?? 440}
                          onChange={(e) => setPricing({...pricing, walls: {...pricing.walls, heightSurcharge: {...pricing.walls?.heightSurcharge, 3.5: Number(e.target.value)}}})}
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
                        onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, none: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Färgad (EXPO)</label>
                      <input type="number" value={pricing.carpet?.colored ?? 180}
                        onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, colored: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>SALSA</label>
                      <input type="number" value={pricing.carpet?.salsa ?? 240}
                        onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, salsa: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Rutmönster</label>
                      <input type="number" value={pricing.carpet?.patterned ?? 250}
                        onChange={(e) => setPricing({...pricing, carpet: {...pricing.carpet, patterned: Number(e.target.value)}})}
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
                        onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, none: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Hyr</label>
                      <input type="number" value={pricing.graphics?.hyr ?? 880}
                        onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, hyr: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Forex</label>
                      <input type="number" value={pricing.graphics?.forex ?? 1450}
                        onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, forex: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Vepa</label>
                      <input type="number" value={pricing.graphics?.vepa ?? 775}
                        onChange={(e) => setPricing({...pricing, graphics: {...pricing.graphics, vepa: Number(e.target.value)}})}
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
                        onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, table: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Barstol</label>
                      <input type="number" value={pricing.furniture?.chair ?? 450}
                        onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, chair: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Pall</label>
                      <input type="number" value={pricing.furniture?.stool ?? 650}
                        onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, stool: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Soffa</label>
                      <input type="number" value={pricing.furniture?.sofa ?? 1500}
                        onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, sofa: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Fåtölj</label>
                      <input type="number" value={pricing.furniture?.armchair ?? 850}
                        onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, armchair: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Sidobord</label>
                      <input type="number" value={pricing.furniture?.side_table ?? 350}
                        onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, side_table: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Podie</label>
                      <input type="number" value={pricing.furniture?.podium ?? 850}
                        onChange={(e) => setPricing({...pricing, furniture: {...pricing.furniture, podium: Number(e.target.value)}})}
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
                        onChange={(e) => setPricing({...pricing, counters: {...pricing.counters, perMeter: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <small style={{ color: '#666' }}>Std: 800 kr/lpm</small>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>L-disk</label>
                      <input type="number" value={pricing.counters?.lShape ?? 1000}
                        onChange={(e) => setPricing({...pricing, counters: {...pricing.counters, lShape: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <small style={{ color: '#666' }}>Std: 1000 kr</small>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>L-disk (spegelvänd)</label>
                      <input type="number" value={pricing.counters?.lShapeMirrored ?? 1000}
                        onChange={(e) => setPricing({...pricing, counters: {...pricing.counters, lShapeMirrored: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      <small style={{ color: '#666' }}>Std: 1000 kr</small>
                    </div>
                  </div>
                </div>

                {/* Disktillbehör */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <h4>☕ Disktillbehör (kr/st)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Espressomaskin</label>
                      <input type="number" value={pricing.counterItems?.espressoMachine ?? 4500}
                        onChange={(e) => setPricing({...pricing, counterItems: {...pricing.counterItems, espressoMachine: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Blomvas</label>
                      <input type="number" value={pricing.counterItems?.flowerVase ?? 850}
                        onChange={(e) => setPricing({...pricing, counterItems: {...pricing.counterItems, flowerVase: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Godis skål</label>
                      <input type="number" value={pricing.counterItems?.candyBowl ?? 500}
                        onChange={(e) => setPricing({...pricing, counterItems: {...pricing.counterItems, candyBowl: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* TV-skärmar */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <h4>📺 TV-skärmar (kr/st)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>43"</label>
                      <input type="number" value={pricing.tvs?.[43] ?? 2700}
                        onChange={(e) => setPricing({...pricing, tvs: {...pricing.tvs, 43: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>55"</label>
                      <input type="number" value={pricing.tvs?.[55] ?? 3500}
                        onChange={(e) => setPricing({...pricing, tvs: {...pricing.tvs, 55: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>70"</label>
                      <input type="number" value={pricing.tvs?.[70] ?? 10000}
                        onChange={(e) => setPricing({...pricing, tvs: {...pricing.tvs, 70: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* Växter */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <h4>🌿 Växter (kr/st)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Liten (&lt;1m)</label>
                      <input type="number" value={pricing.plants?.small ?? 550}
                        onChange={(e) => setPricing({...pricing, plants: {...pricing.plants, small: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Medium (1-2m)</label>
                      <input type="number" value={pricing.plants?.medium ?? 850}
                        onChange={(e) => setPricing({...pricing, plants: {...pricing.plants, medium: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Stor (&gt;2m)</label>
                      <input type="number" value={pricing.plants?.large ?? 1200}
                        onChange={(e) => setPricing({...pricing, plants: {...pricing.plants, large: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* Förråd, Belysning, Truss */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                    <h4>📦 Förråd</h4>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Per m²</label>
                      <input type="number" value={pricing.storage?.perSqm ?? 380}
                        onChange={(e) => setPricing({...pricing, storage: {...pricing.storage, perSqm: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                    <h4>💡 Belysning</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>LED-strips (ca 5m)</label>
                        <input type="number" value={pricing.lighting?.ledStrips ?? 2000}
                          onChange={(e) => setPricing({...pricing, lighting: {...pricing.lighting, ledStrips: Number(e.target.value)}})}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>SAM-LED lampor (kr/st)</label>
                        <input type="number" value={pricing.lighting?.samLed ?? 300}
                          onChange={(e) => setPricing({...pricing, lighting: {...pricing.lighting, samLed: Number(e.target.value)}})}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Truss */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <h4>🔧 Truss</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Ingen</label>
                      <input type="number" value={pricing.truss?.none ?? 0}
                        onChange={(e) => setPricing({...pricing, truss: {...pricing.truss, none: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Fram rak (kr/lpm)</label>
                      <input type="number" value={pricing.truss?.frontStraight ?? 400}
                        onChange={(e) => setPricing({...pricing, truss: {...pricing.truss, frontStraight: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Hängande rund</label>
                      <input type="number" value={pricing.truss?.hangingRound ?? 5500}
                        onChange={(e) => setPricing({...pricing, truss: {...pricing.truss, hangingRound: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Hängande fyrkantig</label>
                      <input type="number" value={pricing.truss?.hangingSquare ?? 5500}
                        onChange={(e) => setPricing({...pricing, truss: {...pricing.truss, hangingSquare: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* Tilläggstjänster */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <h4>➕ Tilläggstjänster (kr/st)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Extra el-uttag</label>
                      <input type="number" value={pricing.extras?.powerOutlet ?? 300}
                        onChange={(e) => setPricing({...pricing, extras: {...pricing.extras, powerOutlet: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Klädhängare</label>
                      <input type="number" value={pricing.extras?.clothingRacks ?? 200}
                        onChange={(e) => setPricing({...pricing, extras: {...pricing.extras, clothingRacks: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Högtalare</label>
                      <input type="number" value={pricing.extras?.speakers ?? 3500}
                        onChange={(e) => setPricing({...pricing, extras: {...pricing.extras, speakers: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Väggskiva</label>
                      <input type="number" value={pricing.extras?.wallShelves ?? 350}
                        onChange={(e) => setPricing({...pricing, extras: {...pricing.extras, wallShelves: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Basplatta</label>
                      <input type="number" value={pricing.extras?.baseplate ?? 450}
                        onChange={(e) => setPricing({...pricing, extras: {...pricing.extras, baseplate: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Färgmålning (kr/m²)</label>
                      <input type="number" value={pricing.extras?.colorPainting ?? 500}
                        onChange={(e) => setPricing({...pricing, extras: {...pricing.extras, colorPainting: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* Personal & Service */}
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <h4>👷 Personal & Service</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Timpris personal (kr/timme)</label>
                      {/* @ts-ignore - services finns runtime */}
                      <input type="number" value={pricing.services?.hourlyRate ?? 750}
                        onChange={(e) => setPricing({...pricing, services: {...(pricing as any).services, hourlyRate: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Skissavgift liten (&lt;25m²)</label>
                      {/* @ts-ignore */}
                      <input type="number" value={pricing.services?.sketchFeeSmall ?? 5000}
                        onChange={(e) => setPricing({...pricing, services: {...(pricing as any).services, sketchFeeSmall: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Skissavgift stor (&gt;25m²)</label>
                      {/* @ts-ignore */}
                      <input type="number" value={pricing.services?.sketchFeeLarge ?? 10000}
                        onChange={(e) => setPricing({...pricing, services: {...(pricing as any).services, sketchFeeLarge: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Projektledning (%)</label>
                      {/* @ts-ignore */}
                      <input type="number" value={pricing.services?.projectManagementPercent ?? 15}
                        onChange={(e) => setPricing({...pricing, services: {...(pricing as any).services, projectManagementPercent: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Förbrukning liten (&lt;25m²)</label>
                      {/* @ts-ignore */}
                      <input type="number" value={pricing.services?.consumablesSmall ?? 750}
                        onChange={(e) => setPricing({...pricing, services: {...(pricing as any).services, consumablesSmall: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Förbrukning medium (25-64m²)</label>
                      {/* @ts-ignore */}
                      <input type="number" value={pricing.services?.consumablesMedium ?? 1350}
                        onChange={(e) => setPricing({...pricing, services: {...(pricing as any).services, consumablesMedium: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>Förbrukning stor (&gt;64m²)</label>
                      {/* @ts-ignore */}
                      <input type="number" value={pricing.services?.consumablesLarge ?? 2000}
                        onChange={(e) => setPricing({...pricing, services: {...(pricing as any).services, consumablesLarge: Number(e.target.value)}})}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSavePricing}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '16px',
                    width: '100%'
                  }}
                >
                  💾 Spara alla priser för {selectedEvent.name}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExhibitorAdmin;
