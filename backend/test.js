const crypto = require('crypto');

const plaintextPassword = 'dg123'; // <--- Choose your temporary password here
const hashedPassword = crypto.createHash('sha256').update(plaintextPassword).digest('hex');

console.log(`Plaintext: ${plaintextPassword}`);
console.log(`SHA-256 Hash: ${hashedPassword}`);