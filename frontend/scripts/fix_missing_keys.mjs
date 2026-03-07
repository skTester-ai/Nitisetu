import fs from 'fs';

// These are Dashboard keys used in Dashboard.jsx that do NOT exist in i18n.js
// We need to add them alongside the existing db_* keys
const missingEnglish = {
  "db_welcome": "Welcome to",
  "db_schemes_loaded": "Schemes Loaded",
  "db_farmer_profiles": "Farmer Profiles",
  "db_system_status": "System Status",
  "db_online": "Online",
  "db_offline": "Offline",
  "db_checks_chart": "Eligibility Checks Over Time",
  "db_eligibility_split": "Eligibility Split",
  "db_eligible": "Eligible",
  "db_not_eligible": "Not Eligible",
  "db_top_schemes": "Top Checked Schemes",
  "db_farmer_by_state": "Farmers by State",
  "db_chunks": "Chunks",
  "db_processed": "Processed",
  "db_active": "Active",
  "db_check_title": "Run Eligibility Check",
  "db_check_desc": "Analyze farmer profile against government scheme documents using AI",
  "db_start_check": "Start Check",
  "db_loaded_schemes": "Loaded Schemes",
  "db_no_data": "No data yet",
  "db_no_schemes": "No schemes uploaded yet. Upload PDFs to get started."
};

const missingHindi = {
  "db_welcome": "स्वागत है",
  "db_schemes_loaded": "योजनाएं लोडेड",
  "db_farmer_profiles": "किसान प्रोफ़ाइल",
  "db_system_status": "सिस्टम स्थिति",
  "db_online": "ऑनलाइन",
  "db_offline": "ऑफ़लाइन",
  "db_checks_chart": "समय के साथ पात्रता जांच",
  "db_eligibility_split": "पात्रता विभाजन",
  "db_eligible": "पात्र",
  "db_not_eligible": "अपात्र",
  "db_top_schemes": "सबसे अधिक जांची गई योजनाएं",
  "db_farmer_by_state": "राज्य अनुसार किसान",
  "db_chunks": "चंक",
  "db_processed": "प्रोसेस किया गया",
  "db_active": "सक्रिय",
  "db_check_title": "पात्रता जांच चलाएं",
  "db_check_desc": "AI का उपयोग करके सरकारी योजना दस्तावेजों के विरुद्ध किसान प्रोफ़ाइल का विश्लेषण करें",
  "db_start_check": "जांच शुरू करें",
  "db_loaded_schemes": "लोडेड योजनाएं",
  "db_no_data": "अभी तक कोई डेटा नहीं",
  "db_no_schemes": "अभी तक कोई योजना अपलोड नहीं हुई। शुरू करने के लिए PDF अपलोड करें।"
};

let content = fs.readFileSync('src/i18n.js', 'utf8');

// Find the position just before the English block closing and add keys
const enEntries = Object.entries(missingEnglish)
  .map(([k, v]) => `      "${k}": "${v.replace(/"/g, '\\"')}"`)
  .join(',\n');

// Insert before the English block closing brace
// The English section ends with: "last_key": "value"\n    }\n  },
content = content.replace(
  /("lp_footer_made": "Made with ❤️ in Kolhapur, Maharashtra\.")/,
  (match) => {
    // Check if db_welcome already exists
    if (content.includes('"db_welcome"')) return match;
    return match;
  }
);

// Check if db_welcome already present
if (!content.includes('"db_welcome"')) {
  // Find the closing of English translation block and insert before it
  // Pattern: last key line, then closing } of translation, then closing } of en
  const enClosePattern = /(      "toast_record_deleted": "[^"]*")\n(\s*}\r?\n\s*},)/;
  if (enClosePattern.test(content)) {
    content = content.replace(enClosePattern, `$1,\n${enEntries}\n$2`);
    console.log(`✅ Added ${Object.keys(missingEnglish).length} English keys (after toast_record_deleted)`);
  } else {
    // Try alternate: look for the real last key before English close
    // Find }  },  hi: pattern
    const altPattern = /("lp_footer_made": "[^"]*"(?:,\n[\s\S]*?)?)\n(\s*}\r?\n\s*},\r?\n\s*hi:)/;
    if (altPattern.test(content)) {
      // Find the actual last line before the close brace
      const match = content.match(/^([\s\S]*)(      "[^"]+": "[^"]*")\n(\s*}\r?\n\s*},\r?\n\s*hi:)/m);
      if (match) {
        const insertPos = content.lastIndexOf(match[2]) + match[2].length;
        content = content.slice(0, insertPos) + ',\n' + enEntries + content.slice(insertPos);
        console.log(`✅ Added ${Object.keys(missingEnglish).length} English keys (before hi:)`);
      }
    }
  }
}

// Do the same for Hindi
if (!content.includes('"db_welcome": "स्वागत')) {
  const hiEntries = Object.entries(missingHindi)
    .map(([k, v]) => `      "${k}": "${v.replace(/"/g, '\\"')}"`)
    .join(',\n');

  // Find the Hindi section closing - look for last Hindi key before the } },  mr: pattern
  const hiClosePattern = /(      "toast_record_deleted": "[^"]*")\n(\s*}\r?\n\s*},\r?\n\s*mr:)/;
  if (hiClosePattern.test(content)) {
    content = content.replace(hiClosePattern, `$1,\n${hiEntries}\n$2`);
    console.log(`✅ Added ${Object.keys(missingHindi).length} Hindi keys (after toast_record_deleted)`);
  } else {
    // Try to find the last Hindi key before closing
    const hiRegex = /^([\s\S]*)(      "[^"]+": "[^"]*")\n(\s*}\r?\n\s*},\r?\n\s*mr:)/m;
    const hiMatch = content.match(hiRegex);
    if (hiMatch) {
      // Find the correct position in the Hindi section (not English)
      const markerIdx = content.indexOf('\n  mr:');
      if (markerIdx > 0) {
        // Search backwards from mr: for the last key
        const hiBlock = content.substring(0, markerIdx);
        const lastKeyMatch = hiBlock.match(/(      "[^"]+": "[^"]*")\n(\s*}\r?\n\s*},)\s*$/);
        if (lastKeyMatch) {
          const insertPos = hiBlock.lastIndexOf(lastKeyMatch[1]) + lastKeyMatch[1].length;
          content = content.slice(0, insertPos) + ',\n' + hiEntries + content.slice(insertPos);
          console.log(`✅ Added ${Object.keys(missingHindi).length} Hindi keys (before mr:)`);
        }
      }
    }
  }
}

fs.writeFileSync('src/i18n.js', content, 'utf8');
console.log('Done.');
