import fs from 'fs';

// ── Get Groq API key from backend .env ──
const envFile = fs.readFileSync('../backend/.env', 'utf8');
const match1 = envFile.match(/^GROQ_API_KEY=(.*)$/m);

const apiKeys = match1 ? [match1[1].trim()] : [];

if (apiKeys.length === 0) { console.error("No GROQ_API_KEY found in ../backend/.env"); process.exit(1); }
let currentKeyIdx = 0;

// ── Read current i18n.js and extract English keys ──
const i18nRaw = fs.readFileSync('src/i18n.js', 'utf8');
const englishDict = {};
const rx = /"(\w+)":\s*"([^"]*)"/g;
let m;
// Only extract from English block
const enStart = i18nRaw.indexOf('en: {');
const enEnd = i18nRaw.indexOf('\n  },', enStart);
const enBlock = i18nRaw.substring(enStart, enEnd);
while ((m = rx.exec(enBlock))) englishDict[m[1]] = m[2];
console.log(`Found ${Object.keys(englishDict).length} English keys\n`);

// ── Target languages ──
const languages = {
  hi: 'Hindi', mr: 'Marathi', bn: 'Bengali', te: 'Telugu',
  ta: 'Tamil', gu: 'Gujarati', kn: 'Kannada', ml: 'Malayalam', pa: 'Punjabi'
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Translate using Groq (1 call per language, batches all keys) ──
async function translateBatch(langCode, langName) {
  console.log(`Translating to ${langName} (${langCode})...`);
  
  const prompt = `You are a translator for an Indian agricultural web app called Niti-Setu.
Translate ALL values of this JSON into ${langName}. Keep keys unchanged. Keep it farmer-friendly.
Do NOT translate proper nouns like "Niti-Setu", "PM-KISAN", "PDF", "AI", "Groq", "RAG".
Output ONLY valid JSON, no markdown, no explanation.

${JSON.stringify(englishDict, null, 2)}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKeys[currentKeyIdx]}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    })
  });

  const data = await res.json();
  if (data.error) {
    if (data.error.message.includes('rate limit') || res.status === 429) {
      const err = new Error('RATE_LIMIT');
      err.status = 429;
      throw err;
    }
    throw new Error(data.error.message);
  }
  if (!data.choices?.[0]) throw new Error('No response from Groq');
  
  return JSON.parse(data.choices[0].message.content);
}

// ── Inject translations into i18n.js ──
async function run() {
  let content = fs.readFileSync('src/i18n.js', 'utf8');

  // Filter by CLI args if provided
  const targetLangs = process.argv.slice(2);
  const langs = targetLangs.length > 0
    ? Object.fromEntries(Object.entries(languages).filter(([c]) => targetLangs.includes(c)))
    : languages;

  for (const [code, name] of Object.entries(langs)) {
    try {
      const translated = await translateBatch(code, name);
      console.log(`  Got ${Object.keys(translated).length} translations`);

      // Find language block using regex (handles whitespace variations)
      const blockRx = new RegExp(`(\\s{2}${code}:\\s*\\{\\s*translation:\\s*\\{)[^}]*?(\\n\\s{4}\\})`, 's');
      const blockMatch = content.match(blockRx);
      
      if (!blockMatch) {
        console.warn(`  ⚠ Block for '${code}' not found, skipping`);
        continue;
      }

      // Build new entries
      const entries = Object.entries(translated)
        .map(([k, v]) => `      "${k}": "${String(v).replace(/"/g, '\\"')}"`)
        .join(',\n');

      const newBlock = `${blockMatch[1]}\n${entries}\n    }`;
      content = content.replace(blockMatch[0], newBlock);
      console.log(`  ✓ Injected ${name}`);
      
      // 8s delay between languages to avoid Groq rate limits
      await sleep(8000);
    } catch (e) {
      if (e.status === 429 || e.message === 'RATE_LIMIT') {
        if (apiKeys.length > 1) {
          currentKeyIdx = (currentKeyIdx + 1) % apiKeys.length;
          console.log(`  ⚠ Rate limited. Switched to API key index ${currentKeyIdx}. Retrying...`);
          // Note: we can retry by decrementing the loop, but since it's an object entries loop, 
          // we'll just wait a bit instead and continue. Alternatively, we could wrap the inner call in a while loop.
          // Let's implement a simple retry here for the current language.
          try {
             const retryTranslated = await translateBatch(code, name);
             const entries = Object.entries(retryTranslated).map(([k, v]) => `      "${k}": "${String(v).replace(/"/g, '\\"')}"`).join(',\n');
             
             const blockRx = new RegExp(`(\\s{2}${code}:\\s*\\{\\s*translation:\\s*\\{)[^}]*?(\\n\\s{4}\\})`, 's');
             const blockMatch = content.match(blockRx);
             if (blockMatch) {
               const newBlock = `${blockMatch[1]}\n${entries}\n    }`;
               content = content.replace(blockMatch[0], newBlock);
               console.log(`  ✓ Injected ${name} (after key swap)`);
             }
          } catch(retryErr) {
             console.error(`  ✗ Failed ${name} even after key swap: ${retryErr.message}`);
          }
        } else {
          console.log('  Waiting 60s for rate limit reset...');
          await sleep(60000);
        }
      } else {
        console.error(`  ✗ Failed ${name}: ${e.message}`);
      }
    }
  }

  fs.writeFileSync('src/i18n.js', content, 'utf8');
  console.log('\n✅ Done! Updated src/i18n.js');
}

run();
