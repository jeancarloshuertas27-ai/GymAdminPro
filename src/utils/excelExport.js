import ExcelJS from 'exceljs';

function getWorkbookConstructor() {
  const ctor =
    ExcelJS?.Workbook ||
    ExcelJS?.default?.Workbook ||
    (typeof globalThis !== 'undefined' ? globalThis?.ExcelJS?.Workbook : null);
  if (!ctor) {
    throw new Error('No se pudo inicializar ExcelJS.Workbook');
  }
  return ctor;
}

const HEADERS = [
  'Apellidos',
  'Nombres',
  'DNI',
  'Usuario',
  'Contraseña',
  'Fidelidad',
  'Estado de Membresía',
  'Rutina',
];

const STATUS_STYLE_MAP = {
  ACTIVO: { fill: 'FFDCFCE7', text: 'FF15803D', labelPrefix: 'ACTIVA' },
  POR_VENCER: { fill: 'FFFFEDD5', text: 'FFC2410C', labelPrefix: 'POR VENCER <=10 DÍAS' },
  VENCIDO: { fill: 'FFFEE2E2', text: 'FFDC2626', labelPrefix: 'VENCIDA' },
};

const THIN_BORDER = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

/**
 * Construye el libro ExcelJS (.xlsx) estilizado del reporte "Usuarios y Fidelidad".
 */
export function buildUsersRosterWorkbook(exportUsers = [], fechaActual = null) {
  const Workbook = getWorkbookConstructor();
  const workbook = new Workbook();
  workbook.creator = 'GymAdminPro';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Usuarios y Fidelidad', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  const dateStr =
    fechaActual ||
    new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  // Fila 1: Título superior con estética oscura (#0F172A) y acento rojo (#DC2626)
  worksheet.mergeCells('A1:H1');
  const titleRow = worksheet.getRow(1);
  titleRow.height = 34;
  const titleCell = titleRow.getCell(1);
  titleCell.value = `GYMADMIN PRO - REPORTE DE USUARIOS Y FIDELIDAD  |  FECHA: ${dateStr}`;
  titleCell.font = {
    name: 'Calibri',
    size: 13,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  for (let col = 1; col <= 8; col++) {
    titleRow.getCell(col).border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FFDC2626' } },
    };
  }

  // Fila 2: Cabeceras obligatorias en negrita sobre fondo oscuro
  const headerRow = worksheet.addRow(HEADERS);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FFDC2626' } },
    };
  });

  const colMaxWidths = HEADERS.map((h) => h.length);

  exportUsers.forEach((u, index) => {
    const statusKey = u.estadoMembresia in STATUS_STYLE_MAP ? u.estadoMembresia : 'VENCIDO';
    const statusStyle = STATUS_STYLE_MAP[statusKey];
    const remainingText = u.tiempoRestante || `${u.diasRestantes ?? 0} DÍAS`;
    const estadoTexto = `${statusStyle.labelPrefix} (${remainingText})`;

    const rowValues = [
      String(u.apellidos || ''),
      String(u.nombres || ''),
      String(u.dni ?? ''),
      String(u.username || ''),
      String(u.password_visible || u.passwordRaw || u.password_plain || 'Atleta2026!'),
      String(u.nivelFidelidad || 'NOVATO'),
      estadoTexto,
      String(u.rutinaAsignada || 'SIN RUTINA ASIGNADA'),
    ];

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 22;
    const rowBgArgb = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

    dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER;
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 3 || colNumber === 6 || colNumber === 7 ? 'center' : 'left',
      };

      // Formatear DNI (col 3) y Contraseña (col 5) como texto explícito ('@')
      if (colNumber === 3 || colNumber === 5) {
        cell.numFmt = '@';
      }

      if (colNumber === 7) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: statusStyle.fill },
        };
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: statusStyle.text },
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBgArgb },
        };
        cell.font = {
          name: 'Calibri',
          size: 10,
          color: { argb: 'FF0F172A' },
        };
      }
    });

    rowValues.forEach((val, idx) => {
      colMaxWidths[idx] = Math.max(colMaxWidths[idx], String(val).length);
    });
  });

  // Ancho automático para todas las columnas
  colMaxWidths.forEach((maxLen, idx) => {
    worksheet.getColumn(idx + 1).width = Math.max(maxLen, 12) + 5;
  });

  return workbook;
}

/**
 * Genera el binario .xlsx y dispara la descarga en el navegador.
 */
export async function exportUsersToExcelFile(exportUsers = []) {
  const workbook = buildUsersRosterWorkbook(exportUsers);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte_usuarios_fidelidad_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
