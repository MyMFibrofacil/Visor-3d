const route = new URLSearchParams(location.search);
if (route.get('mueble') === 'librero-emi') import('./librero_v2.js');
else import('./mesa.js');
