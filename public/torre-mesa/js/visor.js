/** Coordina carga, vista inicial y mensajes de la experiencia AR. */
const modelo = document.querySelector('#modelo');
const estado = document.querySelector('#estado');
const ayuda = document.querySelector('#ayuda-ar');
const progreso = document.querySelector('#progreso');

modelo.addEventListener('progress', ({ detail }) => {
  const porcentaje = Math.round(detail.totalProgress * 100);
  progreso.querySelector('span').style.width = `${porcentaje}%`;
  progreso.setAttribute('aria-valuenow', String(porcentaje));
  progreso.hidden = porcentaje === 100;
});
modelo.addEventListener('load', () => {
  estado.textContent = 'Arrastrá para girar · Acercá para ver detalles';
  progreso.hidden = true;
  if (!modelo.canActivateAR) {
    ayuda.textContent = 'Para verlo en tu ambiente, abrí esta página desde un celular compatible con realidad aumentada.';
  }
});
modelo.addEventListener('error', () => {
  estado.textContent = 'No se pudo cargar el modelo. Recargá la página para intentar otra vez.';
  estado.classList.add('error');
  progreso.hidden = true;
});
modelo.addEventListener('ar-status', ({ detail }) => {
  if (detail.status === 'failed') {
    ayuda.textContent = 'No se pudo iniciar la cámara. Comprobá los permisos y abrí el enlace en Chrome o Safari.';
  } else if (detail.status === 'session-started') {
    ayuda.textContent = 'Mové el celular lentamente y apuntá al piso para colocar el producto.';
  }
});
document.querySelector('#restablecer').addEventListener('click', () => {
  modelo.cameraOrbit = '35deg 75deg 2.1m';
  modelo.cameraTarget = '0m 0.453m 0m';
  modelo.fieldOfView = '32deg';
  modelo.resetTurntableRotation();
});
