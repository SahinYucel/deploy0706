const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Font dosyasının yolu
const FONT_PATH = path.join(__dirname, '../fonts/Roboto-Regular.ttf');
const FONT_BOLD_PATH = path.join(__dirname, '../fonts/Roboto-Bold.ttf');

// Bold font mevcut mu kontrol et
const boldFontExists = fs.existsSync(FONT_BOLD_PATH);

const generateTicketsPDF = async (tickets, fileName, customFilePath = null) => {
    // PDF oluştur - Yatay sayfa (landscape) kullan
    const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'landscape' });
    
    // Eğer özel bir dosya yolu belirtilmişse onu kullan, yoksa temp klasörüne kaydet
    let filePath;
    
    if (customFilePath) {
        filePath = customFilePath;
    } else {
        // Temp klasörü yoksa oluştur
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        filePath = path.join(tempDir, fileName);
    }
    
    // PDF'i dosyaya yönlendir
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Font ekle
    if (fs.existsSync(FONT_PATH)) {
        doc.font(FONT_PATH);
    }
    
    // Biletleri PDF'e ekle
    let y = 50;
    
    // Tur adını ve tarihi başlık olarak ekle
    const tourName = tickets[0].tourName;
    const tourDate = tickets[0].date;
    
    doc.fontSize(16).text(`${tourName} - ${tourDate}`, { align: 'center' });
    y += 30;
    
    // Tablo başlıkları
    doc.fontSize(9);
    
    // Eğer bold font varsa kullan, yoksa normal fontu kullan
    if (boldFontExists) {
        doc.font(FONT_BOLD_PATH);
    }
    
    // Yatay PDF için sütun pozisyonlarını ayarla
    doc.text('Bilet No', 50, y);
    doc.text('Müşteri', 110, y);
    doc.text('Telefon', 190, y);
    doc.text('Otel', 250, y);
    doc.text('Oda', 330, y);
    doc.text('Adult', 370, y);
    doc.text('Child', 400, y);
    doc.text('Free', 430, y);
    doc.text('Saat', 460, y);
    doc.text('Rehber', 500, y);
    doc.text('Opsiyonlar', 570, y);
    doc.text('Rest Miktarı', 640, y);
    doc.text('Açıklama', 710, y);
    
    y += 20;
    doc.moveTo(50, y).lineTo(750, y).stroke();
    y += 10;
    
    // Tekrar normal fonta dön
    if (fs.existsSync(FONT_PATH)) {
        doc.font(FONT_PATH);
    }
    
    // Her bilet için bir satır ekle
    for (const ticket of tickets) {
        // Eğer sayfa sonu yaklaşıyorsa yeni sayfa başlat
        if (y > 500) {
            doc.addPage({layout: 'landscape'});
            y = 50;
            
            // Başlık tekrar ekle
            doc.fontSize(16).text(`${tourName} - ${tourDate}`, { align: 'center' });
            y += 30;
            
            // Tablo başlıkları
            doc.fontSize(9);
            
            if (boldFontExists) {
                doc.font(FONT_BOLD_PATH);
            }
            
            doc.text('Bilet No', 50, y);
            doc.text('Müşteri', 110, y);
            doc.text('Telefon', 190, y);
            doc.text('Otel', 250, y);
            doc.text('Oda', 330, y);
            doc.text('Adult', 370, y);
            doc.text('Child', 400, y);
            doc.text('Free', 430, y);
            doc.text('Saat', 460, y);
            doc.text('Rehber', 500, y);
            doc.text('Opsiyonlar', 570, y);
            doc.text('Rest Miktarı', 640, y);
            doc.text('Açıklama', 710, y);
            
            y += 20;
            doc.moveTo(50, y).lineTo(750, y).stroke();
            y += 10;
            
            if (fs.existsSync(FONT_PATH)) {
                doc.font(FONT_PATH);
            }
        }
        
        // Bilet verilerini ekle
        doc.fontSize(9); // Metni küçült
        doc.text(ticket.ticket_number || '', 50, y);
        doc.text(ticket.customerName || '', 110, y, { width: 75 });
        doc.text(ticket.phone || '', 190, y, { width: 55 });
        doc.text(ticket.hotel_name || '', 250, y, { width: 75 });
        doc.text(ticket.room_number || '', 330, y);
        doc.text(ticket.adult_count || '0', 370, y);
        doc.text(ticket.child_count || '0', 400, y);
        doc.text(ticket.free_count || '0', 430, y);
        doc.text(ticket.time || '', 460, y);
        doc.text(ticket.guide_name || '', 500, y, { width: 65 });
        doc.text(ticket.ticket_options || '-', 570, y, { width: 65 });
        
        // Kalan ödeme bilgisini ekle
        let restAmountText = '-';
        if (ticket.ticket_rest_amount) {
            restAmountText = ticket.ticket_rest_amount.split(', ').join('\n');
        }
        doc.text(restAmountText, 640, y, { width: 65 });
        
        // Not/yorum bilgisini ekle ve satır yüksekliğini hesapla
        const comment = ticket.comment || '';
        doc.text(comment, 710, y, { width: 35 });
        
        // Her alan için satır sayısını hesapla
        const commentLines = Math.ceil(doc.widthOfString(comment) / 35);
        const restAmountLines = restAmountText.split('\n').length;
        const optionsLines = Math.ceil(doc.widthOfString(ticket.ticket_options || '-') / 65);
        const nameLines = Math.ceil(doc.widthOfString(ticket.customerName || '') / 75);
        const hotelLines = Math.ceil(doc.widthOfString(ticket.hotel_name || '') / 75);
        const guideLines = Math.ceil(doc.widthOfString(ticket.guide_name || '') / 65);
        
        // En yüksek satır sayısına göre y koordinatını ayarla
        const maxLines = Math.max(commentLines, restAmountLines, optionsLines, nameLines, hotelLines, guideLines);
        y += Math.max(25, maxLines * 15); // Her satır için 15 piksel, minimum 25 piksel
    }
    
    // Toplam kişi sayısını ekle
    y += 10;
    doc.moveTo(50, y).lineTo(750, y).stroke();
    y += 10;
    
    // Toplam hesapla
    const totalAdult = tickets.reduce((sum, ticket) => sum + parseInt(ticket.adult_count || 0), 0);
    const totalChild = tickets.reduce((sum, ticket) => sum + parseInt(ticket.child_count || 0), 0);
    const totalFree = tickets.reduce((sum, ticket) => sum + parseInt(ticket.free_count || 0), 0);
    const totalPeople = totalAdult + totalChild + totalFree;
    
    // Eğer bold font varsa kullan
    if (boldFontExists) {
        doc.font(FONT_BOLD_PATH);
    }
    
    doc.text(`TOPLAM: ${tickets.length} Bilet - ${totalPeople} Kişi (${totalAdult} Yetişkin, ${totalChild} Çocuk, ${totalFree} Free)`, 50, y, { width: 700 });
    
    // PDF'i tamamla
    doc.end();

    // Stream kapanana kadar bekle
    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve({ fileName, filePath });
        });
        stream.on('error', reject);
    });
};

module.exports = {
    generateTicketsPDF
}; 
