const bcrypt = require('bcrypt');
const password = process.argv[2] || 'password123';
const hash = bcrypt.hashSync(password, 10);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`); 