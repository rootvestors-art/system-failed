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
    en: 'Report a dangerous civic issue near you',
    hi: 'अपने आसपास की खतरनाक समस्या की शिकायत करें',
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
  'intake.city': { en: 'City', hi: 'शहर' },
  'intake.state': { en: 'State', hi: 'राज्य' },
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
  'intake.result.router': { en: 'Suggested first router', hi: 'संभावित ज़िम्मेदार विभाग' },
  'intake.result.alsoResponsible': { en: 'May also be responsible', hi: 'ये भी ज़िम्मेदार हो सकते हैं' },
  'intake.result.complaintText': { en: 'Complaint text', hi: 'शिकायत का मसौदा' },
  'intake.result.worthAdding': { en: 'Worth adding', hi: 'यह भी बताएं तो अच्छा' },
  'intake.result.doFirst': { en: 'Do this first', hi: 'पहले यह कीजिए' },
  'intake.result.accept': { en: 'Looks right — continue', hi: 'सही है — आगे बढ़ें' },
  'intake.result.redo': { en: 'Redo', hi: 'दोबारा' },
  'intake.result.mocked': { en: 'Mocked — AI not connected', hi: 'नमूना — AI जुड़ा नहीं है' },
  'intake.result.instead': {
    en: 'You would otherwise have had to work this out yourself on',
    hi: 'वरना आपको यह खुद पता करना पड़ता, यहां:',
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
