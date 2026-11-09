"use strict";
/* The starting answer bank for "Ask the manual".
   Most answers are built from course content that already exists (lessons, objection replies, niche packs, playbooks, tools), so they say what the course says.
   COMMON holds the questions written by hand. Edit here, or in Admin > Questions once the site is running. */

/* id -> the questions a member would ask for this lesson. The answer is the lesson's own key idea. */
const LESSONS = {
  "1.1": ["How many calls and emails does it take to get one client?", "How much outreach should I do every day?", "ek client ke liye kitni outreach karni hai"],
  "1.2": ["Why is my offer more important than my script?", "My script is good but nobody buys, why?"],
  "1.3": ["How do I deal with rejection?", "People keep saying no and I feel bad", "rejection se kaise deal karun"],
  "1.4": ["Why do people really buy?", "What makes a buyer decide?"],
  "1.5": ["How should I use this platform to train?", "What is the best way to study this course?"],
  "1.6": ["How do I make my offer hard to refuse?", "How do I add guarantees, bonuses and urgency to my offer?"],
  "14.1": ["How do I pick a niche?", "Which niche should I choose?", "How do I niche down?", "niche kaise choose karun"],
  "14.2": ["What do buyers weigh when they look at an offer?", "How do I make my offer more attractive?"],
  "14.3": ["How do I build an offer from the buyer's problems?", "What should my offer include?"],
  "14.4": ["Should I do the work for them or teach them?", "Done for you or done with you, which is better?"],
  "14.5": ["How do I turn my service into a product?", "How do I package my service?"],
  "14.6": ["How do I get clients with no case studies?", "I have no proof or results yet, what do I do?", "mere paas koi case study nahi hai", "How do I sell with no experience or portfolio?"],
  "14.7": ["How do I write my offer on one page?", "Where do I put my final offer together?"],
  "15.1": ["How much should I charge?", "How do I price my service?", "kitna charge karun", "What price should I quote a US client?"],
  "15.2": ["Retainer or commission, which pricing model should I use?", "Should I charge per result or monthly?"],
  "15.3": ["Should I offer a guarantee?", "What guarantee can I safely give?"],
  "15.4": ["What small first offer gets a client in the door?", "How do I make it easy to say yes the first time?"],
  "15.5": ["How do I upsell after a yes?", "What do I offer when they say no to the main offer?", "How do I add add-ons?"],
  "15.6": ["How do I get clients to pay every month?", "How do I make my offer recurring?"],
  "15.7": ["How do I name my offer?", "How do I test if my offer works?"],
  "2.1": ["What kind of market should I target?", "Who should I reach out to?"],
  "2.2": ["How do I build a clean lead list?", "How big should my list be?", "lead list kaise banaun"],
  "2.3": ["How do I research a prospect quickly?", "What should I look up before contacting someone?"],
  "2.4": ["How do I plan my day for outreach?", "How should I time block my prospecting?"],
  "2.5": ["What are the ways to get clients?", "What are the main lead sources?"],
  "2.6": ["What is a lead magnet?", "What free thing can I give to open a conversation?"],
  "2.7": ["How do I get clients from people I already know?", "What is warm outreach?", "How do I ask for referrals from friends?"],
  "2.8": ["What are buying signals?", "When is the best time to contact a business?"],
  "2.9": ["How do I personalise messages at scale?", "How much personalisation do I need?"],
  "2.10": ["How do I combine email, calls and LinkedIn in one sequence?", "What is a multichannel sequence?", "Which channel should I use first?"],
  "3.1": ["What do I say in the first ten seconds of a cold call?", "How do I start a cold call?", "call shuru kaise karun"],
  "3.2": ["What are good cold call openers?", "What opener should I use?"],
  "3.3": ["How should I sound on a call?", "How much should I talk on a call?", "How do I fix my tone and pace?"],
  "3.4": ["How do I handle the first objection on a cold call?", "They object straight away on the call, what do I do?"],
  "3.5": ["How do I get past the gatekeeper?", "The receptionist won't put me through", "What do I say to the receptionist?", "How do I get past the receptionist?"],
  "3.6": ["What do I say in a voicemail?", "Should I leave a voicemail?"],
  "3.7": ["What words should I avoid on a sales call?", "How do I stop sounding like a salesperson?"],
  "3.8": ["Do you have cold call scripts I can copy?", "Give me a call script", "cold call ki script chahiye"],
  "4.1": ["How does cold email work?", "What are the rules for cold email?"],
  "4.2": ["How do I set up cold email so I land in the inbox?", "How many domains and mailboxes do I need?"],
  "4.3": ["How do I build an email list?", "How do I verify email addresses?"],
  "4.4": ["How do I write my first cold email?", "What should a cold email say?", "cold email kaise likhun"],
  "4.5": ["How many follow-up emails should I send?", "How do I follow up on a cold email?"],
  "4.6": ["How do I handle replies to my cold emails?", "Someone replied to my email, what now?"],
  "4.7": ["How do I measure my cold email results?", "What should I test in my emails?"],
  "4.8": ["Why are my emails going to spam?", "How do I fix deliverability?", "meri emails spam mein ja rahi hain"],
  "4.9": ["Show me cold email examples", "Do you have cold email templates?", "Is there a swipe file of emails?"],
  "5.1": ["How does social media outreach work?", "How do I get clients from social media?"],
  "5.2": ["How do I set up my profile to attract clients?", "What should my LinkedIn profile say?"],
  "5.3": ["How do I do outreach on LinkedIn?", "What do I write in a LinkedIn connection note?", "linkedin se client kaise milega"],
  "5.4": ["How do I get clients from Facebook?", "How do I use Facebook groups for outreach?"],
  "5.5": ["How do I get clients on Instagram?", "What do I send in an Instagram DM?"],
  "5.6": ["What is a good daily routine for social outreach?", "How long should I spend on social outreach each day?"],
  "5.7": ["What are the LinkedIn limits?", "How many connection requests can I send on LinkedIn?", "Can I send voice notes on LinkedIn?"],
  "6.1": ["Why send a personal video?", "Do video messages work for outreach?"],
  "6.2": ["What do I say in an outreach video?", "How do I script a Loom video?"],
  "6.3": ["How do I record an outreach video?", "What equipment do I need for video outreach?"],
  "6.4": ["How do I send and follow up on an outreach video?", "How do I make many videos quickly?"],
  "16.1": ["What is an SOP?", "How do I write my own SOPs?", "What daily schedule should I follow in US hours?"],
  "16.2": ["How do I build 200 leads in a day?", "What are the steps to build a lead list?"],
  "16.3": ["What are the steps to set up cold email from zero?", "How long does cold email setup take?"],
  "16.4": ["How do I launch an email campaign?", "What do I check before sending a campaign?"],
  "16.5": ["How do I run a daily calling block?", "What is the routine for making calls every day?"],
  "16.6": ["What is the daily social and video routine?", "What do I do every day on LinkedIn and Instagram?"],
  "16.7": ["How fast should I answer replies?", "What are the steps to turn replies into meetings?"],
  "16.8": ["How do I review my outreach each week?", "What should I check every week?"],
  "7.1": ["What makes a good appointment?", "When is a meeting worth booking?"],
  "7.2": ["How do I qualify a prospect?", "What questions do I ask before booking a meeting?"],
  "7.3": ["How do I book the meeting?", "They are interested, how do I get them on a call?", "meeting kaise book karun"],
  "7.4": ["How do I stop no-shows?", "What reminders should I send before a meeting?", "They booked but did not show up"],
  "7.5": ["How fast should I call a new lead back?", "What is speed to lead?"],
  "7.6": ["What are the US calling rules?", "Is cold calling legal in the US?", "What is the TCPA?", "What are the do not call rules?"],
  "7.7": ["How do I book meetings through DMs?", "How do I hand a lead over to the closer?"],
  "8.1": ["Why does discovery matter?", "What is a discovery call for?"],
  "8.2": ["What questions do I ask on a discovery call?", "In what order do I ask discovery questions?", "discovery call mein kya poochun"],
  "8.3": ["How do I start a discovery call?", "How do I find out who makes the decision?"],
  "8.4": ["What is gap mapping?", "How do I show the gap between where they are and where they want to be?"],
  "8.5": ["What are reflective questions?", "How do I get people to talk themselves into changing?"],
  "8.6": ["How do I listen better on sales calls?", "What are mirrors and labels?"],
  "9.1": ["How do I present my solution?", "Should I explain how my service works in detail?"],
  "9.2": ["How do I present on a sales call?", "price kab batani hai", "When do I reveal the price on a call?"],
  "9.3": ["What are the seven buying beliefs?", "How do I check a deal is ready before the price?"],
  "9.4": ["How do I write a proposal?", "Should I email my proposal?", "proposal kaise banaun"],
  "9.5": ["How do I sell when there is more than one decision maker?", "How do I get the partner involved early?"],
  "10.1": ["How do I close a deal?", "How do I ask for the sale?", "deal close kaise karun"],
  "10.2": ["What are the steps of a full sales call?", "How do I run a sales call from start to finish?"],
  "10.3": ["What is behind an objection?", "How do I find the real objection?", "How do I handle objections?"],
  "10.4": ["How do I negotiate?", "They want to negotiate, what do I do?"],
  "10.5": ["What are the principles of influence?", "How do I persuade people ethically?"],
  "10.6": ["How do I follow up on a quiet deal?", "They went quiet after the proposal", "client ne jawab dena band kar diya"],
  "10.7": ["What are the most common objections and answers?", "What are the five big objections?"],
  "10.8": ["What do I do after they say yes?", "How do I collect payment on the call?"],
  "11.1": ["What are the pipeline stages?", "How do I set up my pipeline?"],
  "11.2": ["What numbers should I track every week?", "What is a good scoreboard?"],
  "11.3": ["What is a follow-up cadence?", "How often should I follow up?", "How many times do I follow up?"],
  "11.4": ["How do I review my own calls?", "How do I score my calls?"],
  "11.5": ["How do I train a team?", "How do I hire and scale outreach?"],
  "12.1": ["What tools do I need?", "What software do I need to start?", "konse tools chahiye"],
  "12.2": ["Which lead data tools should I use?", "How do I verify and enrich leads?"],
  "12.3": ["Which email sending tools do I need?", "What email infrastructure do I need?"],
  "12.4": ["Which tools should I use for social and video?", "Should I automate LinkedIn?"],
  "12.5": ["How do I call the US from Pakistan?", "How do I get a US number?", "What do I need for calling?", "pakistan se US call kaise karun"],
  "12.6": ["Which CRM should I use?", "What do I use for scheduling meetings?"],
  "12.7": ["Can I use AI to write my messages?", "How should I use AI in my outreach?", "Can I use AI to write my emails?"],
  "12.8": ["How do I keep my accounts secure?", "How do I control my tool costs?"],
  "13.1": ["What do I do in the first days after a client signs?", "How do I onboard a new client?"],
  "13.2": ["How do I run a kickoff call?", "What do I cover on the kickoff call?"],
  "13.3": ["What is a 30-60-90 day plan?", "How do I get an early win for a new client?"],
  "13.4": ["How do I report results to a client?", "What should a client report include?"],
  "13.5": ["How do I get a client to renew?", "When do I upsell an existing client?"],
  "13.6": ["A client wants to leave, what do I do?", "How do I save a client who wants to cancel?", "client chhorna chahta hai"],
  "13.7": ["How do I keep delivery quality the same with a team?", "How do I hand a client from sales to delivery?"]
};

