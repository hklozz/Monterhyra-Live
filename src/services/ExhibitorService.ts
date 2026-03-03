import { supabase } from '../supabaseClient';

export interface EventBranding {
  logoUrl?: string;
  primaryColor?: string;
  companyName?: string;
}

export interface EventPricing {
  floor?: { basePricePerSqm: number; minSize: number };
  walls?: { 
    straight: number; 
    lShape: number; 
    uShape: number; 
    heightSurcharge: { 2.5: number; 3.0: number; 3.5: number } 
  };
  carpet?: { none: number; colored: number; salsa: number; patterned: number };
  frames?: { '1x2.5': number };
  graphics?: { none: number; hyr: number; forex: number; vepa: number };
  furniture?: { 
    table: number; 
    chair: number; 
    stool: number; 
    sofa: number; 
    armchair: number; 
    side_table: number; 
    podium: number 
  };
  counters?: { perMeter: number; lShape: number; lShapeMirrored: number };
  counterItems?: { espressoMachine: number; flowerVase: number; candyBowl: number };
  tvs?: { 43: number; 55: number; 70: number };
  storage?: { perSqm: number };
  plants?: { small: number; medium: number; large: number };
  lighting?: { ledStrips: number; samLed: number };
  truss?: { none: number; frontStraight: number; hangingRound: number; hangingSquare: number };
  extras?: { 
    powerOutlet: number; 
    clothingRacks: number; 
    speakers: number; 
    wallShelves: number; 
    baseplate: number; 
    colorPainting: number 
  };
  services?: { 
    hourlyRate: number; 
    sketchFeeSmall: number; 
    sketchFeeLarge: number; 
    projectManagementPercent: number; 
    consumablesSmall: number; 
    consumablesMedium: number; 
    consumablesLarge: number 
  };
}

export interface WhiteLabel {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  customDomain?: string;
  favicon?: string;
  footerText?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  password?: string;
  branding?: EventBranding;
  pricing?: EventPricing;
  whiteLabel?: WhiteLabel;
  createdAt: string;
}

export interface Exhibitor {
  id: string;
  eventId: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  username?: string;
  password?: string;
  boothData?: any;
  status: string;
  createdAt: string;
}

