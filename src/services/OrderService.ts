import { supabase } from '../supabaseClient';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  company: string;
  deliveryAddress: string;
  eventDate: string;
  eventTime: string;
  setupTime: string;
  pickupTime: string;
  message: string;
}

export interface OrderData {
  floorSize: any;
  wallConfig: any;
  furniture: any[];
  plants: any[];
  decorations: any[];
  storages: any[];
  counters: any[];
  tvs: any[];
  totalPrice: number;
  packlista?: any;
  images?: string[];
}

export interface Order {
  id: string;
  exhibitorId?: string | null;
  eventId?: string | null;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string | null;
  customerPhone?: string | null;
  boothData: any;
  pricingData: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class OrderService {
  /**
   * Genererar unikt ordernummer (format: MH-YYYYMMDD-XXXX)
   */
  static generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `MH-${dateStr}-${randomPart}`;
  }

  /**
   * Skapa ny beställning i Supabase
   */
  static async createOrder(
    customerInfo: CustomerInfo,
    orderData: OrderData,
    exhibitorId?: string,
    eventId?: string
  ): Promise<Order> {
    const orderNumber = this.generateOrderNumber();

    const { data, error } = await supabase
      .from('orders')
      .insert({
        exhibitor_id: exhibitorId || null,
        event_id: eventId || null,
        order_number: orderNumber,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_company: customerInfo.company || null,
        customer_phone: customerInfo.phone || null,
        booth_data: {
          floorSize: orderData.floorSize,
          wallConfig: orderData.wallConfig,
          furniture: orderData.furniture,
          plants: orderData.plants,
          decorations: orderData.decorations,
          storages: orderData.storages,
          counters: orderData.counters,
          tvs: orderData.tvs,
          packlista: orderData.packlista,
          images: orderData.images
        },
        pricing_data: {
          totalPrice: orderData.totalPrice,
          deliveryAddress: customerInfo.deliveryAddress,
          eventDate: customerInfo.eventDate,
          eventTime: customerInfo.eventTime,
          setupTime: customerInfo.setupTime,
          pickupTime: customerInfo.pickupTime,
          message: customerInfo.message
        },
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Fel vid skapande av order i Supabase:', error);
      throw new Error(`Kunde inte skapa order: ${error.message}`);
    }

    console.log('✅ Order skapad i Supabase:', data.id);

    return {
      id: data.id,
      exhibitorId: data.exhibitor_id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerCompany: data.customer_company,
      customerPhone: data.customer_phone,
      boothData: data.booth_data,
      pricingData: data.pricing_data,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Hämta alla orders från Supabase
   */
  static async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av orders från Supabase:', error);
      throw new Error(`Kunde inte hämta orders: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      exhibitorId: row.exhibitor_id,
      eventId: row.event_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerCompany: row.customer_company,
      customerPhone: row.customer_phone,
      boothData: row.booth_data,
      pricingData: row.pricing_data,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Hämta orders för ett specifikt event
   */
  static async getOrdersByEvent(eventId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av event orders:', error);
      throw new Error(`Kunde inte hämta orders: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      exhibitorId: row.exhibitor_id,
      eventId: row.event_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerCompany: row.customer_company,
      customerPhone: row.customer_phone,
      boothData: row.booth_data,
      pricingData: row.pricing_data,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
  static async getOrdersByExhibitor(exhibitorId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('exhibitor_id', exhibitorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av exhibitor orders:', error);
      throw new Error(`Kunde inte hämta orders: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      exhibitorId: row.exhibitor_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerCompany: row.customer_company,
      customerPhone: row.customer_phone,
      boothData: row.booth_data,
      pricingData: row.pricing_data,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  /**
   * Hämta en specifik order
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('❌ Fel vid hämtning av order:', error);
      throw new Error(`Kunde inte hämta order: ${error.message}`);
    }

    return {
      id: data.id,
      exhibitorId: data.exhibitor_id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      customerCompany: data.customer_company,
      customerPhone: data.customer_phone,
      boothData: data.booth_data,
      pricingData: data.pricing_data,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Uppdatera status på en order
   */
  static async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('❌ Fel vid uppdatering av order status:', error);
      throw new Error(`Kunde inte uppdatera order: ${error.message}`);
    }

    console.log('✅ Order status uppdaterad:', orderId, status);
  }

  /**
   * Ta bort en order
   */
  static async deleteOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('❌ Fel vid borttagning av order:', error);
      throw new Error(`Kunde inte ta bort order: ${error.message}`);
    }

    console.log('✅ Order borttagen:', orderId);
  }

  /**
   * Prenumerera på nya orders (real-time)
   */
  static subscribeToOrders(callback: (order: Order) => void) {
    const channel = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const data = payload.new as any;
          callback({
            id: data.id,
            exhibitorId: data.exhibitor_id,
            orderNumber: data.order_number,
            customerName: data.customer_name,
            customerEmail: data.customer_email,
            customerCompany: data.customer_company,
            customerPhone: data.customer_phone,
            boothData: data.booth_data,
            pricingData: data.pricing_data,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
