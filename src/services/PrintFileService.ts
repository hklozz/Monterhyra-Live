import { supabase } from '../supabaseClient';

export interface PrintFile {
  id: string;
  orderId?: string | null;
  exhibitorId?: string | null;
  eventId?: string | null;
  fileName: string;
  fileType: string; // 'main', 'wall', 'storage'
  fileUrl: string;
  filePath: string;
  customerName?: string | null;
  label?: string | null;
  createdAt: string;
}

export class PrintFileService {
  private static BUCKET = 'print-files';

  /**
   * Ladda upp en PDF till Supabase Storage och spara metadata
   */
  static async uploadPrintFile(
    pdfBlob: Blob,
    fileName: string,
    options: {
      orderId?: string;
      exhibitorId?: string;
      eventId?: string;
      customerName?: string;
      label?: string;
      fileType?: string;
    } = {}
  ): Promise<PrintFile> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const filePath = `${timestamp}_${safeName}`;

    // Ladda upp fil till Storage
    const { error: uploadError } = await supabase.storage
      .from(this.BUCKET)
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Fel vid uppladdning till Storage:', uploadError);
      throw new Error(`Kunde inte ladda upp tryckfil: ${uploadError.message}`);
    }

    // Hämta publik URL
    const { data: urlData } = supabase.storage
      .from(this.BUCKET)
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;

    // Spara metadata i databasen
    const { data, error: dbError } = await supabase
      .from('print_files')
      .insert({
        order_id: options.orderId || null,
        exhibitor_id: options.exhibitorId || null,
        event_id: options.eventId || null,
        file_name: fileName,
        file_type: options.fileType || 'main',
        file_url: fileUrl,
        file_path: filePath,
        customer_name: options.customerName || null,
        label: options.label || fileName
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Fel vid sparande av tryckfil-metadata:', dbError);
      throw new Error(`Kunde inte spara tryckfil-metadata: ${dbError.message}`);
    }

    console.log('✅ Tryckfil uppladdad:', fileName);

    return {
      id: data.id,
      orderId: data.order_id,
      exhibitorId: data.exhibitor_id,
      eventId: data.event_id,
      fileName: data.file_name,
      fileType: data.file_type,
      fileUrl: data.file_url,
      filePath: data.file_path,
      customerName: data.customer_name,
      label: data.label,
      createdAt: data.created_at
    };
  }

  /**
   * Ladda upp alla PDF-filer från en beställning
   */
  static async uploadOrderPrintFiles(
    pdfFiles: {
      mainPDF?: Blob;
      wallPDFs: { name: string; blob: Blob }[];
      storagePDFs: { name: string; blob: Blob }[];
    },
    options: {
      orderId?: string;
      exhibitorId?: string;
      eventId?: string;
      customerName?: string;
    } = {}
  ): Promise<PrintFile[]> {
    const uploaded: PrintFile[] = [];

    // Huvud-PDF
    if (pdfFiles.mainPDF) {
      try {
        const name = `Bestellning_${options.customerName || 'Okand'}_huvuddok.pdf`;
        const f = await this.uploadPrintFile(pdfFiles.mainPDF, name, {
          ...options,
          fileType: 'main',
          label: `Huvuddokument - ${options.customerName || 'Okänd'}`
        });
        uploaded.push(f);
      } catch (e) {
        console.error('Fel vid uppladdning av huvud-PDF:', e);
      }
    }

    // Vägg-PDFer
    for (const w of pdfFiles.wallPDFs) {
      try {
        const f = await this.uploadPrintFile(w.blob, `${w.name}.pdf`, {
          ...options,
          fileType: 'wall',
          label: w.name
        });
        uploaded.push(f);
      } catch (e) {
        console.error('Fel vid uppladdning av vägg-PDF:', w.name, e);
      }
    }

    // Förråds-PDFer
    for (const s of pdfFiles.storagePDFs) {
      try {
        const f = await this.uploadPrintFile(s.blob, `${s.name}.pdf`, {
          ...options,
          fileType: 'storage',
          label: s.name
        });
        uploaded.push(f);
      } catch (e) {
        console.error('Fel vid uppladdning av förråds-PDF:', s.name, e);
      }
    }

    console.log(`✅ Laddade upp ${uploaded.length} tryckfiler till Supabase`);
    return uploaded;
  }

  /**
   * Hämta alla tryckfiler
   */
  static async getAllPrintFiles(): Promise<PrintFile[]> {
    const { data, error } = await supabase
      .from('print_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fel vid hämtning av tryckfiler:', error);
      throw new Error(`Kunde inte hämta tryckfiler: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      orderId: row.order_id,
      exhibitorId: row.exhibitor_id,
      eventId: row.event_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileUrl: row.file_url,
      filePath: row.file_path,
      customerName: row.customer_name,
      label: row.label,
      createdAt: row.created_at
    }));
  }

  /**
   * Hämta tryckfiler för en specifik order
   */
  static async getPrintFilesByOrder(orderId: string): Promise<PrintFile[]> {
    const { data, error } = await supabase
      .from('print_files')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Kunde inte hämta tryckfiler: ${error.message}`);

    return data.map(row => ({
      id: row.id,
      orderId: row.order_id,
      exhibitorId: row.exhibitor_id,
      eventId: row.event_id,
      fileName: row.file_name,
      fileType: row.file_type,
      fileUrl: row.file_url,
      filePath: row.file_path,
      customerName: row.customer_name,
      label: row.label,
      createdAt: row.created_at
    }));
  }

  /**
   * Ta bort en tryckfil
   */
  static async deletePrintFile(printFileId: string, filePath: string): Promise<void> {
    // Ta bort från Storage
    await supabase.storage.from(this.BUCKET).remove([filePath]);

    // Ta bort metadata
    const { error } = await supabase
      .from('print_files')
      .delete()
      .eq('id', printFileId);

    if (error) throw new Error(`Kunde inte ta bort tryckfil: ${error.message}`);
    console.log('✅ Tryckfil borttagen:', printFileId);
  }
}
