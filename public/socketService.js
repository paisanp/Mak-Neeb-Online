window.SocketService = (() => {
  const socket = io();
  const send = (event, payload) => socket.emit(event, payload || {});
  return { socket, send, on: (event, handler) => socket.on(event, handler) };
})();
