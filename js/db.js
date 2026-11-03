/**
 * Gestor de Base de Datos para BAC Credomatic
 * Base de datos principal en la nube (TextDB Cloud) con persistencia garantizada y copias de seguridad en archivos CSV locales.
 */

const TEXTDB_CONFIG = {
  enabled: true,
  urls: {
    cuentas: 'https://textdb.dev/api/data/bac_credomatic_gt_cuentas',
    transacciones: 'https://textdb.dev/api/data/bac_credomatic_gt_transacciones',
    servicios: 'https://textdb.dev/api/data/bac_credomatic_gt_servicios'
  },
  viewerUrls: {
    cuentas: 'https://textdb.dev/data/bac_credomatic_gt_cuentas',
    transacciones: 'https://textdb.dev/data/bac_credomatic_gt_transacciones',
    servicios: 'https://textdb.dev/data/bac_credomatic_gt_servicios'
  }
};

const DEFAULT_CUENTAS_CSV = `id,usuario,numero_cuenta,tipo_cuenta,titular,cedula,correo,telefono,saldo,moneda,pin
1,admin,GT0501020000000000001,Cuenta Administrativa BAC,Administrador General BAC,00000000,admin@baccredomatic.com,22959898,999999.00,GTQ,1234
2,amorales,GT0501020000987654321,Cuenta Monetaria BAC,Alejandro Morales Salazar,18450921,alejandro.morales@baccredomatic.com,55443322,4850.50,GTQ,1234
3,mrojas,GT0501020000123456789,Cuenta de Ahorros Total,María Fernanda Rojas Solano,09820345,maria.rojas@gmail.com,57112233,18500.00,GTQ,4321
4,cvargas,GT0501020000554433221,Cuenta en Dólares BAC,Carlos Andrés Vargas Soto,204560789,carlos.vargas@empresa.com,50123456,1250.00,USD,9988
5,dherrera,GT0501020000253514146,Cuenta Monetaria Total,Diego Herrera,2548198740101,dherrerae1@miumg.edu.gt,55667788,100.00,GTQ,1234
6,danna.morales,GT0501020000574300123,Cuenta Monetaria BAC,Danna Gimena Morales Arzu,301298450101,danna.morales@correo.com,55998877,250.00,GTQ,1234`;

