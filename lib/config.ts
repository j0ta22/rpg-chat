// Configuración del servidor
export const SERVER_CONFIG = {
  // URL del servidor para desarrollo
  DEV_URL: 'http://localhost:3001',
  
  // URL del servidor para producción (debes cambiar esto por tu servidor real)
  PROD_URL: 'https://tu-servidor-socketio.herokuapp.com',
  
  // Detectar si estamos en desarrollo o producción
  get SERVER_URL() {
    return process.env.NODE_ENV === 'production' 
      ? this.PROD_URL 
      : this.DEV_URL;
  }
}

// Configuración de Socket.IO
export const SOCKET_CONFIG = {
  transports: ['websocket', 'polling'] as const,
  timeout: 5000,
  heartbeatInterval: 5000
}
