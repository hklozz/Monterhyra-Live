import { useState } from 'react';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

// beMatrix dimensioner: 62mm x 62mm moduler
const BEMATRIX_MODULE_SIZE = 62; // mm

// Konvertera meter till beMatrix dimensioner
export function metersToBeMatrixDimensions(meters: number): { mm: number; modules: number } {
  const modules = Math.round((meters * 1000) / BEMATRIX_MODULE_SIZE);
  const mm = modules * BEMATRIX_MODULE_SIZE;
  return { mm, modules };
}

// Typ-definitioner för förrådsvägg design
export interface StorageWallDesign {
  wallId: string; // 'back', 'left', 'right', 'front'
  wallLabel: string; // 'Bakvägg', 'Vänster', 'Höger', 'Framsida'
  widthMeters: number;
  heightMeters: number;
  widthMM: number;
  heightMM: number;
  backgroundColor: string; // CMYK format: "C:0 M:0 Y:0 K:0"
  backgroundColorRGB: string; // RGB hex för preview
  backgroundImage?: string; // Helbild som täcker hela väggen
  logo?: {
    imageData: string; // base64
    x: number; // position i mm från vänster
    y: number; // position i mm från topp
    width: number; // bredd i mm
    height: number; // höjd i mm
  };
  printType: 'vepa' | 'forex'; // Vilken typ av tryck
  isFree: boolean; // Om denna sida är fri (inte mot montervägg)
}

interface StoragePDFGeneratorProps {
  storageWidth: number; // meter (bredd)
  storageDepth: number; // meter (djup)
  storageHeight: number; // meter (höjd)
  freeWalls: {
    back: boolean;
    left: boolean;
    right: boolean;
    front: boolean;
  }; // Vilka väggar som är fria (inte mot montervägg)
  onClose: () => void;
  onApplyDesigns?: (designs: StorageWallDesign[], printType: 'vepa' | 'forex') => void;
  existingDesigns?: StorageWallDesign[];
  existingPrintType?: 'vepa' | 'forex';
}

