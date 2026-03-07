import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync('../backend/.env', 'utf8');
const match1 = envFile.match(/^GROQ_API_KEY=(.*)$/m);

const apiKeys = match1 ? [match1[1].trim()] : [];

if (apiKeys.length === 0) {
  console.error("No GROQ_API_KEY found in ../backend/.env");
  process.exit(1);
}
let currentKeyIdx = 0;

const englishDict = {
  // Register
  "reg_title": "Create Account", "reg_subtitle": "Farmer Registration", "reg_name": "Full Name",
  "reg_name_ph": "Enter your name", "reg_btn": "Register", "reg_btn_loading": "Registering...",
  "reg_or": "OR", "reg_have_account": "Already have an account?", "reg_signin_link": "Sign In here",
  
  // Elements reused in other spaces
  "cm_state": "State", "cm_state_ph": "e.g., Maharashtra", "cm_land": "Land Area (Acres)",
  "cm_category": "Social Category", "cm_general": "General", "cm_obc": "OBC", "cm_scst": "SC/ST",
  "cm_income": "Annual Income (₹)", "cm_crop": "Primary Crop", "cm_search": "Search...",

  // Eligibility Check
  "ec_title": "Eligibility Check", "ec_subtitle": "Voice or form input → AI-powered eligibility analysis with PDF citations",
  "ec_select_scheme": "Select Government Scheme", "ec_choose_scheme": "— Choose a scheme —",
  "ec_all_schemes": "Check all available schemes simultaneously", "ec_scan_results": "Comprehensive Scan Results",
  "ec_schemes_analyzed": "Schemes Analyzed",

  // Profile Form
  "pf_title": "Farmer Profile", "pf_subtitle": "Provide details for accurate scheme matching",
  "pf_btn": "Check Eligibility", "pf_btn_loading": "Analyzing...",

  // Schemes
  "sh_title": "Government Schemes", "sh_subtitle": "Manage and monitor all active agricultural schemes",
  "sh_add_new": "Add New Scheme", "sh_upload_pdf": "Upload Scheme PDF",
  "sh_upload_desc": "PDF will be parsed and vectorized for AI retrieval", "sh_name": "Scheme Name",
  "sh_name_ph": "e.g., PM-KISAN", "sh_cat_income": "Income Support", "sh_cat_infra": "Infrastructure",
  "sh_cat_energy": "Energy/Irrigation", "sh_cat_other": "Other", "sh_desc": "Brief Description",
  "sh_file": "PDF Document", "sh_btn_upload": "Upload & Process", "sh_btn_uploading": "Processing...",
  "sh_empty": "No schemes found matching your search.", "sh_tbl_name": "Scheme Name",
  "sh_tbl_category": "Category", "sh_tbl_chunks": "Chunks", "sh_tbl_status": "Status",
  "sh_tbl_actions": "Actions", "sh_active": "Active",

  // Farmers
  "fm_title": "Registered Farmers", "fm_subtitle": "Manage farmer profiles and demographic data",
  "fm_search_ph": "Search by name or state...", "fm_tbl_name": "Name", "fm_tbl_loc": "Location",
  "fm_tbl_land": "Land (Acres)", "fm_tbl_cat": "Category", "fm_tbl_crop": "Primary Crop",
  "fm_tbl_checks": "Checks", "fm_empty": "No farmers found matching your search.",

  // History
  "hs_title": "Platform History", "hs_subtitle": "System-wide record of all eligibility checks",
  "hs_empty": "No history records found.", "hs_tbl_farmer": "Farmer", "hs_tbl_scheme": "Scheme Checked",
  "hs_tbl_result": "Result", "hs_tbl_conf": "Confidence", "hs_tbl_date": "Date",
  "hs_eligible": "Eligible", "hs_not_eligible": "Not Eligible",

  // Settings
  "st_title": "Platform Settings", "st_subtitle": "Manage your application preferences and configurations",
  "st_profile": "Profile Information", "st_role": "Role", "st_appearance": "Appearance",
  "st_theme": "Theme Preference", "st_language": "Language", "st_save": "Save Changes",

  // Voice Input
  "vi_title": "Voice Input", "vi_subtitle": "Speak your details and our AI will extract them automatically",
  "vi_start": "Start Recording", "vi_stop": "Stop Recording", "vi_processing": "Processing Audio...",
  "vi_listening": "Listening...", "vi_transcript": "Transcript:"
};

