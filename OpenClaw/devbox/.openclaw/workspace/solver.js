#!/usr/bin/env node
const crypto = require('crypto');

const BASE_URL = 'https://realized-begun-colours-sure.trycloudflare.com';
let cookies = '';

async function solvePoW(challenge, difficulty) {
  const prefix = '0'.repeat(difficulty);
  
  for (let nonce = 0; ; nonce++) {
    const data = challenge + ':' + nonce;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    
    if (hash.startsWith(prefix)) {
      return String(nonce);
    }
    
    if (nonce % 10000 === 0 && nonce > 0) {
      process.stdout.write(`\rTrying nonce: ${nonce}...`);
    }
  }
}

async function fetchWithCookies(url, options = {}) {
  const headers = { ...options.headers };
  if (cookies) {
    headers['Cookie'] = cookies;
  }
  
  const res = await fetch(url, { ...options, headers });
  
  // Save cookies
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookies = setCookie.split(';')[0];
  }
  
  return res;
}

async function submitAnswer(layer, answer) {
  console.log(`\n[Layer ${layer}] Getting challenge...`);
  
  // Get challenge
  const challengeRes = await fetchWithCookies(`${BASE_URL}/api/puzzle/challenge`);
  const challengeData = await challengeRes.json();
  
  if (!challengeData.challenge) {
    console.error('Failed to get challenge:', challengeData);
    return;
  }
  
  console.log(`Challenge: ${challengeData.challenge}`);
  console.log(`Difficulty: ${challengeData.difficulty}`);
  console.log('Solving PoW...');
  
  // Solve PoW
  const nonce = await solvePoW(challengeData.challenge, challengeData.difficulty);
  console.log(`\nSolved! Nonce: ${nonce}`);
  
  // Submit answer
  console.log(`Submitting answer: "${answer}"...`);
  const verifyRes = await fetchWithCookies(`${BASE_URL}/api/puzzle/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      layer,
      answer,
      pow: { nonce }
    })
  });
  
  const result = await verifyRes.json();
  console.log('Result:', result);
  return result;
}

async function main() {
  console.log('🦞 The Deep Claw Solver\n');
  
  // Initialize session
  console.log('Initializing session...');
  await fetchWithCookies(`${BASE_URL}/api/puzzle/progress`);
  
  // Layer 0: claw
  const r0 = await submitAnswer(0, 'claw');
  if (!r0.success) {
    console.log('❌ Layer 0 failed, stopping.');
    return;
  }
  
  // Layer 1: PINCH
  const r1 = await submitAnswer(1, 'PINCH');
  if (!r1.success) {
    console.log('❌ Layer 1 failed, stopping.');
    return;
  }
  
  // Check progress
  console.log('\n📊 Checking progress...');
  const progressRes = await fetchWithCookies(`${BASE_URL}/api/puzzle/progress`);
  const progress = await progressRes.json();
  console.log('Progress:', progress);
}

main().catch(console.error);
