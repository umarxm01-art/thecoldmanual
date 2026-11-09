(function (O) {
/* ---------- Playbooks: full calls and conversations, line by line, with notes ----------
   Each one is an example built from situations our callers meet every week. Names and businesses are illustrative.
   turns: [who, what is said, note title, why it works]. R = you, P = the prospect. */
function pb(o) { o.names = o.names || { R: "You", P: "Owner" }; O.PB.push(o); }
var R = "R", P = "P";
O.PB_CATS = ["Cold calls", "Gatekeepers and voicemail", "Inbound and follow-up", "Discovery", "Closing", "Messages and email"];

/* ================= COLD CALLS ================= */

pb({ id: "cold-plumber", cat: "Cold calls", title: "Cold call to a plumbing owner, 7:40am", names: { R: "You", P: "Dave, owner" },
  situation: "Dave runs a 6-truck plumbing company in Fort Worth. You found him on Google Maps: 4.7 stars, 300 reviews, two reviews this month mention \"couldn't get through\".",
  goal: "Book a 15-minute call to show him his own missed-call numbers.",
  setting: "Tuesday, 7:40am Texas time, his mobile. He is in the truck between jobs.",
  prep: ["Read his last 10 Google reviews and note any about slow callbacks.", "Know his service area and whether he offers 24/7 emergency service.", "Have two meeting times ready before you dial."],
  turns: [
    [R, "Dave, it's Sam. We haven't spoken. I'm calling because plumbers in Fort Worth tell me they lose jobs when nobody can pick up after hours. Is that something you deal with, or not really?", "Reason, then an easy no", "Name, honesty about being a stranger, one reason, one question. About 12 seconds. \"Or not really\" lets him answer without feeling pushed."],
    [P, "I mean, sometimes. We're slammed right now."],
    [R, "Makes sense, busy is good. When the crew's on jobs, what happens to a call that comes in at 7 in the evening?", "Agree, then ask about one moment", "Don't argue with \"slammed\". Ask about a specific moment in his week; it gets a story, not a brush-off."],
    [P, "Goes to my cell. If I'm under a sink, voicemail."],
    [R, "And of the people who hit voicemail, roughly how many call back?", "Problem question", "Moves from how it works to whether it works. Let him say the number."],
    [P, "Honestly? Maybe half."],
    [R, "I saw a couple of reviews this month saying people couldn't get through. Is that the same thing?", "Use what you found", "Specific research shows you're not reading a script. Phrase it as a question, never an accusation."],
    [P, "Yeah, that was a Saturday. Nobody was on."],
    [R, "If it's, say, twenty calls a month that don't call back, what's a normal job worth to you?", "Let him do the maths", "His numbers, not yours. A cost he works out himself is one he believes."],
    [P, "Four, five hundred. More for water heaters."],
    [R, "So somewhere around eight to ten thousand a month walking to the next plumber on Google. Does that sound about right, or am I off?", "Say it back, invite correction", "Inviting him to correct you makes the number his."],
    [P, "No, that's probably right. Damn."],
    [R, "I don't want to pitch you on the phone while you're driving. Can I show you what those calls look like on your numbers? Fifteen minutes. Thursday at 9 or Friday at 2?", "Small ask, two times", "Respects his situation, names the length, and gives a choice instead of a yes/no."],
    [P, "Thursday at 9."],
    [R, "Done. What's the best email for the invite? I'll text you a reminder Wednesday too.", "Lock it in", "Get the email and send the invite before you hang up. Mention the reminder so it isn't a surprise."]
  ],
  avoid: ["\"How are you doing today?\" as the opener. It signals a sales call in two seconds.", "Pitching features (\"our AI uses natural language...\") before he has said the problem.", "Giving your own estimate of his losses. Let him supply the numbers."],
  take: ["Reason for the call in the first sentence, then a question with an easy no.", "Use one thing you found in your research.", "Let the owner calculate the cost.", "Ask for a short meeting with two times, and send the invite on the call."],
  rp: "owner-call", drill: "r-opener" });

pb({ id: "cold-roofer", cat: "Cold calls", title: "Roofer, the week after a hailstorm", names: { R: "You", P: "Mike, owner" },
  situation: "A hailstorm hit north Dallas 9 days ago. Mike's roofing company has 3 crews. His Facebook page shows he's posting \"free inspection\" offers.",
  goal: "Book a call about following up on estimates that went quiet.",
  setting: "Thursday, 5:15pm, office line. He picks up himself.",
  prep: ["Know the storm date and area (local news).", "Look at his Facebook posts for how many inspections he's doing.", "Have one question ready about estimates, not leads. Roofers have plenty of leads after a storm."],
  turns: [
    [R, "Mike, it's Sam. We haven't spoken. I know you're buried after last week's hail, so I'll be quick. Roofers tell me the inspections are easy right now, it's following up on all the estimates that falls apart. Is that you, or have you got it covered?", "Show you know his week", "Mentioning the storm proves this isn't a random call. The problem is the follow-up, not getting leads."],
    [P, "Ha. We've done forty inspections since Saturday. Nobody's following up on anything."],
    [R, "Forty in a week is a lot. Of those, how many estimates have gone out?", "Get the size", "Turn \"a lot\" into a number."],
    [P, "Maybe twenty-five. The rest are waiting on insurance."],
    [R, "And of the twenty-five, how many have you heard back from?", "Problem question", "Shows the gap without you saying it."],
    [P, "Six signed. The rest, no idea."],
    [R, "What's a typical job after a storm like this?", "Value", "Short, neutral."],
    [P, "Twelve, fifteen grand."],
    [R, "So nineteen estimates sitting at twelve thousand plus. If even three of them are just waiting for someone to call, that's thirty-six thousand. What happens to them right now?", "Make the gap concrete", "Conservative maths using his numbers. Ends with a question so he talks."],
    [P, "They go to whoever calls them back first. Probably the storm chasers."],
    [R, "That's exactly what I want to show you: a simple follow-up that calls and texts every open estimate on day 2, 5 and 10. Twenty minutes, tomorrow at 7am before the crews go out, or Monday at 5?", "Offer around his schedule", "Times that fit a roofer's day show you understand his business."],
    [P, "Tomorrow at 7 works."],
    [R, "Perfect. I'll send the invite to the email on your website. If you can, have the list of open estimates handy, and we'll use your real numbers.", "Prepare him", "Asking him to bring data makes the meeting about his money, not your product."]
  ],
  avoid: ["Leading with \"more leads\". After a storm, roofers have more leads than they can handle.", "Talking down the storm chasers. Let him name the competition himself.", "Booking calls during daylight working hours in storm season."],
  take: ["Tie the call to what is happening in his week.", "Sell what he's short of (follow-up), not what he has (leads).", "Offer meeting times that fit his trade."],
  rp: "owner-call", drill: "p-close" });

pb({ id: "cold-dental", cat: "Cold calls", title: "Dental office: the lunch-hour calls", names: { R: "You", P: "Karen, office manager" },
  situation: "A 3-dentist practice in Phoenix. Their website says \"Call to book\" with no online booking. The front desk closes 12 to 1.",
  goal: "Book a meeting with the office manager and, ideally, the lead dentist.",
  setting: "Wednesday, 2:30pm, main line. Karen, the office manager, answers.",
  prep: ["Check their hours on Google and the website.", "Check whether they offer online booking.", "Know that new-patient calls are the valuable ones; recall calls matter less."],
  turns: [
    [R, "Hi, it's Sam. I'm looking for whoever looks after the front desk and new-patient calls. Is that you, or someone else?", "Ask for the role", "Asking for a role, not a name, gets you to the right person without pretending you know them."],
    [P, "That's me, I'm the office manager. What's this about?"],
    [R, "Thanks, Karen. I work with dental practices on the calls that come in when the desk is busy or closed. I noticed you close for lunch 12 to 1. What happens to new-patient calls in that hour?", "One specific observation", "A fact from their own website turns a cold call into a relevant one."],
    [P, "They go to voicemail. We call them back after lunch."],
    [R, "How often do you reach them on the callback?", "Problem question", "Neutral. You're asking, not accusing."],
    [P, "Honestly, maybe half the time. People just book somewhere else."],
    [R, "That's what most practices tell me. Roughly how many new patients do you see a month?", "Normalise, then size it", "\"Most practices tell me\" removes any blame from her team."],
    [P, "Around forty."],
    [R, "And what's a new patient worth to the practice over the first year, cleanings, X-rays, the usual?", "Lifetime value", "Dental value is in the first year, not the first visit. Asking this shows you understand the business."],
    [P, "Dr. Patel says about twelve hundred."],
    [R, "So if even four lunch-hour callers a month book elsewhere, that's close to five thousand a year each month you miss them. Would it make sense to look at that with Dr. Patel for fifteen minutes? I can do Thursday at 12:30, while you're closed, or Friday at 4:30.", "Bring in the decision maker", "Ask for the dentist early. Offering the lunch slot is a light, memorable touch."],
    [P, "Friday at 4:30 should work. Let me check with him."],
    [R, "Great. I'll hold Friday at 4:30 and email you both. If it doesn't suit him, just reply with a better time.", "Hold the time", "Holding a time beats \"let me know\". The email makes it easy to change."]
  ],
  avoid: ["Saying \"HIPAA compliant\" before she asks. Answer it clearly when she does.", "Implying her team is failing. They're busy, not careless.", "Calling 8 to 9am or 12 to 1pm, the desk's busiest times."],
  take: ["Ask for the role, not a made-up name.", "Use one fact from their hours or website.", "Value new patients over a year, not one visit.", "Bring in the decision maker at the booking stage."],
  rp: "gatekeeper", drill: "r-gatekeeper" });

pb({ id: "cold-notint", cat: "Cold calls", title: "\"Not interested\" in the first 10 seconds", names: { R: "You", P: "Tony, HVAC owner" },
  situation: "Tony owns an HVAC company in Atlanta. It's late July and 98 degrees. He picks up already irritated.",
  goal: "Turn a reflex \"no\" into a real conversation, or leave on good terms.",
  setting: "Monday, 4:50pm, his mobile.",
  prep: ["Expect the reflex no. It's about the interruption, not your offer.", "Know one fact about AC calls in a heat wave (call volume spikes, every company is booked out)."],
  turns: [
    [R, "Tony, it's Sam. We haven't spoken. I'm calling because...", "Opener", "Same calm opener as always."],
    [P, "Not interested, man."],
    [R, "Fair enough. Most owners say that before they hear why I called. Can I take 20 seconds to tell you, and then you can hang up on me?", "Defuse and ask permission", "Agree, don't argue. Asking for a short amount of time with an easy way out usually gets a yes."],
    [P, "Twenty seconds."],
    [R, "In a heat wave like this, HVAC companies tell me they're getting more calls than they can answer, and the ones that hit voicemail call the next company. I don't know if that's true for you. Is it, or not really?", "Reason, then an easy no", "The reason fits his week. Ending with \"or not really\" lets him tell the truth."],
    [P, "I mean, yeah. Phones are crazy. We're booked out four days."],
    [R, "When you're booked out four days, what do you do with the calls you can't take?", "Problem question", "Curious, not salesy."],
    [P, "We tell them we're booked. Some wait, most don't."],
    [R, "What's a typical AC repair or replacement worth to you right now?", "Value", "Only one question at a time."],
    [P, "Repairs four hundred. Replacements nine, ten grand."],
    [R, "So one replacement a week lost to \"we're booked\" is ten grand. Would it be worth fifteen minutes when it cools down, say Thursday at 7am, to see whether some of those could be booked for next week instead of lost?", "Small, low-risk ask", "Respects that he's slammed. \"Booked for next week instead of lost\" is a benefit he can picture."],
    [P, "Thursday at 7. Fine."],
    [R, "Thanks, Tony. I'll text you the invite now. Stay cool out there.", "End warmly", "Short and human."]
  ],
  avoid: ["\"I understand, but...\". \"But\" cancels everything before it.", "Asking \"why aren't you interested?\" It puts him on the defensive.", "Arguing with the first no."],
  take: ["The first no is a reflex. Agree with it, then ask for 20 seconds.", "Tie the reason to his season.", "If he still says no after the reason, thank him and leave. You'll call again next quarter."],
  rp: "owner-call", drill: "p-notint" });

pb({ id: "cold-already", cat: "Cold calls", title: "\"We already have an answering service\"", names: { R: "You", P: "Lisa, co-owner" },
  situation: "Lisa co-owns an electrical company in Tampa. They pay a live answering service that takes messages.",
  goal: "Find out whether the current setup books jobs or just takes messages, and book a comparison call.",
  setting: "Wednesday, 10am, office line.",
  prep: ["Know the difference between taking a message and booking a job.", "Never criticise the other provider."],
  turns: [
    [R, "Lisa, it's Sam. We haven't spoken. I work with electricians on the calls that come in when the team's on jobs. Is that something you think about, or is it handled?", "Opener", "Leaves room for \"it's handled\" so she relaxes."],
    [P, "It's handled. We have an answering service."],
    [R, "Good, then you already know the calls matter. Can I ask, when they take a call, do they book the job into your calendar, or take a message for someone to call back?", "Agree, then clarify", "Praise the decision she made. Then ask the one question that matters."],
    [P, "They take a message. We call back in the morning."],
    [R, "How does that go? When you call back the next morning, how many have already found someone else?", "Problem question", "Lets her discover the gap herself."],
    [P, "Some. I don't really track it."],
    [R, "Most owners don't, and that's fair. If you had to guess, out of ten messages, how many turn into jobs?", "Guess is fine", "A guess is enough to start a conversation."],
    [P, "Maybe five or six."],
    [R, "That's a useful number. I'm not saying swap anything. Would it be worth fifteen minutes to compare: the calls you got last month, how many became jobs, and what booking them on the spot would change? Friday at 11 or Monday at 2?", "Compare, don't replace", "\"I'm not saying swap anything\" lowers the risk. A comparison feels safe to agree to."],
    [P, "Monday at 2. Bring numbers."],
    [R, "I'll bring the questions, you bring last month's call log, and we'll do the numbers together. Sending the invite now.", "Prepare her", "Makes it a working session, not a pitch."]
  ],
  avoid: ["\"Our service is better than theirs.\"", "Asking which company they use in the first minute.", "Giving up at \"we already have one\". It means she values the problem."],
  take: ["\"We already have one\" means they value the problem. Agree.", "Compare messages taken against jobs booked.", "Offer a comparison, not a replacement."],
  rp: "email-brushoff", drill: "p-email" });

/* ================= GATEKEEPERS AND VOICEMAIL ================= */

pb({ id: "gatekeeper-email", cat: "Gatekeepers and voicemail", title: "Gatekeeper and \"just send an email\"", names: { R: "You", P: "Linda, office" },
  situation: "A pest control company in Charlotte. Linda answers the main line and screens every sales call.",
  goal: "Reach the owner, or get a name and a time to call back.",
  setting: "Tuesday, 9:20am, main line.",
  prep: ["Know the owner's first name from the website or state licence lookup.", "Be ready to say why in one honest sentence."],
  turns: [
    [R, "Hi, it's Sam. Could you help me? I'm trying to reach whoever handles your phones and scheduling.", "Ask for help", "Honest and polite. Most people like helping."],
    [P, "What's it regarding?"],
    [R, "How you handle calls in spring when the phones get busy. I have two quick questions for the owner.", "Direct reason", "Short and true. No tricks, no \"he's expecting my call\"."],
    [P, "He's busy. Just send an email."],
    [R, "Happy to. Who should I address it to, and when's he usually in the office?", "Accept, then get a name and a time", "You agree, and still leave with what you need for the next call."],
    [P, "Ray. He's in Tuesday and Thursday mornings."],
    [R, "Thank you, that's really helpful. And your name, so I can tell him you suggested it?", "Build the relationship", "Linda becomes your ally, not your blocker."],
    [P, "Linda."],
    [R, "Thanks, Linda. Quick one while I have you: when the phones get busy in spring, is it you picking them all up?", "Ask the person who feels the problem", "Gatekeepers often feel the problem most. This can turn her into your champion."],
    [P, "It's me and one part-timer. It's a lot."],
    [R, "That's exactly what I want to ask Ray about. I'll send the email today and call Thursday morning. Have a good one.", "Commit to a next step", "Specific follow-up shows you mean it."]
  ],
  avoid: ["Pretending to know the owner.", "\"It's personal.\"", "Being short with the gatekeeper. She talks to the owner every day."],
  take: ["Be direct and respectful.", "Turn \"send an email\" into a name and a time.", "Ask the gatekeeper about her own workload. She may be your best ally."],
  rp: "gatekeeper", drill: "r-gatekeeper" });

pb({ id: "gatekeeper-ally", cat: "Gatekeepers and voicemail", title: "When the gatekeeper is the one drowning", names: { R: "You", P: "Jess, front desk" },
  situation: "A med spa in Scottsdale. Jess runs the front desk alone. Their Instagram has 20,000 followers and lots of DMs asking for prices.",
  goal: "Make Jess your champion and book a call with the owner.",
  setting: "Friday, 3pm, main line.",
  prep: ["Look at their Instagram comments: are questions being answered?", "Know the owner's name (Dr. Reyes) from the website."],
  turns: [
    [R, "Hi, it's Sam. Is this the front desk?", "Simple start", "Short and easy to answer."],
    [P, "Yes, this is Jess. How can I help?"],
    [R, "Jess, I'll be honest, this is a sales call, and I'll be quick. I work with med spas on the calls and DMs that come in faster than the desk can answer. Is that a problem here, or not really?", "Say it's a sales call", "Honesty disarms. Most gatekeepers expect a trick."],
    [P, "Oh my god. Yes. I'm the only one here on Fridays."],
    [R, "What happens when you're with a client and the phone rings?", "Let her describe it", "People who feel the problem describe it vividly. That becomes your case to the owner."],
    [P, "It goes to voicemail. And the Instagram DMs, I get to them at night if I can."],
    [R, "That sounds like a lot for one person. Does Dr. Reyes know how much comes in?", "Empathy, then the decision maker", "Shows you're on her side, then brings in the person who decides."],
    [P, "She knows it's busy. I don't think she knows how many we miss."],
    [R, "Would it help if I showed you both, with your own numbers, in fifteen minutes? I'm not asking you to sell it to her. Is there a time she's usually free, maybe Tuesday before the first client?", "Make it easy for her", "\"I'm not asking you to sell it\" removes the burden from Jess."],
    [P, "She's in at 8:30 Tuesdays. First client is 9:30."],
    [R, "Could you pencil in 8:45 Tuesday for fifteen minutes? I'll email you both the invite now.", "Book through the ally", "The gatekeeper can often book the owner's time directly."]
  ],
  avoid: ["Going around her once she's helped you.", "Making promises to her about her workload you can't keep."],
  take: ["Honesty about it being a sales call disarms gatekeepers.", "If she feels the pain, let her describe it.", "Ask her to book the owner's time."],
  rp: "gatekeeper", drill: "r-gatekeeper" });

pb({ id: "voicemail-text", cat: "Gatekeepers and voicemail", title: "Voicemail, then a text that gets a reply", names: { R: "You", P: "Owner" },
  situation: "Third attempt to reach the owner of a garage door company in Denver. No answer again.",
  goal: "Leave a voicemail that earns a callback or a text reply.",
  setting: "Wednesday, 7:50am, his mobile. Business number listed on Google (texting only if he has given consent or replies first).",
  prep: ["Keep the voicemail under 20 seconds.", "Say your name and number slowly, twice.", "Check the texting rules for the state before you text (lesson 7.6)."],
  turns: [
    [R, "(Voicemail) Hi Carlos, it's Sam, 214-555-0182. I had a quick idea about the stuck-door calls you get at night. I'll try you again Friday morning. Again, Sam, 214-555-0182.", "Voicemail under 20 seconds", "Name, one specific reason, when you'll call next, and the number twice. No pitch, no company name needed."],
    [P, "(No callback.)"],
    [R, "(Friday call, no answer. No voicemail this time.)", "Don't leave a voicemail every time", "Two voicemails a week sounds like pressure. Alternate."],
    [P, "(Carlos replies by text) Who's this?"],
    [R, "Hi Carlos, it's Sam. I called Wednesday about after-hours calls for garage door companies. Quick question: when a door gets stuck at 9pm, who picks up?", "Reply with a question", "Answer who you are in one line, then ask a question about his business, not your product."],
    [P, "Me if I'm awake lol"],
    [R, "Ha, that's most owners I talk to. Worth a 10-minute call to see how many of those you're missing? Monday 8am or Tuesday 5pm?", "Two times", "Keep it as short as his messages."],
    [P, "Tuesday 5"],
    [R, "Booked. Sending the invite to the email on your site.", "Confirm", "Short."]
  ],
  avoid: ["Voicemails over 30 seconds.", "\"Call me back at your earliest convenience.\"", "Texting numbers that haven't replied or given consent."],
  take: ["Voicemails are for recognition, not selling.", "Say the number twice, slowly.", "When they text back, reply with a question about their business."],
  drill: "r-voicemail" });

/* ================= INBOUND AND FOLLOW-UP ================= */

pb({ id: "inbound-speed", cat: "Inbound and follow-up", title: "Form lead called back in 3 minutes", names: { R: "You", P: "Maria, salon owner" },
  situation: "Maria owns a 6-chair hair salon in Austin. She filled in a form on your ad: \"Get your past clients rebooking\".",
  goal: "Book a call before she talks to anyone else.",
  setting: "Saturday, 6:10pm, three minutes after the form.",
  prep: ["Call within 5 minutes. Speed is the biggest advantage on inbound.", "Have her form answers open."],
  turns: [
    [R, "Hi Maria, it's Sam. You asked about getting past clients rebooking a couple of minutes ago. Is now an okay moment for two quick questions?", "Speed and context", "Reference what she just did. Ask permission."],
    [P, "Oh, wow, that was fast. Yes, I'm closing up."],
    [R, "Thanks. What made you fill it in today?", "Their reason", "Her reason tells you the urgency."],
    [P, "January was slow and I know we have hundreds of old clients who just stopped coming."],
    [R, "Roughly how many clients are in your booking system?", "Size", "One number at a time."],
    [P, "Maybe 1,800. Probably half haven't been in this year."],
    [R, "And an average visit?", "Value", "Short."],
    [P, "About ninety dollars."],
    [R, "So if even 5% of those 900 came back once, that's around four thousand dollars, and most of them come back again. Would a 20-minute call on Monday or Tuesday morning work to plan it?", "Conservative maths, two options", "5% is believable. Mention the repeat visits; that's where the value is."],
    [P, "Tuesday at 10, before clients."],
    [R, "Tuesday at 10. One thing to have ready: can you export your client list from your booking app? I'll show you how if not.", "Prepare her", "Asking for the list makes the meeting concrete."]
  ],
  avoid: ["Waiting until Monday to call a Saturday lead.", "Pitching price on the first call.", "Promising a number of bookings."],
  take: ["Call within 5 minutes.", "Ask what made them reach out today.", "Use small, believable percentages."],
  drill: "r-book" });

pb({ id: "noshow", cat: "Inbound and follow-up", title: "No-show: rebook without guilt", names: { R: "You", P: "Greg, owner" },
  situation: "Greg booked a 15-minute call for 10am. It's 10:08 and he hasn't joined.",
  goal: "Rebook warmly and get the meeting held.",
  setting: "10:08am, his mobile.",
  prep: ["Wait 5 to 8 minutes, then call once.", "Have two new times ready."],
  turns: [
    [R, "Hi Greg, it's Sam. We had 10am on the calendar. I figured something came up. Is now still good, or shall we find another time?", "No guilt", "Assume the best. Give him an easy way out."],
    [P, "Oh man, I'm sorry, I'm at a job. Totally forgot."],
    [R, "No problem at all, that's the job. Would tomorrow at 7:30am before the day starts work, or Thursday at 5?", "Two new times", "Pick times when he isn't on jobs."],
    [P, "Tomorrow at 7:30."],
    [R, "Done. I'll text you a reminder tonight with the link. And it'll still be fifteen minutes.", "Reminder and length", "The reminder and the time limit both raise the show rate."]
  ],
  avoid: ["\"I waited for you.\"", "Emailing only. Call within 10 minutes.", "Rebooking more than two days out."],
  take: ["Call within 10 minutes of a no-show.", "No guilt; offer two new times.", "Send a reminder the night before."],
  drill: "r-confirm" });

pb({ id: "quiet-proposal", cat: "Inbound and follow-up", title: "The proposal that went quiet for 10 days", names: { R: "You", P: "Sandra, co-owner" },
  situation: "You sent a proposal to a landscaping company 10 days ago after a good meeting. No reply to two emails.",
  goal: "Find out what's really happening, without chasing.",
  setting: "Monday, 8am, her mobile.",
  prep: ["Re-read your discovery notes: what did she say the problem cost?", "Be ready for a real no. That's useful too."],
  turns: [
    [R, "Hi Sandra, it's Sam. I sent over the proposal a couple of weeks ago and I haven't heard back, which usually means it's not a priority right now, or something isn't right. Which is it?", "Name the silence", "Saying what silence usually means, with an easy no, gets the truth faster than \"just checking in\"."],
    [P, "Honestly, my husband thinks it's too much right now."],
    [R, "That's fair, thanks for telling me. When you say too much, is it the monthly price, or doing it now in the busy season?", "Clarify", "Separate money from timing."],
    [P, "Timing, mostly. We're slammed until June."],
    [R, "That makes sense. When we spoke, you said you lose about ten quote requests a month in spring. Is that still happening right now?", "Return to their problem", "Bring back the cost she told you, in her words."],
    [P, "Yes, worse actually."],
    [R, "Would it help if we started with only the quote follow-ups, which takes nothing from your team, and add the rest in June? Could the three of us talk for ten minutes this week, maybe Wednesday at 6pm?", "Smaller start, bring in the partner", "A smaller first step answers the timing worry. Including the husband deals with the real decision maker."],
    [P, "Wednesday at 6 could work."],
    [R, "Great, I'll send it to both of you.", "Lock in", "Short."]
  ],
  avoid: ["\"Just checking in.\"", "Dropping the price straight away.", "Sending a third email instead of calling."],
  take: ["Name what silence usually means and ask which it is.", "Separate money from timing.", "Bring in the partner who is really deciding."],
  rp: "price-think", drill: "p-think" });

pb({ id: "referral-ask", cat: "Inbound and follow-up", title: "Asking a happy client for an introduction", names: { R: "You", P: "Dave, client" },
  situation: "Dave has been a client for 60 days. Last week he booked 14 jobs from after-hours calls.",
  goal: "Get one warm introduction to another owner.",
  setting: "End of the monthly review call.",
  prep: ["Have his result in money ready.", "Think of the type of business he'd know (supply-house contacts, other trades)."],
  turns: [
    [R, "Before you go, Dave, fourteen jobs from after-hours calls last month at around four hundred each, that's about fifty-six hundred. How does that feel?", "Make the win concrete", "Ask for a referral only right after he's said the result out loud."],
    [P, "Honestly, it's the best thing I've done this year."],
    [R, "That's great to hear. Who else do you know, maybe from the supply house or another trade, who has the same problem with calls?", "Ask a specific question", "\"Who else do you know\" with a category is easier than \"know anyone?\""],
    [P, "Ricky, he does HVAC. He complains about it all the time."],
    [R, "Would you be okay sending him a quick text introducing us? I can write it for you if that's easier.", "Make it easy", "Offering to write the text removes the effort."],
    [P, "Sure, send me something."],
    [R, "I'll text you three lines now. Thanks, Dave, I'll look after him.", "Promise care", "Reassure him the referral is safe with you."]
  ],
  avoid: ["Asking before he's seen results.", "\"If you know anyone...\"", "Contacting the referral before Dave has introduced you."],
  take: ["Ask right after he says the win out loud.", "Name a category of person.", "Write the introduction text for him."] });

/* ================= DISCOVERY ================= */

pb({ id: "discovery-hvac", cat: "Discovery", title: "Discovery call: the full question sequence", names: { R: "You", P: "Jen, owner" },
  situation: "Jen co-owns an HVAC company with 8 techs in Raleigh. She booked 20 minutes after a cold call last week.",
  goal: "Find the problem, its cost and her reason to fix it now, and earn the right to show a solution.",
  setting: "Zoom, Thursday 9am.",
  prep: ["Write down what she said on the cold call.", "Have the question sequence open (lesson 8.2).", "Don't prepare slides. You'll only show something if she asks."],
  turns: [
    [R, "Thanks for making time, Jen. Here's what I suggest: I ask some questions about how calls work for you now, you ask me anything, and at the end we decide together if a next step makes sense, or not. Is that okay?", "Frame the call", "Agreeing the plan up front makes it normal to decide at the end."],
    [P, "Sounds good."],
    [R, "On the phone you mentioned summer is chaos. Walk me through what happens to a call on a busy July afternoon.", "Situation", "Start from her words and ask for a story."],
    [P, "Two people in the office. If they're both on calls, it rings out. After 6, it goes to my cell."],
    [R, "How's that working?", "Problem", "Open, neutral. Let her judge it."],
    [P, "Not great. My office manager quit in August partly because of the phones."],
    [R, "I'm sorry to hear that. What did that cost the business, beyond the calls?", "Consequence", "Bigger than missed calls: people. Let her say it."],
    [P, "Three weeks of chaos, overtime, and I was answering phones instead of running the company."],
    [R, "If you could fix the phones, what would be different next summer?", "Desired outcome", "Have her describe the future in her words."],
    [P, "My team wouldn't burn out, and we'd book every job we can actually do."],
    [R, "What's stopped you fixing it before now?", "Obstacle", "Brings out the real objection early."],
    [P, "I tried an answering service. Customers hated it, they just took messages."],
    [R, "So you want calls booked, not messages, and it has to sound good to your customers. If that were possible, how soon would you want it in place?", "Gap and commitment", "Say back the gap and the conditions. The timing question tests urgency."],
    [P, "Before May. That's when it starts."],
    [R, "Then it makes sense to show you how a booked call would sound for your company. Would you want your co-owner on that call too?", "Earn the presentation, bring in the partner", "You've earned the right to present. Ask about other decision makers now, not at the end."]
  ],
  avoid: ["Presenting before you understand the cost.", "Asking two questions at once.", "Filling silence after a big question."],
  take: ["Frame the call so a decision at the end is normal.", "Go from situation to problem to consequence to desired outcome.", "Find the obstacle early.", "Ask about other decision makers before you present."],
  rp: "price-think", drill: "p-close" });

pb({ id: "discovery-partner", cat: "Discovery", title: "Two owners on the call: spouse and partner", names: { R: "You", P: "Tom and Amy, owners" },
  situation: "Tom runs the trucks, Amy runs the money. Amy is sceptical; Tom wants it.",
  goal: "Get both of them to agree the problem before you talk about price.",
  setting: "Zoom, Tuesday 7pm, both on camera at the kitchen table.",
  prep: ["Plan to ask Amy a question in the first two minutes.", "Expect the money question from Amy."],
  turns: [
    [R, "Thanks both of you. Amy, before we start, what would make this call worth your time?", "Ask the sceptic first", "Giving the sceptic the first word turns her into a participant."],
    [P, "Honestly, I want to know what it costs and whether it pays for itself."],
    [R, "That's exactly the right question. Can I ask a few questions first so the answer is about your numbers, not a guess?", "Respect it, earn time", "Agree with her priority and explain why you need questions first."],
    [P, "Fine."],
    [R, "Tom, roughly how many calls a week do you miss?", "Situation from the one who knows", "Tom knows the calls; Amy knows the money."],
    [P, "Tom: Fifteen, twenty in summer."],
    [R, "Amy, what's an average job worth when you look at the books?", "Value from the one who knows", "Asking Amy for the money number makes her the authority on it."],
    [P, "Amy: About three-fifty."],
    [R, "So fifteen calls, say half real jobs, at three-fifty. That's about twenty-six hundred a week at stake. Amy, does that match what you see?", "Let the sceptic confirm", "When the sceptic confirms the number, the decision is mostly made."],
    [P, "Amy: It's in the right range."],
    [R, "Then the question is whether booking even a third of those pays for itself. Shall I show you how that would work, and then the price?", "Agree the test", "Sets a simple test for the price: does it pay for itself?"]
  ],
  avoid: ["Talking only to the friendly partner.", "Answering the price question before you know their numbers."],
  take: ["Speak to the sceptic first.", "Ask each partner what they know best.", "Let the sceptic confirm the number."] });

/* ================= CLOSING ================= */

pb({ id: "close-price", cat: "Closing", title: "\"That's more than I expected\"", names: { R: "You", P: "Owner" },
  situation: "You've shown the solution and the price: $497 a month. The owner pauses.",
  goal: "Find out whether it's really the price, and get a decision.",
  setting: "End of a Zoom meeting.",
  prep: ["Know the value he agreed in discovery.", "Decide in advance what you can trade (term, setup fee), not discount."],
  turns: [
    [P, "Hmm. That's more than I expected."],
    [R, "That's fair. Can I ask, more than you expected compared to what?", "Clarify", "Find the comparison: another quote, a budget, or nothing."],
    [P, "I don't know. I thought it'd be like two hundred."],
    [R, "Okay. Setting the price aside for a second, if it were two hundred, would you want to start?", "Separate money from belief", "If he says no, price isn't the real issue."],
    [P, "Yeah, I think it'd work."],
    [R, "Then let's look at it on your numbers. You said about twenty missed calls a week, and half are real jobs at four hundred. If this books even three extra jobs a month, that's twelve hundred against four ninety-seven. Is that maths right, or am I missing something?", "Compare cost with the cost of the problem", "Use the number he agreed earlier. End by inviting correction."],
    [P, "No, that's right."],
    [R, "So is it the monthly amount, or is it that you're not sure it'll book those three jobs?", "Find the real doubt", "Usually it's doubt, not money."],
    [P, "I guess I'm not sure it'll work for us."],
    [R, "That's fair. We start with a 30-day pilot on after-hours calls only. If it doesn't book at least three jobs in that time, you can cancel. Does that feel like a fair way to find out?", "Reduce the risk, not the price", "Lower the risk with terms, and keep the price."],
    [P, "Yeah, that's fair."],
    [R, "Great. I'll send the agreement now. Shall we set it up this Thursday?", "Ask clearly", "Ask for the decision and the next step together."]
  ],
  avoid: ["Dropping the price straight away.", "Re-pitching all the features.", "Talking during the pause after the price."],
  take: ["Ask \"compared to what?\"", "Separate money from belief.", "Lower risk with terms, not discounts.", "Ask for the decision clearly."],
  rp: "price-think", drill: "r-price" });

pb({ id: "close-think", cat: "Closing", title: "\"Let me think about it\"", names: { R: "You", P: "Owner" },
  situation: "End of a good meeting with a roofing owner. You've asked for the decision.",
  goal: "Find out what he needs to think about, and agree a clear next step.",
  setting: "In person at his office.",
  prep: ["Expect it. Most owners say it by habit.", "Have a follow-up time ready."],
  turns: [
    [P, "This looks good. Let me think about it."],
    [R, "Of course. Usually when someone says that, something isn't clear yet. Is it the price, the timing, or whether it'll work for you?", "Defuse and isolate", "Make it normal, then offer the three usual reasons."],
    [P, "Timing, I guess. We've got a lot going on."],
    [R, "That makes sense. If it were three months from now, would it be a yes?", "Test it", "Is timing real, or a polite no?"],
    [P, "Probably, yeah."],
    [R, "What would be different in three months?", "Clarify", "Often nothing is."],
    [P, "Honestly, nothing. We'll still be busy."],
    [R, "Then is it better to set it up now, while it's busy, so it's working before the next storm? We can start with estimates only, so it takes nothing from your team.", "Smaller first step", "Turn \"busy\" into the reason to start."],
    [P, "Okay. Estimates only. Let's do it."],
    [R, "Great. I'll send the agreement now and we'll set it up Thursday.", "Lock in", "Agree the next step before you leave."]
  ],
  avoid: ["\"Sure, take your time, call me when you're ready.\"", "Pushing harder or adding fake urgency."],
  take: ["Make the stall normal, then ask what's unclear.", "Test whether timing is real.", "Offer a smaller first step."],
  rp: "price-think", drill: "p-think" });

pb({ id: "close-discount", cat: "Closing", title: "\"Can you do it cheaper?\"", names: { R: "You", P: "Owner" },
  situation: "The owner wants to go ahead but asks for 30% off.",
  goal: "Keep the price, trade something, and close.",
  setting: "Phone, after the proposal walkthrough.",
  prep: ["Decide what you can trade: a longer term, upfront payment, a case study.", "Never discount without getting something back."],
  turns: [
    [P, "We're in. Can you do it for three-fifty instead of five?"],
    [R, "I appreciate you being straight. Before I answer, is the price the only thing between us and starting?", "Isolate", "Make sure it's the last issue."],
    [P, "Yeah, that's it."],
    [R, "I can't change the monthly price, because it's the same for every client. What I can do is waive the setup fee if you commit to six months, and I'd ask you for a short review once you've seen results. Would that work?", "Trade, don't discount", "Fairness to other clients is a strong reason. Give something only in exchange."],
    [P, "Six months, no setup fee. Okay."],
    [R, "Great. I'll update the agreement and send it in five minutes.", "Close", "Short and quick."]
  ],
  avoid: ["Agreeing straight away. It tells him the price was made up.", "Discounting the monthly price."],
  take: ["Isolate: is price the only issue?", "Trade terms, not price.", "Get something back for anything you give."] });

/* ================= MESSAGES AND EMAIL ================= */

pb({ id: "linkedin-agency", cat: "Messages and email", title: "LinkedIn: agency owner who accepted your request", names: { R: "You", P: "Hassan, agency owner" },
  situation: "Hassan runs a 12-person marketing agency in Dubai. He accepted your connection request. He posts about client churn.",
  goal: "Move from a chat to a 15-minute call without pitching.",
  setting: "LinkedIn messages, over two days.",
  prep: ["Read his last three posts.", "Have one sentence about what you do, in his language."],
  turns: [
    [R, "Thanks for connecting, Hassan. Your post about clients leaving after month 3 was spot on. Is that something you're seeing more of this year, or just a few clients?", "Start from his post", "Shows you read his work. Ends with an easy question."],
    [P, "More this year. Clients want results faster."],
    [R, "Makes sense. When a client leaves, is it usually results, or that they can't see the results?", "Ask a sharper question", "A smart question earns more replies than a pitch."],
    [P, "Honestly, the second. Reporting is weak."],
    [R, "That's fixable. I help agencies set up weekly reports clients actually read. Worth a 15-minute call to see if it would fit? I'm free Tuesday 11am or Wednesday 3pm Dubai time.", "Offer only after the problem", "One line about you, then a specific ask in his time zone."],
    [P, "Wednesday 3pm."],
    [R, "Great, sending an invite. What's the best email?", "Move off the platform", "Book it in a calendar, not in chat."]
  ],
  avoid: ["A pitch in the first message.", "Long messages. Keep each under three lines.", "Sending a link in the first message."],
  take: ["Start from something he posted.", "Ask before you tell.", "Move off the platform once there's interest."] });

pb({ id: "instagram-salon", cat: "Messages and email", title: "Instagram: salon owner, story reply", names: { R: "You", P: "Sofia, salon owner" },
  situation: "Sofia owns a salon in Miami. You've liked and commented on her posts for two days. She posted a story about an empty Tuesday.",
  goal: "Turn a story reply into a short call about bringing back past clients.",
  setting: "Instagram DMs.",
  prep: ["Warm up first: like and comment for 2 to 3 days.", "Reply to a story, not out of the blue."],
  turns: [
    [R, "(Story reply) Empty Tuesdays are the worst. Do you usually fill them with regulars, or new clients?", "Reply to her story", "Relevant, light, and a question."],
    [P, "Regulars mostly. But a lot of them haven't been in for months."],
    [R, "Happens to most salons I talk to. Roughly how many clients haven't been back since summer?", "Size it", "Normalise, then a number."],
    [P, "Probably 400? I've never checked."],
    [R, "If even 20 of them came back for one visit, that's a busy week. I help salons send a friendly win-back message to old clients. Want me to show you what one looks like? 10 minutes, Monday or Tuesday morning?", "Small, believable", "Use a small number and offer to show, not sell."],
    [P, "Sure, Monday 10am."],
    [R, "Perfect. What's the best number or email for the invite?", "Move off the platform", "Short."]
  ],
  avoid: ["\"Hey girl\" or overly familiar openers.", "Promising a number of bookings.", "Messaging her old clients without their consent."],
  take: ["Warm up before you message.", "Reply to a story with a question.", "Keep numbers small and believable."] });

pb({ id: "email-reply", cat: "Messages and email", title: "Cold email: positive reply and \"who is this?\"", names: { R: "You", P: "Prospect" },
  situation: "Your first email went out Tuesday 7am to plumbing owners. Two replies come in.",
  goal: "Book the interested one within the hour; turn the confused one into a conversation.",
  setting: "Email, Tuesday morning.",
  prep: ["Reply within the hour.", "Keep replies under 60 words."],
  turns: [
    [P, "(Reply 1) Interested. How does this work?"],
    [R, "Thanks, Ray. Short version: it answers the calls your team can't and books the job into your calendar. Easier to show than explain. 15 minutes Thursday at 9 or Friday at 2? Here's my calendar if neither works: [link]", "Short answer, then book", "Don't send a long explanation. Book the call."],
    [P, "(Reply 2) Who is this? How did you get my email?"],
    [R, "Fair question, Jim. I'm Sam, I work with plumbing companies in Texas, and your email is on your website. I emailed because plumbers tell me they lose jobs after hours. If it's not relevant, just say so and I won't email again.", "Honest and easy to say no", "Answer both questions truthfully, then offer an easy way out."],
    [P, "(Jim) Actually it is a problem. What do you charge?"],
    [R, "Depends on your call volume, so I'd rather not guess. 15 minutes would tell us both if it's worth it. Thursday at 10 or 3?", "Earn the right to answer price", "Don't price before you know his numbers."]
  ],
  avoid: ["Long replies with attachments.", "Being defensive when asked how you got their email.", "Pricing by email."],
  take: ["Reply within the hour.", "Answer \"who is this?\" honestly with an easy no.", "Book the call; don't explain by email."],
  rp: "email-reply" });

pb({ id: "video-reply", cat: "Messages and email", title: "Personal video, then the follow-up", names: { R: "You", P: "Prospect" },
  situation: "You recorded a 45-second video of a roofing company's website and Google reviews for your best prospect.",
  goal: "Get a reply and a short call.",
  setting: "Email, Monday 7am. Your video tool shows he watched it twice.",
  prep: ["Record only for your best prospects.", "Show something specific: his reviews, his site on a phone."],
  turns: [
    [R, "Subject: quick video for Apex Roofing\n\nHi Mike, I made a 45-second video about follow-ups on your estimates after the storm. Worth a look? [link]", "Plain link, one line", "No embed, no long text. The video does the work."],
    [P, "(Watched twice, no reply.)"],
    [R, "(Next morning) Thanks for watching, Mike. Does that match what's happening with your estimates right now? Happy to walk through it in ten minutes.", "Follow up on the view", "A light question, not a chase."],
    [P, "Yeah, that's us. Can you do Thursday morning?"],
    [R, "Thursday at 7 before the crews go out? Sending the invite now.", "Book it", "Offer a time that fits his trade."]
  ],
  avoid: ["Videos over 60 seconds.", "Saying \"I saw you watched it twice\"."],
  take: ["Use video for your best prospects.", "Show something specific to them.", "Follow up the day after a view."] });

})(window.OSI);
