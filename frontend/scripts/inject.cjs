const fs = require('fs');
let content = fs.readFileSync('src/i18n.js', 'utf8');

const additions = {
  en: {
    'db_welcome': 'Welcome to', 'db_subtitle': 'Voice-powered scheme eligibility engine — AI meets agricultural policy', 'db_schemes_loaded': 'Schemes Loaded', 'db_total_checks': 'Total Eligibility Checks', 'db_farmer_profiles': 'Farmer Profiles', 'db_system_status': 'System Status', 'db_online': 'Online', 'db_offline': 'Offline', 'db_no_data': 'No data available'
  },
  hi: {
    'db_welcome': 'में आपका स्वागत है', 'db_subtitle': 'वॉयस-पावर्ड योजना पात्रता इंजन — एआई और कृषि नीति का मिलन', 'db_schemes_loaded': 'योजनाएं लोड की गईं', 'db_total_checks': 'कुल पात्रता जांच', 'db_farmer_profiles': 'किसान प्रोफाइल', 'db_system_status': 'सिस्टम स्थिति', 'db_online': 'ऑनलाइन', 'db_offline': 'ऑफ़लाइन', 'db_no_data': 'कोई डेटा उपलब्ध नहीं है'
  },
  mr: {
    'db_welcome': 'येथे आपले स्वागत आहे', 'db_subtitle': 'व्हॉइस-पॉवर्ड योजना पात्रता इंजिन — एआय आणि कृषी धोरणाचा संगम', 'db_schemes_loaded': 'योजना लोड केल्या', 'db_total_checks': 'एकूण पात्रता तपासणी', 'db_farmer_profiles': 'शेतकरी प्रोफाइल', 'db_system_status': 'सिस्टम स्थिती', 'db_online': 'ऑनलाइन', 'db_offline': 'ऑफलाइन', 'db_no_data': 'कोणताही डेटा उपलब्ध नाही'
  },
  bn: {
    'db_welcome': 'স্বাগতম', 'db_subtitle': 'ভয়েস-চালিত স্কিম যোগ্যতা ইঞ্জিন — এআই এবং কৃষি নীতির মিলন', 'db_schemes_loaded': 'স্কিম লোড করা হয়েছে', 'db_total_checks': 'মোট যোগ্যতা যাচাই', 'db_farmer_profiles': 'কৃষক প্রোফাইল', 'db_system_status': 'সিস্টেম স্থিতি', 'db_online': 'অনলাইন', 'db_offline': 'অফলাইন', 'db_no_data': 'কোনো ডেটা উপলব্ধ নেই'
  },
  te: {
    'db_welcome': 'స్వాగతం', 'db_subtitle': 'వాయిస్-పవర్డ్ స్కీమ్ ఎలిజిబిలిటీ ఇంజిన్ — AI మరియు వ్యవసాయ విధానం కలయిక', 'db_schemes_loaded': 'పథకాలు లోడ్ చేయబడ్డాయి', 'db_total_checks': 'మొత్తం అర్హత తనిఖీలు', 'db_farmer_profiles': 'రైతు ప్రొఫైల్స్', 'db_system_status': 'సిస్టమ్ స్థితి', 'db_online': 'ఆన్‌లైన్', 'db_offline': 'ఆఫ్‌లైన్', 'db_no_data': 'డేటా అందుబాటులో లేదు'
  },
  ta: {
    'db_welcome': 'வரவேற்கிறோம்', 'db_subtitle': 'குரல்-இயங்கும் திட்ட தகுதி இயந்திரம் — AI மற்றும் விவசாயக் கொள்கை சந்திப்பு', 'db_schemes_loaded': 'திட்டங்கள் ஏற்றப்பட்டன', 'db_total_checks': 'மொத்த தகுதி சரிபார்ப்புகள்', 'db_farmer_profiles': 'விவசாயி விவரக்குறிப்புகள்', 'db_system_status': 'கணினி நிலை', 'db_online': 'ஆன்லைன்', 'db_offline': 'ஆஃப்லைன்', 'db_no_data': 'தரவு கிடைக்கவில்லை'
  },
  gu: {
    'app_name_suffix': '-સેતુ', 'sb_dashboard': 'ડેશબોર્ડ', 'sb_eligibility_check': 'પાત્રતા તપાસ', 'sb_schemes': 'યોજનાઓ', 'sb_farmers': 'ખેડૂતો', 'sb_history': 'ઇતિહાસ', 'sb_settings': 'સેટિંગ્સ', 'sb_admin': 'વહીવટકર્તા', 'sb_farmer': 'ખેડૂત પોર્ટલ', 'sb_logout': 'લૉગ આઉટ', 'sb_light_mode': 'લાઇટ મોડ', 'sb_dark_mode': 'ડાર્ક મોડ', 'sb_system_online': 'સિસ્ટમ ઑનલાઇન',
    'db_welcome': 'સ્વાગત છે', 'db_subtitle': 'વૉઇસ-સંચાલિત યોજના પાત્રતા એન્જિન — AI અને કૃષિ નીતિનો સંગમ', 'db_schemes_loaded': 'યોજનાઓ લોડ કરવામાં આવી', 'db_total_checks': 'કુલ પાત્રતા ચકાસણી', 'db_farmer_profiles': 'ખેડૂત પ્રોફાઇલ્સ', 'db_system_status': 'સિસ્ટમ સ્થિતિ', 'db_online': 'ઑનલાઇન', 'db_offline': 'ઑફલાઇન', 'db_no_data': 'કોઈ ડેટા ઉપલબ્ધ નથી'
  },
  kn: {
    'app_name_suffix': '-ಸೇತು', 'sb_dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'sb_eligibility_check': 'ಅರ್ಹತೆ ತಪಾಸಣೆ', 'sb_schemes': 'ಯೋಜನೆಗಳು', 'sb_farmers': 'ರೈತರು', 'sb_history': 'ಇತಿಹಾಸ', 'sb_settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'sb_admin': 'ಆಡಳಿತಗಾರ', 'sb_farmer': 'ರೈತ ಪೋರ್ಟಲ್', 'sb_logout': 'ಲಾಗ್ ಔಟ್', 'sb_light_mode': 'ಲೈಟ್ ಮೋಡ್', 'sb_dark_mode': 'ಡಾರ್ಕ್ ಮೋಡ್', 'sb_system_online': 'ಸಿಸ್ಟಮ್ ಆನ್‌ಲೈನ್',
    'db_welcome': 'ಸ್ವಾಗತ', 'db_subtitle': 'ಧ್ವನಿ-ಚಾಲಿತ ಯೋಜನೆ ಅರ್ಹತಾ ಎಂಜಿನ್ — AI ಮತ್ತು ಕೃಷಿ ನೀತಿಯ ಸಂಗಮ', 'db_schemes_loaded': 'ಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಿದೆ', 'db_total_checks': 'ಒಟ್ಟು ಅರ್ಹತಾ ತಪಾಸಣೆ', 'db_farmer_profiles': 'ರೈತರ ಪ್ರೊಫೈಲ್‌ಗಳು', 'db_system_status': 'ಸಿಸ್ಟಮ್ ಸ್ಥಿತಿ', 'db_online': 'ಆನ್‌ಲೈನ್', 'db_offline': 'ಆಫ್‌ಲೈನ್', 'db_no_data': 'ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ'
  },
  ml: {
    'app_name_suffix': '-സേതു', 'sb_dashboard': 'ഡാഷ്‌ബോർഡ്', 'sb_eligibility_check': 'അർഹതാ പരിശോധന', 'sb_schemes': 'സ്കീമുകൾ', 'sb_farmers': 'കർഷകർ', 'sb_history': 'ചരിത്രം', 'sb_settings': 'ക്രമീകരണങ്ങൾ', 'sb_admin': 'അഡ്മിനിസ്ട്രേറ്റർ', 'sb_farmer': 'കർഷക പോർട്ടൽ', 'sb_logout': 'ലോഗ് ഔട്ട്', 'sb_light_mode': 'ലൈറ്റ് മോഡ്', 'sb_dark_mode': 'ഡാർക്ക് മോഡ്', 'sb_system_online': 'സിസ്റ്റം ഓൺലൈൻ',
    'db_welcome': 'സ്വാഗതം', 'db_subtitle': 'വോയ്‌സ് പവർ സ്കീം യോഗ്യതാ എഞ്ചിൻ — AI, കാർഷിക നയം എന്നിവ കണ്ടുമുട്ടുന്നു', 'db_schemes_loaded': 'സ്കീമുകൾ ലോഡ് ചെയ്തു', 'db_total_checks': 'മൊത്തം യോഗ്യതാ പരിശോധനകൾ', 'db_farmer_profiles': 'കർഷക പ്രൊഫൈലുകൾ', 'db_system_status': 'സിസ്റ്റം അവസ്ഥ', 'db_online': 'ഓൺലൈൻ', 'db_offline': 'ഓഫ്‌ലൈൻ', 'db_no_data': 'ഡാറ്റ ലഭ്യമല്ല'
  },
  pa: {
    'app_name_suffix': '-ਸੇਤੂ', 'sb_dashboard': 'ਡੈਸ਼ਬੋਰਡ', 'sb_eligibility_check': 'ਯੋਗਤਾ ਜਾਂਚ', 'sb_schemes': 'ਸਕੀਮਾਂ', 'sb_farmers': 'ਕਿਸਾਨ', 'sb_history': 'ਇਤਿਹਾਸ', 'sb_settings': 'ਸੈਟਿੰਗਾਂ', 'sb_admin': 'ਪ੍ਰਸ਼ਾਸਕ', 'sb_farmer': 'ਕਿਸਾਨ ਪੋਰਟਲ', 'sb_logout': 'ਲਾਗ ਆਉਟ', 'sb_light_mode': 'ਲਾਈਟ ਮੋਡ', 'sb_dark_mode': 'ਡਾਰਕ ਮੋਡ', 'sb_system_online': 'ਸਿਸਟਮ ਆਨਲਾਈਨ',
    'db_welcome': 'ਜੀ ਆਇਆਂ ਨੂੰ', 'db_subtitle': 'ਆਵਾਜ਼-ਸੰਚਾਲਿਤ ਸਕੀਮ ਯੋਗਤਾ ਇੰਜਨ — AI ਅਤੇ ਖੇਤੀਬਾੜੀ ਨੀਤੀ ਦਾ ਮੇਲ', 'db_schemes_loaded': 'ਸਕੀਮਾਂ ਲੋਡ ਕੀਤੀਆਂ ਗਈਆਂ', 'db_total_checks': 'ਕੁੱਲ ਯੋਗਤਾ ਜਾਂਚ', 'db_farmer_profiles': 'ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ', 'db_system_status': 'ਸਿਸਟਮ ਸਥਿਤੀ', 'db_online': 'ਆਨਲਾਈਨ', 'db_offline': 'ਆਫਲਾਈਨ', 'db_no_data': 'ਕੋਈ ਡਾਟਾ ਉਪਲਬਧ ਨਹੀਂ'
  }
};

for (const lang in additions) {
  const matchStr = `  ${lang}: {\n    translation: {`;
  const idx = content.indexOf(matchStr);
  if (idx !== -1) {
    const endIdx = content.indexOf('    }', idx);
    let block = content.substring(idx, endIdx);
    
    // Check what is missing and append
    for (const [k, v] of Object.entries(additions[lang])) {
      if (!block.includes(`"${k}":`)) {
        block = block.replace(/,?\s*$/, '') + `,\n      "${k}": "${v}"`;
      }
    }
    content = content.substring(0, idx) + block + content.substring(endIdx);
  }
}
fs.writeFileSync('src/i18n.js', content, 'utf8');
console.log('Successfully injected translations!');
