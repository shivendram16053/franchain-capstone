const bs58 = require('bs58');
const fs = require('fs');

const secretKey = '5xoaskUjEJC9QuTXXQAxBNPakUUt3zpXBuxgHAK5RDs3TuWbaV1JUXPxjgEUPoT7AzSjTKX31xbFUB2CYHtHhFxV';
const decoded = bs58.decode(secretKey);
fs.writeFileSync('Turbin3_wallet.json', JSON.stringify(Array.from(decoded)));
console.log('Wallet JSON saved!');
