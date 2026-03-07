import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import {
  Mic, MicOff, Search, User, MapPin, Ruler, Sprout, Shield, Wallet,
  Droplets, CheckCircle2, XCircle, AlertCircle, FileText, ChevronDown,
  Loader2, Sparkles, Quote, ClipboardList, Clock, Globe, Download, Volume2, VolumeX, Brain, Plus, ExternalLink
} from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useAuth } from '../context/AuthContext';
import { getSchemes, createProfile, updateProfile, checkEligibility, checkEligibilityPublic, generateSpeech, translateResult } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AgriCard from '../components/common/AgriCard';
import DocumentScanner from '../components/farmers/DocumentScanner';
import { CATEGORY_LINKS } from '../services/categoryService';

const STATE_DIALECT_MAPPING = {
  "Maharashtra": [
    { value: "Standard", label: "Standard (Neutral)" },
    { value: "Kolhapur", label: "Kolhapur (Western Marathi)" },
    { value: "Vidarbha", label: "Vidarbha (Varhadi)" },
    { value: "Marathwada", label: "Marathwada" },
    { value: "Konkan", label: "Konkan (Malvani)" },
    { value: "Khandesh", label: "Khandesh (Ahirani)" }
  ],
  "Uttar Pradesh": [
    { value: "Standard", label: "Standard (Neutral)" },
    { value: "Bhojpuri", label: "Bhojpuri Region" },
    { value: "Awadhi", label: "Awadhi Region" },
    { value: "Braj", label: "Braj Bhasha Region" }
  ],
  "Gujarat": [
    { value: "Standard", label: "Standard (Neutral)" },
    { value: "Saurashtra", label: "Saurashtra" },
    { value: "Kutch", label: "Kutch" }
  ],
  "Andhra Pradesh": [
    { value: "Standard", label: "Standard (Neutral)" },
    { value: "Rayalaseema", label: "Rayalaseema" },
    { value: "Coastal", label: "Coastal Andhra" }
  ],
  "Bihar": [
    { value: "Standard", label: "Standard (Neutral)" },
    { value: "Magahi", label: "Magahi Region" },
    { value: "Maithili", label: "Maithili Region" }
  ],
  "Punjab": [
    { value: "Standard", label: "Standard (Neutral)" },
    { value: "Malwa", label: "Malwa Region" },
    { value: "Majha", label: "Majha Region" },
    { value: "Doaba", label: "Doaba Region" }
  ]
};

const indianStates = {
  // ── 28 States ────────────────────────────
  "Andhra Pradesh": ["Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya", "Bapatla", "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur", "Kakinada", "Kurnool", "Nandyal", "NTR", "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "Y.S.R. Kadapa"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Itanagar Capital Complex", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  "Assam": ["Bajali", "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tamulpur", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran (Motihari)", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur (Bhabua)", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger (Monghyr)", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia (Purnea)", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada (South Bastar)", "Dhamtari", "Durg", "Gariyaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham (Kawardha)", "Kanker (North Bastar)", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Niwari", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahilyanagar (Ahmednagar)", "Akola", "Amravati", "Chhatrapati Sambhajinagar", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Dharashiv (Osmanabad)", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
  "Nagaland": ["Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyu", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghapur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar (Keonjhar)", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur (Sonepur)", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar", "Nawanshahr (Shahid Bhagat Singh Nagar)", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Anoopgarh", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur", "Didwana-Kuchaman", "Dudu", "Dungarpur", "Gangapurcity", "Hanumangarh", "Jaipur Rural", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur Rural", "Jodhpur", "Karauli", "Kekri", "Khairthal-Tijara", "Kota", "Kotputli-Behror", "Nagaur", "Neem Ka Thana", "Pali", "Phalodi", "Pratapgarh", "Rajsamand", "Salumbar", "Sanchore", "Sawai Madhopur", "Shahpura", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim (Gangtok)", "North Sikkim (Mangan)", "Pakyong", "Soreng", "South Sikkim (Namchi)", "West Sikkim (Gyalshing)"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi (Chatrapati Sahuji Mahraj Nagar)", "Amroha (J.P. Nagar)", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur (Panchsheel Nagar)", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar (Padrauna)", "Lakhimpur - Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal (Bhim Nagar)", "Sant Kabir Nagar", "Shahjahanpur", "Shamali (Prabuddh Nagar)", "Shravasti", "Siddharth Nagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],

  // ── 8 Union Territories ──────────────────
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

/* ── Voice Input Section ────────────────── */
function VoiceInput({ onProfileExtracted }) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'hi-IN');
  const { isListening, transcript, error: voiceError, startListening, stopListening } = useVoice(selectedLanguage);
  const [processing, setProcessing] = useState(false);
  const { addToast } = useToast();

  // Sync state if user changes global app language
  useEffect(() => {
    setSelectedLanguage(i18n.language || 'hi-IN');
  }, [i18n.language]);

  const handleStop = async () => {
    setProcessing(true);
    try {
      const profile = await stopListening();
      if (profile) {
        onProfileExtracted(profile);
        addToast('Voice Processed', 'Extracted farmer profile from audio source', 'success');
      }
    } catch (e) {
      console.error('Voice processing error:', e);
      addToast('Voice Processing Failed', e.message || 'Could not infer profile from audio', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ padding: '28px', marginBottom: '24px' }}
        padding="28px"
      >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Mic size={20} style={{ color: 'var(--accent-indigo)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('vi_title')}</h3>
        <span className="badge badge-info">{t('vi_ai_powered')}</span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        {t('vi_desc_ph')} <em>"{t('vi_desc_example')}"</em>
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Language Selector for Voice */}
        <select 
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={isListening || processing}
          className="select-dark"
          style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.9rem', maxWidth: '200px' }}
        >
          <option value="en">English</option>
          <option value="hi-IN">Hindi (हिंदी)</option>
          <option value="mr-IN">Marathi (मराठी)</option>
          <option value="bn-IN">Bengali (বাংলা)</option>
          <option value="te-IN">Telugu (తెలుగు)</option>
          <option value="ta-IN">Tamil (தமிழ்)</option>
          <option value="gu-IN">Gujarati (ગુજરાતી)</option>
          <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
          <option value="ml-IN">Malayalam (മലയാളം)</option>
          <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
        </select>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={isListening ? handleStop : startListening}
          disabled={processing}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
            background: isListening ? 'rgba(244, 63, 94, 0.15)' : 'var(--gradient-primary)',
            color: isListening ? 'var(--accent-rose)' : 'white',
            boxShadow: isListening ? 'none' : '0 4px 15px rgba(99, 102, 241, 0.3)',
            opacity: processing ? 0.7 : 1,
          }}
        >
          {processing ? (
            <><Loader2 size={18} className="spin" /> {t('vi_processing')}</>
          ) : isListening ? (
            <><MicOff size={18} /> {t('vi_stop')}</>
          ) : (
            <><Mic size={18} /> {t('vi_start')}</>
          )}
        </motion.button>
      </div>

      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
        >
          <div className="pulse-dot" style={{ background: 'var(--accent-rose)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 500 }}>{t('vi_listening')}</span>
        </motion.div>
      )}

      {transcript && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            padding: '16px', borderRadius: '12px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>{t('vi_transcript').toUpperCase()}</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{transcript}</p>
        </motion.div>
      )}

      {voiceError && (
        <p style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', marginTop: '8px' }}>
          <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> {voiceError}
        </p>
      )}
      </AgriCard>
  );
}