const languages = {
  'kn': 'Kannada'
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function translate(langCode, langName) {
  console.log(`Translating to ${langName} (${langCode})...`);
  
  // Split dictionary into chunks of 15 to avoid max tokens issues on 8b model
  const entries = Object.entries(englishDict);
  const chunkSize = 15;
  const chunkedDicts = [];
  for (let i = 0; i < entries.length; i += chunkSize) {
    chunkedDicts.push(Object.fromEntries(entries.slice(i, i + chunkSize)));
  }

  let finalTranslated = {};

  for (let c = 0; c < chunkedDicts.length; c++) {
    const chunk = chunkedDicts[c];
    console.log(`  Translating chunk ${c + 1}/${chunkedDicts.length} for ${langName}...`);
    
    const prompt = `You are an expert translator specializing in Indian agricultural platforms.
Translate the values of the following JSON object seamlessly into ${langName}. 
Maintain the farmer-friendly tone. Never change the JSON keys.
Output ONLY a strictly valid JSON object without markdown formatting, code blocks, or explanations.
Input JSON:
${JSON.stringify(chunk, null, 2)}`;

    let chunkSuccess = false;
    let chunkAttempts = 0;
    while (!chunkSuccess && chunkAttempts < 3) {
      chunkAttempts++;
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKeys[currentKeyIdx]}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 8000,
            response_format: { type: "json_object" }
          })
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            const err = new Error('RATE_LIMIT');
            err.status = 429;
            throw err;
          }
          throw new Error(`Groq failed for ${langCode}: ` + JSON.stringify(data));
        }
        if (!data.choices || data.choices.length === 0) {
          throw new Error(`Groq failed for ${langCode}: ` + JSON.stringify(data));
        }

        const contentStr = data.choices[0].message.content;
        const parsedChunk = JSON.parse(contentStr);
        finalTranslated = { ...finalTranslated, ...parsedChunk };
        chunkSuccess = true;
        await delay(2000); 
      } catch (e) {
        if (e.status === 429 || e.message === 'RATE_LIMIT') {
          if (apiKeys.length > 1) {
             currentKeyIdx = (currentKeyIdx + 1) % apiKeys.length;
             console.log(`    ⚠ Rate limited on chunk ${c+1}. Switched to API key index ${currentKeyIdx}. Retrying...`);
          } else {
             console.log(`    ⚠ Rate limited on chunk ${c+1}. Waiting 60s...`);
             await delay(60000);
          }
        } else {
          console.error(`  ✗ Failed chunk ${c+1}:`, e.message);
          if (chunkAttempts >= 3) throw e;
        }
      }
    }
  }

  return finalTranslated;
}

async function run() {
  let i18nContent = fs.readFileSync('src/i18n.js', 'utf8');

  for (const [code, name] of Object.entries(languages)) {
    let success = false;
    let attempts = 0;
    while (!success && attempts < 3) {
      attempts++;
      try {
        const translated = await translate(code, name);
      const matchStr = `  ${code}: {\n    translation: {`;
      const idx = i18nContent.indexOf(matchStr);
      if (idx !== -1) {
        let endIdx = i18nContent.indexOf('    }', idx);
        let block = i18nContent.substring(idx, endIdx);
        
        for (const [k, v] of Object.entries(translated)) {
          if (!block.includes(`"${k}":`)) {
            // safely escape things like "Don't" => "Don't" inside standard JSON double quotes
            const safeVal = v.replace(/"/g, '\\"');
            block = block.replace(/,?\s*$/, '') + `,\n      "${k}": "${safeVal}"`;
          }
        }
        i18nContent = i18nContent.substring(0, idx) + block + i18nContent.substring(endIdx);
      }
        console.log(`Successfully injected ${name}`);
        success = true;
        await delay(2000); // 2 second pause per language to respect Groq rate limiting
      } catch (e) {
        if (e.status === 429 || e.message === 'RATE_LIMIT') {
          if (apiKeys.length > 1) {
             currentKeyIdx = (currentKeyIdx + 1) % apiKeys.length;
             console.log(`  ⚠ Rate limited. Switched to API key index ${currentKeyIdx}. Retrying...`);
          } else {
             console.log(`  ⚠ Rate limited. Waiting 60s...`);
             await delay(60000);
          }
        } else {
          console.error(`Failed ${name}:`, e.message);
          break; // break retry loop for non rate limit errors
        }
      }
    }
  }

  // Write back to file
  fs.writeFileSync('src/i18n.js', i18nContent, 'utf8');
  console.log('All done. Wrote src/i18n.js');
}

run();
