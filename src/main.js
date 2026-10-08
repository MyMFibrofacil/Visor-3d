const route = new URLSearchParams(location.search);
if (route.get('mueble') === 'librero-emi') import('./librero_rebuilt.js');
else import('./mesa.js');
