const route = new URLSearchParams(location.search);
if (route.get('mueble') === 'librero-emi') import('./librero.js');
else import('./mesa.js');
