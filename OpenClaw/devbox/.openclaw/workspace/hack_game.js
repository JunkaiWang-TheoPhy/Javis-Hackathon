const crypto = require('crypto');
const https = require('https');

const BASE_URL = 'https://realized-begun-colours-sure.trycloudflare.com';

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function solvePoW(challenge, difficulty) {
  const prefix = '0'.repeat(difficulty);
  
  for (let nonce = 0; ; nonce++) {
    const data = challenge + ':' + nonce;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    if (hash.startsWith(prefix)) {
      return nonce;
    }
    
    if (nonce % 10000 === 0 && nonce > 0) {
      process.stdout.write(`\rSolving PoW... nonce ${nonce}`);
    }
  }
}

async function submitAnswer(layer, answer) {
  console.log(`\n[Layer ${layer}] Getting challenge...`);
  const challengeRes = await request('/api/puzzle/challenge');
  
  if (challengeRes.error) {
    console.log(`Error: ${challengeRes.error}`);
    return;
  }
  
  console.log(`Challenge: ${challengeRes.challenge}, Difficulty: ${challengeRes.difficulty}`);
  const nonce = solvePoW(challengeRes.challenge, challengeRes.difficulty);
  console.log(`\nSolved! Nonce: ${nonce}`);
  
  console.log(`Submitting answer: "${answer}"...`);
  const result = await request('/api/puzzle/verify', 'POST', {
    layer,
    answer,
    pow: { nonce: String(nonce) }
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  // Layer 0: claw
  await submitAnswer(0, 'claw');
  
  // Layer 1: PINCH
  await submitAnswer(1, 'PINCH');
}

main().catch(console.error);
