(function (O) {
/* ---------- Objection bank ---------- */
O.OBJ_CATS = ["Price", "Trust", "Timing", "Authority", "Status quo", "Tech and legal", "Cold call", "Closing"];
function ob(cat, q, means, reply, ask) { O.OBJ.push({ cat: cat, q: q, means: means, reply: reply, ask: ask }); }

ob("Price","It's too expensive.","Usually doubt about the result, sometimes a real cash problem. Find out which before you answer.","That's fair, it's a real investment. Setting the price aside for a second: do you feel this would actually fix [the problem]? [If yes:] Then it's about the money, not whether it works. You said [the problem] costs about [their number] a month. How does the price look next to that?","Expensive compared to what?");
ob("Price","Someone can do it cheaper, or for free.","They think the work is simple and the cost is only the setup.","Could be, and if it works out, great. The cost is rarely the setup. It's the tuning and support after, and what it costs you when it doesn't work. What would happen if the cheaper option missed calls for a month?","Who would fix it when something goes wrong?");
ob("Price","What does it cost? (asked too early)","Price-shopping before they know if it fits.","Fair question. It depends on [volume and what you need], so I'd rather not guess. Can I ask two quick questions, and then give you a real number?","How many [calls / leads / jobs] a month do you handle?");
ob("Price","I can't commit to a long contract.","Fear of being stuck if it doesn't work. A trust and risk concern, not a price one.","Completely fair. If it's not working, you shouldn't be stuck with it. We can start month to month with a clear measure for the first 30 days, so you only stay if it works. [ADD only terms you offer.]","What would you need to see in 30 days to feel good about continuing?");
ob("Price","Can you give me a discount?","Testing for flexibility, or cash is genuinely tight.","I keep pricing the same for everyone, so it stays fair. If budget is the issue, I can change the scope, start smaller or spread the setup. What matters most to you: the full coverage, or a lower monthly number?","If the price were right, would you start this week?");
ob("Price","We don't have the budget.","Either money is truly short, or the problem doesn't feel worth funding yet.","Understood, no pressure. Can I ask: if money weren't a factor at all, would you want to go ahead? [If yes:] Then let's look at what's possible: a smaller start, payment terms, or timing. [If unsure:] Then let's talk about that first, because budget won't fix doubt.","If budget weren't an issue, how would you feel about it?");

ob("Trust","How do I know you're legit?","You're new or unknown, and they're risking money.","Fair to ask, I'd ask the same. You don't have to take my word for it: [ADD real proof, a live demo on your numbers, a small pilot, a written agreement]. What would you need to see to feel comfortable trying a first step?","What would give you confidence to try a small first step?");
ob("Trust","I tried something like this before and it didn't work.","They were burned, and expect the same again.","Thanks for telling me, that's really useful. What happened? [Listen fully.] So the problem was [their words]. Here's how we handle that part differently. Does that address it, or is there more to it?","What specifically didn't work last time?");
ob("Trust","What if it doesn't work for me?","Fear of a loss they can't recover. The likelihood belief is weak.","That's the right question. Let's define what 'working' means for you, put a date on checking it, and [ADD only the guarantee you can honour]. Would that make it feel safe enough to try?","What would 'working' look like for you?");
ob("Trust","Can I talk to a customer of yours?","They want proof from someone like them.","Yes, where I can. [ADD references you have permission to share.] If I don't have one in your exact situation yet, I'll tell you straight and we can start with a small pilot so you judge for yourself.","What would you want to ask them?");
ob("Trust","That sounds too good to be true.","Something earlier sounded like hype.","You're right to be careful. Here's exactly what I can and can't promise: [honest scope]. Which part sounds the least believable? Let's look at that one.","Which part sounds the least believable?");
ob("Trust","Why should I pick you over a bigger company?","They're comparing credibility and risk.","Good question. A bigger company gives you a brand. I give you [speed / direct access / a setup built for your business]. Honestly, if a brand is what matters most, a bigger company might be better. What matters most to you?","What matters most to you in who you work with?");

ob("Timing","Just send me some info.","A polite way to end the call, or quiet interest. Find out which.","Happy to. So I don't send you something useless, what would you want it to show you? [If they answer:] Honestly, five minutes now would answer that better than a PDF. [If not:] No problem, I'll send it and follow up Thursday.","What is the one thing you would most want to see?");
ob("Timing","We're slammed right now.","No bandwidth to think about it.","Totally get it. Out of curiosity, when you're this busy, what happens to the calls you can't pick up? [Listen.] That's usually when it costs the most. Setup takes [time] and one short call from you. Would 15 minutes next week be easier?","When is it a little quieter for you?");
ob("Timing","Call me back in a few months.","Not a priority, or a polite brush-off.","Sure. So I don't call at a bad time again, what will be different in a few months? [Listen.] And meanwhile, what happens to [the problem]? [If it's real:] Is waiting worth that? [If not:] OK, I'll call on [specific date].","What would need to change for this to become a priority?");
ob("Timing","I need to think about it.","There's one unspoken concern: price, whether it works for them, or timing.","Of course, it's worth thinking about. Usually when someone says that, there's one part they're not sure about. Is it the price, whether it'll work for you, or the timing? [If they won't say:] Picture six months from now. If nothing changes, where are you? And if you'd started today?","Is it the price, the results, or the timing?");
ob("Timing","It's our busy season, ask me after.","A real constraint, or a delay.","Makes sense. If the busy season is when [the problem] costs the most, would you rather have it fixed before the rush, or after it's already cost you? What would starting in two weeks look like?","What would you need to be ready before the rush?");

ob("Authority","I need to talk to my partner.","A real second decision maker, or cover for their own doubt.","Of course, they should be part of this. If it were only up to you, would you go ahead? [Listen.] What do you think they'll ask first? It might be easiest if I join for ten minutes so they can ask me directly. Tonight or tomorrow morning?","If it were only up to you, where would you be?");
ob("Authority","I'm not the one who handles that.","A gatekeeper, or no authority.","No problem, thanks for telling me. Who would be the right person? I'll keep it short for them. What's the best time to reach them, and can I mention you pointed me their way?","What's the best way to reach them?");
ob("Authority","I have to run it by my team.","A group decision, or a delay.","Makes sense. Who's on the team, and what will they care about most? I can do a short call with them, or give you a one-page summary that answers their questions. Which would help more?","Can I join a short call with the team?");

ob("Status quo","We already have a provider.","They think the problem is solved.","Good, that's probably part of why you've got the business you have. Out of curiosity, how well does it handle [the specific gap, e.g. nights and weekends]? If it's covering everything, I'll leave you alone.","Is that for everything, including [the gap], or mostly [the easy part]?");
ob("Status quo","We don't have that problem.","They don't see the gap, or it's genuinely small.","That's great if so. Most owners don't see it because it never shows up on a report. Would it be a bad idea to check, say, how many calls went to voicemail last week? If it's close to zero, you're right and I'll get out of your hair.","How would you know if it were happening?");
ob("Status quo","Someone in the office handles it.","A person covers it, so it feels solved.","Good, that's a real strength. What happens when they're busy on another call, off shift or out sick?","How much comes in after hours or at lunch?");
ob("Status quo","We've got enough work already.","Growth isn't the goal right now.","Good problem to have. Is the aim more about keeping the work you've got more profitably, and getting some evenings back? That's often where [offer] helps most.","What would you change about the work you have today?");
ob("Status quo","If it ain't broke, don't fix it.","Change feels risky.","Agreed, no point fixing what works. Can I ask one thing: of the last ten [calls / leads], how many turned into a booked job? [Listen.] Is that where you'd want it?","What would 'broken' look like for you?");

ob("Tech and legal","Will it work with my software?","They don't want a tool that breaks how they work.","Let me be straight: [ADD the integrations you actually support]. If we can't connect directly, details go to your [calendar / text / email] so nothing is lost. What matters most in how the information reaches you?","What matters most in how the information reaches you?");
ob("Tech and legal","What about call recording and privacy?","Legal worries.","Good question. Calls announce recording at the start, and we set it up to your requirements. Rules vary by state, so I'd suggest confirming with your attorney. Do you have a policy we should follow?","Do you have a recording policy we should follow?");
ob("Tech and legal","Who owns the data and the number if I leave?","Fear of lock-in.","You do. It's in the agreement [ADD only if true], and I'd help with the handover if you ever left. Want me to show you that part?","Would you like to see that clause?");

ob("Cold call","Not interested.","A reflex to end an unexpected call.","That's fine, I haven't really said anything you could be interested in yet. Can I ask one thing, then you decide: is [the problem] something you deal with at all, or not really?","Is it the timing, or the topic?");
ob("Cold call","How did you get my number?","Suspicion.","It's the business number listed on [your website / Google]. Sorry for the interruption. If you'd rather I didn't call, I'll take you off my list right now.","Would you like me to take you off my list?");
ob("Cold call","Remove me from your list.","Stop contacting me.","Done, you're removed. Sorry for the interruption, have a good day.","(No question. Remove them immediately and log it.)");
ob("Cold call","Who is this? What's this about?","They need context, fast.","It's [name], [Dave]. We haven't spoken. I work with [industry] owners who [problem]. Is that something you deal with, or not really?","Is that something you deal with?");
ob("Cold call","I'm in a meeting / driving.","Bad timing, or a brush-off.","No problem, I'll be quick to let you go. Better tomorrow morning, or later this afternoon?","What's the best time to reach you this week?");
ob("Cold call","Are you a robot?","They suspect an automated call.","[If you are a person:] No, real person, calling from [place]. [If it is an AI system, say so plainly at the start. Never deny it.]","(Answer honestly and continue.)");

ob("Closing","Let me get a few quotes first.","A normal comparison, or a way to delay.","Smart, you should. So you compare like for like, what will you look at besides price? [Listen.] Based on what you told me matters, here's how we stack up on those. If it helps, I'll give you the questions I'd ask each provider.","What will decide it for you?");
ob("Closing","Send me the contract and I'll review it.","Interest, with something still unresolved.","Happy to. Before I do: on a scale of 1 to 10, how sure are you this is the right fit? [If under 8:] What would make it a 10? [Then:] Let's go through the contract together for ten minutes so nothing is unclear.","When will you have read it? Can we book 10 minutes after?");

/* ---------- Cadences ---------- */
O.CAD = {
  multi: { label: "Two-week multichannel sequence (lesson 2.10)", steps: [
    { day:0, when:"Early morning", ch:"Email", a:"Short, problem-first email with a signal or personal line." },
    { day:0, when:"Midday", ch:"LinkedIn", a:"View their profile, then send a connection request with no note or a one-line note." },
    { day:2, when:"Mid-morning", ch:"Call + voicemail", a:"Call. If no answer, a 20-second voicemail that mentions the email." },
    { day:3, when:"Early morning", ch:"Email", a:"Reply in the same thread with one useful idea or example." },
    { day:5, when:"Mid-morning", ch:"Video", a:"45-second video on their website or Google listing (Module 6)." },
    { day:7, when:"Midday", ch:"LinkedIn or Instagram", a:"A short message if connected, or a story reply." },
    { day:9, when:"Late afternoon", ch:"Call", a:"Second call at a different time of day." },
    { day:13, when:"Early morning", ch:"Email", a:"Polite close: should I stop, or is this worth a look later in the year?" } ] },
  inbound: { label: "Inbound lead (they contacted you)", steps: [
    { day:0, when:"Within 5 minutes", ch:"Call + text", a:"Reply by name with one line about their request, then call. Speed matters most." },
    { day:0, when:"+30 minutes if no answer", ch:"Text", a:"Short follow-up with two time options today." },
    { day:0, when:"Evening", ch:"Email", a:"Recap of their request and a clear next step." },
    { day:1, when:"Morning", ch:"Call", a:"Second attempt. If voicemail, leave 20 seconds." },
    { day:2, when:"Midday", ch:"Text", a:"New angle: one specific question or a short result." },
    { day:4, when:"Any time", ch:"Call + email", a:"Third attempt with new information." },
    { day:7, when:"Any time", ch:"Text", a:"Close the loop: keep this open or close it?" },
    { day:14, when:"Any time", ch:"Email", a:"Final note. Leave the door open." } ] },
  cold: { label: "Cold prospect", steps: [
    { day:1, when:"Business hours", ch:"Call + voicemail", a:"Trigger opener. Check do-not-call and hours first (lesson 7.6)." },
    { day:2, when:"Morning", ch:"Email", a:"Short problem question tied to the trigger." },
    { day:4, when:"Different time of day", ch:"Call", a:"Second attempt, new time." },
    { day:7, when:"Any time", ch:"Email", a:"One insight or data point you can support." },
    { day:10, when:"Business hours", ch:"Call + voicemail", a:"Social proof, only if real." },
    { day:14, when:"Any time", ch:"Email", a:"Break-up note." },
    { day:60, when:"Any time", ch:"Message", a:"Revive with something new." } ] },
  proposal: { label: "Proposal sent", steps: [
    { day:0, when:"Same day as the meeting", ch:"Email", a:"Recap, proposal, and the decision date you agreed." },
    { day:1, when:"Morning", ch:"Text", a:"Confirm it arrived. Ask if anything is unclear." },
    { day:3, when:"Any time", ch:"Email or text", a:"Add value: an answer to their question or a relevant result." },
    { day:5, when:"Business hours", ch:"Call", a:"Ask where they are in the decision." },
    { day:7, when:"Any time", ch:"Text", a:"Decision reminder. Mention a real limit on capacity only if true." },
    { day:10, when:"Any time", ch:"Message", a:"Close the loop: keep it open or close the file?" } ] },
  noshow: { label: "No-show recovery", steps: [
    { day:0, when:"+10 to 15 minutes after start", ch:"Call + text", a:"Friendly: 'Missed you, want to find another time?' Offer two options." },
    { day:1, when:"Morning", ch:"Email", a:"Short note with two new times and a booking link." },
    { day:3, when:"Business hours", ch:"Call", a:"One more attempt." },
    { day:7, when:"Any time", ch:"Text", a:"Final note. Offer to reconnect later." } ] },
  email: { label: "Cold email sequence", steps: [
    { day:1, when:"Tue to Thu morning", ch:"Email 1", a:"Observation, problem, one small ask, opt-out line." },
    { day:4, when:"Morning", ch:"Email 2 (same thread)", a:"A short new fact or one-line question." },
    { day:8, when:"Morning", ch:"Email 3", a:"A different angle, or offer a 60-second video." },
    { day:14, when:"Morning", ch:"Break-up email", a:"Polite close. Stop after this." } ] },
  social: { label: "Social outreach (LinkedIn, Facebook, Instagram)", steps: [
    { day:1, when:"Any time", ch:"Follow and engage", a:"View the profile, like a post, leave one real comment." },
    { day:2, when:"Any time", ch:"Connection note or first DM", a:"Short, relevant, no pitch, no link." },
    { day:5, when:"After they accept", ch:"Message 1", a:"Thank them and ask one easy question." },
    { day:9, when:"Any time", ch:"Message 2", a:"Add something useful. Ask if it matches their experience." },
    { day:14, when:"Any time", ch:"Message 3", a:"Offer a short call or a short video. Then polite close if no reply." } ] },
  video: { label: "Video outreach (Loom method)", steps: [
    { day:1, when:"Morning", ch:"Short text email", a:"One-line note about their business. No video yet." },
    { day:3, when:"Morning", ch:"Video link", a:"Send the 45-second video with one line of context." },
    { day:4, when:"After a view", ch:"Follow-up", a:"Thank them for watching and ask one light question." },
    { day:6, when:"Any time", ch:"Text-only nudge", a:"If not watched: 'Did my video arrive okay?'" },
    { day:10, when:"Any time", ch:"Different angle", a:"A short plain-text email with a new point." },
    { day:15, when:"Any time", ch:"Polite close", a:"Close the file and stop." } ] },
  revive: { label: "Lost deal or stalled lead", steps: [
    { day:0, when:"Right after the no", ch:"Message", a:"Thank them and ask for the reason, with no pressure." },
    { day:30, when:"Any time", ch:"Message", a:"Share a new result or improvement." },
    { day:60, when:"Any time", ch:"Call or message", a:"A quick question about whether their situation has changed." },
    { day:90, when:"Any time", ch:"Email", a:"Invite them to a refreshed conversation." } ] }
};

/* ---------- Call scorecard (0 missed, 1 partly, 2 done well) ---------- */
O.SC = [
  { key:"opener", label:"Opener was short and in my own words" },
  { key:"reason", label:"I stated why I was calling" },
  { key:"tone", label:"Slow, calm tone and pace" },
  { key:"talk", label:"I talked less than half the time" },
  { key:"questions", label:"Questions were open and went from problem to impact" },
  { key:"listen", label:"I used mirrors, labels or silence" },
  { key:"objection", label:"I acknowledged and clarified before answering objections" },
  { key:"ask", label:"I asked clearly for the next step or decision" },
  { key:"next", label:"A dated next step was agreed before ending" },
  { key:"notes", label:"I logged the call and sent a follow-up within an hour" }
];

/* ---------- Scripts (placeholders filled by the generator) ---------- */
O.SCR = [
  { key:"call", label:"Cold call opener", body:"Hey {{prospect}}, it's {{you}}. We haven't spoken before. I'm calling because {{reason}}. Is that something you deal with, or not really?" },
  { key:"voicemail", label:"Voicemail (20 seconds)", body:"Hi {{prospect}}, it's {{you}} from {{company}}. I'm calling because {{reason}}. I'd like to ask how you handle it at {{business}}. You can reach me on {{phone}}. That's {{phone}}. Thanks, {{prospect}}." },
  { key:"email1", label:"First email", body:"Subject: quick question, {{business}}\n\nHi {{prospect}},\n\n{{reason}}\n\nHow are you handling this at {{business}} today? If it is a problem, I have a short way to show what it costs on your numbers.\n\n{{you}}\n{{company}}\nIf you would rather not hear from me, reply stop." },
  { key:"fu1", label:"Follow-up (day 3)", body:"Hi {{prospect}}, one more thought on {{business}}: {{problem}} Is that something you're looking to fix, or not really a priority right now?\n\n{{you}}" },
  { key:"book", label:"Booking ask", body:"Not sure we're a fit yet. Would it be worth 15 minutes where I show you how other owners fixed this, on {{business}}'s numbers, and you decide if it makes sense? {{time1}} or {{time2}}?" },
  { key:"confirm", label:"Confirmation (text)", body:"Hi {{prospect}}, confirming {{time1}} for 10 minutes on {{business}}'s numbers. Reply YES to confirm. If anything changes, tell me and we'll move it. - {{you}}" },
  { key:"remind24", label:"24-hour reminder", body:"Hi {{prospect}}, a reminder for tomorrow at {{time1}}. To make it useful, please reply with roughly how many {{metric}} you handle a month. - {{you}}" },
  { key:"noshow", label:"No-show recovery", body:"Hi {{prospect}}, looks like we missed each other. Want to find another time? I have {{time1}} or {{time2}}. - {{you}}" },
  { key:"recap", label:"Post-meeting recap", body:"Hi {{prospect}}, thanks for your time. What I heard: {{problem}}. That's costing about {{cost}}. What we agreed: {{next}}. I'll hold your slot until {{date}}. - {{you}}" },
  { key:"breakup", label:"Break-up email", body:"Hi {{prospect}}, I haven't heard back, so I'll assume now isn't the right time and stop reaching out. If {{metric}} becomes a priority again, reply here and I'll pick it straight up. All the best, {{you}}" },
  { key:"email2", label:"Email follow-up 2 (day 8)", body:"Hi {{prospect}}, one more angle on {{business}}: {{problem}} Worth a 10-minute look on {{time1}} or {{time2}}?\n\n{{you}}" },
  { key:"li_connect", label:"LinkedIn connection note", body:"Hi {{prospect}}, {{reason}} I help companies like {{business}} with {{metric}}. Would be good to connect." },
  { key:"li_msg1", label:"LinkedIn message 1 (after accept)", body:"Thanks for connecting, {{prospect}}. Curious: how do you handle {{metric}} at {{business}} today?" },
  { key:"li_msg2", label:"LinkedIn message 2 (day 7)", body:"{{prospect}}, one thing I keep hearing from owners: {{problem}} Does that match what you see at {{business}}, or not really?" },
  { key:"li_msg3", label:"LinkedIn message 3 (ask)", body:"Would it help if I showed what that looks like on {{business}}'s numbers? Ten minutes {{time1}} or {{time2}}?" },
  { key:"fb_msg", label:"Facebook message", body:"Hi {{prospect}}, {{reason}} I have a couple of ideas that worked for similar shops. Want me to share them?" },
  { key:"ig_dm", label:"Instagram DM", body:"Hi {{prospect}}, {{reason}} Quick question: how do you keep up with {{metric}} when you are out on jobs?" },
  { key:"loom_line", label:"Video link message", body:"Hi {{prospect}}, I made a 45-second video about {{metric}} at {{business}}. Worth a look? [link]\n\n{{you}}" },
  { key:"loom_script", label:"45-second video script", body:"Hi {{prospect}}, I made this quick video for {{business}}.\n[Show their site or listing] {{reason}}\n[Insight] {{problem}}\nIf it is useful, I can show you what that looks like on your numbers. Ten minutes {{time1}} or {{time2}}?" },
  { key:"referral", label:"Referral ask", body:"Hi {{prospect}}, glad this is working for {{business}}. Who else do you know who has the same headache with {{metric}}? A short intro would mean a lot. - {{you}}" }
];

/* ---------- 30-day plan ---------- */
O.CAL = [
  "Write your offer sentence (lesson 1.2) and your ICP (lesson 2.1).",
  "Build a 100-lead list with source and tier (lesson 2.2).",
  "Research your 10 best leads in five minutes each (lesson 2.3).",
  "Read lessons 4.1 and 7.6, then write your one-page calling and email policy.",
  "Buy 2 sending domains, create 4 mailboxes, set SPF, DKIM and DMARC, and start warm-up (lesson 4.2).",
  "Get a US number and a dialer. Test your headset, connection and call quality (lesson 12.5).",
  "Weekly review: read this week's numbers in the daily log of your 30-day plan.",
  "Run a 45-minute call block. Log every outcome.",
  "Verify your email list and write your first cold email (lessons 4.3 and 4.4).",
  "Polish your LinkedIn, Facebook and Instagram profiles (lesson 5.2).",
  "Learn the first-objection pattern and drill the four common objections (lesson 3.4).",
  "Run a call block. Try one change to your opener.",
  "Warm up 20 prospects on social: follow, watch, leave one real comment each (lesson 5.1).",
  "Weekly review: find the weakest stage and pick one fix.",
  "Send 10 LinkedIn connection notes and 5 Instagram DMs (lessons 5.3 and 5.5).",
  "Record 5 personal videos for your tier A prospects (lessons 6.2 and 6.3).",
  "If warm-up has run two weeks or more, launch a 30-email test campaign (lesson 4.5).",
  "Practise the booking ask. Set up confirmations and reminders (lessons 7.3 and 7.4).",
  "Run a call block and follow up every social conversation.",
  "Reply to every positive reply within the hour. Log reply types (lesson 4.6).",
  "Weekly review: enter numbers and compare against week one.",
  "Practise the question sequence in a roleplay (lesson 8.2).",
  "Build your ten-minute presentation around one real prospect (lesson 9.2).",
  "Write your one-page proposal template with three options (lesson 9.4).",
  "Practise the full sales call out loud with a partner (lesson 10.2).",
  "Set up your CRM pipeline and booking link (lesson 12.6).",
  "Load your proposal follow-up cadence. Send break-up messages to dead leads (lesson 10.6).",
  "Record and score three calls. Pick one habit to fix (lesson 11.4).",
  "Monthly tool and cost review. Turn on two-factor authentication everywhere (lesson 12.8).",
  "30-day review: set targets for the next 30 days."
];
})(window.OSI);