/* ── Profile Form ───────────────────────── */
function ProfileForm({ initialData, onSubmit, loading, allSchemes = [], selectedScheme = '', selectedCategory = '' }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: '', age: '', state: '', district: '', landHolding: '',
    cropType: '', category: 'General', annualIncome: '', hasIrrigationAccess: false,
    gender: 'Male', hasBPLCard: false, ownershipType: 'Owner', hasKcc: false, isDifferentlyAbled: false, hasAadharSeededBank: false,
    activeSchemes: [], subRegion: '', primaryIncomeSource: 'Agriculture', isFarmerRelated: true
  });

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSchemeName, setCustomSchemeName] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Sync with initial data (e.g., from voice or scanner)
  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        // Ensure numbers are handled
        age: initialData.age || prev.age,
        landHolding: initialData.landHolding || prev.landHolding,
        annualIncome: initialData.annualIncome || prev.annualIncome,
      }));
      if (initialData.activeSchemes && initialData.activeSchemes.length > 0) {
        setIsEnrolled(true);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'state') {
        updated.district = '';
        updated.subRegion = (STATE_DIALECT_MAPPING[value] && STATE_DIALECT_MAPPING[value].length > 0) 
          ? STATE_DIALECT_MAPPING[value][0].value 
          : '';
      }
      return updated;
    });
  };

  const toggleScheme = (schemeName) => {
    setForm(prev => {
      const current = prev.activeSchemes || [];
      const updated = current.includes(schemeName)
        ? current.filter(s => s !== schemeName)
        : [...current, schemeName];
      return { ...prev, activeSchemes: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      age: parseInt(form.age) || null,
      landHolding: parseFloat(form.landHolding) || 0,
      annualIncome: parseInt(form.annualIncome) || 0,
    });
  };

  const displaySchemes = allSchemes.filter(s => !selectedCategory || s.category === selectedCategory);

  return (
    <form onSubmit={handleSubmit}>
      <AgriCard
        animate={true}
        transition={{ delay: 0.1 }}
        className="agri-card"
        style={{ padding: '28px', marginBottom: '24px' }}
        padding="28px"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <User size={20} style={{ color: 'var(--accent-violet)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('pf_title')}</h3>
        </div>

        {/* Top 12 Main Parameters - Perfectly Balanced Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={labelStyle}><User size={14} /> {t('reg_name')}</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Ramesh Patil" className="input-dark" required />
          </div>
          <div>
            <label style={labelStyle}><User size={14} /> {t('cm_age')}</label>
            <input name="age" type="number" min="18" max="120" value={form.age} onChange={handleChange} placeholder="e.g. 35" className="input-dark" required />
          </div>
          
          <div>
            <label style={labelStyle}><MapPin size={14} /> {t('cm_state')}</label>
            <select name="state" value={form.state} onChange={handleChange} className="select-dark" required>
              <option value="">{t('cm_search')}</option>
              {Object.keys(indianStates).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}><MapPin size={14} /> {t('cm_district')}</label>
            <select name="district" value={form.district} onChange={handleChange} className="select-dark" disabled={!form.state} required>
              <option value="">{t('cm_district_ph')}</option>
              {form.state && indianStates[form.state] && indianStates[form.state].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}><MapPin size={14} /> {t('pf_sub_region', 'Sub-Region (Dialect)')}</label>
            <select name="subRegion" value={form.subRegion} onChange={handleChange} className="select-dark">
              <option value="">{t('pf_select_subregion', 'Standard (Neutral)')}</option>
              {form.state && STATE_DIALECT_MAPPING[form.state] && STATE_DIALECT_MAPPING[form.state].map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
              {!form.state && <option value="disabled" disabled>Select state first</option>}
            </select>
          </div>
          <div>
            <label style={labelStyle}><Ruler size={14} /> {t('cm_land')}</label>
            <input name="landHolding" type="number" step="0.1" value={form.landHolding} onChange={handleChange} placeholder="e.g. 2.5" className="input-dark" required />
          </div>

          <div>
            <label style={labelStyle}><Sprout size={14} /> {t('cm_crop')}</label>
            <input name="cropType" value={form.cropType} onChange={handleChange} placeholder="e.g. Wheat, Rice" className="input-dark" required />
          </div>
          <div>
            <label style={labelStyle}><Wallet size={14} /> {t('pf_primary_income')}</label>
            <select name="primaryIncomeSource" value={form.primaryIncomeSource} onChange={handleChange} className="select-dark">
              <option value="Agriculture">{t('pf_inc_agri')}</option>
              <option value="Dairy">{t('pf_inc_dairy')}</option>
              <option value="Poultry">{t('pf_inc_poultry')}</option>
              <option value="Fisheries">{t('pf_inc_fisheries')}</option>
              <option value="Horticulture">{t('pf_inc_horti')}</option>
              <option value="Other">{t('pf_inc_other')}</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}><Shield size={14} /> {t('cm_category')}</label>
            <select name="category" value={form.category} onChange={handleChange} className="select-dark">
              <option value="General">{t('cm_general')}</option>
              <option value="EWS">{t('cm_ews')}</option>
              <option value="OBC">{t('cm_obc')}</option>
              <option value="SC">{t('cm_scst')}</option>
              <option value="ST">{t('cm_scst')}</option>
              <option value="Minority">{t('cm_minority')}</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}><Wallet size={14} /> {t('cm_income')}</label>
            <input name="annualIncome" type="number" value={form.annualIncome} onChange={handleChange} placeholder="e.g. 200000" className="input-dark" />
          </div>

          <div>
            <label style={labelStyle}><User size={14} /> {t('pf_gender')}</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="select-dark">
              <option value="Male">{t('pf_male')}</option>
              <option value="Female">{t('pf_female')}</option>
              <option value="Other">{t('pf_other')}</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}><MapPin size={14} /> {t('pf_ownership_type')}</label>
            <select name="ownershipType" value={form.ownershipType} onChange={handleChange} className="select-dark">
              <option value="Owner">{t('pf_owner')}</option>
              <option value="Tenant/Sharecropper">{t('pf_tenant')}</option>
              <option value="Co-owner">{t('pf_coowner')}</option>
            </select>
          </div>
        </div>

        {/* 6 Identity & Eligibility Checkboxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="isFarmerRelated" checked={form.isFarmerRelated} onChange={handleChange} style={checkboxStyle} />
            <span><User size={14} style={iconGapStyle} /> {t('pf_farmer_confirm')}</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="hasIrrigationAccess" checked={form.hasIrrigationAccess} onChange={handleChange} style={checkboxStyle} />
            <span><Droplets size={14} style={iconGapStyle} /> {t('cm_has_irrigation')}</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="hasBPLCard" checked={form.hasBPLCard} onChange={handleChange} style={checkboxStyle} />
            <span><FileText size={14} style={iconGapStyle} /> {t('pf_bpl_card')}</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="hasKcc" checked={form.hasKcc} onChange={handleChange} style={checkboxStyle} />
            <span><Wallet size={14} style={iconGapStyle} /> {t('pf_kcc_owner')}</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="isDifferentlyAbled" checked={form.isDifferentlyAbled} onChange={handleChange} style={checkboxStyle} />
            <span><User size={14} style={iconGapStyle} /> {t('pf_divyangjan')}</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" name="hasAadharSeededBank" checked={form.hasAadharSeededBank} onChange={handleChange} style={checkboxStyle} />
            <span><CheckCircle2 size={14} style={iconGapStyle} /> {t('pf_aadhar_seeded')}</span>
          </label>
        </div>

        {/* Existing Enrollments Section */}
        <div style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-glass)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEnrolled ? '16px' : '0' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              <Shield size={16} style={{ color: 'var(--accent-indigo)' }} /> 
              Are you already enrolled in any related <b>{selectedCategory ? selectedCategory.replace(/_/g, ' ') : 'government'}</b> schemes?
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsEnrolled(true);
                  if (!form.activeSchemes || form.activeSchemes.length === 0) {
                    setForm(prev => ({ ...prev, activeSchemes: displaySchemes.map(s => s.name) }));
                  }
                }}
                className={`tab-btn ${isEnrolled ? 'active' : ''}`}
                style={{
                  padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  background: isEnrolled ? 'var(--accent-indigo)' : 'var(--bg-glass)',
                  color: isEnrolled ? 'var(--bg-primary)' : 'var(--text-secondary)',
                  border: `1px solid ${isEnrolled ? 'var(--accent-indigo)' : 'var(--border-glass)'}`,
                }}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEnrolled(false);
                  setForm(prev => ({ ...prev, activeSchemes: [] }));
                }}
                style={{
                  padding: '4px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                  background: !isEnrolled ? 'var(--accent-rose)' : 'var(--bg-glass)',
                  color: !isEnrolled ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${!isEnrolled ? 'var(--accent-rose)' : 'var(--border-glass)'}`,
                }}
              >
                No
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isEnrolled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '16px', borderTop: '1px dashed var(--border-glass)' }}>
                  {displaySchemes.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('pf_no_schemes_found')}</p>
                  ) : (
                    displaySchemes.map(s => (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => toggleScheme(s.name)}
                        style={{
                          padding: '6px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          background: form.activeSchemes?.includes(s.name) ? 'var(--accent-indigo)' : 'var(--bg-glass)',
                          color: form.activeSchemes?.includes(s.name) ? 'var(--bg-primary)' : 'var(--text-secondary)',
                          border: `1px solid ${form.activeSchemes?.includes(s.name) ? 'var(--accent-indigo)' : 'var(--border-glass)'}`
                        }}
                      >
                        {s.name}
                      </button>
                    ))
                  )}
                  
                  {form.activeSchemes?.filter(s => !displaySchemes.some(as => as.name === s)).map(customName => (
                    <button
                      key={customName}
                      type="button"
                      onClick={() => setForm({ ...form, activeSchemes: form.activeSchemes.filter(s => s !== customName) })}
                      style={{
                        padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'var(--accent-indigo)', color: 'var(--bg-primary)', border: '1px solid var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {customName} <X size={12} />
                    </button>
                  ))}

                  {!showCustomInput && (
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      style={{
                        padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'var(--bg-glass)', color: 'var(--accent-indigo)', border: '1px dashed var(--accent-indigo)'
                      }}
                    >
                      <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} /> {t('pf_not_listed')}
                    </button>
                  )}
                </div>

                {showCustomInput && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <input type="text" value={customSchemeName} onChange={(e) => setCustomSchemeName(e.target.value)} placeholder={t('pf_enter_scheme_ph')} className="input-dark" style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }} />
                    <button type="button" onClick={() => { if (customSchemeName.trim()) { setForm({ ...form, activeSchemes: [...new Set([...(form.activeSchemes || []), customSchemeName.trim()])] }); setCustomSchemeName(''); setShowCustomInput(false); } }} className="btn-glow" style={{ padding: '8px 16px', fontSize: '0.8rem' }}> {t('pf_add')} </button>
                    <button type="button" onClick={() => { setShowCustomInput(false); setCustomSchemeName(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}> Cancel </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="btn-glow"
          disabled={loading}
          style={{ marginTop: '32px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }}
        >
          {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
          {loading ? t('pf_btn_loading') : t('pf_btn')}
        </motion.button>
      </AgriCard>
    </form>
  );
}

const checkboxLabelStyle = {
  display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
  fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)'
};
const checkboxStyle = { width: '18px', height: '18px', accentColor: 'var(--accent-indigo)' };
const iconGapStyle = { display: 'inline', marginRight: '4px' };

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)',
  marginBottom: '8px',
};

/* ── Proof Card (Result) ────────────────── */
function ProofCard({ result }) {
  // ── Hooks (must be declared before any state that uses them) ──
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioObj, setAudioObj] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedResult, setTranslatedResult] = useState(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [translateLabel, setTranslateLabel] = useState('Translate');
  // Tracks which language the displayed result is in (for audio generation)
  // Initialised as 'en'; updated whenever the user picks a language from the dropdown
  const [speechLang, setSpeechLang] = useState('en');
  // Per-card in-memory cache: { 'hi': {...result}, 'mr': {...result} }
  const translationCache = useRef({});
  // Per-card audio URL cache: { 'en::PM-KISAN': 'blob:...', 'hi::PM-KISAN': 'blob:...' }
  const audioCache = useRef({});

  const displayResult = translatedResult || result;


  useEffect(() => {
    return () => {
      if (audioObj) {
        audioObj.pause();
        audioObj.currentTime = 0;
      }
    };
  }, [audioObj]);

  const handleDownload = async () => {
    setIsDownloading(true);
    addToast('Generating PDF', 'Preparing your Eligibility Proof Card...', 'info');
    try {
      const element = document.getElementById(`proof-card-${result.scheme.replace(/\s+/g, '-')}`);
      if (!element) return;
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${result.scheme.replace(/\s+/g, '_')}_Eligibility.pdf`);
      addToast('Download Complete', 'Your PDF has been saved successfully', 'success');
    } catch (error) {
      console.error('PDF Generation Failed:', error);
      addToast('Export Failed', 'Could not generate PDF card', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTranslate = async (lang, label) => {
    setShowLangMenu(false);
    if (!lang || lang === 'en') {
        setTranslatedResult(null);
        setTranslateLabel('Translate');
        setSpeechLang(i18n?.language?.split('-')[0] || 'en'); // reset to app language
        return;
    }

    setTranslateLabel(label);
    const langCode = lang.split('-')[0];
    setSpeechLang(langCode); // <-- audio will now speak in this language

    // ──  Cache hit: serve instantly, no API call ──
    if (translationCache.current[langCode]) {
        setTranslatedResult(translationCache.current[langCode]);
        addToast('Loaded from cache', `Showing cached ${label} translation`, 'success');
        return;
    }

    // ── Cache miss: call backend, then store result ──
    setIsTranslating(true);
    addToast('Translating', 'Translating result into your language...', 'info');
    try {
        const res = await translateResult(result, langCode);
        if (res.success) {
            translationCache.current[langCode] = res.data; // store in cache
            setTranslatedResult(res.data);
            addToast('Success', 'AI Analysis translated successfully', 'success');
        }
    } catch (err) {
        console.error('Translation failed:', err);
        addToast('Translation Error', 'Could not translate the results', 'error');
    } finally {
        setIsTranslating(false);
    }
  };

  const LANG_OPTIONS = [
    { value: 'en',    label: 'English (Original)' },
    { value: 'hi-IN', label: 'Hindi (हिंदी)' },
    { value: 'mr-IN', label: 'Marathi (मराठी)' },
    { value: 'bn-IN', label: 'Bengali (বাংলা)' },
    { value: 'te-IN', label: 'Telugu (తెలుగు)' },
    { value: 'ta-IN', label: 'Tamil (தமிழ்)' },
    { value: 'gu-IN', label: 'Gujarati (ગુજરાતી)' },
    { value: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
    { value: 'ml-IN', label: 'Malayalam (മലയാളം)' },
    { value: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)' },
    { value: 'or-IN', label: 'Odia (ଓଡ଼ିଆ)' },
    { value: 'as-IN', label: 'Assamese (অসমীয়া)' },
    { value: 'ur',    label: 'Urdu (اردو)' },
  ];

  const toggleSpeech = async () => {
    if (isSpeaking) {
      if (audioObj) {
        audioObj.pause();
        audioObj.currentTime = 0;
      }
      setIsSpeaking(false);
      addToast(t('sb_history'), 'Voice analysis paused', 'info');
    } else {
      setIsSpeaking(true);
      const textToSpeak = `AI Analysis regarding ${displayResult.scheme}. ${displayResult.reason}`;
      // Use the language that the card is currently DISPLAYING in, not the global app language
      const langCode = speechLang;
      const cacheKey = `${langCode}::${result.scheme}`;

      try {
        let url;

        // ── Audio cache hit: no API call, instant playback ──
        if (audioCache.current[cacheKey]) {
          url = audioCache.current[cacheKey];
        } else {
          // ── Audio cache miss: fetch from ElevenLabs, then cache URL ──
          addToast(t('sb_history'), 'Fetching high-quality AI voice...', 'info');
          const audioBlob = await generateSpeech(textToSpeak, langCode);
          url = URL.createObjectURL(audioBlob);
          audioCache.current[cacheKey] = url;
        }

        const audio = new Audio(url);
        setAudioObj(audio);
        
        audio.onended = () => {
          setIsSpeaking(false);
          setAudioObj(null);
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          setAudioObj(null);
          addToast('Audio Error', 'Could not play generated audio', 'error');
        }
        
        await audio.play();
      } catch (err) {
        console.error("Speech generation error", err);
        addToast('Audio Error', 'Failed to fetch natural voice', 'error');
        setIsSpeaking(false);
      }
    }
  };

  if (displayResult.error) {
    return (
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ padding: '24px', marginBottom: '16px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)' }}
        padding="24px"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <AlertCircle size={24} style={{ color: 'var(--accent-rose)' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{displayResult.scheme}</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{displayResult.error}</p>
      </AgriCard>
    );
  }

  const isEligible = displayResult.eligible;
  const reqDocs = Array.isArray(displayResult.requiredDocuments) ? displayResult.requiredDocuments : (typeof displayResult.requiredDocuments === 'string' ? [displayResult.requiredDocuments] : []);

  return (
    <motion.div
      id={`proof-card-${displayResult.scheme.replace(/\s+/g, '-')}`}
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{ marginBottom: '24px' }}
    >
      {/* 1. Header Banner & Verification Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, delay: 0.1 }}
            style={{
              width: '72px', height: '72px', borderRadius: '22px',
              background: isEligible ? 'var(--gradient-success)' : 'var(--gradient-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isEligible ? '0 12px 32px rgba(16,185,129,0.35)' : '0 12px 32px rgba(244,63,94,0.35)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            {isEligible ? <CheckCircle2 size={36} color="white" /> : <XCircle size={36} color="white" />}
          </motion.div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', color: isEligible ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {isEligible ? t('pc_eligible') : t('pc_not_eligible')}
              </h2>
              <div style={{ padding: '4px 10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '20px', border: '1px solid var(--border-agri)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Shield size={12} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-emerald)', letterSpacing: '0.05em' }}>Verified by RAG</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{displayResult.scheme}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {t('pc_confidence')}: <strong style={{ color: 'var(--text-primary)' }}>{displayResult.confidence.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-glass"
            data-html2canvas-ignore="true"
            style={{ padding: '12px 20px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}
          >
            {isDownloading ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
            {isDownloading ? t('pc_exporting') : t('pc_download_pdf')}
          </motion.button>
        </div>
      </div>

      {/* 2. AI Decision Summary */}
      <div className="agri-card" style={{ padding: '24px 28px', marginBottom: '20px', borderTop: '4px solid', borderTopColor: isEligible ? 'var(--accent-emerald)' : 'var(--accent-rose)', background: 'var(--bg-card)', overflow: 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Brain size={18} style={{ color: isEligible ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
          <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pc_ai_analysis')}</h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 500, margin: 0, lineHeight: 1.7, flex: 1, minWidth: '200px' }}>
            {displayResult.reason}
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            {/* Custom Translate Dropdown */}
            <div style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowLangMenu(v => !v)}
                disabled={isTranslating}
                data-html2canvas-ignore="true"
                style={{
                  background: translatedResult ? 'rgba(139,92,246,0.15)' : 'var(--bg-secondary)',
                  color: translatedResult ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  border: `1px solid ${translatedResult ? 'var(--accent-violet)' : 'var(--border-color)'}`,
                  padding: '8px 14px', borderRadius: '20px',
                  fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                  cursor: isTranslating ? 'not-allowed' : 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}
              >
                {isTranslating ? <Loader2 size={14} className="spin" /> : <Globe size={14} />}
                {isTranslating ? t('pf_btn_loading') : translateLabel}
                {!isTranslating && <ChevronDown size={12} style={{ opacity: 0.6, transform: showLangMenu ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />}
              </motion.button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, zIndex: 9999,
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                      minWidth: '200px', backdropFilter: 'blur(20px)'
                    }}
                  >
                    {LANG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleTranslate(opt.value, opt.label)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '10px 16px', background: 'transparent',
                          color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 500,
                          border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                          borderBottom: '1px solid var(--border-color)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isSpeaking && (
               <div className="waveform" style={{ marginRight: '8px' }}>
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="waveform-bar" style={{ background: 'var(--accent-indigo)' }}></div>
                 ))}
               </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleSpeech}
              data-html2canvas-ignore="true"
              style={{ 
                background: isSpeaking ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
                color: isSpeaking ? 'white' : 'var(--accent-indigo)',
                border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '20px',
                fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
              }}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isSpeaking ? t('pc_stop_audio') : t('pc_listen')}
            </motion.button>
          </div>
        </div>
      </div>

      {/* 3. Details Grid (Amount & Documents) */}
      <div style={{ display: 'grid', gridTemplateColumns: (isEligible && displayResult.benefitAmount) ? 'minmax(250px, 1fr) 2fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Benefit Amount Widget */}
        {isEligible && displayResult.benefitAmount && (
          <div style={{ 
            padding: '32px', borderRadius: '24px', 
            background: 'var(--gradient-success)', 
            boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.15, transform: 'rotate(-10deg)' }}>
              <Brain size={160} color="white" />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginBottom: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('pc_benefit_amount')}</p>
              <h3 style={{ fontSize: '3rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1 }}>
                {String(displayResult.benefitAmount).startsWith('₹') ? displayResult.benefitAmount : `₹${displayResult.benefitAmount}`}
              </h3>
              {displayResult.paymentFrequency && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Clock size={14} color="white" />
                  <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{displayResult.paymentFrequency}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Required Documents Card — always show if available */}
        {reqDocs.length > 0 && (
          <div className="agri-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ClipboardList size={18} style={{ color: 'var(--accent-amber)' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('pc_required_docs')}</h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                {reqDocs.length} {t('pc_items')}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
              {reqDocs.map((doc, i) => {
                const isCategoryCert = /caste|obc|sc\/st|ews|minority|ncl|creamy/i.test(doc);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: isCategoryCert ? 'rgba(245,158,11,0.06)' : 'var(--bg-secondary)', borderRadius: '10px', border: `1px solid ${isCategoryCert ? 'rgba(245,158,11,0.2)' : 'var(--border-color)'}` }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: isCategoryCert ? 'rgba(245,158,11,0.15)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isCategoryCert ? 'rgba(245,158,11,0.3)' : 'var(--border-color)'}`, flexShrink: 0 }}>
                      {isCategoryCert
                        ? <Shield size={12} style={{ color: 'var(--accent-amber)' }} />
                        : <FileText size={12} style={{ color: 'var(--accent-indigo)' }} />
                      }
                    </div>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{doc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Citation Box */}
      {displayResult.citation && (
        <div style={{ padding: '20px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Quote size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('pc_citation_title')}</h4>
          </div>
          <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px 10px', paddingLeft: '12px', borderLeft: '3px solid var(--accent-cyan)' }}>
            "{displayResult.citation}"
          </p>
          {displayResult.citationSource && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '10px' }}>
              {displayResult.citationSource.page && (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                  {t('pc_page')} {displayResult.citationSource.page}
                </span>
              )}
              {displayResult.citationSource.section && (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                  {t('pc_sect')} {displayResult.citationSource.section}
                </span>
              )}
              {displayResult.citationSource.paragraph && (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                  {t('pc_para')} {displayResult.citationSource.paragraph}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. System Latency & Performance (Requested) */}
      <div style={{ 
        marginTop: '20px', padding: '16px 20px', borderRadius: '16px', 
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        display: 'flex', flexDirection: 'column', gap: '12px'
      }} data-html2canvas-ignore="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              System Performance Metrics
            </h5>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            ⚡ Optimized RAG Pipeline
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <LatencyItem 
            label="Total RAG Latency" 
            value={`${(displayResult.latencies?.total || 0) / 1000}s`} 
            icon={<Brain size={12} />} 
            color="var(--accent-indigo)"
          />
          <LatencyItem 
            label="LLM (Groq API)" 
            value={`${(displayResult.latencies?.llm || 0) / 1000}s`} 
            icon={<Sparkles size={12} />} 
            color="var(--accent-violet)"
          />
          <LatencyItem 
            label="Vector Search" 
            value={`${(displayResult.latencies?.vectorSearch || 0) / 1000}s`} 
            icon={<Search size={12} />} 
            color="var(--accent-cyan)"
          />
          <LatencyItem 
            label="Embeddings" 
            value={`${(displayResult.latencies?.embedding || 0) / 1000}s`} 
            icon={<Ruler size={12} />} 
            color="var(--accent-emerald)"
          />
          {displayResult.latencies?.graph > 0 && (
            <LatencyItem 
              label="Graph Logic" 
              value={`${(displayResult.latencies?.graph || 0) / 1000}s`} 
              icon={<Shield size={12} />} 
              color="var(--accent-amber)"
            />
          )}
        </div>
      </div>

      {/* 4. High-Priority Action Section */}
      <div style={{ 
        marginTop: '32px', padding: '24px', borderRadius: '20px', 
        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
        display: 'flex', flexDirection: 'column', gap: '20px'
      }} data-html2canvas-ignore="true">
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} style={{ color: 'var(--accent-indigo)' }} /> Primary Access & Official Resources
        </h4>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Always Priority: Official Website */}
          {displayResult.officialWebsite && displayResult.officialWebsite !== 'null' ? (
            <motion.a 
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              href={displayResult.officialWebsite.startsWith('http') ? displayResult.officialWebsite : `https://${displayResult.officialWebsite}`} 
              target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 32px', background: 'var(--gradient-primary)', color: 'white', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', boxShadow: '0 8px 24px rgba(16, 163, 74, 0.4)', transition: 'all 0.2s', flex: 1, minWidth: '240px', justifyContent: 'center' }}
            >
              <ExternalLink size={20} /> {t('pc_official_website')}
            </motion.a>
          ) : (
             <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={CATEGORY_LINKS[displayResult.category] || CATEGORY_LINKS['other']} 
              target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 32px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', borderRadius: '16px', fontWeight: 700, fontSize: '1rem', border: '1px solid var(--border-glass)', transition: 'all 0.2s', flex: 1, minWidth: '240px', justifyContent: 'center' }}
            >
              <ExternalLink size={20} /> Access Official Portal
            </motion.a>
          )}

          {/* Official Documents / Guidelines */}
          {displayResult.documentUrl && (
            <motion.a 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={displayResult.documentUrl} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 32px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', borderRadius: '16px', fontWeight: 600, fontSize: '1rem', border: '1px solid var(--border-glass)', transition: 'all 0.2s', flex: 1, minWidth: '240px', justifyContent: 'center' }}
            >
              <FileText size={20} /> {t('pc_view_official_docs') || 'Download Official Guidelines'}
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Helper component for latency items
 */
function LatencyItem({ label, value, icon, color }) {
  return (
    <div style={{ 
      padding: '10px 14px', borderRadius: '12px', background: 'var(--bg-secondary)', 
      border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      </div>
      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}


/* ── Main Page ──────────────────────────── */
export default function EligibilityCheck() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user } = useAuth();
  const [schemes, setSchemes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('');
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publicChecksUsed, setPublicChecksUsed] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    getSchemes().then((s) => setSchemes(s.data || [])).catch(console.error);
    
    // Load public check counter from local storage
    if (!user) {
      const used = parseInt(localStorage.getItem('niti_setu_public_checks') || '0', 10);
      setPublicChecksUsed(used);
    }
  }, [user]);

  const handleCheck = async (profileData) => {
    if (!selectedScheme) {
      addToast(t('us_error_title'), 'Please select a scheme from the dropdown first', 'warning');
      return;
    }

    // Limit check for unauthenticated users
    if (!user && publicChecksUsed >= 1) {
      addToast(
        'Limit Reached', 
        'You have used your 1 free public check. Please log in or register to securely save your profile and continue checking.', 
        'warning'
      );
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      if (user) {
        addToast('Profile Update', 'Syncing farmer profile securely...', 'info');
        
        // Update existing profile if it has an ID, else create new
        let profile;
        if (profileData._id) {
          profile = await updateProfile(profileData._id, profileData);
        } else {
          profile = await createProfile(profileData);
        }

        if (!profile.success) throw new Error(profile.error || 'Failed to save profile');

        addToast('AI Scanning', 'Analyzing documents via RAG...', 'info');
        const eligibility = await checkEligibility(profile.data._id, selectedScheme, i18n.language, selectedCategory);
        if (eligibility.success) {
          setResult(eligibility.data);
          
          // Show performance notification
          const data = eligibility.data;
          const perf = Array.isArray(data) ? data[0]?.latencies : data.latencies;
          if (perf) {
            const totalS = (perf.total / 1000).toFixed(2);
            const otherApis = ((perf.graph + perf.llm) / 1000).toFixed(2);
            addToast(
              'Check Complete', 
              `AI analysis finished in ${totalS}s (External APIs: ${otherApis}s)`, 
              'success'
            );
          } else {
            addToast('Check Complete', 'AI analysis finished successfully', 'success');
          }
        } else {
          addToast('Analysis Failed', eligibility.error || 'Eligibility check failed', 'error');
        }
      } else {
        addToast('Fast AI Scan', 'Analyzing criteria...', 'info');
        const eligibility = await checkEligibilityPublic(profileData, selectedScheme, i18n.language, selectedCategory);
        if (eligibility.success) {
          setResult(eligibility.data);
          const newCount = publicChecksUsed + 1;
          setPublicChecksUsed(newCount);
          localStorage.setItem('niti_setu_public_checks', newCount.toString());
          
          // Show performance notification
          const data = eligibility.data;
          const perf = Array.isArray(data) ? data[0]?.latencies : data.latencies;
          if (perf) {
            const totalS = (perf.total / 1000).toFixed(2);
            const otherApis = (perf.llm / 1000).toFixed(2);
            addToast(
              'Check Complete', 
              `Free check used in ${totalS}s (AI Latency: ${otherApis}s)`, 
              'success'
            );
          } else {
            addToast('Check Complete', `Free check used. Please login next time.`, 'success');
          }
        } else {

          if (eligibility.message?.requiresLogin) {
            addToast('Limit Reached', eligibility.error, 'error');
            setPublicChecksUsed(1);
            localStorage.setItem('niti_setu_public_checks', '1');
          } else {
             addToast('Analysis Failed', eligibility.error || 'Eligibility check failed', 'error');
          }
        }
      }
    } catch (e) {
      if (e.response?.data?.error?.includes('maximum number of free checks')) {
         addToast('Limit Reached', e.response.data.error, 'warning');
         setPublicChecksUsed(1);
         localStorage.setItem('niti_setu_public_checks', '1');
      } else {
         addToast('System Error', e.response?.data?.error || e.message || 'Something went wrong', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: user ? '0' : '100px', paddingBottom: '60px' }}>
      <AgriCard
        animate={true}
        className="agri-card"
        style={{ padding: '32px', marginBottom: '24px' }}
        padding="32px"
      >
        <div style={{ marginBottom: '28px', textAlign: user ? 'left' : 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            <Search size={28} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-indigo)', verticalAlign: 'text-bottom' }} />
            {t('ec_title')}
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            {t('ec_subtitle')}
          </p>
          
          {!user && (
            <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Shield size={14} style={{ color: 'var(--accent-indigo)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', fontWeight: 600 }}>{t('guest_mode')} {1 - publicChecksUsed} {t('free_checks_remaining')}</span>
            </div>
          )}
        </div>

        {/* Scheme Selector */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>
              <FileText size={14} /> Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedScheme(''); }}
              className="select-dark"
              style={{ fontSize: '1rem', fontWeight: 500 }}
            >
              <option value="">-- All Categories --</option>
              {Array.from(new Set(schemes.map(s => s.category)))
                .filter(c => c && c !== 'other')
                .sort()
                .map(c => (
                <option key={c} value={c}>{c.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
              {Array.from(new Set(schemes.map(s => s.category))).includes('other') && (
                <option value="other">OTHER</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>
              <FileText size={14} /> {t('ec_select_scheme')}
            </label>
            <select
              value={selectedScheme}
              onChange={(e) => setSelectedScheme(e.target.value)}
              className="select-dark"
              style={{ fontSize: '1rem', fontWeight: 500 }}
              disabled={!selectedCategory && schemes.length > 0}
            >
              <option value="">{t('ec_choose_scheme')}</option>
              <option value="all">
                🔍 {schemes.length === 0 ? t('db_no_schemes') : `I don't know my scheme — Search all in ${selectedCategory ? selectedCategory.replace('_', ' ') : 'this'} category`}
              </option>
              {schemes
                .filter(s => !selectedCategory || s.category === selectedCategory)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                <option key={s._id} value={s.name}>{s.name} ({s.totalChunks || 0} chunks)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Voice Input */}
        <VoiceInput onProfileExtracted={setVoiceProfile} />

        {/* Phase 4: Document Auto-Scan Vault */}
        <DocumentScanner onDataExtracted={(data) => {
          setVoiceProfile(data); // Re-use the same state to auto-fill the form below
          addToast('Scan Success', 'Form fields auto-filled from document.', 'success');
        }} />

        {/* Profile Form */}
        <ProfileForm 
          initialData={voiceProfile || location.state?.profile} 
          onSubmit={handleCheck} 
          loading={loading} 
          allSchemes={schemes} 
          selectedScheme={selectedScheme}
          selectedCategory={selectedCategory} 
        />

        {/* Result */}
        <AnimatePresence>
          {result && (Array.isArray(result) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={20} color="white" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{t('ec_scan_results')}</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{result.length} {t('ec_schemes_analyzed')}</p>
                </div>
              </div>
              {result.map((r, i) => (
                <div key={i} style={{ 
                  background: 'var(--bg-glass)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '24px', 
                  padding: '32px',
                  position: 'relative',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ 
                    position: 'absolute', top: '-16px', left: '32px', 
                    background: 'var(--bg-primary)', padding: '4px 16px', 
                    borderRadius: '20px', border: '1px solid var(--border-glass)',
                    fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <Shield size={14} style={{ color: r.eligible ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
                    {t('pc_scheme_x_of_y')} {i + 1} {t('pc_of')} {result.length}
                  </div>
                  <ProofCard result={r} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
              <ProofCard result={result} />
            </div>
          ))}
        </AnimatePresence>
      </AgriCard>
    </div>
  );
}
