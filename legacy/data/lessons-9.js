(function (O) {
var L = O.lesson;

/* ---------------- Program 13: Client delivery and retention ---------------- */

L({ p:13, n:1, t:"The first 72 hours after the sale", min:9,
idea:"The client decides whether they made a good choice in the first three days. Make those days fast, clear and busy with visible progress.",
src:"", tool:"delivery",
md:`
## Why the first 72 hours matter
Right after paying, most clients feel a small doubt: "Did I just waste money?" Silence makes that doubt grow. A fast, organised start makes it disappear. Most refund requests and early cancellations start with a slow, quiet first week.

## What happens, and when
| When | What you do | Why |
|---|---|---|
| Within 1 hour of payment | Send the welcome email with the onboarding form and the kickoff booking link | Shows they are in good hands, and starts the clock on what you need from them |
| Same day | Send the access checklist (logins, numbers, calendars) | Missing access is the number one cause of slow starts |
| Day 1 to 2 | Hold the kickoff call | Agrees goals, the scoreboard and the first win |
| Day 2 to 3 | Send the first progress note, even if small | Proves the work has started |

## The welcome email has four parts
1. **Thanks and confirmation.** One line. No long speech.
2. **What happens next.** Three dated steps, so they know the plan.
3. **What you need from them.** The form and the access list, with a deadline.
4. **How to reach you.** One channel, the hours you reply and your reply time.

## The onboarding form
Ask only what you need to start. Long forms do not get filled in. Group the questions:
- **Business basics:** services, service area, hours, average job value, busiest season.
- **Customers:** who the best customers are, and who they do not want.
- **Goals:** the one number they most want to move in 90 days.
- **Brand and voice:** words they use, words to avoid, examples they like.
- **Access:** who gives you each login, and by when.

> Book the kickoff before the form is done
> Do not wait for a perfect form. Book the call for day 1 or 2 and finish any gaps on the call.

!> Never start work that touches their customers without written approval
!> Scripts, emails and calling agents that speak to their customers must be approved by the client in writing first. Keep the approval email.
`,
drill:"Open the Client delivery kit. Fill in a real or practice client, then copy the welcome email and the onboarding form. Time yourself: both should be ready to send in under ten minutes.",
quiz:[
["When should the welcome email go out?",["After the kickoff call","Within an hour of payment","At the end of the first week","Only if the client asks"],1,"A fast welcome removes the doubt that follows payment."],
["What is the most common cause of a slow start?",["Missing access to logins, numbers and calendars","A short welcome email","Booking the kickoff too early","Weekly reports"],0,"Ask for access on day one with a clear deadline."],
["The onboarding form is half done. What do you do?",["Wait until it is complete","Book the kickoff anyway and fill the gaps on the call","Start without any information","Send a longer form"],1,"Momentum matters more than a perfect form."]
]});

L({ p:13, n:2, t:"The kickoff call", min:10,
idea:"A kickoff call agrees one goal, one scoreboard, who does what, and the first win. Everything after it is measured against what you agree here.",
src:"", tool:"delivery",
md:`
## The agenda (45 minutes)
| Minutes | Part | Outcome |
|---|---|---|
| 0 to 5 | Thank you and the plan for the call | They know what the call will cover |
| 5 to 15 | Their goal, in their words | One number to move in 90 days |
| 15 to 25 | How we will measure it | The scoreboard: three to five numbers, where they come from |
| 25 to 35 | Who does what | Owner on their side, owner on yours, how fast each replies |
| 35 to 40 | The first win | Something visible in 14 days |
| 40 to 45 | Recap and next date | Report day and the 30-day review booked |

## Ask for the goal as a number
"More leads" cannot be measured. Ask: "If we sit here in 90 days and you are happy, what number changed?" Write down their exact words and the number.

## Agree the scoreboard
Pick three to five numbers that the client can check. For an AI calling agent: calls answered, jobs booked, after-hours calls caught and the booking rate. For appointment setting: conversations, meetings booked, meetings held and show rate.

## Set the rules for talking
- One main channel for updates, such as email or one WhatsApp group.
- Your reply time on working days, and when you are offline.
- What counts as urgent, and how they reach you for it.

> Agree what success is not
> Ask: "Is there anything that would make you unhappy even if the numbers went up?" You will hear about tone, brand and customer experience. Write it down.
`,
call:{ title:"Kickoff with a plumbing owner", meta:"AI calling agent client, day 2", turns:[
 ["R","Thanks for making time, Dave. In 45 minutes I'd like to agree on your goal, how we'll measure it and the first win. Sound good?","Set the agenda","Saying what the call will cover makes the client relax and keeps you on time."],
 ["P","Sure. I just want to stop missing calls."],
 ["R","If we sit down in 90 days and you're happy, what number changed?","Goal as a number","This turns a feeling into something both sides can check."],
 ["P","I guess booked jobs from calls we used to miss. Maybe 15 more a month."],
 ["R","Fifteen extra booked jobs a month. I'll put that at the top of every report. Who on your side should I send it to, and who approves anything that talks to your customers?","Owners and approvals","Naming the approver early prevents delays later."],
 ["P","Send it to me and my office manager, Linda. I approve scripts."],
 ["R","Great. First win: in 14 days, every after-hours call is answered and you get a text summary of each one. I'll report every Monday, and let's book our 30-day review now.","First win and next date","A visible early win builds trust before the bigger results arrive."]
]},
drill:"Write the goal question and the first-win sentence for one real or practice client. Say both out loud until they sound natural.",
quiz:[
["What is the best way to ask for the client's goal?",["Ask what they want in general","Ask what number changed if they are happy in 90 days","Tell them your usual results","Skip it and start the work"],1,"A number gives both sides something to measure."],
["How many numbers should the scoreboard have?",["One","Three to five","Twenty","As many as possible"],1,"Few enough to read in a minute, enough to show the full picture."]
]});

L({ p:13, n:3, t:"The first 30 days: early wins and the 30-60-90 plan", min:9,
idea:"Plan the first 90 days in three blocks and make sure the first block delivers something the client can see.",
src:"", tool:"delivery",
md:`
## Three blocks
| Block | Focus | What the client should see |
|---|---|---|
| Days 1 to 30 | Set up and first win | The system is live, the first results are reported |
| Days 31 to 60 | Improve | Weak numbers improved, tests started |
| Days 61 to 90 | Scale and prove | Results against the goal, the case for renewal |

## Early wins are visible, not big
An early win is something the client notices without being told: a booked job from a missed call, a meeting on their calendar, a reply from a prospect they wanted. Small and visible beats large and invisible.

## Protect the plan from surprises
- **Write down the assumptions.** For example: "Assumes 40 or more inbound calls a month."
- **Flag risks early.** If a number looks off in week 2, say so in week 2, not at the review.
- **Change one thing at a time.** Then you know what caused the result.

> Under-promise on dates, over-deliver on updates
> A plan that slips quietly loses trust. A plan that slips with a clear reason and a new date keeps it.
`,
drill:"Use the Client delivery kit to create a dated 30-60-90 plan. Add one early win for days 1 to 14 that the client will notice without being told.",
quiz:[
["What makes a good early win?",["It is large, even if the client cannot see it","The client notices it without being told","It happens on day 90","It is a new logo"],1,"Visible beats big in the first month."],
["A number looks wrong in week 2. When do you tell the client?",["At the 90-day review","Never","In week 2, with what you are doing about it","Only if they ask"],2,"Raising risks early keeps trust."]
]});

L({ p:13, n:4, t:"Reports clients actually read", min:8,
idea:"A good report takes one minute to read: the numbers against the goal, what you did, what is next and one thing you need from them.",
src:"", tool:"delivery",
md:`
## The one-minute weekly report
1. **Headline.** One sentence: on track, ahead or behind, and why.
2. **The scoreboard.** The three to five numbers, this week and the total so far, against the goal.
3. **What we did.** Three bullets at most.
4. **What is next.** Three bullets at most.
5. **One ask.** The single thing you need from them, with a date.

## Write the bad weeks too
Send the report on the same day every week, especially when the numbers are down. A missing report on a bad week is read as hiding. A clear report with a plan is read as control.

## The monthly review call (30 minutes)
| Part | What to cover |
|---|---|
| Results | The scoreboard against the goal, in their numbers |
| What worked | One or two things to keep |
| What did not | One thing to fix, and the plan |
| Next month | The focus and any change in scope |
| Feedback | "What should we start, stop or keep doing?" |

> Put the money next to the numbers
> Where you can, show what the result is worth: "12 booked jobs at about $450 each is roughly $5,400." Use the client's own job value.
`,
drill:"Log this week's numbers for a real or practice client in the delivery kit's scoreboard, then open the weekly report template it fills in. Read it aloud. If it takes longer than a minute, cut it.",
quiz:[
["What should a weekly report end with?",["A long summary","One clear ask with a date","A sales pitch","Nothing"],1,"One ask is easy to act on."],
["The numbers are down this week. What do you do?",["Skip the report","Send it on the usual day with the reason and the plan","Change the numbers","Wait for a better week"],1,"Consistency on bad weeks builds trust."]
]});

L({ p:13, n:5, t:"Renewals, upsells and referrals", min:10,
idea:"Renewals are won at the 60-day mark, not the week the contract ends. Upsell only after the first goal is on track.",
src:"", tool:"delivery",
md:`
## The renewal timeline
| When | What you do |
|---|---|
| Day 60 | Review results against the goal. Ask: "If we keep going, what would you want next?" |
| 30 days before the end | Send the renewal email with results, the plan for the next term and the price |
| 14 days before the end | Renewal call if there is no reply |
| End date | Thank you, or a clean handover |

## When to offer more
Offer an upsell only when two things are true: the first goal is on track, and the client has a new problem you can solve. Good upsells extend what already works:
- AI calling agent: add outbound follow-up calls, review requests or a second location.
- Appointment setting: add a new channel, a new market or a reactivation campaign.
- Agency services: add reporting, a landing page or a new campaign.

## Ask for referrals at the high point
The best moment is right after a visible win, such as a strong monthly review. Make it specific: "Who else do you know who runs a service business and misses calls after hours?"

> Never upsell to fix a result you have not delivered
> If the main goal is behind, fix that first. Selling more to an unhappy client speeds up the cancellation.
`,
call:{ title:"Renewal conversation at day 60", meta:"Appointment setting client", turns:[
 ["R","Before we look at next month, here is where we are: 22 meetings booked against a goal of 30 by day 90, and a 78% show rate.","Results first","Starting with their numbers keeps the call about value, not price."],
 ["P","That's better than I expected, honestly."],
 ["R","Glad to hear it. If we keep going for another term, what would you want next?","Let them name the next goal","When the client names the next goal, renewal becomes their idea."],
 ["P","We're opening in a second city in spring."],
 ["R","Then the next term could add the second city from March. I'll send the plan and price this week, and we can confirm on our call on the 20th.","Upsell tied to their goal","The extra scope comes from their plan, so it does not feel like a push."]
]},
drill:"For one client, write the day-60 question and a referral ask. Use the renewal email template in the delivery kit for the 30-day notice.",
quiz:[
["When is a renewal really won?",["The day the contract ends","Around day 60, when results are reviewed","On the first day","After the client cancels"],1,"Start the renewal conversation well before the end date."],
["When is an upsell a bad idea?",["When the main goal is behind","When the client names a new problem","After a strong review","When it extends what already works"],0,"Fix the main result before selling more."]
]});

L({ p:13, n:6, t:"Saving a client who wants to leave", min:10,
idea:"Most cancellations show warning signs weeks earlier. Spot them, call instead of emailing, listen first, then offer a fix, a pause or a smaller plan.",
src:"", tool:"delivery",
md:`
## Warning signs
| Sign | What it often means |
|---|---|
| Slower replies, missed calls | Lost interest or too busy to see the value |
| Questions about the contract end date | Already thinking of leaving |
| New person involved, such as a partner or finance | Someone is questioning the cost |
| Late payments | Cash pressure or doubt about value |
| Results flat for four or more weeks | The plan needs to change |

## The save call
1. **Call, do not email.** Tone matters, and email feels final.
2. **Thank them and listen.** "Thanks for being straight with me. Can you walk me through what is not working?"
3. **Clarify the real reason.** Ask until you reach it: results, cost, fit, timing or trust.
4. **Agree what you heard.** Repeat it in their words.
5. **Offer one fitting option.** Fix the problem, pause, a smaller plan, or a trial period with clear goals.
6. **Accept a no gracefully.** Ask for feedback and permission to check in later.

## Match the offer to the reason
| Reason | Offer |
|---|---|
| Results | A 30-day fix plan with one changed thing and a clear check date |
| Cost | A smaller plan, or a pause, not a large discount |
| Timing or season | A pause with a restart date |
| Fit or trust | A frank talk. If it is not a fit, help them leave well |

## Leave well when they go
Hand over everything they paid for, thank them in writing and ask for honest feedback. Clients who leave on good terms come back and send referrals.

!> Do not trap clients
!> Never refuse to hand over their data, logins or numbers, and never make cancelling hard. It damages your name and can break consumer and contract rules.
`,
drill:"Use the churn-save script in the delivery kit. Roleplay it out loud with a partner for each reason: results, cost and timing.",
quiz:[
["A client asks when the contract ends. What should you do?",["Ignore it","Treat it as a warning sign and book a call","Send the invoice early","Offer a 50% discount by email"],1,"Questions about the end date usually come before a cancellation."],
["The client says the cost is too high. What is usually the best offer?",["A big discount","A smaller plan or a pause","More features for free","Refuse to discuss it"],1,"A smaller scope keeps the relationship without cheapening your price."],
["What is the first step on a save call?",["Make an offer","Thank them and listen","Defend your work","Read the contract"],1,"Listening first finds the real reason."]
]});

L({ p:13, n:7, t:"Delivery SOPs and handoffs for agency teams", min:9,
idea:"When a team delivers, the process lives in writing. A one-page SOP for each repeated task and a clean sales-to-delivery handoff keep quality the same, whoever does the work.",
src:"", tool:"delivery",
md:`
## What deserves an SOP
Anything you do more than twice a month for clients: onboarding, campaign setup, weekly reports, monthly reviews, script updates, cancellations.

## The one-page SOP format
| Part | What to write |
|---|---|
| Purpose | One line: why the task exists |
| Owner | Who does it, who checks it |
| Trigger | When it starts, such as "the client pays" |
| Steps | Numbered, one action each, with the tool used |
| Done means | How you know it is finished and right |
| Time | How long it should take |

## The sales-to-delivery handoff
Before the kickoff, the closer passes this to the account owner, in writing:
- What the client bought: scope, price, term and start date.
- Why they bought: the pain and the goal, in the client's own words.
- What was promised: dates, deliverables, any special terms.
- Risks: worries they raised, people who doubted, any deadlines.

The account owner reads it before the kickoff, so the client never repeats themselves.

## Capacity: know when you are full
Set a maximum number of clients per account owner, and track it. Taking one client too many lowers results for every client. Hire or pause sales before you reach the limit, not after.

> Record once, use many times
> Record a short screen video for each SOP. New team members learn faster from a video plus a one-page checklist.
`,
drill:"Write a one-page SOP for your weekly report, using the format above. Then fill in the handoff note for your most recent sale.",
quiz:[
["What must the closer pass to delivery before the kickoff?",["Only the invoice","Scope, the client's reasons, what was promised and any risks","Nothing, delivery will ask","The sales script"],1,"A written handoff means the client never repeats themselves."],
["When should you hire or pause sales?",["After quality drops","Before account owners reach their client limit","Never","Only when a client leaves"],1,"Plan capacity ahead, or every client suffers."]
]});

})(window.OSI);
