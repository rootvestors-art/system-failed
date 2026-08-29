/**
 * UI strings for the citizen journey, in English and Hindi.
 *
 * Deliberately a plain object rather than i18next: this is ~90 strings in a
 * project with 8 runtime dependencies, and a library would cost more bundle than
 * the feature is worth.
 *
 * Scope is the journey a citizen actually walks — navigation, home, intake,
 * receipt, tracker. The disclosure page and the memorial remain English-only and
 * say so, rather than pretending to be translated.
 *
 * Hindi here is deliberately plain, spoken Hindi rather than formal/Sanskritised
 * register: "शिकायत" not "परिवाद", "सड़क" not "मार्ग". The point is a citizen who
 * cannot read English can still complete the journey.
 */

export type Lang = 'en' | 'hi'

type Entry = { en: string; hi: string }

export const STRINGS: Record<string, Entry> = {
  // ── Navigation ──────────────────────────────────────────────────────────
  'nav.map': { en: 'Map', hi: 'नक्शा' },
  'nav.track': { en: 'Track', hi: 'स्थिति देखें' },
  'nav.howItWorks': { en: 'How it works', hi: 'यह कैसे काम करता है' },
  'nav.reportedIssues': { en: 'Reported issues', hi: 'दर्ज शिकायतें' },
  'nav.report': { en: 'Report', hi: 'शिकायत करें' },
  'nav.tagline.report': { en: 'Report', hi: 'बताइए' },
  'nav.tagline.route': { en: 'Route', hi: 'विभाग तक' },
  'nav.tagline.resolve': { en: 'Resolve', hi: 'समाधान' },
  'nav.language': { en: 'भाषा / Language', hi: 'भाषा / Language' },

  // ── Home ────────────────────────────────────────────────────────────────
  'home.eyebrow': {
    en: 'Speak or type, in any Indian language',
    hi: 'अपनी भाषा में बोलिए या लिखिए',
  },
  'home.h1': {
    en: 'Report a civic problem in your area',
    hi: 'अपने इलाके की समस्या की शिकायत करें',
  },
  'home.sub': {
    en: "A pothole, an open drain, an exposed live wire, an abandoned pit. Describe it in one sentence and we'll work out which department owns it, write the formal complaint for you, and keep a clock on it until it's fixed.",
    hi: 'गड्ढा, खुला नाला, लटकता बिजली का तार, खुदा हुआ खड्डा। एक वाक्य में बताइए — हम पता लगाएंगे कि यह किस विभाग का काम है, आपकी शिकायत लिखेंगे, और ठीक होने तक समय पर नज़र रखेंगे।',
  },
  'home.cta.report': { en: 'Report an issue', hi: 'शिकायत दर्ज करें' },
  'home.cta.sample': { en: 'Try a sample report', hi: 'नमूना शिकायत देखें' },
  'home.cta.track': { en: 'Track a complaint', hi: 'शिकायत की स्थिति' },
  'home.noLogin': {
    en: 'No login. No personal details required.',
    hi: 'न लॉगिन, न कोई निजी जानकारी।',
  },
  'home.stat.open': { en: 'Open issues', hi: 'खुली शिकायतें' },
  'home.stat.resolved': { en: 'Marked resolved', hi: 'ठीक हो चुकीं' },
  'home.stat.cities': { en: 'Cities covered', hi: 'शहर शामिल' },

  'home.how.title': { en: 'How it works', hi: 'यह कैसे काम करता है' },
  'home.how.sub': {
    en: "Three steps. The parts you'd normally have to figure out yourself are the parts we do for you.",
    hi: 'तीन कदम। जो हिस्सा आपको खुद पता करना पड़ता है, वह हम कर देते हैं।',
  },
  'home.step': { en: 'Step', hi: 'कदम' },
  'home.step1.title': { en: 'Describe it', hi: 'समस्या बताइए' },
  'home.step1.body': {
    en: 'Speak or type one sentence in your own language, and add a photo. No department dropdowns, no forms in English.',
    hi: 'अपनी भाषा में एक वाक्य बोलिए या लिखिए, और फोटो लगाइए। कोई विभाग चुनने की झंझट नहीं, अंग्रेज़ी में फॉर्म नहीं।',
  },
  'home.step2.title': { en: 'We route it', hi: 'हम विभाग तक पहुंचाते हैं' },
  'home.step2.body': {
    en: 'We identify the department that actually owns the problem and draft a formal complaint you can read and correct.',
    hi: 'हम पता लगाते हैं कि यह काम असल में किस विभाग का है, और आपकी शिकायत लिख देते हैं — जिसे आप पढ़ और सुधार सकते हैं।',
  },
  'home.step3.title': { en: 'Track until fixed', hi: 'ठीक होने तक नज़र रखें' },
  'home.step3.body': {
    en: 'You get a reference and a visible deadline. If nobody acts, it escalates up the chain on its own.',
    hi: 'आपको एक नंबर और साफ समय-सीमा मिलती है। कोई कार्रवाई न हो, तो शिकायत खुद ऊपर के अधिकारी तक चली जाती है।',
  },

  'home.recent.title': { en: 'Recently reported', hi: 'हाल की शिकायतें' },
  'home.recent.sub': {
    en: 'Open safety issues flagged by citizens.',
    hi: 'नागरिकों द्वारा बताई गई खुली समस्याएं।',
  },
  'home.recent.empty': {
    en: 'Nothing reported yet. Be the first, it takes under a minute.',
    hi: 'अभी कोई शिकायत नहीं। पहले आप कीजिए — एक मिनट से भी कम लगेगा।',
  },
  'home.viewMap': { en: 'View on map', hi: 'नक्शे पर देखें' },
  'home.seeAll': { en: 'See all reported issues', hi: 'सारी शिकायतें देखें' },

  // ── Report page shell ───────────────────────────────────────────────────
  'report.title': { en: 'Report a civic issue', hi: 'शिकायत दर्ज करें' },
  'report.sub': {
    en: "Tell us what's wrong in your own words. We'll identify the responsible department and prepare the complaint for you to check.",
    hi: 'अपने शब्दों में बताइए क्या दिक्कत है। हम ज़िम्मेदार विभाग पता करेंगे और आपकी शिकायत तैयार कर देंगे — आप बस जांच लीजिए।',
  },

  // ── Hazard categories and severity ──────────────────────────────────────
  //
  // These are the citizen's main choice on the form, so leaving them in English
  // defeated the point of the toggle. Keyed by the stored enum value; the Hindi
  // side uses the words people actually say (गड्ढा, not क्षतिग्रस्त सड़क).
  //
  // `negligenceLabel()` is still the English-only formatter used for share
  // captions and search URLs, which must stay in English regardless of UI
  // language — this dictionary is for display only.
  'type.Pothole': { en: 'Pothole', hi: 'गड्ढा' },
  'type.Street_Light': { en: 'Street Light', hi: 'स्ट्रीट लाइट' },
  'type.Road_Design': { en: 'Road Design', hi: 'सड़क की बनावट' },
  'type.Open_Drain': { en: 'Open Drain', hi: 'खुला नाला' },
  'type.Waterlogging': { en: 'Waterlogging', hi: 'जलभराव' },
  'type.Broken_Footpath': { en: 'Broken Footpath', hi: 'टूटा फुटपाथ' },
  'type.Electrocution': { en: 'Electrocution', hi: 'बिजली का करंट' },
  'type.Open_Pit': { en: 'Open Pit', hi: 'खुला गड्ढा' },
  'type.Collapse': { en: 'Collapse', hi: 'ढह जाना' },
  'type.Debris': { en: 'Debris', hi: 'मलबा' },
  'type.Dangerous_Structure': { en: 'Dangerous Structure', hi: 'जर्जर ढांचा' },
  'type.Garbage_Waste': { en: 'Garbage Waste', hi: 'कूड़ा-कचरा' },
  'type.Water_Leak': { en: 'Water Leak', hi: 'पानी का रिसाव' },
  'type.Other': { en: 'Other', hi: 'अन्य' },

  'severity.Low': { en: 'Low', hi: 'कम' },
  'severity.Medium': { en: 'Medium', hi: 'मध्यम' },
  'severity.High': { en: 'High', hi: 'ज़्यादा' },
  'severity.Critical': { en: 'Critical', hi: 'बहुत गंभीर' },

  // ── Location picker ─────────────────────────────────────────────────────
  'loc.useCurrent': { en: 'Use my current location', hi: 'मेरी मौजूदा जगह लें' },
  'loc.locating': { en: 'Finding you…', hi: 'आपकी जगह पता कर रहे हैं…' },
  'loc.pasteLink': { en: '…or paste a Google Maps link', hi: '…या Google Maps लिंक लगाइए' },
  'loc.go': { en: 'Go', hi: 'लगाओ' },
  'loc.tapHint': {
    en: 'Tap the map to drop a pin, or use one of the options above.',
    hi: 'नक्शे पर टैप कर पिन लगाइए, या ऊपर दिए विकल्पों में से कोई चुनिए।',
  },
  'loc.location': { en: 'Location', hi: 'जगह' },
  'loc.noPin': { en: 'No pin set yet', hi: 'अभी पिन नहीं लगा' },
  'loc.coordinates': { en: 'Coordinates', hi: 'अक्षांश-देशांतर' },
  'loc.movePin': {
    en: 'Not quite right? Tap the map to move the pin.',
    hi: 'ठीक नहीं है? नक्शे पर टैप कर पिन खिसकाइए।',
  },
  'loc.lookingUp': { en: 'Looking up the address…', hi: 'पता खोज रहे हैं…' },
  'loc.approximate': {
    en: 'That link named a place rather than exact coordinates, so this pin is approximate. Tap the exact spot on the map below to correct it.',
    hi: 'उस लिंक में सिर्फ जगह का नाम था, ठीक निर्देशांक नहीं — इसलिए यह पिन अंदाज़न है। नीचे नक्शे पर सही जगह टैप कर इसे ठीक कर लीजिए।',
  },

  // ── Footer ──────────────────────────────────────────────────────────────
  'footer.disclaimer': {
    en: 'An independent prototype built for a hackathon. Not affiliated with or endorsed by any government authority.',
    hi: 'यह हैकाथॉन के लिए बनाया गया एक स्वतंत्र प्रोटोटाइप है। यह किसी सरकारी विभाग से जुड़ा नहीं है और न ही उसके द्वारा मान्य है।',
  },

  // ── Intake ──────────────────────────────────────────────────────────────
  'intake.title': { en: "Just tell us what's wrong", hi: 'बस बताइए क्या दिक्कत है' },
  'intake.sub': {
    en: "Speak or type one sentence in your own language. We'll pick the department, write the formal complaint and fill this form for you.",
    hi: 'अपनी भाषा में एक वाक्य बोलिए या लिखिए। हम विभाग चुनेंगे, शिकायत लिखेंगे और यह फॉर्म भर देंगे।',
  },
  'intake.problemLabel': { en: 'What is the problem?', hi: 'क्या दिक्कत है?' },
  'intake.placeholder': {
    en: 'e.g. Hamare gali mein bada khadda hai, raat mein dikhta nahi, koi gir jayega',
    hi: 'जैसे: हमारी गली में बड़ा गड्ढा है, रात में दिखता नहीं, कोई गिर जाएगा',
  },
  'intake.speak': { en: 'Speak', hi: 'बोलिए' },
  'intake.stop': { en: 'Stop', hi: 'रोकें' },
  'intake.preparing': { en: 'Preparing…', hi: 'तैयार हो रहा है…' },
  'intake.transcribing': { en: 'Transcribing…', hi: 'सुन रहे हैं…' },
  'intake.listening': {
    en: 'Listening — speak now, then tap Stop. Stops on its own after 30 seconds.',
    hi: 'सुन रहे हैं — अब बोलिए, फिर रोकें दबाइए। 30 सेकंड बाद अपने आप रुक जाएगा।',
  },
  'intake.photo': { en: 'Photo (optional)', hi: 'फोटो (ज़रूरी नहीं)' },
  'intake.choosePhoto': { en: 'Take or choose photo', hi: 'फोटो खींचें या चुनें' },
  'intake.changePhoto': { en: 'Change photo', hi: 'फोटो बदलें' },
  'photo.notImage': {
    en: 'That file is not an image. Please choose a photo.',
    hi: 'यह फाइल फोटो नहीं है। कृपया कोई फोटो चुनिए।',
  },
  'photo.tooLarge': {
    en: 'That photo is larger than 10 MB. Please choose a smaller one.',
    hi: 'यह फोटो 10 MB से बड़ी है। कृपया छोटी फोटो चुनिए।',
  },
  'photo.remove': { en: 'Remove photo', hi: 'फोटो हटाएं' },
  'intake.city': { en: 'City', hi: 'शहर' },
  'intake.state': { en: 'State', hi: 'राज्य' },
  'intake.cityLabel': { en: 'Which city?', hi: 'कौन सा शहर?' },
  'intake.cityPlaceholder': { en: 'Choose your city…', hi: 'अपना शहर चुनिए…' },
  'intake.cityOther': { en: 'Somewhere else', hi: 'कोई और जगह' },

  // City names in Devanagari. A citizen who picked Hindi because they cannot read
  // English should not have to read nine city names in English to find their own.
  // Keyed by the stored English value, which stays the routing key.
  'city.Bengaluru': { en: 'Bengaluru', hi: 'बेंगलुरु' },
  'city.Delhi': { en: 'Delhi', hi: 'दिल्ली' },
  'city.Mumbai': { en: 'Mumbai', hi: 'मुंबई' },
  'city.Chennai': { en: 'Chennai', hi: 'चेन्नई' },
  'city.Kolkata': { en: 'Kolkata', hi: 'कोलकाता' },
  'city.Ahmedabad': { en: 'Ahmedabad', hi: 'अहमदाबाद' },
  'city.Gurugram': { en: 'Gurugram', hi: 'गुरुग्राम' },
  'city.Hyderabad': { en: 'Hyderabad', hi: 'हैदराबाद' },
  'city.Pune': { en: 'Pune', hi: 'पुणे' },
  'intake.cityRoutable': {
    en: 'departments mapped',
    hi: 'विभाग पता हैं',
  },
  'intake.cityUnmapped': {
    en: "We haven't mapped departments for this city yet, so the complaint goes to the municipal corporation as a general route.",
    hi: 'इस शहर के विभाग हमने अभी नहीं जोड़े हैं, इसलिए शिकायत नगर निगम को सामान्य रूप से भेजी जाएगी।',
  },
  'intake.submit': { en: 'Write my complaint', hi: 'मेरी शिकायत लिखें' },
  'intake.reading': { en: 'Reading your report…', hi: 'आपकी बात पढ़ रहे हैं…' },
  'intake.manual': { en: "I'll fill the form myself", hi: 'मैं खुद फॉर्म भरूंगा' },
  'intake.needSomething': {
    en: 'Describe the problem in a sentence, or attach a photo.',
    hi: 'एक वाक्य में समस्या बताइए, या फोटो लगाइए।',
  },
  'intake.result.title': { en: "Here's your complaint", hi: 'यह है आपकी शिकायत' },
  'intake.result.hazard': { en: 'Hazard', hi: 'समस्या' },
  'intake.result.severity': { en: 'Severity', hi: 'गंभीरता' },
  'intake.result.language': { en: 'You wrote in', hi: 'आपने लिखा' },
  'intake.result.confidence': { en: 'Confidence', hi: 'भरोसा' },
  // Plain language, not our internal vocabulary. "Suggested first router" is
  // precise but nobody outside this codebase thinks in those terms.
  'intake.result.router': { en: 'Who should fix this', hi: 'यह किसे ठीक करना है' },
  'intake.result.checkDept': {
    en: 'Worth double-checking this one.',
    hi: 'इसे एक बार जांच लेना ठीक रहेगा।',
  },
  'intake.result.alsoResponsible': { en: 'May also be responsible', hi: 'ये भी ज़िम्मेदार हो सकते हैं' },
  'intake.result.complaintText': { en: 'Complaint text', hi: 'शिकायत का मसौदा' },
  'intake.result.worthAdding': { en: 'Worth adding', hi: 'यह भी बताएं तो अच्छा' },
  'intake.result.doFirst': { en: 'Do this first', hi: 'पहले यह कीजिए' },
  // Each action names its own consequence. "Looks right / Redo" left the citizen
  // guessing what either button actually did.
  'intake.result.nextStep': {
    en: "Next you'll check the location and severity, then file it. Nothing is sent yet.",
    hi: 'आगे आप जगह और गंभीरता जांचेंगे, फिर शिकायत दर्ज होगी। अभी कुछ नहीं भेजा गया है।',
  },
  'intake.result.accept': {
    en: 'Yes, use this complaint',
    hi: 'हां, यही शिकायत भेजें',
  },
  'intake.result.redo': {
    en: 'Change what I wrote',
    hi: 'मैंने जो लिखा वह बदलें',
  },
  'intake.result.mocked': { en: 'Mocked — AI not connected', hi: 'नमूना — AI जुड़ा नहीं है' },
  'intake.result.instead': {
    en: 'You would otherwise have had to work this out yourself on',
    hi: 'वरना आपको यह खुद पता करना पड़ता, यहां:',
  },


  // ── Form step ───────────────────────────────────────────────────────────
  'form.prefilled': {
    en: 'Filled in from your description.',
    hi: 'आपकी बात से भर दिया गया है।',
  },
  'form.prefilledMock': {
    en: 'Filled in using offline keyword matching (AI not connected).',
    hi: 'बिना AI, शब्दों के आधार पर भरा गया है।',
  },
  'form.checkEverything': {
    en: "Check every field below and correct anything that's wrong — nothing is submitted until you press the final button.",
    hi: 'नीचे सब कुछ जांच लीजिए और गलत हो तो सुधार दीजिए। आखिरी बटन दबाने तक कुछ नहीं भेजा जाएगा।',
  },
  'form.specifyType': {
    en: 'Specify the type of problem',
    hi: 'बताइए किस तरह की समस्या है',
  },
  'form.hazardDetails': { en: 'Hazard details', hi: 'समस्या का ब्यौरा' },
  'form.locationEvidence': { en: 'Location and evidence', hi: 'जगह और सबूत' },
  'form.severity': { en: 'How serious is it?', hi: 'यह कितनी गंभीर है?' },
  'form.photo': { en: 'Photo evidence', hi: 'फोटो सबूत' },
  'form.location': { en: 'Where is it?', hi: 'यह कहां है?' },
  'form.hazardType': { en: 'What kind of problem is it?', hi: 'यह किस तरह की समस्या है?' },
  'form.description': { en: 'Description', hi: 'ब्यौरा' },
  'form.descriptionPlaceholder': {
    en: 'Describe the problem and why it needs attention…',
    hi: 'बताइए क्या दिक्कत है और इसे ठीक करना क्यों ज़रूरी है…',
  },
  'form.piiHeading': { en: 'Before you file:', hi: 'भेजने से पहले:' },
  'form.piiBody': {
    en: "this report becomes part of a public record. Please don't include Aadhaar or PAN numbers, phone numbers, bank or payment details, or medical information — yours or anyone else's. Check the description above and remove anything personal.",
    hi: 'यह शिकायत सार्वजनिक रिकॉर्ड का हिस्सा बनेगी। कृपया आधार या पैन नंबर, फोन नंबर, बैंक या भुगतान की जानकारी, या किसी की सेहत से जुड़ी बात न लिखें — न अपनी, न किसी और की। ऊपर का ब्यौरा जांच लीजिए।',
  },
  'form.file': { en: 'File complaint', hi: 'शिकायत दर्ज करें' },
  'form.filing': { en: 'Filing…', hi: 'दर्ज हो रही है…' },
  'form.back': { en: 'Back', hi: 'पीछे' },
  'form.next': { en: 'Next', hi: 'आगे' },

  // ── Past-incident path ──────────────────────────────────────────────────
  //
  // Recording an incident that already caused death or injury is a rarer, more
  // sombre task than reporting a hazard, but it was the last part of the journey
  // still in English — which meant a Hindi reader hit a wall exactly where the
  // form asks the most of them.
  'incident.notice': {
    en: 'You are recording an incident that has already caused death or injury, so we ask for a few extra details.',
    hi: 'आप ऐसी घटना दर्ज कर रहे हैं जिसमें किसी की मौत या चोट हुई है, इसलिए हम कुछ और जानकारी पूछ रहे हैं।',
  },
  'incident.notHurt': {
    en: 'No one was hurt — report it as a hazard',
    hi: 'किसी को चोट नहीं आई — इसे समस्या के रूप में दर्ज करें',
  },
  'incident.heading': { en: 'Incident information', hi: 'घटना की जानकारी' },
  'incident.title': { en: 'Incident title', hi: 'घटना का शीर्षक' },
  'incident.titlePlaceholder': {
    en: 'Brief headline describing the incident',
    hi: 'एक पंक्ति में घटना बताइए',
  },
  'incident.titleExample': {
    en: 'Example: "Bank manager falls into uncovered DJB pit"',
    hi: 'जैसे: "बैंक मैनेजर खुले DJB गड्ढे में गिरे"',
  },
  'incident.date': { en: 'Date of incident', hi: 'घटना की तारीख' },
  'incident.descriptionPlaceholder': {
    en: 'What happened? Include details about the negligence…',
    hi: 'क्या हुआ था? लापरवाही की बात भी लिखिए…',
  },
  'incident.victims': { en: 'People affected', hi: 'प्रभावित लोग' },
  'incident.addVictim': { en: 'Add person', hi: 'व्यक्ति जोड़ें' },
  'incident.victim': { en: 'Person', hi: 'व्यक्ति' },
  'incident.name': { en: 'Name (optional if unknown)', hi: 'नाम (पता न हो तो छोड़ दें)' },
  'incident.namePlaceholder': { en: 'Their name', hi: 'उनका नाम' },
  'incident.age': { en: 'Age (optional)', hi: 'उम्र (ज़रूरी नहीं)' },
  'incident.agePlaceholder': { en: 'Age', hi: 'उम्र' },
  'incident.occupationPlaceholder': { en: 'Occupation', hi: 'काम-धंधा' },
  'incident.occupation': { en: 'Occupation (optional)', hi: 'काम-धंधा (ज़रूरी नहीं)' },
  'incident.outcome': { en: 'What happened to them', hi: 'उनके साथ क्या हुआ' },
  'incident.outcome.Death': { en: 'Died', hi: 'मृत्यु' },
  'incident.outcome.Serious_Injury': { en: 'Seriously injured', hi: 'गंभीर चोट' },
  'incident.deptHeading': {
    en: 'Which department was responsible?',
    hi: 'कौन सा विभाग ज़िम्मेदार था?',
  },
  'incident.deptBody': {
    en: 'We worked this out from the location and the type of hazard. Change it only if you know better.',
    hi: 'हमने यह जगह और समस्या के आधार पर तय किया है। आपको ठीक से पता हो तो ही बदलिए।',
  },
  'incident.deptLabel': { en: 'Department', hi: 'विभाग' },
  'incident.deptNote': {
    en: "Elected representatives are recorded by office (your area's MLA and MP), not by name — so there is nothing for you to look up.",
    hi: 'जनप्रतिनिधि पद के नाम से दर्ज होते हैं (आपके क्षेत्र के विधायक और सांसद), किसी व्यक्ति के नाम से नहीं — इसलिए आपको कुछ खोजना नहीं है।',
  },

  // ── Receipt ─────────────────────────────────────────────────────────────
  'receipt.title': { en: 'Complaint filed', hi: 'शिकायत दर्ज हो गई' },
  'receipt.routedTo': { en: 'It has been routed to', hi: 'यह भेजी गई है' },
  'receipt.clockRunning': {
    en: 'and the clock is now running.',
    hi: 'और अब समय की गिनती शुरू हो गई है।',
  },
  'receipt.yourReference': { en: 'Your reference', hi: 'आपका शिकायत नंबर' },
  'receipt.saveThis': {
    en: 'Save this. You can reopen the tracker any time with it.',
    hi: 'इसे सहेज लें। इससे आप कभी भी स्थिति देख सकते हैं।',
  },
  'receipt.track': { en: 'Track this complaint', hi: 'स्थिति देखें' },
  'receipt.viewPublic': { en: 'View public record', hi: 'सार्वजनिक रिकॉर्ड देखें' },

  // ── Tracker / status ────────────────────────────────────────────────────
  'track.progress': { en: 'Progress', hi: 'प्रगति' },
  'track.simulated': { en: 'Simulated', hi: 'नमूना' },
  'track.status': { en: 'Complaint status', hi: 'शिकायत की स्थिति' },
  'track.sittingWith': { en: 'Sitting with', hi: 'अभी इनके पास है' },
  'track.with': { en: 'With', hi: 'इनके पास' },
  'track.markedFixed': { en: 'Marked fixed', hi: 'ठीक हो गई' },
  'track.reportedFixed': { en: 'Reported fixed', hi: 'ठीक बताई गई' },
  'track.exhausted': { en: 'Unresolved at every level', hi: 'हर स्तर पर अनसुनी' },
  'track.chain': { en: 'Chain of accountability', hi: 'ज़िम्मेदारी की कड़ी' },
  'track.fullTimeline': { en: 'Full timeline', hi: 'पूरा ब्यौरा' },
  'track.routedTo': { en: 'Routed to', hi: 'भेजी गई' },
  'track.instead': { en: 'Instead of', hi: 'इसकी जगह' },
  'track.stage.submitted': { en: 'Submitted', hi: 'दर्ज' },
  'track.stage.acknowledged': { en: 'Acknowledged', hi: 'स्वीकार' },
  'track.stage.assigned': { en: 'Assigned', hi: 'सौंपी गई' },
  'track.stage.resolved': { en: 'Resolved', hi: 'ठीक' },

  // Countdown / escalation. Kept as parameterised entries because Hindi word
  // order and pluralisation differ from English — a naive "add an s" fails.
  'track.daysLeft': {
    en: '{n} days left before this escalates automatically.',
    hi: '{n} दिन बाद यह अपने आप ऊपर के अधिकारी को चली जाएगी।',
  },
  'track.dayLeft': {
    en: '1 day left before this escalates automatically.',
    hi: '1 दिन बाद यह अपने आप ऊपर के अधिकारी को चली जाएगी।',
  },
  'track.hoursLeft': {
    en: '{n} hours left before this escalates automatically.',
    hi: '{n} घंटे बाद यह अपने आप ऊपर के अधिकारी को चली जाएगी।',
  },
  'track.hourLeft': {
    en: '1 hour left before this escalates automatically.',
    hi: '1 घंटे बाद यह अपने आप ऊपर के अधिकारी को चली जाएगी।',
  },
  'track.escalatingNow': {
    en: 'Escalating to the next level now.',
    hi: 'अभी अगले स्तर पर भेजी जा रही है।',
  },
  'track.allExhausted': {
    en: 'Every escalation level has been exhausted. This now sits on the public record.',
    hi: 'सारे स्तर खत्म हो गए। अब यह सार्वजनिक रिकॉर्ड में दर्ज है।',
  },
  'track.escalatedOnce': {
    en: 'Escalated once — nobody has acted',
    hi: 'एक बार ऊपर भेजी गई — किसी ने कुछ नहीं किया',
  },
  'track.escalatedTimes': {
    en: 'Escalated {n} times — nobody has acted',
    hi: '{n} बार ऊपर भेजी गई — किसी ने कुछ नहीं किया',
  },

  // ── Cross-cutting ───────────────────────────────────────────────────────
  'common.englishOnly': {
    en: 'This page is available in English only.',
    hi: 'यह पृष्ठ अभी सिर्फ अंग्रेज़ी में है।',
  },
}
