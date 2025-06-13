const bcryptjs = require('bcryptjs');
const saltRounds = 10;

// Generate new hashes
async function generateHashes() {
  console.log('Branch Manager:', await bcryptjs.hash('branch123', saltRounds));
  console.log('Accountant:', await bcryptjs.hash('account456', saltRounds));
  console.log('Receptionist:', await bcryptjs.hash('recep789', saltRounds));
  console.log('Super Admin:', await bcryptjs.hash('superadmin', saltRounds));
}
generateHashes();