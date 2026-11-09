/* The Cold Manual: roleplay scenarios. Each beat: prospect line, then three replies scored 0 (weak), 1 (okay), 2 (strong). */
(function (O) {
O.RP = [];
O.RP_TAGS = {
  Opening: { lesson: "3.2", text: "Openers that earn a second sentence" },
  Questions: { lesson: "8.2", text: "The question sequence" },
  Objections: { lesson: "10.3", text: "What is behind an objection" },
  "Next step": { lesson: "7.3", text: "Booking the meeting" },
  Value: { lesson: "9.2", text: "Present on their numbers" },
  Tone: { lesson: "3.3", text: "Tone, pace and talk ratio" }
};
function o(t, s, tag, fb) { return { t: t, s: s, tag: tag, fb: fb }; }
function b(p, opts) { return { p: p, opts: opts }; }
function sc(id, title, channel, level, setting, persona, goal, beats) { O.RP.push({ id: id, title: title, channel: channel, level: level, setting: setting, persona: persona, goal: goal, beats: beats }); }

sc("owner-call", "Cold call to a busy plumbing owner", "Call", "Core", "You call a plumbing company owner you have never spoken to. You sell an AI call-answering service.", "Dave, owner of a four-truck plumbing company. Busy, direct, tired of sales calls.", "Agree a ten-minute demo.", [
  b("Yeah, this is Dave.", [
    o("Dave, it's [you]. We haven't spoken. I'm calling because plumbers tell me they lose calls when they're on a job. Is that something you deal with, or not really?", 2, "Opening", "Short, honest about the cold call, names a problem other owners have, and ends on a question with an easy no."),
    o("Hi Dave, how are you doing today? Hope I'm not catching you at a bad time!", 0, "Opening", "Small talk and an apology mark you as a salesperson in two seconds. Say who you are and why you called."),
    o("Hi Dave, I'm with [company]. We build AI agents that answer calls for plumbers. Do you have a minute?", 1, "Opening", "Clear, but it leads with your product and ends on a closed question that is easy to refuse.")
  ]),
  b("We're slammed right now. I don't have time for this.", [
    o("Sounds like business is good. I'll be quick: when you are under a sink and the phone rings, what happens to that call?", 2, "Objections", "Acknowledges, then asks one easy question about their world. You keep the call alive without arguing."),
    o("I totally understand, I just need two minutes to explain how our system works.", 0, "Objections", "You ignored what they said and asked for more time. That is pushing."),
    o("No problem. When is a better time to call back?", 1, "Next step", "Polite, but you leave without a single question. Ask one before you offer to call back.")
  ]),
  b("It goes to voicemail. Maybe half get answered.", [
    o("Half. About how many calls a week is that, and roughly what is an average job worth?", 2, "Questions", "Gets the two numbers you need to build the case on their figures."),
    o("Great, that's exactly what we fix. Our agent answers 24/7 with a natural voice and books the job straight into your calendar.", 0, "Value", "A pitch dump before you know the size of the problem. Ask first."),
    o("Wow, that's a lot of missed calls.", 1, "Questions", "A fair reaction, but it is a statement. Turn it into a question about volume and value.")
  ]),
  b("Maybe 15 a week. Average job's about four hundred bucks.", [
    o("If even a third of those were real jobs, what would that add up to in a week, roughly?", 2, "Value", "He does the math with his own numbers. A cost he works out himself is one he believes."),
    o("Cool. Our plan is a few hundred a month, so you'd earn it back on one job.", 1, "Value", "The link is good, but you quote a price before they have agreed the problem is real."),
    o("Okay. Do you want me to send over some pricing?", 0, "Value", "You skipped the whole point of the numbers. Nothing here has been confirmed.")
  ]),
  b("Huh. Two grand a week, maybe. That's more than I thought. So what do you want from me?", [
    o("Ten minutes. I'll show it answering a call for your business and you decide if it is worth it. Thursday at 9 or Friday at 2?", 2, "Next step", "Small ask, clear purpose, two specific times."),
    o("Can I just send you an email with the details?", 1, "Next step", "Low commitment, so low value. An email rarely gets read and gives you no next step."),
    o("Just let me know if you're interested and I'll get something over to you.", 0, "Next step", "You handed control back to a busy owner. Nothing is booked.")
  ])
]);

sc("email-brushoff", "\"Just send me an email\"", "Call", "Core", "Early in a cold call the owner tries to end it.", "Priya, office manager at a small HVAC business. Polite, wants the call over.", "Turn the brush-off into a real conversation or a booked time.", [
  b("Just send me an email.", [
    o("Happy to. So it's relevant, quick question: how are you handling calls that come in while the crew is out?", 2, "Objections", "Agrees, then asks a question that shows if there is any interest at all."),
    o("Sure, what's your email address?", 0, "Objections", "You accept the brush-off. The email will never be read."),
    o("I can do that. What would you want it to say?", 1, "Questions", "Better than giving in, but the question is vague. Ask about their situation instead.")
  ]),
  b("Honestly, we just let it go to voicemail and call back later.", [
    o("Sounds like a few never get called back, or they've already booked someone else. About how many a week, would you say?", 2, "Questions", "A label followed by a number question. They start thinking about the cost."),
    o("That's a mistake. Most customers call the next company straight away.", 0, "Tone", "Telling them they are wrong creates resistance. Let them find the cost themselves."),
    o("Okay. Do you want to hear how we can help with that?", 1, "Questions", "Polite, but a yes or no question that is easy to refuse.")
  ]),
  b("Maybe five or six. I never really counted.", [
    o("Since nobody has counted, would it help if I showed you how to track it? Ten minutes Thursday at 9 or Friday at 2?", 2, "Next step", "Offers something useful, keeps the ask small and gives two times."),
    o("Then you're losing business. We can fix that. Can I send you a quote?", 0, "Value", "You jumped to a price before any value was agreed."),
    o("Okay, I'll send the email and follow up next week.", 1, "Next step", "A follow-up is fine, but no time is agreed and the email still has no reason to be opened.")
  ])
]);

sc("price-think", "Price and \"I'll think about it\"", "Call", "Advanced", "You have run a good discovery call. Now the owner pushes back on price.", "Sam, owner of a plumbing and drain business. Careful with money, has been burned by software before.", "Keep the deal alive and agree a dated next step.", [
  b("Honestly, four hundred a month feels like a lot.", [
    o("Fair. Let's compare it to one number. You said an average job is four hundred and you miss about seven calls a week. Is it the amount, or whether it would pay back?", 2, "Objections", "Acknowledges, uses their numbers and asks what the concern really is."),
    o("I can do three hundred if you sign this week.", 0, "Objections", "A discount before you know the objection teaches them that your price is soft."),
    o("It's actually cheap compared to hiring a receptionist.", 1, "Value", "Comparing is useful, but it is defensive and about your price, not their gain.")
  ]),
  b("I guess it's whether it works. I've been burned by software before.", [
    o("It sounds like you have been burned before. What went wrong last time?", 2, "Questions", "A label and an open question. You learn the real fear."),
    o("Ours is different. We have great reviews.", 1, "Objections", "Claims without proof, and you did not learn what happened before."),
    o("Everyone says that until they try it.", 0, "Tone", "Dismissive. You are telling them their concern is not real.")
  ]),
  b("It never got set up. Took forever and then nobody used it.", [
    o("So the problem was set-up and follow-through, not the idea. We set it up for you in [N] days and start month to month with one check at 30 days: booked jobs. Would that remove most of the risk?", 2, "Value", "Addresses the exact fear and makes the risk small and measurable."),
    o("That won't happen with us.", 0, "Value", "A promise with nothing behind it."),
    o("Let me send you some case studies.", 1, "Value", "Proof helps, but you did not answer the worry or agree a next step.")
  ]),
  b("Okay. Let me think about it.", [
    o("Of course. Usually there's one part people aren't sure about. Is it the price, whether it'll work for you, or the timing? And let's put Thursday at 10 in, so you're not left chasing me.", 2, "Next step", "Turns the vague stall into a specific concern, and sets a dated decision call."),
    o("No problem. I'll check back next month.", 0, "Next step", "A month is too long. The deal will go cold."),
    o("Sure. Can you tell me what you're thinking about so I can help?", 1, "Questions", "Good instinct, but it is vague and still has no date.")
  ])
]);

sc("gatekeeper", "Getting past the gatekeeper", "Call", "Core", "Someone answers who is not the decision maker.", "Maria, front desk at a roofing company. Protective of the owner's time.", "Reach the owner or get a named contact and a time.", [
  b("Good afternoon, [company]. How can I help?", [
    o("Hi, it's [you]. Could you help me? I need to speak with whoever looks after the phones and booking, is that you or the owner?", 2, "Opening", "Calm, asks for help and a role, not a name. Gatekeepers respond to that."),
    o("Hi, can I speak to the owner please?", 1, "Opening", "Direct, but it triggers the standard screen: \"What is it about?\""),
    o("Hi, I'm calling about an opportunity to grow your business. Is the decision maker in?", 0, "Opening", "Sales phrases like \"opportunity\" and \"decision maker\" get you screened out.")
  ]),
  b("He's not available. What is this regarding?", [
    o("It's about calls that come in while the crew is on a roof. I'll be brief. When is he usually free, so I call when it suits him?", 2, "Objections", "Honest, short reason, and you ask for a time instead of leaving a message."),
    o("It's a business matter. Can you just put me through?", 0, "Objections", "Vague and pushy. That is exactly what screeners are trained to block."),
    o("It's about a sales service. Can I leave my number?", 1, "Next step", "Honest, but an owner will rarely call back a number left this way.")
  ]),
  b("He's usually in around 8 in the morning.", [
    o("Thank you, that helps. I'll call at 8:05 tomorrow. What's your name, so I can say you suggested the time?", 2, "Next step", "Gets a time, a name and a reason for the owner to take the call."),
    o("Great, I'll try him some time then.", 0, "Next step", "No time, no name. You will forget and so will they."),
    o("Thanks. Can I leave an email with you for him?", 1, "Next step", "Possible, but an email from a stranger rarely works. A timed call usually does.")
  ])
]);

sc("email-reply", "\"We already have someone\"", "Email", "Core", "You sent a cold email. This is the reply.", "Tom, owner of a landscaping firm. Replied in two lines.", "Keep the thread alive without arguing.", [
  b("We already have a company handling this.", [
    o("Thanks for the reply, Tom. That makes sense. Out of curiosity, how well are they picking up calls after hours? If they do it well, no need to change anything.", 2, "Objections", "Accepts the answer, asks a low-pressure question and gives them a way to be honest."),
    o("Are you sure they are doing a good job? Many companies like yours still miss a lot of calls.", 0, "Tone", "Challenges them and sounds like a sales sequence."),
    o("Understood. Would you like me to send some information in case that changes?", 1, "Next step", "Polite, but there is no reason to reply and no question that opens the door.")
  ]),
  b("They're okay. Not sure about nights and weekends.", [
    o("That is the gap I hear most. Would it be worth ten minutes to compare how nights and weekends are covered? No obligation to switch. Thursday at 9 or Friday at 2?", 2, "Next step", "Names the gap, keeps the ask small and gives two times."),
    o("Then you should definitely switch. We cover nights and weekends.", 0, "Value", "A pushy leap. They did not say they want to switch."),
    o("Let me know if you want a quote.", 1, "Next step", "Passive. Nothing moves.")
  ]),
  b("Send me something and I'll look.", [
    o("Will do. So I send the right thing, what matters more to you: more booked jobs, or fewer interruptions for your team?", 2, "Questions", "Sends something and uses the moment to learn what to put in it."),
    o("Sure. Attached is our full brochure and pricing.", 0, "Value", "A generic dump that nobody opens. You learned nothing."),
    o("Sure, I'll send a short summary today.", 1, "Next step", "Fine, but no question, and no date to follow up.")
  ])
]);

sc("dm-howmuch", "\"How much is it?\" in a direct message", "Social", "Core", "You sent a first message on Instagram or LinkedIn. They reply with a price question.", "Alex, owner of a home services business. Replying between jobs.", "Move to a short call without a price war.", [
  b("Thanks for reaching out. How much is it?", [
    o("Good question. It depends on how many calls you get and what you want connected. Two quick questions: roughly how many calls a week, and what is a typical job worth?", 2, "Questions", "Does not dodge, does not guess a number. Asks the two questions you need to give a real answer."),
    o("It starts at four hundred a month.", 1, "Value", "Honest, but the price floats with no value attached and you learned nothing."),
    o("It's a really great price, I promise it's worth it! Can I call you?", 0, "Tone", "Vague and pushy. Sounds like every other DM.")
  ]),
  b("Around 20 a week. Jobs are maybe 500.", [
    o("Thanks. If even 5 of those are missed, that is around 2,500 a week at risk. Easier to show than type. Ten minutes Thursday at 9 or Friday at 2?", 2, "Next step", "Reflects their numbers and asks for a short call with two times."),
    o("Great. Plans start at four hundred, and it goes up from there.", 1, "Value", "Gives the price, but no value or next step."),
    o("Awesome! Here is a link to our website with all the details.", 0, "Next step", "A link ends most conversations.")
  ]),
  b("Thursday at 9 is fine. Can you just text me the details?", [
    o("Yes. I'll send a calendar invite for Thursday at 9 and a text the morning before to confirm. What is the best number?", 2, "Next step", "Locks it in with an invite and a reminder."),
    o("Sure, I'll text you the details. Talk soon!", 1, "Next step", "No invite and no reminder. No-shows start here."),
    o("Great. Just show up when you can.", 0, "Next step", "A time without a confirmation is a no-show waiting to happen.")
  ])
]);
})(window.OSI);
