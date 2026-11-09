(function (O) {
var L = O.lesson;

/* ---------------- Program 4: Cold email ---------------- */

L({ p:4, n:1, t:"How cold email works, and the rules", min:10,
idea:"Cold email is a short, relevant note to a business contact, sent from a healthy domain, with an honest way to opt out.",
src:"",
md:`
## What cold email is good for
Cold email reaches decision makers who never pick up the phone. It scales, it leaves a written trail, and it works well beside calls and social messages. It is weaker for complex pitches, so keep the goal small: **get a reply, then get a short call.**

## The simple model
Replies come from four things multiplied together:
**deliverability x right person x relevant message x easy ask.**
If any one is near zero, the result is near zero. A perfect email that lands in spam gets nothing. A perfect inbox placement with a vague message gets nothing too.

## Set honest expectations
Reply rates vary a lot by list, offer and message. Treat any benchmark you read as a rough guide, and measure your own. A realistic early target is a steady trickle of replies and a few booked calls per few hundred emails, then improve from there.

## The rules you must follow
!> General information, not legal advice
!> Check your own situation with a qualified attorney.

- **United States (CAN-SPAM):** applies to commercial email, including business to business. Use your real name and a truthful from line, a subject that is not misleading, a valid physical postal address, and a clear way to opt out. Honour opt-outs promptly (the law allows up to 10 business days, so do it the same day). Penalties apply per email.
- **Mailbox provider rules:** Google and Yahoo tightened requirements for bulk senders in 2024. They expect proper authentication (SPF, DKIM and DMARC), easy unsubscribe for bulk marketing mail and low spam complaint rates (under 0.3 percent, and ideally far lower).
- **Other regions:** the UK, EU and Canada have stricter consent rules for some recipients. Canada's anti-spam law is especially strict. If you email outside the US, check the rules first.

## A simple compliance habit
Put a one-line opt-out and your company name and address in every email. Keep a suppression list of everyone who asks to stop, and never email them again.

> The two-sentence summary
> Send a short, honest, relevant email to a real business contact. Make it easy to say no, and respect it.
`,
drill:"Write your sender identity (name, company, address, opt-out line) and a suppression list in your sheet. Then list the countries of the prospects you plan to email and note which rules apply.",
quiz:[
["Which part of the simple model can ruin an otherwise perfect email?",["The signature","Poor deliverability, so it lands in spam","A short subject line","Using the prospect's name"],1,"If the email never reaches the inbox, the rest does not matter."],
["What should you do when someone asks to stop receiving your emails?",["Send one last follow-up","Add them to a suppression list and never email them again","Wait a month","Ask them to fill a form"],1,"Honour opt-outs immediately and permanently."]
]});

L({ p:4, n:2, t:"Set up so you land in the inbox", min:12,
idea:"Use separate sending domains, authenticate them properly, warm up slowly and keep volume low per mailbox.",
src:"", tool:"emailcheck",
md:`
## Never send cold email from your main domain
If your main domain gets flagged, your normal business email suffers too. Buy one to three look-alike domains for sending (for example, if your brand is acme.com, use tryacme.com or getacme.com), and redirect them to your main website.

## Mailboxes
Create two or three mailboxes per domain, each with a real person's name. A common approach is to use a mainstream mailbox provider for each. Spreading volume across several mailboxes keeps each one well below the limits where problems start.

## The three DNS records
| Record | What it does | Plain meaning |
|---|---|---|
| SPF | Lists which servers may send for your domain | "These servers are allowed to send as me" |
| DKIM | Adds a signature to each email | "This email was not altered, and really came from me" |
| DMARC | Tells receivers what to do if SPF or DKIM fail | "Check my mail and report problems" |

Set all three up before you send anything. Your email provider has step-by-step guides. A free tester, such as a mail-tester or DNS checker, will confirm they work.

## Warm up before you send
New mailboxes have no reputation. Warm-up means sending and receiving small, natural volumes of email for two to four weeks, so inbox providers learn your mailbox is real. Most sending platforms include a warm-up feature. Keep it running even after you start sending campaigns.

## Keep volume low
A common rule of thumb is to start with 10 to 20 cold emails a day per mailbox and rise slowly toward 30 to 50 only if bounce and spam rates stay healthy. Spread sends across the working day, not in one burst.

## Technical choices that help
- **Plain text** emails with no heavy design.
- **Zero or one link** in the first email. Add your domain's signature, no images.
- **No open tracking.** It adds a hidden image and is unreliable. Track replies, which are what matter.
- **Custom tracking domain** if you do track clicks.
- **Verify every email address** before sending, so your bounce rate stays under about 2 percent.

## Watch the health signals
Check bounce rate, spam complaints and replies weekly. If bounces rise or replies fall, pause the mailbox and fix the cause before sending more.

!> Do not rush this
!> Skipping setup is the most common reason cold email fails. A week of setup saves months of damage.
`,
drill:"Work through the Cold email pre-flight checklist. Do not send a single campaign email until every box is ticked.",
quiz:[
["Why use separate sending domains?",["They look more professional","To protect your main domain's reputation","They are cheaper","Mailbox providers require it"],1,"If a sending domain is flagged, your main business email stays safe."],
["What is warm-up for?",["To check your spelling","To build a sending reputation before real campaigns","To reduce your price","To collect replies"],1,"New mailboxes have no reputation, so they need a few weeks of natural activity."]
]});

L({ p:4, n:3, t:"Build and clean an email list", min:9,
idea:"One narrow list, one clear persona, every address verified.",
src:"", tool:"icp",
md:`
## One list, one persona
Do not send the same email to plumbers, dentists and gyms. Build one list for one type of business and one type of role, so the message can be specific. Aim for 200 to 500 contacts per campaign.

## Where to find emails
- Company websites (contact pages and team pages).
- Business directories and map listings, then the company website for the address.
- Professional networks, for names and titles.
- Data tools that provide company and contact details. Check their terms and the law in the target region.

## Prefer a named person
An email to a named decision maker beats one to a generic mailbox. If you only find a generic address, such as info@, it can still work for small businesses where the owner reads everything, but expect lower replies.

## Verify before you send
Run every address through an email verification tool. Remove invalid addresses, spam traps and risky ones. Treat "catch-all" domains carefully: they accept everything, so you cannot be sure the mailbox exists. Send to them in small amounts or skip them.

## Clean the data
- Remove duplicates and anyone on your suppression list.
- Use the person's first name as they use it, and the business name in the form people say it ("Apex Plumbing", not "APEX PLUMBING LLC").
- Add one personal line per lead for your best prospects (a trigger, a review, a hire).

## Segment by quality
| Tier | What it means | What to send |
|---|---|---|
| A | Strong fit and a clear trigger | Personal email, maybe a short video |
| B | Good fit | Template with one personalised line |
| C | Maybe | Template only, or skip |

> Rule of thumb
> If you would not be comfortable reading the email aloud to the person on a phone call, the list is wrong.
`,
drill:"Build a 200-contact list for one persona. Verify every address and mark each lead tier A, B or C. Count how many remain after cleaning.",
quiz:[
["Why verify email addresses before sending?",["To save money on postage","To keep bounce rates low and protect your reputation","To make the list longer","Because it is a legal rule"],1,"High bounce rates damage your sender reputation."],
["Why keep one list for one persona?",["It is easier to store","So the message can be specific and relevant","Providers require it","To avoid verification"],1,"Specific messages get more replies than generic ones."]
]});

L({ p:4, n:4, t:"Write the first email", min:12,
idea:"Short, about them, and easy to answer. Name a problem other owners have, offer something useful, and ask a question with an easy no.",
src:"", tool:"emailwriter",
md:`
## The shape of a good cold email
Aim for **50 to 90 words**. Read it on your phone. If it needs scrolling, cut it.

1. **Subject:** short, lowercase, like a colleague wrote it ("after-hours calls", "question about apex").
2. **First line:** why you're writing to *them*: a trigger, an observation, or a problem other owners like them have.
3. **The problem:** one likely pain, in plain words.
4. **Something useful:** a free audit, a short demo, a result. Only what is true.
5. **One easy question:** low friction, with an easy no.
6. **Signature and opt-out line.**

## Ask small, give first
A cold email that asks for a 30-minute meeting asks a stranger for a lot. One that offers something useful asks for very little:

| Ask | Friction |
|---|---|
| "Can we book a 30-minute demo?" | High |
| "Worth a 10-minute look on Thursday?" | Medium |
| "Mind if I send a 40-second demo of how your after-hours calls could be answered?" | Low |
| "Is this even a problem for you, or am I off base?" | Lowest |

Start low. Book the meeting in the second or third message, once they've replied.

## A worked example
**Subject:** after-hours calls

Hi Dave,

A few of your reviews mention it's hard to reach Apex after 5 pm. Most plumbers I talk to lose jobs that way, mostly from people who never leave a voicemail.

I recorded a 40-second demo of how those calls could be answered and booked for Apex. Want me to send it over, or is this not really a problem for you?

Sam
If you'd rather not hear from me, reply "stop" and I won't email again.

## Neutral beats hype
Words like "revolutionary", "skyrocket", "guaranteed results" and "limited time" read like an ad and trigger spam filters and suspicion. Write the way a calm expert talks. "Not sure if it's relevant, but..." gets more honest replies than "You need this."

## Three first-line types
| Type | Example |
|---|---|
| Trigger | "Saw you're hiring a dispatcher." |
| Observation | "Your site says 24/7, but a couple of reviews mention missed calls." |
| Problem other owners have | "Most plumbers I talk to lose jobs on calls after 5." |

## What to avoid
Long company introductions, attachments, images, more than one link, fake "Re:" subjects, fake urgency, and anything you couldn't say out loud on a phone call.

!> Be truthful
!> Never claim a relationship, a result or a client you don't have.
`,
call:{ title:"A first cold email, annotated", meta:"To an owner of a plumbing company", names:{R:"Email",P:"Why it works"}, turns:[
 ["R","Subject: after-hours calls","Subject line","Short, lowercase and specific. Reads like a person wrote it."],
 ["R","Hi Dave, a few of your reviews mention it's hard to reach Apex after 5 pm.","Observation","Proves you looked at their business, in one line."],
 ["R","Most plumbers I talk to lose jobs that way, mostly from people who never leave a voicemail.","Problem other owners have","Not a claim about Dave. A pattern he can recognise."],
 ["R","I recorded a 40-second demo of how those calls could be answered and booked for Apex. Want me to send it over, or is this not really a problem for you?","Value first, easy no","A useful thing, with an honest way to say no."],
 ["R","Sam. If you'd rather not hear from me, reply stop.","Opt-out","Honest and good practice."]
]},
drill:"Use the message builder (cold email) to produce three versions for one real prospect: one with a meeting ask, one offering a lead magnet, and one with 'is this even a problem for you?'. Read each on your phone and cut 20% of the words.",
quiz:[
["About how long should a cold email be?",["50 to 90 words","300 words","One word","Three paragraphs plus an attachment"],0,"Short emails get read and answered."],
["Which ask has the lowest friction?",["Book a 30-minute demo","Is this even a problem for you, or am I off base?","Send me your budget","Sign this contract"],1,"An easy question with an easy no is the simplest thing to reply to."],
["Why offer a demo or audit in the first email?",["It looks fancy","It gives value first and asks for very little","It's required","It replaces the meeting"],1,"Giving first lowers the bar for a reply and builds trust."]
]});

L({ p:4, n:5, t:"The follow-up sequence", min:10,
idea:"Most replies come from follow-ups. Four to five short emails over two to three weeks, each with a new reason to reply, never 'just checking in'.",
src:"", tool:"cadence",
md:`
## Why follow-ups matter
People are busy. Many replies arrive after the second, third or fourth email. One email is a lottery ticket. A short sequence is a process.

## A five-email sequence
| Day | Email | Angle |
|---|---|---|
| 1 | First email | Observation, problem, something useful, easy question |
| 4 | Follow-up 1 | One new fact or question: "Most plumbers find about half of after-hours callers never leave a voicemail. Does that match what you see?" |
| 8 | Follow-up 2 | Different angle: a different problem, a real result, or the lead magnet again in a new form |
| 13 | Follow-up 3 | Very short and neutral: "Is fixing after-hours calls on your list at all, or should I leave it?" |
| 18 | Close-out | "I'll stop reaching out. If missed calls ever become a headache, reply here." |

## Every follow-up brings something
Never "just checking in" or "bumping this to the top of your inbox". Each email adds a new fact, a new question, a different benefit or a lower-friction ask.

## Short and neutral works late in the sequence
After a few emails, a one-line neutral question often gets the reply long emails didn't: "Did you already sort out after-hours calls, or is it still an issue?" It's easy to answer, and both answers are useful.

## Same thread
Reply in the same thread with the same subject to keep context.

## Timing
Send in the recipient's working hours. Mid-week mornings often work well, but test with your own data. Space emails further apart as you go.

## Stop rules
Stop immediately when someone replies, books or opts out. Never send a "follow-up" after a no.

## Combine channels
Pair email with a call, a social message or a short video. A call the day after email two often lifts response from people who ignored the emails.
`,
drill:"Build the five-email sequence in the Cadence builder. Write every email in your own words with no 'just', make the fourth under 20 words, and load it for a small test list.",
quiz:[
["What should each follow-up do?",["Say 'just checking in'","Add something new: a fact, question, benefit or easier ask","Repeat the first email","Make the ask bigger"],1,"A new reason gives a new chance to reply."],
["Why send a very short neutral question late in the sequence?",["To save time","It's easy to answer and both answers are useful","To annoy them","It's required"],1,"Low effort to reply means more replies."],
["When must the sequence stop?",["After the second email","When they reply, book or opt out","Never","After a weekend"],1,"A reply or opt-out ends automation immediately."]
]});

L({ p:4, n:6, t:"Handling replies", min:10,
idea:"Reply fast, stay calm, ask one question, and move interested people to a call. Treat every no, referral and opt-out with the same respect.",
src:"", tool:"objections",
md:`
## Speed matters
A reply is a warm lead. Answer within the hour during working time. A reply that sits for a day cools fast.

## Positive reply: one question, then book
**They say:** "Sure, send the demo."
**You say:** Send it, then: "Here it is. Out of curiosity, roughly how many calls come in after you close in a busy week?" When they answer: "Worth 15 minutes Thursday at 9 or Friday at 2 Eastern to see what it'd look like on your numbers?"

Ask one question before the booking ask, so the meeting is about their problem, not your product.

## "Send me more info"
"Happy to. So I send the right thing, what's the main thing you'd want to know?" Then: "Honestly, 10 minutes on a call would answer it better than a brochure. Thursday or Friday?"

## "Not interested" or "Not now"
Defuse and leave an easy door open: "No problem at all. Is it that missed calls aren't really an issue for you, or just not the right time?" Then do what they say.

## "We already have someone"
"Good, that's probably why you've got the business you have. Do they cover nights and weekends too, or mostly daytime?"

## "Who is this?" or "How did you get my email?"
Be honest: "I found your business on [source] and wrote because [reason]. If you'd rather not hear from me, I'll remove you right away."

## "Wrong person"
"Thanks for telling me. Who would be the right person to ask about after-hours calls?" Referrals from these replies are often warm.

## Out-of-office
Pause the sequence and resume after their return date.

## Unsubscribe or "stop"
Remove them from every list and sequence at once. A brief reply is fine: "Done, you're removed. Sorry for the interruption."

## Angry replies
Don't argue. Apologise briefly, remove them and move on.

## Keep a reply log
Tag each reply as positive, neutral, negative, referral or opt-out. Your **positive reply rate** tells you if the email works.
`,
drill:"Write your reply to each of the nine reply types above. Save them as snippets in your sending tool.",
quiz:[
["A prospect replies 'sure, send the demo'. What do you do?",["Send it and stop","Send it and ask one question about their situation, then offer a time","Send pricing","Wait a week"],1,"One question keeps the conversation about their problem, then you book."],
["How fast should you answer a positive reply?",["Within a week","Within the hour in working time","Only on Mondays","After two follow-ups"],1,"Speed turns interest into a booked call."],
["What do you do with an opt-out?",["Ignore it","Remove them everywhere immediately","Send one more email","Ask why"],1,"Honour opt-outs at once."]
]});

L({ p:4, n:7, t:"Measure and improve your emails", min:9,
idea:"Track replies and booked calls, change one thing at a time and test with enough volume.",
src:"", tool:"emailcheck",
md:`
## Metrics that matter
| Metric | What it tells you | Watch for |
|---|---|---|
| Bounce rate | List quality | Keep under about 2% |
| Spam complaints | Message and targeting problems | As close to zero as possible |
| Reply rate | Interest and deliverability | Rising |
| Positive reply rate | Real interest | Rising |
| Booked calls | The result | Your funnel number |

## Why not opens?
Open tracking is unreliable, because many mail apps load images automatically, and it can hurt deliverability. Judge your emails by replies.

## Diagnose with the funnel
- **Few replies, low bounces:** the message or the list needs work.
- **Many bounces:** your list or verification is poor.
- **Replies, but few positive:** targeting is off, or the offer is weak.
- **Positive replies, few booked:** reply faster and ask better.

## Test one variable at a time
Change one thing per test: the subject, the first line, the ask or the offer. Send at least 100 to 200 emails per version before you decide. Small samples mislead.

## A weekly routine
1. Check mailbox health and bounces.
2. Review replies and tag them.
3. Pick the weakest metric.
4. Launch one test.
5. Log the result.

## Stop rules for campaigns
Pause a campaign if bounces climb above your limit or a mailbox gets complaints. Fix first, then resume at a lower volume.

> Keep a swipe file
> Save your best emails and the replies they got. After ten campaigns you will have your own proven templates.
`,
drill:"Set up a one-page tracker for your next campaign: sent, bounced, replies, positive replies, booked. Plan your first test and write down what you expect to happen.",
quiz:[
["Which metric should you trust more than opens?",["Replies","Image loads","Subject length","Number of recipients"],0,"Replies measure what you want, and opens are unreliable."],
["How should you run a test?",["Change five things at once","Change one thing and send enough volume","Test on 5 emails","Never test"],1,"One variable and enough volume gives a result you can trust."]
]});

})(window.OSI);