/* extra wording for the objections members ask about most (matched on the objection's own question) */
const OBJECTION_ALTS = {
  "It's too expensive.": ["They said the price is too high", "client bolta hai bohat mehnga hai", "It costs too much"],
  "Someone can do it cheaper, or for free.": ["They found someone cheaper", "koi aur sasta kar raha hai"],
  "What does it cost? (asked too early)": ["They ask how much it is straight away", "How much is it?", "pehle hi price pooch raha hai"],
  "Can you give me a discount?": ["They want a discount", "They ask for a lower price", "discount maang raha hai"],
  "We don't have the budget.": ["They have no budget", "budget nahi hai"],
  "How do I know you're legit?": ["They think I'm a scam", "They don't trust me", "Is this a scam?"],
  "What if it doesn't work for me?": ["They worry it won't work"],
  "Just send me some info.": ["They said send me an email", "They just want information by email", "bolta hai email kar do", "Send me some details"],
  "We're slammed right now.": ["They are too busy", "They said they have no time", "abhi time nahi hai"],
  "Call me back in a few months.": ["They said not right now", "Maybe next quarter", "baad mein call karna"],
  "I need to think about it.": ["They said let me think", "sochna hai bol raha hai", "They want time to think"],
  "I need to talk to my partner.": ["They need to ask their wife or husband", "partner se poochna hai"],
  "We already have a provider.": ["They already have someone", "They already use another company", "pehle se kisi ke saath kaam kar rahe hain"],
  "We don't have that problem.": ["They say they don't need it", "They don't need my service"],
  "Not interested.": ["They said not interested", "dilchaspi nahi hai", "They said no thanks"],
  "How did you get my number?": ["They asked where I got their number"],
  "Remove me from your list.": ["They asked to be removed", "They said stop contacting me", "unsubscribe"],
  "Who is this? What's this about?": ["They asked who I am"],
  "Are you a robot?": ["They think I'm AI", "They asked if I am a real person"],
  "Let me get a few quotes first.": ["They want to compare quotes"]
};