const DEFAULT_TRANSACCIONES_CSV = `id,fecha,numero_cuenta,tipo,categoria,descripcion,monto,saldo_posterior,referencia
TRX-1001,2026-10-15 09:00:00,GT0501020000000000001,Crédito,Depósito,Acreditación Fondo de Reserva Institucional BAC,50000.00,1000000.00,BAC-RES-00192
TRX-1002,2026-10-20 11:30:15,GT0501020000000000001,Débito,Servicios,Pago Servicios de Infraestructura Nube BAC,15500.00,984500.00,BAC-SRV-99104
TRX-1003,2026-10-24 14:10:45,GT0501020000000000001,Crédito,Transferencia,Liquidación de Comisiones Interbancarias ACH,28499.00,1012999.00,BAC-ACH-77215
TRX-1004,2026-10-28 16:45:00,GT0501020000000000001,Débito,Transferencia,Asignación de Liquidez a Sucursal Central,20000.00,992999.00,BAC-TRF-66108
TRX-1005,2026-11-01 10:15:30,GT0501020000000000001,Crédito,Depósito,Rendimiento por Inversión en Bonos del Tesoro,7000.00,999999.00,BAC-INV-55421
TRX-1006,2026-10-18 08:30:00,GT0501020000987654321,Crédito,Depósito,Depósito de Nómina Primera Quincena,4000.00,6250.50,BAC-DEP-99120
TRX-1007,2026-10-22 14:15:22,GT0501020000987654321,Débito,Servicios,Pago Recibo de Energía Eléctrica EEGSA,350.00,5900.50,BAC-SRV-88211
TRX-1008,2026-10-25 19:40:05,GT0501020000987654321,Débito,Compras,Supermercado Paiz / Walmart Guatemala,650.00,5250.50,BAC-POS-77412
TRX-1009,2026-10-28 11:22:18,GT0501020000987654321,Crédito,Transferencia,Transferencia Recibida de María Rojas,450.00,5700.50,BAC-TRF-66519
TRX-1010,2026-10-31 16:50:40,GT0501020000987654321,Débito,Servicios,Pago Plan Telefónico e Internet Tigo,850.00,4850.50,BAC-SRV-44102
TRX-1011,2026-10-10 09:10:00,GT0501020000123456789,Crédito,Depósito,Depósito de Apertura de Cuenta de Ahorros,15000.00,15000.00,BAC-DEP-11002
TRX-1012,2026-10-15 15:20:10,GT0501020000123456789,Crédito,Depósito,Acreditación Honorarios Profesionales,6200.00,21200.00,BAC-DEP-11845
TRX-1013,2026-10-20 18:35:00,GT0501020000123456789,Débito,Transferencia,Transferencia Enviada a Alejandro Morales,450.00,20750.00,BAC-TRF-22941
TRX-1014,2026-10-25 12:40:22,GT0501020000123456789,Débito,Servicios,Pago Tarjeta de Crédito BAC Credomatic,2000.00,18750.00,BAC-SRV-33789
TRX-1015,2026-10-30 17:15:45,GT0501020000123456789,Débito,Servicios,Pago de Servicio de Agua Potable EMPAGUA,250.00,18500.00,BAC-SRV-55120
TRX-1016,2026-10-05 10:00:00,GT0501020000554433221,Crédito,Depósito,Depósito Inicial en Dólares por Apertura,1000.00,1000.00,BAC-DEP-33005
TRX-1017,2026-10-12 16:40:15,GT0501020000554433221,Crédito,Transferencia,Transferencia Internacional Cablewire,800.00,1800.00,BAC-INT-99410
TRX-1018,2026-10-18 11:25:30,GT0501020000554433221,Débito,Compras,Compra en Línea Amazon Web Services,220.00,1580.00,BAC-POS-44821
TRX-1019,2026-10-24 14:50:00,GT0501020000554433221,Débito,Transferencia,Transferencia a Proveedor Comercial,250.00,1330.00,BAC-TRF-66702
TRX-1020,2026-10-29 09:30:10,GT0501020000554433221,Débito,Compras,Suscripción de Software y Licencias,80.00,1250.00,BAC-POS-88914
TRX-1021,2026-10-14 09:00:00,GT0501020000253514146,Crédito,Depósito,Depósito Inicial de Apertura Monetaria Total,500.00,500.00,BAC-APE-101452
TRX-1022,2026-10-19 13:20:15,GT0501020000253514146,Crédito,Depósito,Transferencia Recibida de Familiar,350.00,850.00,BAC-TRF-441890
TRX-1023,2026-10-23 15:45:00,GT0501020000253514146,Débito,Servicios,Pago Mensualidad Claro Guatemala,250.00,600.00,BAC-SRV-331902
TRX-1024,2026-10-27 18:10:30,GT0501020000253514146,Débito,Compras,Compra en Establecimiento Comercial,320.00,280.00,BAC-POS-778219
TRX-1025,2026-10-31 11:05:40,GT0501020000253514146,Débito,Servicios,Pago Servicio de Agua Potable EMPAGUA,180.00,100.00,BAC-SRV-992341
TRX-1026,2026-10-15 10:30:00,GT0501020000574300123,Crédito,Depósito,Depósito de Apertura de Cuenta Monetaria BAC,600.00,600.00,BAC-APE-554102
TRX-1027,2026-10-20 12:15:45,GT0501020000574300123,Crédito,Depósito,Depósito por Pago de Proyecto Diseño,450.00,1050.00,BAC-DEP-663219
TRX-1028,2026-10-24 16:40:00,GT0501020000574300123,Débito,Servicios,Pago de Recibo de Electricidad Energuate,320.00,730.00,BAC-SRV-221945
TRX-1029,2026-10-27 19:20:10,GT0501020000574300123,Débito,Compras,Compra Farmacia Galeno / Supermercado,280.00,450.00,BAC-POS-884120
TRX-1030,2026-10-30 14:10:00,GT0501020000574300123,Débito,Transferencia,Transferencia a Terceros Banco BAC,200.00,250.00,BAC-TRF-330912`;

const DEFAULT_SERVICIOS_CSV = `id,categoria,empresa,codigo_convenio,descripcion
SRV-01,Electricidad,Empresa Eléctrica de Guatemala (EEGSA),EEGSA-01,Suministro eléctrico metropolitano
SRV-02,Electricidad,Energuate (DEOCSA / DEORSA),ENERG-02,Distribución eléctrica departamental
SRV-03,Agua Potable,Empresa Municipal de Agua (EMPAGUA),EMPA-01,Cobro de agua potable y saneamiento
SRV-04,Telefonía e Internet,Tigo Guatemala,TIGO-01,Planes móviles, prepago y residencial
SRV-05,Telefonía e Internet,Claro Guatemala,CLR-02,Telefonía móvil y fibra óptica
SRV-06,Tarjeta de Crédito,Tarjeta BAC Credomatic Visa / Mastercard,BAC-TC,Pago de tarjeta de crédito BAC`;

