export const getApiBaseUrl = () => {
  const customUrl = localStorage.getItem('exam_backend_url');
  if (customUrl) {
    return customUrl.replace(/\/$/, '');
  }

  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }

  // Check if hostname is an IP address (e.g. 192.168.1.15)
  const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  if (ipPattern.test(hostname)) {
    return `http://${hostname}:8080`;
  }

  // Default to relative path
  return '';
};
