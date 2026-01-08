/*
 * Copyright © 2025 Klozz Holding AB. All rights reserved.
 * MONTERHYRA™ - Proprietary and Confidential
 * Unauthorized copying or distribution is strictly prohibited.
 */

export type MonterSize = 'small' | 'medium' | 'large';

export interface MonterDimensions {
  width: number;   // i meter
  depth: number;   // i meter
  height: number;  // i meter
}

export interface Exhibitor {
  id: string;
  name: string;
  email: string;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  monterSize: MonterSize;
  monterDimensions: MonterDimensions; // actual width/depth/height
  eventId: string;
  token: string;
  inviteLink: string;
  createdAt: Date;
  boothConfig?: {
    furniture: string[];
    decorations: string[];
    customizations: Record<string, any>;
  };
}

export interface EventBranding {
  logo?: string; // URL or base64 image
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string; // White label company name
  contactEmail?: string;
  contactPhone?: string;
  customDomain?: string;
  emailTemplate?: string;
}

export interface EventPricing {
  // Grundpriser
  floor?: {
    basePricePerSqm?: number;
    minSize?: number;
  };
  
  // Väggar
  walls?: {
    straight?: number;
    lShape?: number;
    uShape?: number;
    heightSurcharge?: {
      2.5?: number;
      3.0?: number;
      3.5?: number;
    };
  };
  
  // Golv och mattor
  carpet?: {
    none?: number;
    colored?: number;
    salsa?: number;
    patterned?: number;
  };
  
  // Ramar
  frames?: {
    '1x2.5'?: number;
  };
  
  // Grafik
  graphics?: {
    none?: number;
    hyr?: number;
    forex?: number;
    vepa?: number;
  };
  
  // Möbler
  furniture?: {
    table?: number;
    chair?: number;
    stool?: number;
    sofa?: number;
    armchair?: number;
    side_table?: number;
    podium?: number;
  };
  
  // Diskar
  counters?: {
    perMeter?: number;
    lShape?: number;
    lShapeMirrored?: number;
  };
  
  // Disktillbehör
  counterItems?: {
    espressoMachine?: number;
    flowerVase?: number;
    candyBowl?: number;
  };
  
  // TV-skärmar
  tvs?: {
    43?: number;
    55?: number;
    70?: number;
  };
  
  // Förråd
  storage?: {
    perSqm?: number;
  };
  
  // Växter
  plants?: {
    small?: number;
    medium?: number;
    large?: number;
  };
  
  // Belysning
  lighting?: {
    ledStrips?: number;
  };
  
  // Truss
  truss?: {
    none?: number;
    frontStraight?: number;
    hangingRound?: number;
    hangingSquare?: number;
  };
  
  // Tilläggstjänster
  extras?: {
    powerOutlet?: number;
    clothingRacks?: number;
    speakers?: number;
    wallShelves?: number;
    baseplate?: number;
    colorPainting?: number;
  };
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  exhibitors: Exhibitor[];
  createdAt: Date;
  branding?: EventBranding; // White label branding per event
  pricing?: EventPricing; // Custom pricing per event
}

// Default dimensions for each monterSize
const DEFAULT_DIMENSIONS: Record<MonterSize, MonterDimensions> = {
  small: { width: 2, depth: 2, height: 2.5 },
  medium: { width: 3, depth: 3, height: 2.5 },
  large: { width: 4, depth: 4, height: 2.5 }
};

