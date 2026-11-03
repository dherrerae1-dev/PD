document.addEventListener('DOMContentLoaded', () => {
  const registroForm = document.getElementById('registroForm');
  const alertContainer = document.getElementById('alertContainer');
  const formSection = document.getElementById('formSection');
  const confirmationSection = document.getElementById('confirmationSection');
  const btnAccederBanca = document.getElementById('btnAccederBanca');
  const btnDescargarMiCuenta = document.getElementById('btnDescargarMiCuenta');

  const regTitularInput = document.getElementById('regTitular');
  const regUsuarioInput = document.getElementById('regUsuario');

  let cuentaCreada = null;

  // Sugerencia automática de usuario basada en el nombre del titular
  if (regTitularInput && regUsuarioInput) {
    regTitularInput.addEventListener('input', () => {
      if (!regUsuarioInput.dataset.manual) {
        const val = regTitularInput.value.trim().toLowerCase();
        const partes = val.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
        if (partes.length >= 2) {
          regUsuarioInput.value = `${partes[0]}.${partes[1]}`;
        } else if (partes.length === 1) {
          regUsuarioInput.value = partes[0];
        }
      }
    });

    regUsuarioInput.addEventListener('input', () => {
      regUsuarioInput.dataset.manual = 'true';
    });
  }

  if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titular = document.getElementById('regTitular').value.trim();
      const usuario = document.getElementById('regUsuario').value.trim().toLowerCase();
      const cedula = document.getElementById('regCedula').value.trim();
      const correo = document.getElementById('regCorreo').value.trim();
      const telefono = document.getElementById('regTelefono').value.trim();
      const tipoCuenta = document.getElementById('regTipoCuenta').value;
      const moneda = document.getElementById('regMoneda').value;
      const depositoInicial = parseFloat(document.getElementById('regDeposito').value);
      const pin = document.getElementById('regPin').value.trim();
      const pinConfirm = document.getElementById('regPinConfirm').value.trim();

      if (!usuario) {
        mostrarAlerta('Debe ingresar un nombre de usuario de acceso.', 'danger');
        return;
      }

      if (pin !== pinConfirm) {
        mostrarAlerta('Los dígitos del PIN de seguridad no coinciden.', 'danger');
        return;
      }

      if (pin.length < 4 || pin.length > 6) {
        mostrarAlerta('El PIN debe tener entre 4 y 6 dígitos numéricos.', 'danger');
        return;
      }

      if (isNaN(depositoInicial) || depositoInicial < 0) {
        mostrarAlerta('Ingrese un monto de depósito inicial válido.', 'danger');
        return;
      }

      // Validar si el usuario o identificación ya existen
      const cuentasExistentes = DB.getCuentas();
      const duplicadoUsuario = cuentasExistentes.some(c => (c.usuario && c.usuario.toLowerCase() === usuario));
      if (duplicadoUsuario) {
        mostrarAlerta('El nombre de usuario ya se encuentra registrado. Elija otro nombre.', 'warning');
        return;
      }

      const duplicadoCedula = cuentasExistentes.some(c => c.cedula.toLowerCase() === cedula.toLowerCase());
      if (duplicadoCedula) {
        mostrarAlerta('Ya existe una cuenta registrada con ese número de identificación o DPI.', 'warning');
        return;
      }

      // Generar número de cuenta IBAN BAC Guatemala (GT)
      const aleatorio = Math.floor(100000000 + Math.random() * 900000000);
      const numeroCuenta = `GT0501020000${aleatorio}`;

      const nuevaCuenta = {
        usuario: usuario,
        numero_cuenta: numeroCuenta,
        tipo_cuenta: tipoCuenta,
        titular: titular,
        cedula: cedula,
        correo: correo,
        telefono: telefono,
        saldo: depositoInicial.toFixed(2),
        moneda: moneda,
        pin: pin
      };

      // Guardar cuenta de forma persistente y sincronizar físicamente en disco (cuentas.csv)
      cuentaCreada = await DB.guardarCuenta(nuevaCuenta);

      // Registrar depósito inicial en transacciones si es mayor a 0
      if (depositoInicial > 0) {
        await DB.registrarTransaccion({
          numero_cuenta: numeroCuenta,
          tipo: 'Crédito',
          categoria: 'Depósito',
          descripcion: 'Depósito Inicial de Apertura de Cuenta',
          monto: depositoInicial.toFixed(2),
          saldo_posterior: depositoInicial.toFixed(2),
          referencia: 'BAC-APE-' + Math.floor(100000 + Math.random() * 900000)
        });
      }

      // Mostrar datos de registro exitoso
      mostrarConfirmacion(nuevaCuenta);
    });
  }

  function mostrarConfirmacion(cuenta) {
    document.getElementById('confUsuario').textContent = cuenta.usuario;
    document.getElementById('confTitular').textContent = cuenta.titular;
    document.getElementById('confCedula').textContent = cuenta.cedula;
    document.getElementById('confNumeroCuenta').textContent = cuenta.numero_cuenta;
    document.getElementById('confTipoCuenta').textContent = cuenta.tipo_cuenta;

    let monedaTexto = 'Quetzales (Q - GTQ)';
    if (cuenta.moneda === 'USD') monedaTexto = 'Dólares ($ - USD)';
    if (cuenta.moneda === 'CRC') monedaTexto = 'Colones (₡ - CRC)';
    document.getElementById('confMoneda').textContent = monedaTexto;

    const simbolo = DB.getSimboloMoneda(cuenta.moneda);
    document.getElementById('confSaldo').textContent = `${simbolo} ${parseFloat(cuenta.saldo).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
    document.getElementById('confCorreo').textContent = cuenta.correo;
    document.getElementById('confTelefono').textContent = cuenta.telefono;

    formSection.classList.add('d-none');
    confirmationSection.classList.remove('d-none');
    confirmationSection.classList.add('animate__animated', 'animate__fadeIn');
  }

  if (btnAccederBanca) {
    btnAccederBanca.addEventListener('click', () => {
      if (cuentaCreada) {
        DB.setCurrentSession(cuentaCreada.numero_cuenta);
      }
      window.location.href = 'banca.html';
    });
  }

  if (btnDescargarMiCuenta) {
    btnDescargarMiCuenta.addEventListener('click', () => {
      if (cuentaCreada) {
        DB.exportarComprobanteApertura(cuentaCreada);
      }
    });
  }

  function mostrarAlerta(mensaje, tipo) {
    if (!alertContainer) return;
    alertContainer.className = `alert alert-${tipo} py-2 small mb-3 animate__animated animate__shakeX`;
    alertContainer.textContent = mensaje;
    alertContainer.classList.remove('d-none');
  }
});
