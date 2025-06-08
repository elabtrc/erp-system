const bcrypt = require('bcrypt');
const saltRounds = 10;

// Generate new hashes
async function generateHashes() {
  console.log('Branch Manager:', await bcrypt.hash('branch123', saltRounds));
  console.log('Accountant:', await bcrypt.hash('account456', saltRounds));
  console.log('Receptionist:', await bcrypt.hash('recep789', saltRounds));
  console.log('Super Admin:', await bcrypt.hash('superadmin', saltRounds));
}
generateHashes();