/* Niche id -> how members refer to it */
const NICHE_WORDS = {
  "home-services": "plumbers HVAC electricians", roofing: "roofers", dental: "dentists", "med-spa": "med spas aesthetics", "real-estate": "real estate agents", solar: "solar installers", law: "law firms lawyers",
  agencies: "marketing agencies freelancers", saas: "software SaaS companies", ecommerce: "ecommerce brands online stores", "pest-control": "pest control", landscaping: "landscaping lawn care", cleaning: "cleaning companies",
  "garage-door": "garage door companies", "pool-service": "pool companies", remodeling: "remodeling general contractors", restoration: "restoration water damage", moving: "moving companies movers",
  "auto-repair": "auto repair shops mechanics", chiropractic: "chiropractors", "physical-therapy": "physical therapy clinics", veterinary: "vets veterinary clinics", "home-care": "home care senior care", gyms: "gyms fitness studios",
  salons: "salons barbers spas", "property-management": "property management companies", "insurance-agency": "insurance agencies agents", mortgage: "mortgage brokers loan officers", accounting: "accountants tax firms", msp: "managed IT MSP"
};

/* Written by hand. l = lessons, t = tool, go = other pages. Keep to what the course says: no invented results or promises. */
const COMMON = [
  { id: "english", q: "My English isn't perfect. Can I still do this?", alts: ["meri english achi nahi hai", "Is my accent a problem?", "Do I need perfect English?", "My English is bad"], a: "Yes. US business owners don't need perfect English. They need you to be clear and get to the point.\n\nMuch of the outreach is written, so you can start with email and DMs. The communication drills help you get comfortable speaking when you're ready.", l: ["3.3"], go: [["#/drills", "Communication drills"]] },
  { id: "time-per-day", q: "How much time do I need each day?", alts: ["roz kitna time dena hoga", "Can I do this around my job or studies?", "How long does this take?"], a: "Most days take a couple of hours, and most of that is outreach and practice, not reading. You can do it around a job or your studies.", l: ["2.4", "16.1"], go: [["#/track", "First client in 30 days"]] },
  { id: "beginner", q: "I have never sold anything. Where do I start?", alts: ["Where do I begin?", "main beginner hun kahan se shuru karun", "I'm new to sales"], a: "Start with the 30-day plan. It tells you what to do each day, from picking a market and writing an offer to your first conversations. Each job opens the lesson or tool you need.", l: ["1.5", "1.1"], go: [["#/track", "First client in 30 days"]] },
  { id: "income", q: "Will this make me money? Is income guaranteed?", alts: ["Do you guarantee I will get clients?", "kya paise guarantee hain", "Will I definitely get a client in 30 days?"], a: "Nobody can honestly promise that. You get a process, tools, practice and a way to see your own numbers. What happens next depends on your offer, your market and how much work you put in.", l: ["1.1"] },
  { id: "behind", q: "I have fallen behind on the 30-day plan. What do I do?", alts: ["I missed some days of the plan", "plan se peeche reh gaya hun", "Can I catch up on missed days?"], a: "Keep going. The plan shows which days to catch up on, and some people simply take longer than 30 days. If a checkpoint has you stuck, the 1:1 strategy call is there for that.", go: [["#/track", "First client in 30 days"], ["#/upgrades", "1:1 strategy call"]] },
  { id: "stuck", q: "I'm stuck and need more help. Can I talk to someone?", alts: ["Can I talk to Umar?", "Can I book a call with you?", "mujhe aur madad chahiye"], a: "Book a 1:1 strategy call from inside the portal. Send a short request saying what you sell, where you are and what's holding you back.", go: [["#/upgrades", "1:1 strategy call"]] },
  { id: "us-hours", q: "What time should I contact US businesses from Pakistan?", alts: ["What is the time difference with the US?", "US time zone Pakistan se kitna farq hai", "When should I call the US?", "What time should I call the USA?", "What time should I work in Pakistan?"], a: "Pakistan is 9 or 10 hours ahead of US Eastern time, depending on the season. A 9 am to 5 pm Eastern day runs from about 6 pm to 2 am in Pakistan during US summer. West Coast mornings start three hours later.\n\nCalls and social outreach work best in US business hours, so that usually means your evening. Test what works for your niche. The cadence builder shows send times in both time zones.", l: ["12.5", "16.1", "2.4"], t: "cadence" },
  { id: "touches-day", q: "How many messages should I send per day?", alts: ["roz kitne messages bhejun", "What is the daily outreach target?", "How many touches a day?"], a: "The course asks for 100 outreach touches every working day, counting calls, emails, messages and videos together, for at least 100 days before you judge the method. Most beginners fail on volume, not skill.", l: ["1.1", "2.10"], t: "funnel" },
  { id: "email-volume", q: "How many cold emails can I send per day from one mailbox?", alts: ["daily email limit kya hai", "What is the sending limit per inbox?", "How many emails per mailbox?"], a: "Start at 15 to 20 cold emails per mailbox per day and rise slowly, to about 30 over the next weeks, and only if bounce and spam rates stay healthy. Spread sends across the working day, not in one burst.", l: ["4.2", "16.3"] },
  { id: "warmup", q: "How long should I warm up a new email domain?", alts: ["What is email warm up?", "warm up kitne din karna hai", "How long before I can send cold emails?"], a: "Warm up new mailboxes for two to three weeks before your first campaign. Warm-up means sending and receiving small, natural amounts of email so inbox providers learn the mailbox is real. Allow about three weeks from buying domains to your first real send.", l: ["4.2", "4.8", "16.3"] },
  { id: "spf", q: "What are SPF, DKIM and DMARC?", alts: ["How do I authenticate my domain?", "SPF DKIM DMARC kya hai"], a: "They prove your email is really from you. SPF lists which servers may send for your domain, DKIM signs each message, and DMARC tells receivers what to do if those checks fail. Set up all three on every sending domain.", l: ["4.2", "4.8"], t: "emailcheck" },
  { id: "bounce", q: "What bounce rate is too high?", alts: ["My emails are bouncing", "bounce rate kitna hona chahiye"], a: "Keep your bounce rate under about 2 percent. Verify every address before you send. If bounces rise or replies fall, pause the mailbox and fix the cause before sending more.", l: ["4.2", "4.7", "4.8"] },
  { id: "no-replies", q: "Nobody is replying to my outreach. What should I fix?", alts: ["I get no replies", "Nobody replies to my emails", "koi reply nahi kar raha", "I sent hundreds of emails and got nothing", "My cold emails get no response"], a: "Fix one step at a time. First check that your mail is reaching the inbox. Then check your list: is it the right person, with a problem they have now? Then the message: short, about them, with an easy question.\n\nLog your numbers so you can see the weakest step, and change one thing at a time.", l: ["4.8", "2.1", "4.4", "4.7"], t: "funnel" },
  { id: "cold-email-legal", q: "Is cold email legal in the US?", alts: ["What is CAN-SPAM?", "Can I send cold emails to US businesses?", "cold email legal hai"], a: "CAN-SPAM applies to commercial email, including business to business. Use your real name and a truthful from line, a subject that isn't misleading, a valid postal address and a clear way to opt out. The UK, EU and Canada have stricter rules for some recipients.\n\nThis is general information, not legal advice. Check your situation with a qualified attorney.", l: ["4.1", "4.8"] },
  { id: "ai-voice", q: "Are AI voice calls allowed under US rules?", alts: ["Can I use an AI caller for cold calls?", "Is it legal to use AI voices on calls?"], a: "The FCC's 2024 ruling says AI-generated voices count as artificial under the TCPA, so the consent rules for artificial voices apply. Read the US calling rules lesson before you dial.\n\nThis is general information, not legal advice. Check your situation with a qualified attorney.", l: ["7.6"] },
  { id: "opt-out", q: "Someone asked me to stop contacting them. What do I do?", alts: ["A prospect replied unsubscribe", "They asked me to stop emailing", "They told me never to call again"], a: "Stop straight away, on every channel, and don't argue or send a final pitch. Mark them as do not contact in your lead tracker. The reply handler does this in one click.", l: ["4.6", "7.6"], t: "replies" },
  { id: "linkedin-limit", q: "How many LinkedIn connection requests should I send?", alts: ["linkedin pe kitni requests bhejun", "Will LinkedIn ban me?", "How do I keep my LinkedIn account safe?"], a: "Stay well under 100 requests a week. A normal day is 10 to 20 requests to people you've already engaged with. LinkedIn watches for automation and copied messages, so warm people up with comments and keep notes short.", l: ["5.3", "5.7", "16.6"] },
  { id: "first-channel", q: "Which channel is best for getting my first client?", alts: ["Email ya LinkedIn, which is better?", "Should I start with calls or emails?", "best channel konsa hai", "How do I get my first client?"], a: "Your first client often comes fastest from people you already know, so start with warm contacts and referrals. For cold outreach, pick two or three channels that suit your market and strengths, and run them as one sequence. If you prefer writing, lead with email and DMs. If you speak well, add calls.", l: ["2.7", "2.10", "2.5"] },
  { id: "work-free", q: "Should I work for free to get my first client?", alts: ["Should I do free work for a case study?", "muft mein kaam karun?", "Should I lower my price for my first client?"], a: "Aim for a small, safe first step, not open-ended free work. One way is founding clients: your first two or three clients get a lower price in exchange for a case study and a review. Say honestly why the price is lower, and pick the clients most likely to get a good result.", l: ["14.6", "15.4"] },
  { id: "fake-proof", q: "Can I make up testimonials or numbers until I have real ones?", alts: ["Can I use fake reviews?", "Can I exaggerate my results?", "fake testimonials use kar sakta hun"], a: "No. Never invent case studies, numbers or testimonials. With no results yet, offer a pilot, a guarantee you can actually keep or a low-risk first step. Honest, small and specific beats big and fake.", l: ["1.2", "14.6"] },
  { id: "pakistan-mention", q: "Should I tell clients I'm from Pakistan?", alts: ["They asked where I am based", "Do I hide that I am in Pakistan?", "client ko batana chahiye ke main pakistan se hun"], a: "Yes, be honest if it comes up. Never pretend to be somewhere you're not. A US owner compares your price with what the problem costs him, not with Pakistani salaries, so keep the talk on his problem and on what you've done to prove you understand it.", l: ["15.1", "14.6"] },
  { id: "nervous-calls", q: "I get nervous before making calls. What can I do?", alts: ["mujhe call karte hue dar lagta hai", "I'm scared to make cold calls", "How do I build confidence on calls?"], a: "Practise first, and remember you're only finding out whether you can help, not trying to win every call. Run the drills out loud, do a roleplay, then dial the next number before you start judging yourself.", l: ["1.3", "3.3", "1.5"], go: [["#/drills", "Communication drills"], ["#/roleplay", "Roleplay lab"]] },
  { id: "no-calls", q: "Can I get clients without making calls?", alts: ["Do I have to cold call?", "Can I only use email and DMs?", "call ke baghair client mil sakta hai"], a: "Yes. Calls are one channel out of several. You can lead with email, LinkedIn, Facebook, Instagram, short videos and referrals. You'll still need to speak with interested owners at the meeting stage, and the drills help you get ready for that.", l: ["2.10", "5.1"], go: [["#/drills", "Communication drills"]] },
  { id: "dont-need-software", q: "Do I need to buy expensive software to start?", alts: ["Can I start for free?", "paid tools zaroori hain"], a: "No. You can start with a laptop, a phone and a free spreadsheet. Buy one tool per layer and add a tool only when not having it hurts.", l: ["12.1"] },
  { id: "contract-needed", q: "Do I need a contract with a client?", alts: ["How do I write a contract?", "What should a service agreement include?", "contract kaise banaun"], a: "Use the contract and invoice kit to fill in a plain-language agreement, a scope or an invoice. These are starting points, so have a qualified lawyer review the final text before you rely on it.", l: ["10.8"], t: "contract" },
  { id: "drills-mic", q: "Why isn't the drill microphone or clarity score working?", alts: ["Drills are not recording", "mic kaam nahi kar raha", "Clarity score is missing"], a: "Drills need microphone permission and a secure connection. The clarity score needs Chrome or Edge, because it uses the browser's speech recognition, which may send your speech to the browser's maker to turn it into text. We don't receive or store your recordings.", go: [["#/drills", "Communication drills"]] },
  { id: "saved-work", q: "Is my work saved? Can I use my phone and laptop?", alts: ["Will I lose my progress?", "Does it work on mobile?", "mera data save hota hai"], a: "Yes. Your progress, notes and tool entries are saved to your account, so they're the same on your phone and your laptop.", go: [["#/settings", "Settings"]] },
  { id: "certificate", q: "How do I get my certificate?", alts: ["Is there a certificate?", "certificate kaise milega"], a: "Complete every lesson to unlock your certificate of completion. The Certificate page shows how far you've got.", go: [["#/cert", "Certificate"]] },
  { id: "password", q: "How do I change my password?", alts: ["password change karna hai", "How do I log out of other devices?"], a: "Go to Settings. You can change your password there and log out everywhere.", go: [["#/settings", "Settings"]] },
  { id: "refund", q: "How do I get a refund?", alts: ["refund kaise milega", "What is your refund policy?"], a: "Use the manual for 14 days and complete days 1 to 14 of the 30-day plan. If you've done the steps and don't like it, contact us within 7 days after that and we'll refund you in full. The refund goes back to the account you paid from.", go: [["/site/terms.html#refund", "Refund policy"], ["#/track", "First client in 30 days"]] },
  { id: "only-us", q: "Does this work for markets outside the US?", alts: ["Can I use this for UK or Canada clients?", "Can I sell in the Gulf or Pakistan?"], a: "The selling works anywhere. The examples and rules focus on the US, so check the rules for wherever your prospects are. The UK, EU and Canada have stricter consent rules for some cold email.", l: ["4.1", "7.6"] },
  { id: "team-use", q: "Can my team use The Cold Manual?", alts: ["Do you have team accounts?", "Can I add my setters?"], a: "Yes. Team accounts come with seats and a manager view of each person's progress. Members are told what the manager can see before they join. Email us for team pricing.", l: ["11.5"] },
  { id: "setter-closer", q: "What is the difference between an appointment setter and a closer?", alts: ["setter aur closer mein kya farq hai", "What does an appointment setter do?", "What does a closer do?"], a: "A setter finds out whether someone wants the problem fixed and books them a clear meeting. A closer runs that meeting: discovery, the proposal, the price and the decision. When you hand over, give the closer everything they need so the prospect never repeats themselves.", l: ["7.1", "7.7", "10.2"] },
  { id: "not-answering-phone", q: "They don't pick up the phone. What do I do?", alts: ["Nobody answers my calls", "koi phone nahi uthata"], a: "Treat it as one touch in your sequence. Try a different time in their time zone, leave a short and specific voicemail, then send a short email or message that repeats the reason and asks one easy question. People reply on the channel they find easiest.", l: ["3.6", "2.10", "16.5"] },
  { id: "reply-speed", q: "How quickly should I answer when someone replies?", alts: ["reply kitni jaldi karna chahiye", "How fast should I respond to a positive reply?"], a: "Check replies twice a day and answer positive replies within hours. A reply goes cold fast. Move every interested person to a booked time.", l: ["16.7", "4.6"], t: "replies" },
  { id: "interested-reply", q: "They replied saying they are interested. What do I say?", alts: ["They said tell me more", "They said sounds good", "client interested hai ab kya bolun"], a: "Reply fast and keep it short: one question about their problem and two specific times. No sales pitch. The reply handler writes this for you.", l: ["16.7", "7.3"], t: "replies" },
  { id: "payment-on-call", q: "When should I ask for payment?", alts: ["payment kab leni hai", "How do I take the money after they agree?"], a: "Take payment on the call, right after they say yes. Then reinforce why they decided and start onboarding before you hang up.", l: ["10.8"], t: "contract" }
];

