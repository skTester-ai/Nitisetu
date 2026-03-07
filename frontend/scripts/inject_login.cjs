const fs = require('fs');
let content = fs.readFileSync('src/i18n.js', 'utf8');

const additions = {
  en: {
    'login_title': 'Welcome Back', 'login_subtitle': 'Sign in to Niti-Setu Engine', 'login_email': 'Email Address', 'login_email_ph': 'Enter your email', 'login_password': 'Password', 'login_password_ph': 'Enter your password', 'login_authenticating': 'Authenticating...', 'login_forgot': 'Forgot your password?', 'login_no_account': "Don't have an account?"
  },
  hi: {
    'login_title': 'वापसी पर स्वागत है', 'login_subtitle': 'नीति-सेतु इंजन में साइन इन करें', 'login_email': 'ईमेल पता', 'login_email_ph': 'अपना ईमेल दर्ज करें', 'login_password': 'पासवर्ड', 'login_password_ph': 'अपना पासवर्ड दर्ज करें', 'login_authenticating': 'प्रमाणित किया जा रहा है...', 'login_forgot': 'अपना पासवर्ड भूल गए?', 'login_no_account': 'खाता नहीं है?'
  },
  mr: {
    'login_title': 'परत स्वागत आहे', 'login_subtitle': 'नीती-सेतू इंजिनमध्ये साइन इन करा', 'login_email': 'ईमेल पत्ता', 'login_email_ph': 'तुमचा ईमेल प्रविष्ट करा', 'login_password': 'पासवर्ड', 'login_password_ph': 'तुमचा पासवर्ड प्रविष्ट करा', 'login_authenticating': 'प्रमाणीकरण करत आहे...', 'login_forgot': 'तुमचा पासवर्ड विसरलात?', 'login_no_account': 'खाते नाही?'
  },
  bn: {
    'login_title': 'ফিরে আসার জন্য স্বাগতম', 'login_subtitle': 'নীতি-সেতু ইঞ্জিনে সাইন ইন করুন', 'login_email': 'ইমেইল ঠিকানা', 'login_email_ph': 'আপনার ইমেইল লিখুন', 'login_password': 'পাসওয়ার্ড', 'login_password_ph': 'আপনার পাসওয়ার্ড লিখুন', 'login_authenticating': 'প্রমাণীকরণ করা হচ্ছে...', 'login_forgot': 'আপনার পাসওয়ার্ড ভুলে গেছেন?', 'login_no_account': 'কোনো অ্যাকাউন্ট নেই?'
  },
  te: {
    'login_title': 'తిరిగి స్వాగతం', 'login_subtitle': 'నీతి-సేతు ఇంజిన్‌కి సైన్ ఇన్ చేయండి', 'login_email': 'ఈమెయిల్ చిరునామా', 'login_email_ph': 'మీ ఈమెయిల్‌ను నమోదు చేయండి', 'login_password': 'పాస్‌వర్డ్', 'login_password_ph': 'మీ పాస్‌వర్డ్‌ను నమోదు చేయండి', 'login_authenticating': 'ప్రామాణీకరిస్తోంది...', 'login_forgot': 'మీ పాస్‌వర్డ్ మర్చిపోయారా?', 'login_no_account': 'ఖాతా లేదా?'
  },
  ta: {
    'login_title': 'மீண்டும் வருக', 'login_subtitle': 'நீதி-சேது இயந்திரத்தில் உள்நுழையவும்', 'login_email': 'மின்னஞ்சல் முகவரி', 'login_email_ph': 'உங்கள் மின்னஞ்சலை உள்ளிடவும்', 'login_password': 'கடவுச்சொல்', 'login_password_ph': 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்', 'login_authenticating': 'அங்கீகரிக்கப்படுகிறது...', 'login_forgot': 'உங்கள் கடவுச்சொல்லை மறந்துவிட்டீர்களா?', 'login_no_account': 'கணக்கு இல்லையா?'
  },
  gu: {
    'login_title': 'પરત સ્વાગત છે', 'login_subtitle': 'નીતિ-સેતુ એન્જિનમાં સાઇન ઇન કરો', 'login_email': 'ઇમેઇલ સરનામું', 'login_email_ph': 'તમારું ઇમેઇલ દાખલ કરો', 'login_password': 'પાસવર્ડ', 'login_password_ph': 'તમારો પાસવર્ડ દાખલ કરો', 'login_authenticating': 'પ્રમાણિત કરી રહ્યું છે...', 'login_forgot': 'તમારો પાસવર્ડ ભૂલી ગયા છો?', 'login_no_account': 'ખાતું નથી?'
  },
  kn: {
    'login_title': 'ಮತ್ತೆ ಸ್ವಾಗತ', 'login_subtitle': 'ನೀತಿ-ಸೇತು ಎಂಜಿನ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ', 'login_email': 'ಇಮೇಲ್ ವಿಳಾಸ', 'login_email_ph': 'ನಿಮ್ಮ ಇಮೇಲ್ ಅನ್ನು ನಮೂದಿಸಿ', 'login_password': 'ಪಾಸ್‌ವರ್ಡ್', 'login_password_ph': 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ನಮೂದಿಸಿ', 'login_authenticating': 'ಪ್ರಮಾಣೀಕರಿಸಲಾಗುತ್ತಿದೆ...', 'login_forgot': 'ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರುವಿರಾ?', 'login_no_account': 'ಖಾತೆ ಇಲ್ಲವೇ?'
  },
  ml: {
    'login_title': 'തിരികെ സ്വാഗതം', 'login_subtitle': 'നീതി-സേതു എഞ്ചിനിൽ സൈൻ ഇൻ ചെയ്യുക', 'login_email': 'ഇമെയിൽ വിലാസം', 'login_email_ph': 'നിങ്ങളുടെ ഇമെയിൽ നൽകുക', 'login_password': 'പാസ്‌വേഡ്', 'login_password_ph': 'നിങ്ങളുടെ പാസ്‌വേഡ് നൽകുക', 'login_authenticating': 'സാക്ഷ്യപ്പെടുത്തുന്നു...', 'login_forgot': 'നിങ്ങളുടെ പാസ്‌വേഡ് മറന്നുപോയോ?', 'login_no_account': 'അക്കൗണ്ട് ഇല്ലേ?'
  },
  pa: {
    'login_title': 'ਵਾਪਸੀ ਤੇ ਸਵਾਗਤ ਹੈ', 'login_subtitle': 'ਨੀਤੀ-ਸੇਤੂ ਇੰਜਨ ਵਿੱਚ ਸਾਈਨ ਇਨ ਕਰੋ', 'login_email': 'ਈਮੇਲ ਪਤਾ', 'login_email_ph': 'ਆਪਣੀ ਈਮੇਲ ਦਰਜ ਕਰੋ', 'login_password': 'ਪਾਸਵਰਡ', 'login_password_ph': 'ਆਪਣਾ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ', 'login_authenticating': 'ਪ੍ਰਮਾਣਿਤ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ...', 'login_forgot': 'ਆਪਣਾ ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?', 'login_no_account': 'ਖਾਤਾ ਨਹੀਂ ਹੈ?'
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
        block = block.replace(/,?\s*$/, '') + `,\n      "${k}": "${v.replace(/"/g, '\\"')}"`;
      }
    }
    content = content.substring(0, idx) + block + content.substring(endIdx);
  }
}
fs.writeFileSync('src/i18n.js', content, 'utf8');
console.log('Successfully injected auth translations!');
