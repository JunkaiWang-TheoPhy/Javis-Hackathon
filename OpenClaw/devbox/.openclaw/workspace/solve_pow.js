const crypto = require('crypto');

async function solvePoW(challenge, difficulty) {
  const prefix = '0'.repeat(difficulty);
  
  for (let nonce = 0; ; nonce++) {
    const data = challenge + ':' + nonce;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    if (hash.startsWith(prefix)) {
      return nonce;
    }
    
    if (nonce % 10000 === 0 && nonce > 0) {
      process.stdout.write(`\rTrying nonce ${nonce}...`);
    }
  }
}

const challenge = process.argv[2];
const difficulty = parseInt(process.argv[3]);

solvePoW(challenge, difficulty).then(nonce => {
  console.log(`\nFound nonce: ${nonce}`);
  const hash = crypto.createHash('sha256').update(challenge + ':' + nonce).digest('hex');
  console.log(`Hash: ${hash}`);
});
