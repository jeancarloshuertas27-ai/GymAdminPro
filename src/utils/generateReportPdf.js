import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Compila y descarga el reporte consolidado diario oficial en PDF conforme a los 4 bloques
 * @param {Object} reportData Datos estructurados devueltos por /api/reportes/diario
 * @param {string} fecha Fecha del reporte (YYYY-MM-DD)
 */
export function generateReportPdf(reportData, fecha) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const targetDate = fecha || reportData?.fecha || new Date().toISOString().split('T')[0];
  const filename = `REPORTE ${targetDate}.pdf`;

  // Estilos de cabecera
  doc.setFillColor(16, 19, 26); // #10131a
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(175, 198, 255); // primary #afc6ff
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('GYMADMINPRO // AUDITORÍA FISCAL Y CORTE DIARIO', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(`REPORTE CONSOLIDADO // ${targetDate}`, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(194, 198, 215); // on-surface-variant
  doc.text(`EMITIDO: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')} | MONEDA: SOLES (S/)`, 14, 30);

  let currentY = 44;

  // Resumen Ejecutivo de Cabecera (Tarjetas métricas)
  const totalMembresias = reportData?.bloque_a_membresias?.total_recaudado || 0;
  const totalProductos = reportData?.bloque_c_productos_ganancias?.total_ingresos || 0;
  const gananciaNetaProd = reportData?.bloque_c_productos_ganancias?.ganancia_neta || 0;
  const totalNuevosUsuarios = reportData?.bloque_b_nuevos_usuarios?.total_nuevos || 0;
  const totalGeneral = reportData?.resumen_total?.total_ingresos_dia || (totalMembresias + totalProductos);

  doc.setFillColor(24, 28, 35);
  doc.roundedRect(14, currentY, 182, 22, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(140, 144, 160);
  doc.text('TOTAL RECAUDADO DEL DÍA', 20, currentY + 7);
  doc.text('MEMBRESÍAS', 75, currentY + 7);
  doc.text('PRODUCTOS POS', 120, currentY + 7);
  doc.text('NUEVOS SOCIOS', 160, currentY + 7);

  doc.setFontSize(13);
  doc.setTextColor(31, 113, 239); // primary-container
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${parseFloat(totalGeneral).toFixed(2)}`, 20, currentY + 16);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`S/ ${parseFloat(totalMembresias).toFixed(2)}`, 75, currentY + 16);
  doc.text(`S/ ${parseFloat(totalProductos).toFixed(2)}`, 120, currentY + 16);
  doc.text(`${totalNuevosUsuarios} inscritos`, 160, currentY + 16);

  currentY += 28;

  // BLOQUE A: Ganancias por pagos de membresías en Soles
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 19, 26);
  doc.text(`A. PAGOS DE MEMBRESÍAS (Total: S/ ${parseFloat(totalMembresias).toFixed(2)})`, 14, currentY);

  const transaccionesMemb = (reportData?.bloque_a_membresias?.transacciones || []).map((t) => [
    t.hora || '--:--',
    t.atleta_nombre || 'Atleta',
    t.atleta_dni || '--------',
    t.plan_nombre || 'Membresía',
    t.metodo_pago || 'EFECTIVO',
    `S/ ${parseFloat(t.monto || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['HORA', 'ATLETA / SOCIO', 'DNI', 'PLAN / TIEMPO', 'MÉTODO', 'MONTO']],
    body: transaccionesMemb.length > 0 ? transaccionesMemb : [['--', 'Sin transacciones de membresía en esta fecha', '--', '--', '--', 'S/ 0.00']],
    theme: 'grid',
    headStyles: { fillColor: [31, 113, 239], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // BLOQUE B: Cantidad de nuevos usuarios inscritos
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 19, 26);
  doc.text(`B. NUEVOS USUARIOS INSCRITOS (${totalNuevosUsuarios} nuevos socios)`, 14, currentY);

  const usuariosNuevos = (reportData?.bloque_b_nuevos_usuarios?.usuarios || []).map((u) => [
    u.hora || '--:--',
    `${u.apellidos || ''}, ${u.nombres || ''}`,
    u.dni || '--------',
    u.celular || '--------',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['HORA REGISTRO', 'NOMBRES Y APELLIDOS', 'DNI', 'CELULAR']],
    body: usuariosNuevos.length > 0 ? usuariosNuevos : [['--', 'No se registraron nuevos miembros en esta fecha', '--', '--']],
    theme: 'grid',
    headStyles: { fillColor: [48, 72, 122], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // BLOQUE C & D: Ganancias y Detalle de productos vendidos
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 19, 26);
  doc.text(`C & D. VENTA DE PRODUCTOS (Total: S/ ${parseFloat(totalProductos).toFixed(2)} | Ganancia Neta: S/ ${parseFloat(gananciaNetaProd).toFixed(2)})`, 14, currentY);

  const detalleProductos = (reportData?.bloque_d_productos_detalle || []).map((p) => [
    p.sku || 'SKU-GEN',
    p.nombre || 'Producto',
    `${p.cantidad_total || 0} unid.`,
    `S/ ${parseFloat(p.precio_unitario || 0).toFixed(2)}`,
    `S/ ${parseFloat(p.subtotal || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['SKU', 'DESCRIPCIÓN DEL PRODUCTO', 'CANTIDAD', 'P. UNITARIO', 'SUBTOTAL']],
    body: detalleProductos.length > 0 ? detalleProductos : [['--', 'Sin ventas de productos registradas en esta fecha', '--', '--', 'S/ 0.00']],
    theme: 'grid',
    headStyles: { fillColor: [199, 83, 2], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 },
  });

  // Pie de página oficial
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 144, 160);
    doc.text(
      `GymAdminPro v1.0 — Documento de Auditoría Oficial | Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Descargar archivo con el nombre formal obligatorio
  doc.save(filename);
}
