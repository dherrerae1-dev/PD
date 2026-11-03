document.addEventListener('DOMContentLoaded', () => {
  let activeAccount = null;
  let currentTab = 'movimientos';

  // Inicializar sesión
  initSession();

  function initSession() {
    const savedAccountNum = DB.getCurrentSession();
    const cuentas = DB.getCuentas();

    if (cuentas.length === 0) {
      alert('No hay cuentas registradas en el sistema.');
      window.location.href = '../index.html';
      return;
    }

    if (!savedAccountNum) {
      window.location.href = '../index.html';
      return;
    }

    activeAccount = DB.getCuentaByNumero(savedAccountNum);
    if (!activeAccount) {
      window.location.href = '../index.html';
      return;
    }

    configurarPrivilegios();
    actualizarVistaCuenta();
    cargarMovimientos();
    inicializarPestañas();
    inicializarFormularioTransferencias();
    inicializarFormularioServicios();
    inicializarEstadoDeCuenta();
    cargarDatosCSVEnTab();
  }

  function configurarPrivilegios() {
    const esAdmin = DB.isAdminSession();
    const adminCol = document.getElementById('adminAccountSelectorCol');
    const tabAdminDb = document.getElementById('tabAdminDatabase');
    const panelHeaderCol = document.getElementById('panelHeaderCol');

    if (esAdmin) {
      if (adminCol) adminCol.classList.remove('d-none');
      if (tabAdminDb) tabAdminDb.classList.remove('d-none');
      if (panelHeaderCol) {
        panelHeaderCol.className = 'col-md-7';
      }
      poblarSelectorCuentas(DB.getCuentas());
    } else {
      // Cliente normal: ocultar completamente selector de cuentas y tab administrativo
      if (adminCol) adminCol.classList.add('d-none');
      if (tabAdminDb) tabAdminDb.classList.add('d-none');
      if (panelHeaderCol) {
        panelHeaderCol.className = 'col-12';
      }
    }

    const btnExportarMiCuenta = document.getElementById('btnExportarMiCuenta');
    if (btnExportarMiCuenta) {
      btnExportarMiCuenta.onclick = () => {
        DB.exportarMiCuenta(activeAccount);
      };
    }
  }

  function poblarSelectorCuentas(cuentas) {
    const select = document.getElementById('accountSelector');
    if (!select) return;
    select.innerHTML = '';
    cuentas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.numero_cuenta;
      const simbolo = DB.getSimboloMoneda(c.moneda);
      const saldoFmt = parseFloat(c.saldo || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const numCorto = c.numero_cuenta.length > 8 ? `...${c.numero_cuenta.slice(-6)}` : c.numero_cuenta;
      opt.textContent = `${c.usuario || c.titular} • ${c.tipo_cuenta} (${numCorto}) — ${simbolo} ${saldoFmt}`;
      if (c.numero_cuenta === activeAccount.numero_cuenta) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.onchange = (e) => {
      const nuevaCuenta = DB.getCuentaByNumero(e.target.value);
      if (nuevaCuenta) {
        activeAccount = nuevaCuenta;
        DB.setCurrentSession(activeAccount.numero_cuenta);
        configurarPrivilegios();
        actualizarVistaCuenta();
        cargarMovimientos();
        if (currentTab === 'estado') {
          generarEstadoDeCuenta();
        }
      }
    };
  }

  function actualizarVistaCuenta() {
    if (!activeAccount) return;

    // Recargar datos actualizados de la cuenta
    activeAccount = DB.getCuentaByNumero(activeAccount.numero_cuenta);

    const greeting = document.getElementById('userGreeting');
    if (greeting) {
      if (DB.isAdminSession()) {
        greeting.textContent = activeAccount.usuario === 'admin' 
          ? 'Administrador General (admin)' 
          : `Admin • Viendo cuenta: ${activeAccount.titular}`;
      } else {
        greeting.textContent = `${activeAccount.titular} (${activeAccount.usuario || 'cliente'})`;
      }
    }
    document.getElementById('displayTitular').textContent = activeAccount.titular;
    document.getElementById('displayUsuario').textContent = activeAccount.usuario || 'cliente';
    document.getElementById('displayCedula').textContent = activeAccount.cedula;
    document.getElementById('displayNumeroCuenta').textContent = activeAccount.numero_cuenta;
    document.getElementById('displayTipoCuenta').textContent = activeAccount.tipo_cuenta;

    const simbolo = DB.getSimboloMoneda(activeAccount.moneda);
    const saldoNum = parseFloat(activeAccount.saldo) || 0;
    document.getElementById('displaySaldo').textContent = `${simbolo} ${saldoNum.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Tarjeta visual
    const cardDisplay = document.getElementById('bacCardPreview');
    const cardImg = document.getElementById('bacCardImg');
    if (activeAccount.tipo_cuenta.includes('Monetaria') || activeAccount.tipo_cuenta.includes('Corriente') || activeAccount.moneda === 'USD' || DB.isAdmin(activeAccount)) {
      if (cardDisplay) {
        cardDisplay.className = 'bac-card-display black';
      }
      if (cardImg) cardImg.src = '../imas/tarjeta_black.png';
    } else {
      if (cardDisplay) {
        cardDisplay.className = 'bac-card-display red';
      }
      if (cardImg) cardImg.src = '../imas/tarjeta.png';
    }

    // Calcular totales de ingresos y egresos
    const trans = DB.getTransacciones(activeAccount.numero_cuenta);
    let totalIngresos = 0;
    let totalEgresos = 0;
    trans.forEach(t => {
      const m = parseFloat(t.monto) || 0;
      if (t.tipo === 'Crédito') totalIngresos += m;
      if (t.tipo === 'Débito') totalEgresos += m;
    });

    const elIngresos = document.getElementById('displayTotalIngresos');
    const elEgresos = document.getElementById('displayTotalEgresos');
    if (elIngresos) elIngresos.textContent = `${simbolo} ${totalIngresos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    if (elEgresos) elEgresos.textContent = `${simbolo} ${totalEgresos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
  }

  function inicializarPestañas() {
    const tabBtns = document.querySelectorAll('.bac-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        if (target === 'database' && !DB.isAdminSession()) return;

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = target;

        document.querySelectorAll('.tab-content-panel').forEach(panel => {
          panel.classList.add('d-none');
        });
        const activePanel = document.getElementById(`panel-${target}`);
        if (activePanel) {
          activePanel.classList.remove('d-none');
          activePanel.classList.add('animate__animated', 'animate__fadeIn');
        }

        if (target === 'movimientos') {
          cargarMovimientos();
        } else if (target === 'estado') {
          generarEstadoDeCuenta();
        } else if (target === 'database') {
          cargarDatosCSVEnTab();
        }
      });
    });
  }

  // 1. MOVIMIENTOS
  function cargarMovimientos() {
    const trans = DB.getTransacciones(activeAccount.numero_cuenta);
    trans.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const tbody = document.getElementById('movimientosTableBody');
    const filterType = document.getElementById('filterTipoMovimiento')?.value || 'todos';
    const searchTerm = document.getElementById('searchMovimiento')?.value.toLowerCase() || '';

    if (!tbody) return;
    tbody.innerHTML = '';

    const filtradas = trans.filter(t => {
      const cumpleTipo = filterType === 'todos' || t.tipo.toLowerCase() === filterType.toLowerCase();
      const cumpleBusqueda = t.descripcion.toLowerCase().includes(searchTerm) || 
                             t.categoria.toLowerCase().includes(searchTerm) || 
                             t.referencia.toLowerCase().includes(searchTerm);
      return cumpleTipo && cumpleBusqueda;
    });

    if (filtradas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            No se registraron movimientos para su cuenta con los filtros seleccionados.
          </td>
        </tr>
      `;
      return;
    }

    const simbolo = DB.getSimboloMoneda(activeAccount.moneda);

    filtradas.forEach(t => {
      const tr = document.createElement('tr');
      const esCredito = t.tipo === 'Crédito';
      const badgeClase = esCredito ? 'bac-badge-credit' : 'bac-badge-debit';
      const montoSigno = esCredito ? '+' : '-';
      const montoColor = esCredito ? 'text-success' : 'text-danger';

      tr.innerHTML = `
        <td class="text-nowrap">${t.fecha}</td>
        <td>
          <span class="fw-semibold text-dark">${t.descripcion}</span>
          <div class="text-muted small">Ref: ${t.referencia}</div>
        </td>
        <td><span class="bac-badge ${badgeClase}">${t.tipo}</span></td>
        <td>${t.categoria}</td>
        <td class="fw-bold ${montoColor} text-nowrap">${montoSigno} ${simbolo} ${parseFloat(t.monto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
        <td class="text-muted text-nowrap">${simbolo} ${parseFloat(t.saldo_posterior).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  const searchInput = document.getElementById('searchMovimiento');
  const filterSelect = document.getElementById('filterTipoMovimiento');
  if (searchInput) searchInput.addEventListener('input', cargarMovimientos);
  if (filterSelect) filterSelect.addEventListener('change', cargarMovimientos);

  // 2. TRANSFERENCIAS
  function inicializarFormularioTransferencias() {
    const form = document.getElementById('transferForm');
    const feedback = document.getElementById('transferFeedback');
    const voucherContainer = document.getElementById('transferVoucher');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      feedback.classList.add('d-none');
      voucherContainer.classList.add('d-none');

      const cuentaDestino = document.getElementById('tfDestino').value.trim();
      const beneficiario = document.getElementById('tfBeneficiario').value.trim();
      const monto = parseFloat(document.getElementById('tfMonto').value);
      const motivo = document.getElementById('tfMotivo').value.trim();
      const saldoActual = parseFloat(activeAccount.saldo) || 0;
      const simbolo = DB.getSimboloMoneda(activeAccount.moneda);

      if (!cuentaDestino || !beneficiario || isNaN(monto) || !motivo) {
        mostrarFeedback(feedback, 'Todos los campos son obligatorios.', 'danger');
        return;
      }

      if (monto <= 0) {
        mostrarFeedback(feedback, 'El monto a transferir debe ser mayor a cero.', 'danger');
        return;
      }

      if (cuentaDestino === activeAccount.numero_cuenta) {
        mostrarFeedback(feedback, 'No puede transferir fondos a su misma cuenta.', 'danger');
        return;
      }

      // Comprobar saldo suficiente
      if (monto > saldoActual) {
        mostrarFeedback(feedback, `Saldo insuficiente. Su saldo disponible es ${simbolo} ${saldoActual.toLocaleString('es-GT', { minimumFractionDigits: 2 })}.`, 'danger');
        return;
      }

      // Actualizar saldo de origen
      const nuevoSaldoOrigen = saldoActual - monto;
      await DB.actualizarSaldo(activeAccount.numero_cuenta, nuevoSaldoOrigen);

      // Registrar débito en CSV
      const refCode = 'BAC-TRF-' + Math.floor(100000 + Math.random() * 900000);
      const debitoTrx = await DB.registrarTransaccion({
        numero_cuenta: activeAccount.numero_cuenta,
        tipo: 'Débito',
        categoria: 'Transferencia',
        descripcion: `Transferencia a ${beneficiario} (${motivo})`,
        monto: monto.toFixed(2),
        saldo_posterior: nuevoSaldoOrigen.toFixed(2),
        referencia: refCode
      });

      // Si la cuenta destino existe en el banco, acreditarle fondos
      const cuentaDestinoObj = DB.getCuentaByNumero(cuentaDestino);
      if (cuentaDestinoObj) {
        const saldoDestinoActual = parseFloat(cuentaDestinoObj.saldo) || 0;
        const nuevoSaldoDestino = saldoDestinoActual + monto;
        await DB.actualizarSaldo(cuentaDestino, nuevoSaldoDestino);
        await DB.registrarTransaccion({
          numero_cuenta: cuentaDestino,
          tipo: 'Crédito',
          categoria: 'Transferencia',
          descripcion: `Transferencia recibida de ${activeAccount.titular}`,
          monto: monto.toFixed(2),
          saldo_posterior: nuevoSaldoDestino.toFixed(2),
          referencia: refCode
        });
      }

      // Actualizar vista
      actualizarVistaCuenta();
      cargarMovimientos();
      cargarDatosCSVEnTab();

      // Mostrar comprobante
      mostrarVoucherTransferencia(voucherContainer, {
        referencia: refCode,
        fecha: debitoTrx.fecha,
        origen: activeAccount.numero_cuenta,
        destino: cuentaDestino,
        beneficiario: beneficiario,
        monto: monto,
        motivo: motivo,
        moneda: activeAccount.moneda
      });

      form.reset();
      mostrarFeedback(feedback, 'Transferencia realizada con éxito y registrada en la base de datos CSV.', 'success');
    });
  }

  function mostrarVoucherTransferencia(container, data) {
    const simbolo = DB.getSimboloMoneda(data.moneda);
    container.innerHTML = `
      <div class="bac-receipt animate__animated animate__fadeIn">
        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <span class="fw-bold text-dark">Comprobante de Transferencia</span>
          <span class="bac-badge bac-badge-credit">Completada</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Número de Referencia:</span>
          <span class="fw-bold text-danger">${data.referencia}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Fecha y Hora:</span>
          <span>${data.fecha}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Cuenta Origen:</span>
          <span>${data.origen}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Cuenta Destino:</span>
          <span>${data.destino}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Beneficiario:</span>
          <span class="fw-semibold text-dark">${data.beneficiario}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Motivo:</span>
          <span>${data.motivo}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Monto Debitado:</span>
          <span class="fw-bold text-dark fs-6">${simbolo} ${parseFloat(data.monto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    `;
    container.classList.remove('d-none');
  }

  // 3. PAGO DE SERVICIOS
  function inicializarFormularioServicios() {
    const form = document.getElementById('serviciosForm');
    const feedback = document.getElementById('serviciosFeedback');
    const voucherContainer = document.getElementById('serviciosVoucher');
    const categoriaSelect = document.getElementById('srvCategoria');
    const empresaSelect = document.getElementById('srvEmpresa');

    if (!form) return;

    const listaServicios = DB.getServicios();

    function actualizarEmpresas() {
      const cat = categoriaSelect.value;
      empresaSelect.innerHTML = '';
      const filtradas = listaServicios.filter(s => s.categoria.toLowerCase() === cat.toLowerCase());
      filtradas.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.empresa;
        opt.textContent = `${s.empresa} (${s.codigo_convenio})`;
        empresaSelect.appendChild(opt);
      });
    }

    if (categoriaSelect) {
      categoriaSelect.addEventListener('change', actualizarEmpresas);
      actualizarEmpresas();
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      feedback.classList.add('d-none');
      voucherContainer.classList.add('d-none');

      const empresa = empresaSelect.value;
      const contrato = document.getElementById('srvContrato').value.trim();
      const monto = parseFloat(document.getElementById('srvMonto').value);
      const saldoActual = parseFloat(activeAccount.saldo) || 0;
      const simbolo = DB.getSimboloMoneda(activeAccount.moneda);

      if (!contrato || isNaN(monto) || monto <= 0) {
        mostrarFeedback(feedback, 'Ingrese un número de servicio y un monto válido.', 'danger');
        return;
      }

      // Comprobar saldo suficiente
      if (monto > saldoActual) {
        mostrarFeedback(feedback, `Saldo insuficiente para realizar el pago. Saldo disponible: ${simbolo} ${saldoActual.toLocaleString('es-GT', { minimumFractionDigits: 2 })}.`, 'danger');
        return;
      }

      // Actualizar saldo
      const nuevoSaldo = saldoActual - monto;
      await DB.actualizarSaldo(activeAccount.numero_cuenta, nuevoSaldo);

      // Registrar transacción en la base de datos CSV
      const refCode = 'BAC-PAG-' + Math.floor(100000 + Math.random() * 900000);
      const trx = await DB.registrarTransaccion({
        numero_cuenta: activeAccount.numero_cuenta,
        tipo: 'Débito',
        categoria: 'Servicios',
        descripcion: `Pago de Servicio: ${empresa} (Contrato: ${contrato})`,
        monto: monto.toFixed(2),
        saldo_posterior: nuevoSaldo.toFixed(2),
        referencia: refCode
      });

      // Actualizar vistas
      actualizarVistaCuenta();
      cargarMovimientos();
      cargarDatosCSVEnTab();

      // Mostrar comprobante
      mostrarVoucherServicio(voucherContainer, {
        referencia: refCode,
        fecha: trx.fecha,
        empresa: empresa,
        contrato: contrato,
        monto: monto,
        moneda: activeAccount.moneda,
        cuenta: activeAccount.numero_cuenta
      });

      form.reset();
      actualizarEmpresas();
      mostrarFeedback(feedback, 'Pago de servicio procesado exitosamente y registrado en CSV.', 'success');
    });
  }

  function mostrarVoucherServicio(container, data) {
    const simbolo = DB.getSimboloMoneda(data.moneda);
    container.innerHTML = `
      <div class="bac-receipt animate__animated animate__fadeIn">
        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
          <span class="fw-bold text-dark">Recibo de Pago de Servicios</span>
          <span class="bac-badge bac-badge-credit">Cancelado</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Número de Autorización:</span>
          <span class="fw-bold text-danger">${data.referencia}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Fecha de Pago:</span>
          <span>${data.fecha}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Empresa / Institución:</span>
          <span class="fw-semibold text-dark">${data.empresa}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Número de Contrato / NIS:</span>
          <span>${data.contrato}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Debitado de la Cuenta:</span>
          <span>${data.cuenta}</span>
        </div>
        <div class="bac-receipt-row">
          <span class="text-muted">Monto Pagado:</span>
          <span class="fw-bold text-dark fs-6">${simbolo} ${parseFloat(data.monto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    `;
    container.classList.remove('d-none');
  }

  // 4. ESTADO DE CUENTA
  function inicializarEstadoDeCuenta() {
    const btnGenerar = document.getElementById('btnGenerarEstado');
    if (btnGenerar) {
      btnGenerar.addEventListener('click', generarEstadoDeCuenta);
    }
  }

  function generarEstadoDeCuenta() {
    const container = document.getElementById('statementContainer');
    if (!container) return;

    const periodo = document.getElementById('periodoEstado')?.value || 'mes_actual';
    const trans = DB.getTransacciones(activeAccount.numero_cuenta);
    trans.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const simbolo = DB.getSimboloMoneda(activeAccount.moneda);

    let totalCreditos = 0;
    let totalDebitos = 0;

    trans.forEach(t => {
      const m = parseFloat(t.monto) || 0;
      if (t.tipo === 'Crédito') totalCreditos += m;
      if (t.tipo === 'Débito') totalDebitos += m;
    });

    const saldoFinal = parseFloat(activeAccount.saldo) || 0;
    const saldoInicial = (saldoFinal - totalCreditos + totalDebitos).toFixed(2);

    let periodLabel = 'Mes Actual (Octubre - Noviembre 2026)';
    if (periodo === 'mes_anterior') periodLabel = 'Mes Anterior (Septiembre 2026)';
    if (periodo === 'trimestre') periodLabel = 'Últimos 3 Meses (Agosto - Octubre 2026)';

    let rowsHtml = '';
    if (trans.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="5" class="text-center py-3 text-muted">No existen transacciones en este período para su cuenta.</td>
        </tr>
      `;
    } else {
      trans.forEach(t => {
        const esCred = t.tipo === 'Crédito';
        const sign = esCred ? '+' : '-';
        const color = esCred ? 'text-success' : 'text-danger';
        rowsHtml += `
          <tr>
            <td>${t.fecha}</td>
            <td>${t.referencia}</td>
            <td>${t.descripcion}</td>
            <td class="fw-bold ${color} text-end">${sign} ${simbolo} ${parseFloat(t.monto).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="text-end">${simbolo} ${parseFloat(t.saldo_posterior).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <div class="statement-box animate__animated animate__fadeIn">
        <div class="d-flex justify-content-between align-items-center statement-header">
          <div>
            <img src="../imas/logo_sinfondo.png" alt="BAC Credomatic" style="height: 44px;" class="mb-2">
            <div class="text-muted small">BAC Credomatic Guatemala | Estado de Cuenta Digital</div>
          </div>
          <div class="text-end">
            <div class="fw-bold text-dark">Emisión: ${new Date().toLocaleDateString('es-GT')}</div>
            <div class="text-muted small">Período: ${periodLabel}</div>
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <div class="p-3 bg-light border rounded">
              <div class="text-muted small">Titular</div>
              <div class="fw-bold text-dark fs-6">${activeAccount.titular}</div>
              <div class="text-muted small mt-1">Usuario: <strong>${activeAccount.usuario || 'cliente'}</strong></div>
              <div class="text-muted small">Identificación: ${activeAccount.cedula}</div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-3 bg-light border rounded">
              <div class="text-muted small">Cuenta</div>
              <div class="fw-bold text-danger fs-6">${activeAccount.numero_cuenta}</div>
              <div class="text-muted small mt-1">Producto: ${activeAccount.tipo_cuenta}</div>
              <div class="text-muted small">Moneda: ${activeAccount.moneda === 'GTQ' ? 'Quetzales (Q)' : (activeAccount.moneda === 'USD' ? 'Dólares ($)' : 'Colones (₡)')}</div>
            </div>
          </div>
        </div>

        <!-- Resumen Financiero -->
        <div class="row g-3 mb-4">
          <div class="col-sm-3">
            <div class="statement-summary-box text-center">
              <span class="text-muted small d-block">Saldo Inicial</span>
              <span class="fw-bold text-dark fs-6">${simbolo} ${parseFloat(saldoInicial).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div class="col-sm-3">
            <div class="statement-summary-box text-center">
              <span class="text-muted small d-block">Créditos (+)</span>
              <span class="fw-bold text-success fs-6">+ ${simbolo} ${totalCreditos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div class="col-sm-3">
            <div class="statement-summary-box text-center">
              <span class="text-muted small d-block">Débitos (-)</span>
              <span class="fw-bold text-danger fs-6">- ${simbolo} ${totalDebitos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div class="col-sm-3">
            <div class="statement-summary-box text-center border-danger">
              <span class="text-muted small d-block">Saldo Final Disponible</span>
              <span class="fw-bold text-danger fs-6">${simbolo} ${saldoFinal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <!-- Detalle de Movimientos -->
        <h3 class="h6 fw-bold text-dark mb-3">Movimientos de la Cuenta</h3>
        <div class="bac-table-container mb-4">
          <table class="table bac-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Referencia</th>
                <th>Descripción</th>
                <th class="text-end">Monto</th>
                <th class="text-end">Saldo Resultante</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="border-top pt-3 d-flex justify-content-between align-items-center">
          <div class="text-muted small">
            Certificación digital de cuenta personal emitida por BAC Credomatic.
          </div>
          <button type="button" id="btnExportarEstadoCSV" class="uiverse-btn-primary uiverse-btn-sm">
            <span class="svg-icon"><img src="../svg/download.svg" alt="Descargar"></span>
            <span>Exportar Mi Estado (CSV)</span>
          </button>
        </div>
      </div>
    `;

    const btnExportarEstado = document.getElementById('btnExportarEstadoCSV');
    if (btnExportarEstado) {
      btnExportarEstado.onclick = () => {
        DB.exportarMiCuenta(activeAccount);
      };
    }
  }

  // 5. BASE DE DATOS CSV (Solo Admin)
  function cargarDatosCSVEnTab() {
    if (!DB.isAdminSession()) return;
    const preCuentas = document.getElementById('csvCuentasPre');
    const preTrans = document.getElementById('csvTransaccionesPre');
    if (preCuentas) {
      preCuentas.textContent = localStorage.getItem('bac_cuentas_csv') || '';
    }
    if (preTrans) {
      preTrans.textContent = localStorage.getItem('bac_transacciones_csv') || '';
    }
  }

  const btnSyncCloud = document.getElementById('btnSyncCloud');
  if (btnSyncCloud) {
    btnSyncCloud.addEventListener('click', async () => {
      btnSyncCloud.disabled = true;
      btnSyncCloud.innerHTML = '<span>Sincronizando...</span>';
      await DB.sincronizarDatos();
      cargarDatosCSVEnTab();
      actualizarVistaCuenta();
      cargarMovimientos();
      btnSyncCloud.disabled = false;
      btnSyncCloud.innerHTML = '<span class="svg-icon"><img src="../svg/refresh.svg" alt="Sincronizar"></span><span>Sincronizar Cloud & CSV</span>';
      alert('Sincronización completa con TextDB Cloud y copias de seguridad locales en CSV.');
    });
  }

  const btnResetDB = document.getElementById('btnResetDB');
  if (btnResetDB) {
    btnResetDB.addEventListener('click', async () => {
      if (confirm('¿Desea restablecer la base de datos CSV a los valores originales predeterminados?')) {
        await DB.restablecerDatos();
        initSession();
        alert('Base de datos CSV restablecida con éxito.');
      }
    });
  }

  const btnCerrarSesion = document.getElementById('btnCerrarSesion');
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
      DB.clearCurrentSession();
      window.location.href = '../index.html';
    });
  }

  function mostrarFeedback(element, mensaje, tipo) {
    if (!element) return;
    element.className = `alert alert-${tipo} py-2 small mb-3 animate__animated animate__fadeIn`;
    element.textContent = mensaje;
    element.classList.remove('d-none');
  }
});
