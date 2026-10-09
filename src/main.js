const route = new URLSearchParams(location.search);
if (route.get('mueble') === 'librero-emi') import('./librero_v2.js');
else if (route.get('mueble') === 'cama-montessori-emi') import('./cama.js');
else if (route.get('mueble') === 'juguetero-bajo-x2-emi') import('./juguetero.js');
else import('./mesa.js');