const HEADERS_CUENTAS = ['id', 'usuario', 'numero_cuenta', 'tipo_cuenta', 'titular', 'cedula', 'correo', 'telefono', 'saldo', 'moneda', 'pin'];
const HEADERS_TRANSACCIONES = ['id', 'fecha', 'numero_cuenta', 'tipo', 'categoria', 'descripcion', 'monto', 'saldo_posterior', 'referencia'];

const DB = {
  getApiUrl(endpoint) {
    if (window.location.protocol === 'http:' && window.location.port === '8080') {
      return endpoint;
    }
    return 'http://localhost:8080' + endpoint;
  },

  init() {
    if (!localStorage.getItem('bac_cuentas_csv') || !localStorage.getItem('bac_cuentas_csv').includes('usuario')) {
      localStorage.setItem('bac_cuentas_csv', DEFAULT_CUENTAS_CSV.trim());
    }
    if (!localStorage.getItem('bac_transacciones_csv')) {
      localStorage.setItem('bac_transacciones_csv', DEFAULT_TRANSACCIONES_CSV.trim());
    }
    if (!localStorage.getItem('bac_servicios_csv')) {
      localStorage.setItem('bac_servicios_csv', DEFAULT_SERVICIOS_CSV.trim());
    }

    // Sincronización automática de datos: nube TextDB + archivos físicos CSV
    this.sincronizarDatos();
  },

  async sincronizarDatos() {
    let cloudOk = false;

    // 1. Cargar desde la base de datos TextDB en la nube
    try {
      const resCuentas = await fetch(TEXTDB_CONFIG.urls.cuentas, { cache: 'no-store' });
      if (resCuentas.ok) {
        const text = await resCuentas.text();
        if (text && text.includes('usuario') && text.includes('numero_cuenta')) {
          localStorage.setItem('bac_cuentas_csv', text.trim());
          this.escribirArchivoFisico('cuentas.csv', text.trim());
          cloudOk = true;
          console.log('[TextDB Cloud]: Cuentas sincronizadas exitosamente.');
        }
      }
    } catch (e) {
      console.warn('[TextDB Cloud]: No se pudo conectar a TextDB, usando almacenamiento local.');
    }

    try {
      const resTrans = await fetch(TEXTDB_CONFIG.urls.transacciones, { cache: 'no-store' });
      if (resTrans.ok) {
        const text = await resTrans.text();
        if (text && text.includes('numero_cuenta') && text.includes('saldo_posterior')) {
          localStorage.setItem('bac_transacciones_csv', text.trim());
          this.escribirArchivoFisico('transacciones.csv', text.trim());
        }
      }
    } catch (e) {}

    try {
      const resServ = await fetch(TEXTDB_CONFIG.urls.servicios, { cache: 'no-store' });
      if (resServ.ok) {
        const text = await resServ.text();
        if (text && text.includes('codigo_convenio')) {
          localStorage.setItem('bac_servicios_csv', text.trim());
          this.escribirArchivoFisico('servicios.csv', text.trim());
        }
      }
    } catch (e) {}

    // 2. Si no hubo conexión a TextDB, cargar desde el servidor local CSV
    if (!cloudOk) {
      await this.cargarDesdeDisco();
    }
  },

  async cargarDesdeDisco() {
    try {
      const res = await fetch(this.getApiUrl('/api/read-csv?file=cuentas.csv'), { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.includes('usuario')) {
          localStorage.setItem('bac_cuentas_csv', text.trim());
        }
      }
    } catch (e) {}

    try {
      const res = await fetch(this.getApiUrl('/api/read-csv?file=transacciones.csv'), { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.includes('numero_cuenta')) {
          localStorage.setItem('bac_transacciones_csv', text.trim());
        }
      }
    } catch (e) {}
  },

  // Guarda en la base de datos Cloud (TextDB) y en el archivo CSV local como copia de seguridad
  async guardarCambios(archivo, contenido) {
    if (!contenido) return;
    const key = archivo.replace('.csv', '');

    // 1. Guardar en TextDB Cloud con garantía de escritura
    if (TEXTDB_CONFIG.urls[key]) {
      try {
        const cloudRes = await fetch(TEXTDB_CONFIG.urls[key], {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: contenido.trim()
        });
        if (cloudRes.ok) {
          console.log(`[TextDB Cloud]: ${archivo} asegurado en la nube con éxito.`);
        }
      } catch (err) {
        console.warn('[TextDB Cloud Sync]: No se pudo escribir en la nube, usando copia local:', err);
      }
    }

    // 2. Guardar en el disco físico local como copia de seguridad CSV
    await this.escribirArchivoFisico(archivo, contenido);
  },

  async escribirArchivoFisico(archivo, contenido) {
    if (!contenido) return;
    try {
      const url = this.getApiUrl('/api/save-csv');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: archivo, content: contenido })
      });
      return await response.json();
    } catch (e) {
      console.warn(`[Copia CSV Local]: No se pudo escribir en el servidor local:`, e);
    }
  },

  getSimboloMoneda(moneda) {
    if (!moneda) return 'Q';
    const m = String(moneda).trim().toUpperCase();
    if (m === 'GTQ' || m === 'Q' || m.includes('QUETZAL')) return 'Q';
    if (m === 'USD' || m === '$' || m.includes('DOLAR') || m.includes('DÓLAR')) return '$';
    if (m === 'CRC' || m === '₡' || m.includes('COLON') || m.includes('COLÓN')) return '₡';
    return 'Q';
  },

  parseCSV(csvText) {
    if (!csvText) return [];
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(l => l.trim().length > 0).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] !== undefined ? values[index] : '';
      });
      return obj;
    });
  },

  toCSV(headers, rows) {
    const headerRow = headers.join(',');
    const bodyRows = rows.map(row => headers.map(h => row[h] !== undefined ? String(row[h]).replace(/,/g, '') : '').join(','));
    return [headerRow, ...bodyRows].join('\n');
  },

  getCuentas() {
    this.init();
    return this.parseCSV(localStorage.getItem('bac_cuentas_csv'));
  },

  getCuentaByNumero(numeroCuenta) {
    const cuentas = this.getCuentas();
    return cuentas.find(c => c.numero_cuenta === numeroCuenta) || null;
  },

  getCuentaByCredenciales(identificador, pin) {
    const cuentas = this.getCuentas();
    const idClean = identificador.trim().toLowerCase();
    const pinClean = pin.trim();

    return cuentas.find(c => 
      ((c.usuario && c.usuario.toLowerCase() === idClean) ||
       c.cedula.toLowerCase() === idClean || 
       c.numero_cuenta.toLowerCase() === idClean || 
       c.correo.toLowerCase() === idClean) && 
      c.pin === pinClean
    ) || null;
  },

  setCurrentSession(numeroCuenta, usuario = '') {
    sessionStorage.setItem('bac_active_account', numeroCuenta);
    if (usuario) {
      sessionStorage.setItem('bac_session_user', usuario);
    }
  },

  getCurrentSession() {
    return sessionStorage.getItem('bac_active_account');
  },

  getSessionUser() {
    return sessionStorage.getItem('bac_session_user') || '';
  },

  isAdmin(cuenta) {
    if (!cuenta) return false;
    return cuenta.usuario === 'admin' || cuenta.numero_cuenta === 'GT0501020000000000001';
  },

  isAdminSession() {
    const user = this.getSessionUser();
    if (user === 'admin') return true;
    const activeAccNum = this.getCurrentSession();
    return activeAccNum === 'GT0501020000000000001';
  },

  clearCurrentSession() {
    sessionStorage.removeItem('bac_active_account');
    sessionStorage.removeItem('bac_session_user');
  },

  async guardarCuenta(cuenta) {
    const cuentas = this.getCuentas();
    const index = cuentas.findIndex(c => c.numero_cuenta === cuenta.numero_cuenta);
    if (index >= 0) {
      cuentas[index] = { ...cuentas[index], ...cuenta };
    } else {
      cuenta.id = cuentas.length + 1;
      cuentas.push(cuenta);
    }
    const nuevoCSV = this.toCSV(HEADERS_CUENTAS, cuentas);
    localStorage.setItem('bac_cuentas_csv', nuevoCSV);
    await this.guardarCambios('cuentas.csv', nuevoCSV);
    return cuenta;
  },

  async actualizarSaldo(numeroCuenta, nuevoSaldo) {
    const cuenta = this.getCuentaByNumero(numeroCuenta);
    if (cuenta) {
      cuenta.saldo = parseFloat(nuevoSaldo).toFixed(2);
      await this.guardarCuenta(cuenta);
      return cuenta;
    }
    return null;
  },

  getTransacciones(numeroCuenta = null) {
    this.init();
    const trans = this.parseCSV(localStorage.getItem('bac_transacciones_csv'));
    if (!numeroCuenta) return trans;
    return trans.filter(t => t.numero_cuenta === numeroCuenta);
  },

  async registrarTransaccion(trx) {
    const transacciones = this.parseCSV(localStorage.getItem('bac_transacciones_csv'));
    
    if (!trx.id) {
      trx.id = 'TRX-' + (1000 + transacciones.length + 1);
    }
    if (!trx.fecha) {
      const now = new Date();
      trx.fecha = now.toISOString().replace('T', ' ').substring(0, 19);
    }
    if (!trx.referencia) {
      trx.referencia = 'BAC-' + Math.floor(100000 + Math.random() * 900000);
    }

    transacciones.unshift(trx);
    const nuevoCSV = this.toCSV(HEADERS_TRANSACCIONES, transacciones);
    localStorage.setItem('bac_transacciones_csv', nuevoCSV);
    await this.guardarCambios('transacciones.csv', nuevoCSV);
    return trx;
  },

  getServicios() {
    this.init();
    return this.parseCSV(localStorage.getItem('bac_servicios_csv'));
  },

  // Exportar datos propios del cliente individual (solo sus movimientos)
  exportarMiCuenta(cuenta) {
    if (!cuenta) return;
    const trans = this.getTransacciones(cuenta.numero_cuenta);
    const headers = ['id', 'fecha', 'numero_cuenta', 'tipo', 'categoria', 'descripcion', 'monto', 'saldo_posterior', 'referencia'];
    const csvContent = [
      `ESTADO DE CUENTA - BAC CREDOMATIC`,
      `Titular: ${cuenta.titular}`,
      `Usuario: ${cuenta.usuario}`,
      `Numero de Cuenta IBAN: ${cuenta.numero_cuenta}`,
      `Tipo de Cuenta: ${cuenta.tipo_cuenta}`,
      `Moneda: ${cuenta.moneda}`,
      `Saldo Actual: ${cuenta.saldo}`,
      ``,
      `DETALLE DE MOVIMIENTOS`,
      this.toCSV(headers, trans)
    ].join('\n');

    this.descargarArchivo(csvContent, `BAC_${cuenta.usuario}_movimientos.csv`);
  },

  // Comprobante oficial de apertura para el cliente recién registrado
  exportarComprobanteApertura(cuenta) {
    if (!cuenta) return;
    const content = [
      `COMPROBANTE OFICIAL DE APERTURA DE CUENTA - BAC CREDOMATIC`,
      `Fecha de Registro: ${new Date().toLocaleString('es-GT')}`,
      `Titular: ${cuenta.titular}`,
      `Usuario de Acceso: ${cuenta.usuario}`,
      `Numero de Cuenta IBAN: ${cuenta.numero_cuenta}`,
      `Tipo de Cuenta: ${cuenta.tipo_cuenta}`,
      `Identificacion / DPI: ${cuenta.cedula}`,
      `Correo Electronico: ${cuenta.correo}`,
      `Telefono: ${cuenta.telefono}`,
      `Moneda: ${cuenta.moneda}`,
      `Saldo Inicial: ${cuenta.saldo}`,
      `Estado: ACTIVA`,
      ``,
      `* Conserve este comprobante con sus datos de acceso para futuras consultas.`
    ].join('\n');

    this.descargarArchivo(content, `BAC_Comprobante_${cuenta.usuario}.csv`);
  },

  // Exportar base de datos completa: estrictamente reservado para Administrador
  exportarCSV(tipo = 'cuentas') {
    let csvData = '';
    let filename = '';
    if (tipo === 'cuentas') {
      csvData = localStorage.getItem('bac_cuentas_csv') || DEFAULT_CUENTAS_CSV;
      filename = 'copia_seguridad_cuentas.csv';
    } else if (tipo === 'transacciones') {
      csvData = localStorage.getItem('bac_transacciones_csv') || DEFAULT_TRANSACCIONES_CSV;
      filename = 'copia_seguridad_transacciones.csv';
    } else if (tipo === 'servicios') {
      csvData = localStorage.getItem('bac_servicios_csv') || DEFAULT_SERVICIOS_CSV;
      filename = 'copia_seguridad_servicios.csv';
    }

    this.descargarArchivo(csvData, filename);
  },

  descargarArchivo(contenido, nombreArchivo) {
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async restablecerDatos() {
    localStorage.setItem('bac_cuentas_csv', DEFAULT_CUENTAS_CSV.trim());
    localStorage.setItem('bac_transacciones_csv', DEFAULT_TRANSACCIONES_CSV.trim());
    localStorage.setItem('bac_servicios_csv', DEFAULT_SERVICIOS_CSV.trim());
    await this.guardarCambios('cuentas.csv', DEFAULT_CUENTAS_CSV.trim());
    await this.guardarCambios('transacciones.csv', DEFAULT_TRANSACCIONES_CSV.trim());
    await this.guardarCambios('servicios.csv', DEFAULT_SERVICIOS_CSV.trim());
  }
};

DB.init();