export default function StoragePDFGenerator({
  storageWidth,
  storageDepth,
  storageHeight,
  freeWalls,
  onClose,
  onApplyDesigns,
  existingDesigns,
  existingPrintType
}: StoragePDFGeneratorProps) {
  const [printType, setPrintType] = useState<'vepa' | 'forex'>(existingPrintType || 'vepa');
  const [designs, setDesigns] = useState<StorageWallDesign[]>(() => {
    // Om vi har tidigare designs, använd dem
    if (existingDesigns && existingDesigns.length > 0) {
      console.log('📂 Laddar tidigare förråds-designs:', existingDesigns);
      return existingDesigns;
    }
    
    // Annars initiera nya design-objekt för alla väggar
    console.log('🆕 Skapar nya förråds-designs');
    const initialDesigns: StorageWallDesign[] = [];
    const heightDimensions = metersToBeMatrixDimensions(storageHeight);
    
    // Bakvägg (bredd = storageWidth)
    if (freeWalls.back) {
      const backDimensions = metersToBeMatrixDimensions(storageWidth);
      initialDesigns.push({
        wallId: 'back',
        wallLabel: 'Bakvägg',
        widthMeters: storageWidth,
        heightMeters: storageHeight,
        widthMM: backDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    // Vänster vägg (bredd = storageDepth)
    if (freeWalls.left) {
      const leftDimensions = metersToBeMatrixDimensions(storageDepth);
      initialDesigns.push({
        wallId: 'left',
        wallLabel: 'Vänster vägg',
        widthMeters: storageDepth,
        heightMeters: storageHeight,
        widthMM: leftDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    // Höger vägg (bredd = storageDepth)
    if (freeWalls.right) {
      const rightDimensions = metersToBeMatrixDimensions(storageDepth);
      initialDesigns.push({
        wallId: 'right',
        wallLabel: 'Höger vägg',
        widthMeters: storageDepth,
        heightMeters: storageHeight,
        widthMM: rightDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    // Framsida (bredd = storageWidth)
    if (freeWalls.front) {
      const frontDimensions = metersToBeMatrixDimensions(storageWidth);
      initialDesigns.push({
        wallId: 'front',
        wallLabel: 'Framsida',
        widthMeters: storageWidth,
        heightMeters: storageHeight,
        widthMM: frontDimensions.mm,
        heightMM: heightDimensions.mm,
        backgroundColor: 'C:0 M:0 Y:0 K:0',
        backgroundColorRGB: '#FFFFFF',
        printType,
        isFree: true
      });
    }
    
    return initialDesigns;
  });
  
  const [currentWallIndex, setCurrentWallIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentDesign = designs[currentWallIndex];
  
  // Ladda upp logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      
      // Ladda bilden för att få dess faktiska dimensioner
      const img = new Image();
      img.onload = () => {
        // Beräkna bildens proportioner
        const imageAspectRatio = img.width / img.height;
        
        let logoWidth: number;
        let logoHeight: number;
        
        // Anpassa bilden så den passar inom väggen (max 80% av väggen för att ha marginal)
        const maxWidth = currentDesign.widthMM * 0.8;
        const maxHeight = currentDesign.heightMM * 0.8;
        
        if (imageAspectRatio > (maxWidth / maxHeight)) {
          // Bilden är bredare än väggen - begränsa till maxWidth
          logoWidth = maxWidth;
          logoHeight = maxWidth / imageAspectRatio;
        } else {
          // Bilden är högre än väggen - begränsa till maxHeight
          logoHeight = maxHeight;
          logoWidth = maxHeight * imageAspectRatio;
        }
        
        // Centrera logon
        const logoX = (currentDesign.widthMM - logoWidth) / 2;
        const logoY = (currentDesign.heightMM - logoHeight) / 2;
        
        setDesigns(prev => prev.map((d, i) => 
          i === currentWallIndex 
            ? { ...d, logo: { imageData, x: logoX, y: logoY, width: logoWidth, height: logoHeight } }
            : d
        ));
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };
  
  // Ta bort logo
  const removeLogo = () => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentWallIndex 
        ? { ...d, logo: undefined }
        : d
    ));
  };
  
  // Ladda upp bakgrundsbild
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const backgroundImage = event.target?.result as string;
      setDesigns(prev => prev.map((d, i) => 
        i === currentWallIndex 
          ? { ...d, backgroundImage }
          : d
      ));
    };
    reader.readAsDataURL(file);
  };
  
  // Ta bort bakgrundsbild
  const removeBackground = () => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentWallIndex 
        ? { ...d, backgroundImage: undefined }
        : d
    ));
  };
  
  // Uppdatera bakgrundsfärg
  const updateBackgroundColor = (rgb: string, cmyk: string) => {
    setDesigns(prev => prev.map((d, i) => 
      i === currentWallIndex 
        ? { ...d, backgroundColorRGB: rgb, backgroundColor: cmyk }
        : d
    ));
  };
  
  // Applicera design på 3D-modellen
  const applyToModel = () => {
    if (onApplyDesigns) {
      onApplyDesigns(designs, printType);
      alert('✅ Design applicerad på 3D-modellen!');
    }
  };
  
  // Generera PDF för alla fria väggar
  const generateAllPDFs = async () => {
    if (designs.length === 0) {
      alert('❌ Inga fria väggar att generera PDF för');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const zip = new JSZip();
      const bleedMM = printType === 'vepa' ? 30 : 3; // 30mm för VEPA, 3mm för Forex
      
      for (const design of designs) {
        const pdf = await generateWallPDF(design, bleedMM, printType);
        const pdfBlob = pdf.output('blob');
        zip.file(`Forrad_${design.wallLabel.replace(/\s+/g, '_')}_${design.widthMM}x${design.heightMM}mm.pdf`, pdfBlob);
      }
      
      // Ladda ner ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Forrad_${printType.toUpperCase()}_PDF_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`✅ PDF-filer nedladdade! Du kan nu:\n• Fortsätta redigera designen\n• Skicka PDF-filerna till tryckeriet\n• Applicera designen på 3D-modellen`);
      
    } catch (error) {
      console.error('❌ Fel vid PDF-generering:', error);
      alert('❌ Kunde inte generera PDF-filer');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generera PDF för en vägg
  async function generateWallPDF(design: StorageWallDesign, bleedMM: number, type: 'vepa' | 'forex'): Promise<jsPDF> {
    const totalWidth = design.widthMM + 2 * bleedMM;
    const totalHeight = design.heightMM + 2 * bleedMM;
    
    const pdf = new jsPDF({
      orientation: totalWidth > totalHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [totalWidth, totalHeight],
      compress: true
    });
    
    // Parse CMYK background color
    const cmykMatch = design.backgroundColor.match(/C:(\d+)\s+M:(\d+)\s+Y:(\d+)\s+K:(\d+)/);
    if (cmykMatch) {
      const [, c, m, y, k] = cmykMatch.map(Number);
      pdf.setFillColor(c, m, y, k);
      pdf.rect(0, 0, totalWidth, totalHeight, 'F');
    }
    
    // Rita bakgrundsbild om den finns
    if (design.backgroundImage) {
      try {
        pdf.addImage(design.backgroundImage, 'JPEG', bleedMM, bleedMM, design.widthMM, design.heightMM, undefined, 'FAST');
      } catch (error) {
        console.error('Kunde inte lägga till bakgrundsbild:', error);
      }
    }
    
    // Rita logo om den finns
    if (design.logo) {
      try {
        pdf.addImage(
          design.logo.imageData,
          'PNG',
          design.logo.x + bleedMM,
          design.logo.y + bleedMM,
          design.logo.width,
          design.logo.height,
          undefined,
          'FAST'
        );
      } catch (error) {
        console.error('Kunde inte lägga till logo:', error);
      }
    }
    
    // Rita skärlinjer (cutlines)
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.rect(bleedMM, bleedMM, design.widthMM, design.heightMM);
    
    // Rita hörn markeringar
    const cornerSize = 10;
    // Övre vänster
    pdf.line(bleedMM, bleedMM - cornerSize, bleedMM, bleedMM + cornerSize);
    pdf.line(bleedMM - cornerSize, bleedMM, bleedMM + cornerSize, bleedMM);
    // Övre höger
    pdf.line(bleedMM + design.widthMM, bleedMM - cornerSize, bleedMM + design.widthMM, bleedMM + cornerSize);
    pdf.line(bleedMM + design.widthMM - cornerSize, bleedMM, bleedMM + design.widthMM + cornerSize, bleedMM);
    // Nedre vänster
    pdf.line(bleedMM, bleedMM + design.heightMM - cornerSize, bleedMM, bleedMM + design.heightMM + cornerSize);
    pdf.line(bleedMM - cornerSize, bleedMM + design.heightMM, bleedMM + cornerSize, bleedMM + design.heightMM);
    // Nedre höger
    pdf.line(bleedMM + design.widthMM, bleedMM + design.heightMM - cornerSize, bleedMM + design.widthMM, bleedMM + design.heightMM + cornerSize);
    pdf.line(bleedMM + design.widthMM - cornerSize, bleedMM + design.heightMM, bleedMM + design.widthMM + cornerSize, bleedMM + design.heightMM);
    
    // Lägg till metadata
    pdf.setProperties({
      title: `Förråd ${design.wallLabel} - ${type.toUpperCase()} Tryck`,
      subject: `${design.widthMM}mm x ${design.heightMM}mm (${design.widthMeters}m x ${design.heightMeters}m)`,
      author: 'Monterhyra PDF Generator',
      keywords: `${type}, förråd, tryck, beMatrix, ${bleedMM}mm bleed`,
      creator: 'Monterhyra System'
    });
    
    return pdf;
  }
  
  if (!currentDesign) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">❌ Inga fria väggar</h2>
          <p className="mb-4">Detta förråd har inga fria väggar som behöver grafik.</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-7xl w-full my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">🎨 Förråd {printType.toUpperCase()} Designer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        {/* Trycktyp väljare */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-bold mb-2">Välj trycktyp:</label>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setPrintType('vepa');
                setDesigns(prev => prev.map(d => ({ ...d, printType: 'vepa' })));
              }}
              className={`px-6 py-3 rounded-lg font-bold ${
                printType === 'vepa'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              VEPA (Fabric - 30mm bleed)
            </button>
            <button
              onClick={() => {
                setPrintType('forex');
                setDesigns(prev => prev.map(d => ({ ...d, printType: 'forex' })));
              }}
              className={`px-6 py-3 rounded-lg font-bold ${
                printType === 'forex'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              FOREX (Rigid - 3mm bleed)
            </button>
          </div>
        </div>
        
        {/* Väggväljare */}
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">Välj vägg att designa ({designs.length} fria väggar):</label>
          <div className="flex gap-2 flex-wrap">
            {designs.map((design, index) => (
              <button
                key={design.wallId}
                onClick={() => setCurrentWallIndex(index)}
                className={`px-4 py-2 rounded ${
                  index === currentWallIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {design.wallLabel} ({design.widthMeters}m × {design.heightMeters}m)
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vänster panel: Redigeringsverktyg */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{currentDesign.wallLabel}</h3>
            <p className="text-sm text-gray-600">
              Storlek: {currentDesign.widthMM}mm × {currentDesign.heightMM}mm 
              ({currentDesign.widthMeters}m × {currentDesign.heightMeters}m)
            </p>
            
            {/* Bakgrundsfärg */}
            <div>
              <label className="block text-sm font-bold mb-2">Bakgrundsfärg:</label>
              <input
                type="color"
                value={currentDesign.backgroundColorRGB}
                onChange={(e) => {
                  const rgb = e.target.value;
                  // Enkel RGB till CMYK konvertering (approximation)
                  const r = parseInt(rgb.slice(1, 3), 16) / 255;
                  const g = parseInt(rgb.slice(3, 5), 16) / 255;
                  const b = parseInt(rgb.slice(5, 7), 16) / 255;
                  
                  const k = 1 - Math.max(r, g, b);
                  const c = (1 - r - k) / (1 - k) || 0;
                  const m = (1 - g - k) / (1 - k) || 0;
                  const y = (1 - b - k) / (1 - k) || 0;
                  
                  const cmyk = `C:${Math.round(c * 100)} M:${Math.round(m * 100)} Y:${Math.round(y * 100)} K:${Math.round(k * 100)}`;
                  updateBackgroundColor(rgb, cmyk);
                }}
                className="w-full h-12 rounded cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">CMYK: {currentDesign.backgroundColor}</p>
            </div>
            
            {/* Bakgrundsbild */}
            <div>
              <label className="block text-sm font-bold mb-2">Bakgrundsbild (heltäckande):</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="w-full text-sm"
              />
              {currentDesign.backgroundImage && (
                <button
                  onClick={removeBackground}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm"
                >
                  ❌ Ta bort bakgrundsbild
                </button>
              )}
            </div>
            
            {/* Logo */}
            <div>
              <label className="block text-sm font-bold mb-2">Logo / Bild:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full text-sm"
              />
              {currentDesign.logo && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Position: {Math.round(currentDesign.logo.x)}mm, {Math.round(currentDesign.logo.y)}mm<br />
                    Storlek: {Math.round(currentDesign.logo.width)}mm × {Math.round(currentDesign.logo.height)}mm
                  </p>
                  <button
                    onClick={removeLogo}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    ❌ Ta bort logo
                  </button>
                </div>
              )}
            </div>
            
            {/* Actionknappar */}
            <div className="space-y-2 pt-4">
              <button
                onClick={applyToModel}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded hover:bg-purple-700 font-bold"
              >
                📺 Applicera design på 3D-modell
              </button>
              <button
                onClick={generateAllPDFs}
                disabled={isGenerating}
                className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 font-bold disabled:bg-gray-400"
              >
                {isGenerating ? '⏳ Genererar PDFs...' : '📄 Ladda ner alla PDF-filer (.zip)'}
              </button>
            </div>
          </div>
          
          {/* Höger panel: Preview */}
          <div>
            <h3 className="text-xl font-bold mb-2">Preview (förhandsvisning):</h3>
            <div 
              className="border-4 border-gray-300 rounded relative overflow-hidden"
              style={{
                aspectRatio: `${currentDesign.widthMM} / ${currentDesign.heightMM}`,
                backgroundColor: currentDesign.backgroundColorRGB,
                backgroundImage: currentDesign.backgroundImage ? `url(${currentDesign.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {currentDesign.logo && (
                <img
                  src={currentDesign.logo.imageData}
                  alt="Logo"
                  style={{
                    position: 'absolute',
                    left: `${(currentDesign.logo.x / currentDesign.widthMM) * 100}%`,
                    top: `${(currentDesign.logo.y / currentDesign.heightMM) * 100}%`,
                    width: `${(currentDesign.logo.width / currentDesign.widthMM) * 100}%`,
                    height: `${(currentDesign.logo.height / currentDesign.heightMM) * 100}%`,
                  }}
                />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {printType === 'vepa' ? '30mm' : '3mm'} bleed kommer läggas till runt om i PDF:en
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
