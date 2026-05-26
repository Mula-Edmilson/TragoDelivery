// ==================================================
// MÓDULO DE MAPA DO ADMINISTRADOR (adminMap.js)
// ==================================================

let adminMapInstance = null;
let driverMarkers = {};

const AdminMap = {
  initMap: () => {
    const mapEl = document.getElementById('admin-map');
    if (!mapEl) return;

    if (adminMapInstance) {
      adminMapInstance.remove();
    }

    // Coordenadas centrais de Maputo
    adminMapInstance = L.map('admin-map').setView([-25.9653, 32.5890], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(adminMapInstance);

    AdminMap.fetchAndPlotLocations();
  },

  fetchAndPlotLocations: async () => {
    try {
      const res = await fetch(`${window.API_URL}/drivers/live-locations`, { headers: window.Auth.getAuthHeaders('admin') });
      if (res.ok) {
        const data = await res.json();
        AdminMap.updateDriverMarkers(data.drivers);
      }
    } catch (err) {
      console.warn('Erro ao carregar localizações fallback:', err);
    }
  },

  updateDriverMarkers: (drivers) => {
    if (!adminMapInstance) return;

    const currentIds = new Set();

    drivers.forEach(d => {
      if (!d.lat || !d.lng) return;
      currentIds.add(d.driverId.toString());

      const latlng = [d.lat, d.lng];
      const statusText = d.status || 'offline';
      const speed = d.speed ? `${Math.round(d.speed)} km/h` : '0 km/h';

      const popupContent = `
        <div class="text-xs p-1">
          <p class="font-bold text-[#2F7A3C]">${d.driverName}</p>
          <p class="text-gray-600">${d.telefone}</p>
          <p class="mt-1 font-semibold">Status: ${window.UI.getDriverStatusLabel(statusText)}</p>
          <p class="text-gray-500 mt-0.5">Velocidade: ${speed}</p>
        </div>
      `;

      if (driverMarkers[d.driverId]) {
        driverMarkers[d.driverId].setLatLng(latlng);
        driverMarkers[d.driverId].getPopup().setContent(popupContent);
      } else {
        const markerColor = statusText.includes('livre') ? 'green' : statusText.includes('ocupado') ? 'orange' : 'red';
        
        const customIcon = L.divIcon({
          className: 'custom-driver-marker',
          html: `<div class="w-4 h-4 rounded-full bg-${markerColor}-600 border-2 border-white shadow-md animate-pulse"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker(latlng, { icon: customIcon })
          .bindPopup(popupContent)
          .addTo(adminMapInstance);

        driverMarkers[d.driverId] = marker;
      }
    });

    Object.keys(driverMarkers).forEach(id => {
      if (!currentIds.has(id)) {
        adminMapInstance.removeLayer(driverMarkers[id]);
        delete driverMarkers[id];
      }
    });
  },

  focusDriver: (driverId) => {
    // Focar no motorista se este tiver um marcador no mapa
    if (!adminMapInstance) {
      window.AdminApp.showSection('mapa');
      setTimeout(() => AdminMap.focusDriver(driverId), 500);
      return;
    }

    window.AdminApp.showSection('mapa');
    
    const marker = driverMarkers[driverId];
    if (marker) {
      adminMapInstance.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    } else {
      window.UI.showAlert('A localização exata deste motorista não está disponível de momento.', 'warning');
    }
  }
};

window.AdminMap = AdminMap;
