// ==================================================
// CONFIGURAÇÃO DINÂMICA DA API
// ==================================================
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BASE_URL = isLocalhost ? 'http://localhost:3000' : 'https://entregaah-mz.onrender.com';
const API_URL = `${BASE_URL}/api`;

window.BASE_URL = BASE_URL;
window.API_URL = API_URL;

console.log(`[API Config] Base URL definida para: ${BASE_URL}`);