export class ExhibitorService {
  /**
   * Skapa nytt event i Supabase
   */
  static async createEvent(
    name: string,
    description?: string,
    options?: {
      startDate?: string;
      endDate?: string;
      location?: string;
      password?: string;
      branding?: EventBranding;
      pricing?: EventPricing;
      whiteLabel?: WhiteLabel;
    }
  ): Promise<Event> {
    // Auto-generera lösenord om inget angivet
    const eventPassword = options?.password || Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data, error } = await supabase
      .from('events')
      .insert({
        name,
        description: description || null,
        start_date: options?.startDate || null,
        end_date: options?.endDate || null,
        location: options?.location || null,
        password: eventPassword,
        branding: options?.branding || null,
        pricing: options?.pricing || null,
        white_label: options?.whiteLabel || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Fel vid skapande av event i Supabase:', error);
      throw new Error(`Kunde inte skapa event: ${error.message}`);
    }

    console.log('✅ Event skapat i Supabase:', data.id);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      password: data.password,
      branding: data.branding,
      pricing: data.pricing,
      whiteLabel: data.white_label,
      createdAt: data.created_at
    };
  }

  /**
   * Hämta alla events från Supabase
   */
  static async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av events:', error);
      throw new Error(`Kunde inte hämta events: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      location: row.location,
      password: row.password,
      branding: row.branding,
      pricing: row.pricing,
      whiteLabel: row.white_label,
      createdAt: row.created_at
    }));
  }

  /**
   * Hämta ett specifikt event
   */
  static async getEvent(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('❌ Fel vid hämtning av event:', error);
      throw new Error(`Kunde inte hämta event: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      password: data.password,
      branding: data.branding,
      pricing: data.pricing,
      whiteLabel: data.white_label,
      createdAt: data.created_at
    };
  }

  /**
   * Uppdatera event
   */
  static async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({
        name: updates.name,
        description: updates.description,
        start_date: updates.startDate,
        end_date: updates.endDate,
        location: updates.location,
        password: updates.password,
        branding: updates.branding,
        pricing: updates.pricing,
        white_label: updates.whiteLabel
      })
      .eq('id', eventId);

    if (error) {
      console.error('❌ Fel vid uppdatering av event:', error);
      throw new Error(`Kunde inte uppdatera event: ${error.message}`);
    }

    console.log('✅ Event uppdaterat:', eventId);
  }

  /**
   * Ta bort event (och alla relaterade exhibitors tack vare CASCADE)
   */
  static async deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('❌ Fel vid borttagning av event:', error);
      throw new Error(`Kunde inte ta bort event: ${error.message}`);
    }

    console.log('✅ Event borttaget:', eventId);
  }

  /**
   * Skapa ny exhibitor i ett event
   */
  static async createExhibitor(
    eventId: string,
    name: string,
    email: string,
    options?: {
      company?: string;
      phone?: string;
      boothData?: any;
      username?: string;
      password?: string;
    }
  ): Promise<Exhibitor> {
    // Generera username och password om de inte finns
    const username = options?.username || email.split('@')[0].toLowerCase();
    const password = options?.password || Math.random().toString(36).substring(2, 10);

    const { data, error } = await supabase
      .from('exhibitors')
      .insert({
        event_id: eventId,
        name,
        email,
        company: options?.company || null,
        phone: options?.phone || null,
        booth_data: options?.boothData || null,
        username,
        password,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Fel vid skapande av exhibitor:', error);
      throw new Error(`Kunde inte skapa exhibitor: ${error.message}`);
    }

    console.log('✅ Exhibitor skapad:', data.id, 'Username:', username, 'Password:', password);

    return {
      id: data.id,
      eventId: data.event_id,
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      username: data.username,
      password: data.password,
      boothData: data.booth_data,
      status: data.status,
      createdAt: data.created_at
    };
  }

  /**
   * Hämta alla exhibitors för ett event
   */
  static async getExhibitorsByEvent(eventId: string): Promise<Exhibitor[]> {
    const { data, error } = await supabase
      .from('exhibitors')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av exhibitors:', error);
      throw new Error(`Kunde inte hämta exhibitors: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      email: row.email,
      company: row.company,
      phone: row.phone,
      boothData: row.booth_data,
      status: row.status,
      createdAt: row.created_at
    }));
  }

  /**
   * Hämta alla exhibitors
   */
  static async getAllExhibitors(): Promise<Exhibitor[]> {
    const { data, error } = await supabase
      .from('exhibitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av exhibitors:', error);
      throw new Error(`Kunde inte hämta exhibitors: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      email: row.email,
      company: row.company,
      phone: row.phone,
      boothData: row.booth_data,
      status: row.status,
      createdAt: row.created_at
    }));
  }

  /**
   * Hämta specifik exhibitor
   */
  static async getExhibitor(exhibitorId: string): Promise<Exhibitor | null> {
    const { data, error } = await supabase
      .from('exhibitors')
      .select('*')
      .eq('id', exhibitorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('❌ Fel vid hämtning av exhibitor:', error);
      throw new Error(`Kunde inte hämta exhibitor: ${error.message}`);
    }

    return {
      id: data.id,
      eventId: data.event_id,
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      boothData: data.booth_data,
      status: data.status,
      createdAt: data.created_at
    };
  }

  /**
   * Uppdatera exhibitor
   */
  static async updateExhibitor(exhibitorId: string, updates: Partial<Exhibitor>): Promise<void> {
    const { error } = await supabase
      .from('exhibitors')
      .update({
        name: updates.name,
        email: updates.email,
        company: updates.company,
        phone: updates.phone,
        booth_data: updates.boothData,
        status: updates.status
      })
      .eq('id', exhibitorId);

    if (error) {
      console.error('❌ Fel vid uppdatering av exhibitor:', error);
      throw new Error(`Kunde inte uppdatera exhibitor: ${error.message}`);
    }

    console.log('✅ Exhibitor uppdaterad:', exhibitorId);
  }

  /**
   * Ta bort exhibitor
   */
  static async deleteExhibitor(exhibitorId: string): Promise<void> {
    const { error } = await supabase
      .from('exhibitors')
      .delete()
      .eq('id', exhibitorId);

    if (error) {
      console.error('❌ Fel vid borttagning av exhibitor:', error);
      throw new Error(`Kunde inte ta bort exhibitor: ${error.message}`);
    }

    console.log('✅ Exhibitor borttagen:', exhibitorId);
  }

  /**
   * Uppdatera exhibitor credentials (username/password)
   */
  static async updateExhibitorCredentials(
    exhibitorId: string,
    username?: string,
    password?: string
  ): Promise<void> {
    const updates: any = {};
    if (username) updates.username = username;
    if (password) updates.password = password;

    const { error } = await supabase
      .from('exhibitors')
      .update(updates)
      .eq('id', exhibitorId);

    if (error) {
      console.error('❌ Fel vid uppdatering av credentials:', error);
      throw new Error(`Kunde inte uppdatera credentials: ${error.message}`);
    }

    console.log('✅ Credentials uppdaterade för exhibitor:', exhibitorId);
  }

  /**
   * Verifiera exhibitor login
   */
  static async verifyExhibitorLogin(username: string, password: string): Promise<Exhibitor | null> {
    const { data, error } = await supabase
      .from('exhibitors')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      eventId: data.event_id,
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      username: data.username,
      password: data.password,
      boothData: data.booth_data,
      status: data.status,
      createdAt: data.created_at
    };
  }

  /**
   * Generera länk för exhibitor med förfyllda mått
   */
  static generateExhibitorLink(
    exhibitor: Exhibitor,
    baseUrl: string = 'https://monterhyra.com'
  ): string {
    const boothData = exhibitor.boothData || {};
    const width = boothData.width || 3;
    const depth = boothData.depth || 3;
    const height = boothData.height || 2.5;

    const params = new URLSearchParams({
      eventId: exhibitor.eventId,
      exhibitorId: exhibitor.id,
      width: width.toString(),
      depth: depth.toString(),
      height: height.toString()
    });

    // Använd alltid /app.html för monterredigeraren
    return `${baseUrl}/app.html?${params.toString()}`;
  }

  /**
   * Verifiera event-lösenord
   */
  static async verifyEventPassword(eventId: string, password: string): Promise<boolean> {
    const event = await this.getEvent(eventId);
    return event?.password === password;
  }
}
