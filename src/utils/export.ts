import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Order } from '../types';

// Helper to load Arabic font
const loadArabicFont = async (doc: jsPDF) => {
    try {
        const response = await fetch('/fonts/Amiri-Regular.ttf');
        if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
                reader.onloadend = () => {
                    const base64data = reader.result?.toString().split(',')[1];
                    if (base64data) {
                        doc.addFileToVFS('Amiri-Regular.ttf', base64data);
                        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
                        doc.setFont('Amiri');
                        resolve();
                    }
                };
                reader.readAsDataURL(blob);
            });
        }
    } catch (error) {
        console.error("Failed to load Arabic font", error);
    }
};

export const exportOrdersToPDF = async (orders: Order[]) => {
    const doc = new jsPDF();

    await loadArabicFont(doc);

    // Title
    doc.setFontSize(18);
    doc.text('Orders Report / تقرير الطلبات', 190, 22, { align: 'right' });
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table Data
    const tableData = orders.map(order => [
        order.orderNumber ? `#${order.orderNumber}` : order.id.slice(0, 8),
        new Date(order.date).toLocaleDateString(),
        order.customer.fullName,
        order.customer.phone,
        `${order.customer.commune}, ${order.customer.wilaya}`,
        order.items.length.toString(),
        `${order.total} DZD`,
        order.deliveryType === 'office' ? 'Office' : 'Domicile',
        order.status.toUpperCase()
    ]);

    // Table Headers
    const headers = [['ID', 'Date', 'Customer', 'Phone', 'Location', 'Items', 'Total', 'Delivery', 'Status']];

    autoTable(doc, {
        head: headers,
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 2,
            font: 'Amiri' // Use the Arabic font
        },
        headStyles: {
            fillColor: [30, 64, 175], // Blue-800
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 22 },
            4: { cellWidth: 35 },
            5: { cellWidth: 12 },
            6: { cellWidth: 20 },
            7: { cellWidth: 18 },
            8: { cellWidth: 18 }
        }
    });

    doc.save('orders_report.pdf');
};

// Alternative export that preserves Arabic text by using Excel
export const exportOrdersToExcel = (orders: Order[]) => {
    // Flatten data for Excel - Excel handles Arabic text natively
    const excelData = orders.map(order => ({
        'Order ID': order.id,
        'Order Number / رقم الطلب': order.orderNumber || order.id.slice(0, 8),
        'Date / التاريخ': new Date(order.date).toLocaleDateString('ar-DZ'),
        'Customer / العميل': order.customer.fullName,
        'Phone / الهاتف': order.customer.phone,
        'Address / العنوان': order.customer.address,
        'Wilaya / الولاية': order.customer.wilaya,
        'Commune / البلدية': order.customer.commune,
        'Items / المنتجات': order.items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        'Delivery Type / نوع التوصيل': order.deliveryType === 'office' ? 'مكتب / Office' : 'منزل / Domicile',
        'Delivery Fee / رسوم التوصيل': order.deliveryFee,
        'Total / المجموع': order.total,
        'Status / الحالة': order.status === 'pending' ? 'قيد الانتظار' :
            order.status === 'confirmed' ? 'مؤكد' :
                order.status === 'shipped' ? 'تم الشحن' :
                    order.status === 'delivered' ? 'تم التوصيل' : 'ملغي',
        'Carrier / الناقل': order.carrier || '',
        'Tracking / رقم التتبع': order.trackingNumber || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    // Set RTL for Arabic support
    worksheet['!rtl'] = true;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders - الطلبات");

    // Auto-width columns
    worksheet["!cols"] = [
        { wch: 36 }, // Full ID
        { wch: 10 }, // Short ID
        { wch: 15 }, // Date
        { wch: 25 }, // Customer
        { wch: 15 }, // Phone
        { wch: 40 }, // Address
        { wch: 15 }, // Wilaya
        { wch: 15 }, // Commune
        { wch: 50 }, // Items
        { wch: 20 }, // Delivery Type
        { wch: 15 }, // Delivery Fee
        { wch: 12 }, // Total
        { wch: 15 }, // Status
        { wch: 15 }, // Carrier
        { wch: 20 }  // Tracking
    ];

    XLSX.writeFile(workbook, "orders_export.xlsx");
};

// Export single order as printable receipt
export const exportOrderReceipt = async (order: Order) => {
    const doc = new jsPDF({
        format: [80, 200], // Receipt paper size (80mm width)
        unit: 'mm'
    });

    await loadArabicFont(doc);

    const pageWidth = 80;
    const margin = 5;
    let y = 10;

    // Header
    doc.setFontSize(14);
    doc.text('SHOP.', pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(8);
    doc.text('Order Receipt', pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Order ID
    doc.setFontSize(7);
    doc.text(`Order: #${order.orderNumber || order.id.slice(0, 8)}`, margin, y);
    y += 4;
    doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, margin, y);
    y += 6;

    // Separator
    doc.setDrawColor(0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Customer Info
    doc.setFontSize(8);
    doc.text('Customer:', margin, y);
    y += 4;
    doc.setFontSize(7);
    doc.text(order.customer.fullName, margin, y);
    y += 4;
    doc.text(order.customer.phone, margin, y);
    y += 4;
    doc.text(`${order.customer.commune}, ${order.customer.wilaya}`, margin, y);
    y += 6;

    // Separator
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Items
    doc.setFontSize(8);
    doc.text('Items:', margin, y);
    y += 4;

    order.items.forEach(item => {
        doc.setFontSize(7);
        const itemText = `${item.quantity}x ${item.name}`;
        const priceText = `${item.finalPrice * item.quantity} DZD`;
        // Truncate to avoid overflow
        doc.text(itemText.substring(0, 35), margin, y);
        doc.text(priceText, pageWidth - margin, y, { align: 'right' });
        // Manually handle overflowing RTL text is hard, but font should render chars
        y += 4;
    });

    y += 2;

    // Separator
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Totals
    doc.setFontSize(7);
    const subtotal = order.total - order.deliveryFee;
    doc.text('Subtotal:', margin, y);
    // Align numbers to right is standard. Arabic numbers?
    // Usually numbers are LTR even in Arabic unless using Eastern Arabic numerals.
    // DZD text is LTR.
    doc.text(`${subtotal} DZD`, pageWidth - margin, y, { align: 'right' });
    y += 4;

    doc.text(`Delivery (${order.deliveryType || 'domicile'}):`, margin, y);
    doc.text(`${order.deliveryFee} DZD`, pageWidth - margin, y, { align: 'right' });
    y += 4;

    doc.setFontSize(9);
    doc.text('TOTAL:', margin, y);
    doc.text(`${order.total} DZD`, pageWidth - margin, y, { align: 'right' });
    y += 8;

    // Footer
    doc.setFontSize(6);
    doc.text('Cash on Delivery', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('Thank you for your order!', pageWidth / 2, y, { align: 'center' });

    doc.save(`receipt_${order.orderNumber || order.id.slice(0, 8)}.pdf`);
};
