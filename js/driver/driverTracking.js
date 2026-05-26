// ==================================================
// MÓDULO DE RASTREAMENTO DO MOTORISTA (driverTracking.js)
// ==================================================

const DriverTracking = {
  socket: null,
  locationInterval: null,

  init: () => {
    const token = window.Auth.getAuthToken('driver');
    if (!token) return;

    DriverTracking.socket = io(window.BASE_URL, { auth: { token } });

    DriverTracking.socket.on('connect', () => {
      console.log('[Driver Tracking] Ligado ao servidor de WebSockets.');
      window.DriverUI.updateOnlineStatus(true);
      DriverTracking.startTracking();
    });

    DriverTracking.socket.on('disconnect', () => {
      console.warn('[Driver Tracking] Desligado do servidor.');
      window.DriverUI.updateOnlineStatus(false);
    });

    DriverTracking.socket.on('nova_entrega_atribuida', (order) => {
      window.UI.showAlert(`Nova Entrega Atribuída! (${order.service_type.toUpperCase()})`, 'success');
      window.DriverApp.loadDeliveries();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    DriverTracking.socket.on('entrega_cancelada', () => {
      window.UI.showAlert('Uma das suas entregas foi reatribuída ou cancelada.', 'warning');
      window.DriverApp.loadDeliveries();
    });
  },

  startTracking: () => {
    if (!navigator.geolocation) {
      window.DriverUI.showLocationPermissionError('Geolocalização não é suportada por este navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.DriverUI.hideLocationPermissionError();
        DriverTracking.sendLocation(pos);

        if (DriverTracking.locationInterval) clearInterval(DriverTracking.locationInterval);
        DriverTracking.locationInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(DriverTracking.sendLocation, null, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        }, 10000);
      },
      (err) => {
        window.DriverUI.showLocationPermissionError('Por favor, ative a permissão de localização para partilhar a sua posição em tempo real.');
      },
      { enableHighAccuracy: true }
    );
  },

  sendLocation: (pos) => {
    if (!DriverTracking.socket || !DriverTracking.socket.connected) return;

    const payload = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed || 0
    };

    DriverTracking.socket.emit('driver_location_update', payload);
    window.DriverUI.updateLastLocationTime();
  },

  stopTracking: () => {
    if (DriverTracking.locationInterval) {
      clearInterval(DriverTracking.locationInterval);
    }
    if (DriverTracking.socket) {
      DriverTracking.socket.disconnect();
    }
  }
};

window.DriverTracking = DriverTracking;
