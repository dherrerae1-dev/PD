document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginFeedback = document.getElementById('loginFeedback');
  const heroAmbient = document.querySelector('.bac-hero-ambient');

  // Efecto difuminado interactivo en el fondo con el movimiento del ratón
  if (heroAmbient) {
    heroAmbient.addEventListener('mousemove', (e) => {
      const rect = heroAmbient.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      heroAmbient.style.setProperty('--mouse-x', `${x}%`);
      heroAmbient.style.setProperty('--mouse-y', `${y}%`);

      const orbs = heroAmbient.querySelectorAll('.bac-ambient-orb');
      orbs.forEach((orb, idx) => {
        const factor = (idx + 1) * 8;
        const moveX = ((e.clientX - rect.left) / rect.width - 0.5) * factor;
        const moveY = ((e.clientY - rect.top) / rect.height - 0.5) * factor;
        orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    });
  }

  // Inicio de sesión
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('loginUser').value.trim();
      const pin = document.getElementById('loginPin').value.trim();

      if (!user || !pin) {
        mostrarAlerta('Por favor, ingrese su usuario o identificación y su PIN de acceso.', 'danger');
        return;
      }

      const cuenta = DB.getCuentaByCredenciales(user, pin);
      if (cuenta) {
        DB.setCurrentSession(cuenta.numero_cuenta, cuenta.usuario);
        mostrarAlerta('Credenciales verificadas. Ingresando a la Banca en Línea...', 'success');
        setTimeout(() => {
          window.location.href = 'html/banca.html';
        }, 600);
      } else {
        mostrarAlerta('Datos incorrectos. Verifique su usuario o identificación y PIN.', 'danger');
      }
    });
  }

  function mostrarAlerta(mensaje, tipo) {
    if (!loginFeedback) return;
    loginFeedback.className = `alert alert-${tipo} py-2 small mb-3 animate__animated animate__fadeIn`;
    loginFeedback.textContent = mensaje;
    loginFeedback.classList.remove('d-none');
  }
});