class ExhibitorManagerClass {
  private events: Event[] = [];
  private exhibitors: Exhibitor[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('exhibitor-portal-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.exhibitors = data.exhibitors || [];
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('exhibitor-portal-data', JSON.stringify({
        events: this.events,
        exhibitors: this.exhibitors,
      }));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }

  // Event methods
  createEvent(
    name: string, 
    description?: string, 
    startDate?: string, 
    endDate?: string,
    branding?: EventBranding
  ): Event {
    const event: Event = {
      id: `event-${Date.now()}`,
      name,
      description,
      startDate,
      endDate,
      exhibitors: [],
      createdAt: new Date(),
      branding: branding || {
        companyName: 'Monterhyra',
        primaryColor: '#3498db',
        secondaryColor: '#2c3e50'
      }
    };
    this.events.push(event);
    this.saveToLocalStorage();
    return event;
  }

  getEvents(): Event[] {
    return this.events;
  }

  getEvent(eventId: string): Event | undefined {
    return this.events.find(e => e.id === eventId);
  }

  deleteEvent(eventId: string): void {
    this.events = this.events.filter(e => e.id !== eventId);
    this.exhibitors = this.exhibitors.filter(ex => ex.eventId !== eventId);
    this.saveToLocalStorage();
  }

  // Exhibitor methods
  addExhibitor(
    eventId: string,
    name: string,
    email: string,
    companyName: string,
    monterSize: MonterSize,
    monterDimensions?: MonterDimensions,
    contactPerson?: string,
    phone?: string
  ): Exhibitor {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const dimensions = monterDimensions || DEFAULT_DIMENSIONS[monterSize];
    
    // Use window.location.origin to get the current origin dynamically
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5176';
    
    const exhibitor: Exhibitor = {
      id: `exhibitor-${Date.now()}`,
      name,
      email,
      companyName,
      contactPerson,
      phone,
      monterSize,
      monterDimensions: dimensions,
      eventId,
      token,
      inviteLink: `${baseUrl}/?invite=${token}&width=${dimensions.width}&depth=${dimensions.depth}&height=${dimensions.height}`,
      createdAt: new Date(),
      boothConfig: {
        furniture: [],
        decorations: [],
        customizations: {},
      },
    };

    this.exhibitors.push(exhibitor);

    // Add exhibitor to event
    const event = this.getEvent(eventId);
    if (event) {
      event.exhibitors.push(exhibitor);
    }

    this.saveToLocalStorage();
    return exhibitor;
  }

  getExhibitors(eventId?: string): Exhibitor[] {
    if (eventId) {
      return this.exhibitors.filter(e => e.eventId === eventId);
    }
    return this.exhibitors;
  }

  getExhibitor(exhibitorId: string): Exhibitor | undefined {
    return this.exhibitors.find(e => e.id === exhibitorId);
  }

  getExhibitorByToken(token: string): Exhibitor | undefined {
    return this.exhibitors.find(e => e.token === token);
  }

  deleteExhibitor(exhibitorId: string): void {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      this.exhibitors = this.exhibitors.filter(e => e.id !== exhibitorId);
      
      // Remove from event
      const event = this.getEvent(exhibitor.eventId);
      if (event) {
        event.exhibitors = event.exhibitors.filter(e => e.id !== exhibitorId);
      }
    }
    this.saveToLocalStorage();
  }

  updateExhibitor(exhibitorId: string, updates: Partial<Exhibitor>): Exhibitor | undefined {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      Object.assign(exhibitor, updates);
      
      // If dimensions were updated, regenerate the invite link
      if (updates.monterDimensions) {
        const dims = updates.monterDimensions;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5176';
        exhibitor.inviteLink = `${baseUrl}/?invite=${exhibitor.token}&width=${dims.width}&depth=${dims.depth}&height=${dims.height}`;
      }
      
      this.saveToLocalStorage();
      return exhibitor;
    }
    return undefined;
  }

  updateExhibitorDimensions(exhibitorId: string, dimensions: MonterDimensions): Exhibitor | undefined {
    return this.updateExhibitor(exhibitorId, { monterDimensions: dimensions });
  }

  getInviteLink(exhibitor: Exhibitor): string {
    return exhibitor.inviteLink;
  }

  // Booth configuration
  saveBoothConfig(
    exhibitorId: string,
    config: {
      furniture: string[];
      decorations: string[];
      customizations: Record<string, any>;
    }
  ): void {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      exhibitor.boothConfig = config;
      this.saveToLocalStorage();
    }
  }

  getBoothConfig(exhibitorId: string) {
    const exhibitor = this.getExhibitor(exhibitorId);
    return exhibitor?.boothConfig;
  }

  // Branding methods
  updateEventBranding(eventId: string, branding: EventBranding): Event | undefined {
    const event = this.getEvent(eventId);
    if (event) {
      event.branding = { ...event.branding, ...branding };
      this.saveToLocalStorage();
      return event;
    }
    return undefined;
  }

  getEventBranding(eventId: string): EventBranding | undefined {
    const event = this.getEvent(eventId);
    return event?.branding;
  }

  // Get branding for an exhibitor (via their event)
  getExhibitorBranding(exhibitorId: string): EventBranding | undefined {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      return this.getEventBranding(exhibitor.eventId);
    }
    return undefined;
  }

  // Pricing methods
  updateEventPricing(eventId: string, pricing: EventPricing): Event | undefined {
    const event = this.getEvent(eventId);
    if (event) {
      event.pricing = { ...event.pricing, ...pricing };
      this.saveToLocalStorage();
      return event;
    }
    return undefined;
  }

  getEventPricing(eventId: string): EventPricing | undefined {
    const event = this.getEvent(eventId);
    return event?.pricing;
  }

  // Get pricing for an exhibitor (via their event)
  getExhibitorPricing(exhibitorId: string): EventPricing | undefined {
    const exhibitor = this.getExhibitor(exhibitorId);
    if (exhibitor) {
      return this.getEventPricing(exhibitor.eventId);
    }
    return undefined;
  }
}

// Export singleton instance
export const ExhibitorManager = new ExhibitorManagerClass();
