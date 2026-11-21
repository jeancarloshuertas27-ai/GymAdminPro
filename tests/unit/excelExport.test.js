import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { buildUsersRosterWorkbook } from '../../src/utils/excelExport.js';

describe('Exportación Excel (.xlsx) Usuarios y Fidelidad - Unit', () => {
  it('debe generar un archivo .xlsx estilizado con columnas exactas, texto @ en DNI/Contraseña, semáforo y anchos automáticos', async () => {
    const sampleUsers = [
      {
        apellidos: 'Alvarado Quispe',
        nombres: 'Luis',
        dni: '01234567',
        username: '@lalvarado',
        password_visible: '007Secreto',
        nivelFidelidad: 'MUTANDO',
        estadoMembresia: 'ACTIVO',
        tiempoRestante: '25 DÍAS',
        rutinaAsignada: 'Hipertrofia Full',
      },
      {
        apellidos: 'Benites Ramos',
        nombres: 'Sofía',
        dni: '09876543',
        username: '@sbenites',
        password_visible: '000Clave',
        nivelFidelidad: 'PROMEDIO',
        estadoMembresia: 'POR_VENCER',
        tiempoRestante: '5 DÍAS',
        rutinaAsignada: 'Glúteos Pro',
      },
      {
        apellidos: 'Castro Vega',
        nombres: 'Mario',
        dni: '00445566',
        username: '@mcastro',
        password_visible: '001Test',
        nivelFidelidad: 'NOVATO',
        estadoMembresia: 'VENCIDO',
        tiempoRestante: 'VENCIDA',
        rutinaAsignada: 'SIN RUTINA ASIGNADA',
      },
    ];

    const workbook = buildUsersRosterWorkbook(sampleUsers, '21/11/2026');
    const buffer = await workbook.xlsx.writeBuffer();

    const readBack = new ExcelJS.Workbook();
    await readBack.xlsx.load(buffer);
    const ws = readBack.getWorksheet('Usuarios y Fidelidad');
    expect(ws).toBeDefined();

    // Fila 1: Título oscuro con acento rojo y fecha
    const titleCell = ws.getCell('A1');
    expect(String(titleCell.value)).toContain('GYMADMIN PRO - REPORTE DE USUARIOS Y FIDELIDAD');
    expect(String(titleCell.value)).toContain('21/11/2026');
    expect(titleCell.fill?.fgColor?.argb).toBe('FF0F172A');
    expect(titleCell.border?.bottom?.color?.argb).toBe('FFDC2626');

    // Fila 2: Cabeceras exactas
    const row2Values = ws.getRow(2).values.slice(1, 9);
    expect(row2Values).toEqual([
      'Apellidos',
      'Nombres',
      'DNI',
      'Usuario',
      'Contraseña',
      'Fidelidad',
      'Estado de Membresía',
      'Rutina',
    ]);
    expect(ws.getCell('A2').font?.bold).toBe(true);
    expect(ws.getCell('A2').fill?.fgColor?.argb).toBe('FF0F172A');

    // DNI (col 3) y Contraseña (col 5) con formato texto '@' conservando ceros a la izquierda
    expect(ws.getCell('C3').value).toBe('01234567');
    expect(ws.getCell('C3').numFmt).toBe('@');
    expect(ws.getCell('E3').value).toBe('007Secreto');
    expect(ws.getCell('E3').numFmt).toBe('@');
    expect(ws.getCell('C5').value).toBe('00445566');
    expect(ws.getCell('E4').value).toBe('000Clave');

    // Colores semáforo en Estado de Membresía (col G)
    expect(ws.getCell('G3').fill?.fgColor?.argb).toBe('FFDCFCE7'); // Verde Activa
    expect(ws.getCell('G4').fill?.fgColor?.argb).toBe('FFFFEDD5'); // Naranja <=10 días
    expect(ws.getCell('G5').fill?.fgColor?.argb).toBe('FFFEE2E2'); // Rojo Vencida

    // Filas alternadas y bordes
    expect(ws.getCell('A3').fill?.fgColor?.argb).toBe('FFFFFFFF');
    expect(ws.getCell('A4').fill?.fgColor?.argb).toBe('FFF8FAFC');
    expect(ws.getCell('A3').border?.bottom?.style).toBe('thin');

    // Anchos automáticos configurados
    for (let col = 1; col <= 8; col++) {
      expect(ws.getColumn(col).width).toBeGreaterThanOrEqual(17);
    }
  });
});
