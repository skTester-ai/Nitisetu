const fs = require('fs');

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

let i18nContent = fs.readFileSync('src/i18n.js', 'utf8');

// Inject english
{
  const matchStr = `  en: {\n    translation: {`;
  const idx = i18nContent.indexOf(matchStr);
  if (idx !== -1) {
    const endIdx = i18nContent.indexOf('    }', idx);
    let block = i18nContent.substring(idx, endIdx);
    for (const [k, v] of Object.entries(englishDict)) {
      if (!block.includes(`"${k}":`)) {
        block = block.replace(/,?\s*$/, '') + `,\n      "${k}": "${v.replace(/"/g, '\\"')}"`;
      }
    }
    i18nContent = i18nContent.substring(0, idx) + block + i18nContent.substring(endIdx);
  }
}

fs.writeFileSync('src/i18n.js', i18nContent, 'utf8');
console.log('Saved english dict to i18n.js');
