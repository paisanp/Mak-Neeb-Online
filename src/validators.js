function sanitizeName(value) {
  if (typeof value !== 'string') return null;
  const name = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  return name && name.length <= 20 ? name : null;
}
function normalizeCode(value) { return typeof value === 'string' && /^[A-Z0-9]{6}$/i.test(value.trim()) ? value.trim().toUpperCase() : null; }
function validToken(value) { return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value); }
module.exports = { sanitizeName, normalizeCode, validToken };