function build(O) {
  const qa = [];
  const title = (id) => { const x = O.L.filter((l) => l.id === id)[0]; return x ? x.t : ""; };
  O.L.forEach((l) => {
    const qs = LESSONS[l.id]; if (!qs) throw new Error("No question written for lesson " + l.id);
    const tool = l.tool ? String(O.TOOL_ALIAS[l.tool] || l.tool) : "";
    qa.push({ id: "l-" + l.id, src: "lesson", q: qs[0], alts: qs.slice(1), k: "", a: l.idea, l: [l.id], t: tool && tool[0] !== "#" ? tool : "", go: tool[0] === "#" && tool.startsWith("#/track") ? [[tool, "First client in 30 days"]] : tool[0] === "#" ? [] : undefined });
  });
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  O.OBJ.forEach((o) => {
    qa.push({ id: "obj-" + slug(o.q), src: "objection", q: "They said: " + o.q, alts: [o.q].concat(OBJECTION_ALTS[o.q] || []), k: "", a: "What it usually means: " + o.means + "\n\nA reply to adapt: \"" + o.reply + "\"\n\nThen ask: " + o.ask, l: [], t: "objections" });
  });
  O.NICHES.forEach((n) => {
    const w = NICHE_WORDS[n.id]; if (!w) throw new Error("No wording for niche " + n.id);
    const go = [["#/niche/" + n.id, "Niche pack: " + n.name]], low = /^[A-Z][a-z]/.test(n.name) ? n.name[0].toLowerCase() + n.name.slice(1) : n.name;
    qa.push({ id: "n-" + n.id + "-sell", src: "niche", q: "Selling to " + low + ": what can I offer?", alts: ["What can I sell to " + w + "?", "What offer works for " + w + "?", "Is " + n.name + " a good niche?"], k: w, a: (n.offers && n.offers.length ? "What sells best: " + n.offers.join("; ") + ".\n\n" : "") + "The angle: " + n.angle, l: [], go });
    qa.push({ id: "n-" + n.id + "-reach", src: "niche", q: "Selling to " + low + ": who do I contact, and where?", alts: ["How do I reach " + w + "?", "Which channel works for " + w + "?", "Who do I contact at " + w + "?", "How do I find " + w + "?"], k: w, a: "Who decides: " + n.buyer + "\n\nChannels: " + n.channels, l: [], go });
    qa.push({ id: "n-" + n.id + "-pain", src: "niche", q: "Selling to " + low + ": what problems do they have?", alts: ["What problems do " + w + " have?", "What are the pain points of " + w + "?", "What should I talk about with " + w + "?"], k: w, a: n.tag + "\n\nCommon problems: " + (n.pain || []).join(" "), l: [], go });
  });
  O.TOOLS.forEach((t) => { qa.push({ id: "t-" + t.key, src: "tool", q: "How do I use the " + t.title.toLowerCase() + "?", alts: ["What does the " + t.title.toLowerCase() + " do?", "Where is the " + t.title.toLowerCase() + "?"], k: "", a: t.desc, l: (t.lessons || []).slice(0, 2), t: t.key }); });
  O.PB.forEach((p) => { qa.push({ id: "pb-" + p.id, src: "playbook", q: "Show me an example: " + p.title.replace(/^"|"$/g, ""), alts: ["Example of " + p.title.replace(/"/g, "")], k: "", a: p.situation + " Your goal: " + p.goal + " The playbook shows the whole conversation, with notes on each line.", l: [], go: [["#/pb/" + p.id, "Playbook: " + p.title]] }); });
  COMMON.forEach((c) => { qa.push(Object.assign({ src: "common", alts: [], k: "", l: [] }, c, { id: "h-" + c.id })); });

  /* resolve links so the member's screen needs no course data, and catch broken ones at build time */
  const tools = new Map(O.TOOLS.map((t) => [t.key, t.title])), lessons = new Set(O.L.map((l) => l.id)), seen = new Set(), bad = [];
  qa.forEach((e) => {
    if (seen.has(e.id)) bad.push("duplicate answer id " + e.id); seen.add(e.id);
    const links = [];
    (e.l || []).forEach((id) => { if (!lessons.has(id)) bad.push(e.id + " links to missing lesson " + id); else links.push(["#/l/" + id, "Lesson " + id + ": " + title(id)]); });
    if (e.t) { const key = String(e.t).split("/")[0]; if (!tools.has(key)) bad.push(e.id + " links to missing tool " + e.t); else links.push(["#/t/" + e.t, tools.get(key)]); }
    (e.go || []).forEach((g) => links.push(g));
    e.links = links; delete e.l; delete e.t; delete e.go;
    if (!e.a || !e.q) bad.push(e.id + " has no question or answer");
  });
  if (bad.length) throw new Error("Answer bank problems:\n - " + bad.join("\n - "));
  return qa;
}

module.exports = { build };
