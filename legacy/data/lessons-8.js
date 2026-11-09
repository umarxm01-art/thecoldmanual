(function (O) {
var L = O.lesson;

/* ---------------- Program 12: Tech stack ---------------- */

L({ p:12, n:1, t:"The whole stack on one page", min:10,
idea:"Buy one tool per layer, start with free or low-cost options and add a tool only when its absence hurts.",
src:"",
md:`
## The eleven layers
| Layer | What it does | Starter option | Add later |
|---|---|---|---|
| 1. Lead data | Find businesses and contacts | Map listings, free search, a sheet | A contact database |
| 2. Enrichment and verification | Fill gaps, check emails | A verification tool | An enrichment tool |
| 3. Email domains and mailboxes | Safe sending identity | 1 to 3 sending domains, 2 mailboxes each | More domains and mailboxes |
| 4. Email sending platform | Sequences, warm-up, replies | One sending tool | Inbox management |
| 5. Social platforms | LinkedIn, Facebook, Instagram | Free accounts, manual | A paid navigator tool |
| 6. Video | Personal videos | A free screen recorder | A paid plan |
| 7. Calling | Number, dialer, recording | A calling app with a US number | A power dialer |
| 8. CRM and scheduling | Pipeline, bookings | A free CRM or a sheet, a booking tool | A full CRM |
| 9. Automation | Connect tools, alerts | One connector tool | More workflows |
| 10. AI helpers | Notes, drafts, roleplay | A general AI assistant | Call-note tools |
| 11. Reporting and security | Numbers and safety | A sheet, a password manager | A dashboard |

## The rule: one tool per layer
Three tools doing the same job make a mess. Pick one, learn it, and only switch if it truly limits you.

## Budget bands (rough, check current prices)
- **Starter:** mostly free tools plus a few low monthly fees (domains, a sending tool, a calling app).
- **Growth:** add a data tool, more mailboxes, a paid CRM and a dialer.
- **Scale:** add enrichment, deliverability monitoring and reporting.

Prices change often, so check each tool's current pricing and free limits before you commit.

## Order of setup
1. Number and dialer (if you call).
2. List and verification.
3. Domains, mailboxes and warm-up (start this early, since it takes weeks).
4. Sending tool and a first campaign.
5. Profiles and a social routine.
6. CRM and scheduling.
7. Automation, once the manual process works.

## Keep notes
Write down, for each tool: purpose, owner, login location, cost and renewal date.

> Do not buy a stack to avoid doing the work
> The best stack is the one you use every day.
`,
drill:"List what you already have, choose one tool for each missing layer and write the first three to set up this week.",
quiz:[
["What is the rule for each layer?",["Use five tools for safety","Pick one tool and learn it","Never pay","Use only free tools forever"],1,"One tool per layer keeps the stack simple."],
["Which setup task should start early because it takes weeks?",["Writing a logo","Domain and mailbox warm-up","Buying a headset","Making a thumbnail"],1,"Warm-up takes two to four weeks."]
]});

L({ p:12, n:2, t:"Lead data and enrichment tools", min:10,
idea:"Choose where your leads come from, then verify and enrich them before they reach any sending tool.",
src:"",
md:`
## Sources of leads
| Source | Good for | Watch out for |
|---|---|---|
| Map listings and directories | Local businesses, phone numbers, reviews | Contact names are often missing |
| LinkedIn search | Names, titles, company size | Scraping it breaks its terms |
| Contact databases (for example Apollo, ZoomInfo, Lusha and similar) | Names, titles, emails, phones at scale | Accuracy varies, check terms and local law |
| Website contact pages | Owner names, emails, social links | Slower, more manual |
| Scraping services (for example Apify, Outscraper) | Pulling listings into a sheet | Respect each site's terms and local law |
| Referrals and customers | Warm intros | Smaller volume |

## Enrichment
Enrichment fills in missing details: company website, size, owner name, social profiles. Tools such as Clay and similar platforms combine several data sources and let you build a repeatable list-building workflow. Start by doing it by hand for 50 leads, so you know what you need before paying for automation.

## Email finders and verifiers
- **Finders** (for example Hunter or the finder inside a contact database) suggest likely addresses.
- **Verifiers** (for example ZeroBounce, NeverBounce, MillionVerifier and similar) check each address before you send. Always verify.

## A simple lead sheet
Columns: company, website, phone, owner name, title, email, email status, LinkedIn, Facebook, Instagram, time zone, tier, trigger, source, status, date added.

## Legal and ethical checks
- Check each source's terms of service.
- Use only business contact information for business outreach.
- Respect privacy laws where the person lives.
- Keep a suppression list and do not re-add anyone who opted out.

## Cost control
Pay for data by the batch, not by the month, until you know your conversion. Export your data regularly so you are not locked in.

> Start small
> A hand-built, verified list of 100 beats a bought list of 10,000.
`,
drill:"Build 50 leads by hand using one source. Time how long each takes. Then decide which part is worth paying a tool to do.",
quiz:[
["What should you always do before sending to an email address?",["Guess it","Verify it","Add it twice","Send an attachment"],1,"Verification protects your sender reputation."],
["Why build 50 leads by hand first?",["It is cheaper forever","You learn what you need before paying for automation","Tools are banned","It looks impressive"],1,"You will know what to automate."]
]});

L({ p:12, n:3, t:"Email infrastructure and sending tools", min:12,
idea:"Domains, mailboxes and a sending platform form the engine. Build it in the right order and monitor it weekly.",
src:"", tool:"emailcheck",
md:`
## The parts
1. **Domains:** bought from a registrar (for example Namecheap, Cloudflare or GoDaddy). Keep DNS in one place.
2. **Mailboxes:** hosted with a mainstream email provider such as Google Workspace or Microsoft 365, or an email infrastructure reseller. Two or three per domain.
3. **Sending platform:** the tool that runs sequences, rotates mailboxes, handles warm-up and shows replies. Popular options include Instantly, Smartlead, Lemlist and Woodpecker.
4. **Monitoring:** free or low-cost tools to check DNS, blacklists and reputation (for example MXToolbox, mail-tester and Google Postmaster Tools).

## What to look for in a sending platform
- Multiple mailbox support with rotation.
- Built-in warm-up.
- Sequences with stop-on-reply.
- A unified inbox for replies.
- Easy suppression list and unsubscribe handling.
- Custom tracking domain.
- Integrations with your CRM or a webhook.

## Capacity maths
A rough planning example: 3 domains x 2 mailboxes = 6 mailboxes. At 30 emails a day each, that is about 180 emails a day, or around 900 a week. Start lower, increase slowly and check your results before scaling.

## Sample setup order
1. Buy sending domains and set up redirects to your main site.
2. Create mailboxes and set SPF, DKIM and DMARC.
3. Connect mailboxes to the sending platform and start warm-up.
4. After two to four weeks, launch a small test campaign.
5. Review bounces, replies and spam signals weekly.

## Costs
Costs grow with domains, mailboxes and the sending tool. Check current prices, and choose a plan that fits your first 30 days, not your year-end dream.

## Reliability tips
- Keep a spare domain or two ready.
- Retire a mailbox that shows trouble and replace it.
- Do not use your main business mailbox for cold email.
- Use a password manager and two-factor authentication on every login.

!> Respect the rules
!> Follow your mailbox provider's acceptable use policy and the email laws from lesson 4.1.
`,
drill:"Write down your planned domains, mailboxes and sending tool, with a start date for warm-up. Calculate your daily capacity at 20 emails a mailbox.",
quiz:[
["What does a sending platform do?",["Builds a website","Runs sequences, warm-up and replies across mailboxes","Writes contracts","Hosts videos"],1,"It is the engine for your campaigns."],
["Where should you never send cold email from?",["A new sending domain","Your main business mailbox","A warmed-up mailbox","A mailbox with SPF and DKIM"],1,"Protect your main domain."]
]});

L({ p:12, n:4, t:"Social and video tools", min:9,
idea:"Run LinkedIn, Facebook and Instagram by hand first. Add tools for finding, scheduling and recording, not for blasting.",
src:"",
md:`
## LinkedIn
- **Free account:** enough to start, with limited search and invitations.
- **Sales navigator tools:** a paid LinkedIn product with advanced filters and saved lists. Worth it once you message regularly.
- **Automation tools** (for example HeyReach, Expandi, Dripify and similar): these automate invitations and messages. They break LinkedIn's terms and can cost you your account. If you use one anyway, understand the risk, keep volume low and never use your only account.
- **Cloud versus browser-extension tools:** cloud tools run on servers and extension tools run in your browser. Both carry risk.

## Facebook and Instagram
- **Meta Business Suite:** manage a Page, an Instagram business account, scheduled posts and a shared inbox in one place.
- **Chat automation tools** (for example ManyChat): useful for replying to people who message you first (inbound), such as after a post or an ad. Not for cold outreach.
- **Content scheduling tools** (for example Buffer or Later): schedule posts so your profile stays active.

## Design and screenshots
A free design tool for thumbnails and a screenshot tool for annotated screenshots.

## Video
- **Loom** is the best-known screen-and-camera recorder. Alternatives include Vidyard, Tella and your computer's built-in screen recorder.
- **Hosting:** most tools host the video and give a link.
- **Thumbnail tools:** a design tool, or a feature inside your recorder.
- **View notifications:** useful, but not a reason to chase.

## Browser and account hygiene
- Use a dedicated browser profile for outreach.
- Use two-factor authentication.
- Keep your accounts real: your name, your photo, your phone.
- Do not share a login with several people.

## Manual first
Do the routine by hand for two weeks. If a repetitive step really slows you, then look for a tool, and prefer one that works inside the platform's rules.

> Rule of thumb
> If a tool lets you send hundreds of identical messages, it is the wrong tool.
`,
drill:"Choose your one social platform, your one recorder and your one scheduling tool. Set up two-factor authentication on each.",
quiz:[
["What is chat automation best used for?",["Cold outreach at scale","Replying to people who message you first","Scraping profiles","Buying followers"],1,"Inbound automation is safe and useful."],
["Why do outreach tools carry risk on LinkedIn?",["They are slow","They can breach the platform's terms and risk your account","They are free","They show ads"],1,"Platforms can restrict accounts that automate."]
]});

L({ p:12, n:5, t:"The calling stack, including calling the US from Pakistan", min:14,
idea:"A good number, a reliable internet connection, a proper headset and a dialer that records and logs make calls consistent.",
src:"",
md:`
## The parts of a calling stack
| Part | Purpose | Options |
|---|---|---|
| Phone number | Your caller ID | A US local number from a calling provider |
| Calling app or dialer | Places the calls, logs and records | Dialpad, Aircall, JustCall, CloudTalk, OpenPhone, Kixie, or a build on Twilio |
| Power dialer | Dials the next lead automatically | PhoneBurner, Orum, or a dialer inside your CRM |
| Recording and notes | Review and coaching | The calling app, plus AI note tools such as Fathom, Fireflies or Otter |
| CRM link | Logs calls automatically | Your CRM's integration |

Check each tool's current features, pricing and country availability.

## Caller ID reputation
Phone carriers label numbers as spam based on call patterns. To protect your numbers:
- Use a number from a provider that supports caller registration.
- Register your number with carrier-branding or caller-registry programs where available.
- Start with low daily volume on a new number and increase slowly.
- Rotate or retire numbers that get flagged.
- Keep calls to real prospects with real conversations, not hang-ups.

## Calling the US from Pakistan
**Time zones.** Pakistan is five hours ahead of UTC. US Eastern time is four hours behind UTC in summer and five behind in winter, so the gap is 9 or 10 hours. A 9 am to 5 pm Eastern day runs from about 6 pm to 2 am in Pakistan during US daylight time, or 7 pm to 3 am otherwise. Central and Pacific are one and three hours later again. Plan your schedule and sleep, and never call outside legal hours (lesson 7.6).

**Connection.** Use a wired connection if you can, and a second internet source (such as mobile data) for failover. Test call quality at your calling hours.

**Power.** Keep a UPS or backup power for your router and laptop.

**Hardware.** A noise-cancelling USB headset beats a laptop mic. Use a quiet room.

**Local presence.** A local-area-code number often gets more answers than an unknown or foreign number. Make sure your use is honest and within the rules.

**Payments and business setup.** Check the rules for receiving payments and operating a business across borders with a qualified professional.

## Compliance in the stack
- Keep a do-not-call list and scrub against registries where it applies.
- Disclose recording where required.
- Do not use an AI voice for cold outbound calls without the right consent (lesson 7.6).

## AI calling agents
Platforms such as Vapi, Retell and Bland let you build voice agents that answer calls. They are a good fit for **inbound** calls and for contacts who have given consent. They are not a shortcut for cold outbound.

## A sample setup
1. A US number from a calling app.
2. A USB headset and a wired connection with a backup.
3. The dialer connected to your CRM.
4. Recording on, with disclosure in your opener.
5. A call block schedule that matches your target time zone.

> Test before you dial
> Call a friend in the US at your planned hour. Check delay, echo and audio.
`,
drill:"Write your calling schedule in Pakistan time for the US time zone you target. Test your number, headset and connection with a friend on a real call.",
quiz:[
["Why start a new number with low volume?",["It saves money","To protect its reputation and avoid spam labels","Law requires it","It is faster"],1,"High volume from a new number looks like spam."],
["How many hours ahead is Pakistan of US Eastern time?",["1 or 2","9 or 10","15","None"],1,"It is 9 or 10 hours depending on daylight saving."]
]});

L({ p:12, n:6, t:"CRM, scheduling and handoff", min:9,
idea:"One place for every lead and one link for booking. Keep your pipeline simple and your handoff notes complete.",
src:"", tool:"leads",
md:`
## Choosing a CRM
Start with the simplest thing that works:
| Stage | Option |
|---|---|
| First 100 leads | A spreadsheet, or a free CRM tier |
| Growing | A CRM such as HubSpot, Pipedrive or Close |
| Marketing and pipeline in one | An all-in-one platform such as GoHighLevel |

Pick a tool that can send and receive email and calls, log activity and show a pipeline.

## Fields every lead needs
Name, business, phone, email, source, tier, stage, next action, due date, owner and notes.

## Pipeline stages
Use the stages from lesson 11.1 with entry rules based on buyer actions.

## Scheduling
- A booking tool (such as Calendly, Cal.com or your CRM's calendar) with two or three time slots.
- Connect it to your calendar so double bookings cannot happen.
- Set time zones correctly. Show invites in the prospect's time zone.
- Add confirmation and reminder messages (lesson 7.4).
- Use a meeting link and a phone fallback.

## Handoff from setter to closer
A short note in the CRM: pain in their words, impact number, who else is involved, tone, tools they use and the agreed time. The closer should never ask the same discovery questions again.

## Automations worth building
- New lead to CRM with a first task.
- Booked meeting to a reminder sequence.
- Reply detected to a task and an alert.
- No-show to a recovery message.

## Housekeeping
- Review stalled deals weekly.
- Remove or tag dead leads.
- Back up your data monthly.
- Remove access for people who leave.
`,
drill:"Set up your pipeline stages and a booking link. Create five test leads and run them through the stages to be sure the notes and tasks work.",
quiz:[
["What should a handoff note include?",["Only the name","Pain, impact, who else is involved, tools and the time","A joke","Nothing"],1,"A full handoff saves the closer from re-asking."],
["What do you do about time zones in invites?",["Ignore them","Set and show the prospect's time zone","Use random times","Only call on Mondays"],1,"Wrong time zones cause no-shows."]
]});

L({ p:12, n:7, t:"Automation and AI helpers", min:10,
idea:"Automate the boring steps, keep a human in the loop for anything a prospect reads, and never let AI invent facts.",
src:"",
md:`
## Connector tools
Tools such as Zapier, Make and n8n connect your apps. They move data from one place to another when something happens.

## Five useful workflows
1. **Form to CRM:** new lead creates a contact and a task, and sends a confirmation.
2. **Reply alert:** a positive reply in your sending tool creates a task and pings you.
3. **Booked call:** triggers reminders and a handoff note.
4. **No-show:** triggers a recovery message.
5. **Lead sheet to sequence:** a new verified row is added to a campaign.

## Build slowly
Automate a process only after you have run it by hand a few times. Test with five fake leads before turning it on.

## AI helpers: where they help
- **First drafts:** subject lines, first lines, variations of a message. Always edit.
- **Summaries:** call notes and meeting recaps.
- **Roleplay:** practise objection handling with a general AI assistant playing the prospect.
- **Research:** summarise a company's website. Check key facts yourself.
- **Reporting:** turn numbers into a short plain-language summary.

## Where AI is risky
- It can make up facts. Never send a claim about a prospect without checking it.
- Generic AI text sounds generic. Rewrite it in your own voice.
- Sending large volumes of AI-written, near-identical messages gets you flagged.
- Do not paste private or sensitive customer data into tools you have not checked.

## Human in the loop
Rule: a person reads every message before it goes to a prospect, and a person decides what to do with every reply.

## AI voice and compliance
AI voices on outbound calls fall under strict rules. See lesson 7.6. Using AI to answer inbound calls is a very different matter.

> Test for good automation
> If it fails, would you notice quickly, and would the damage be small?
`,
drill:"Map one repetitive task in your week as a trigger and an action. Build it with a connector tool, test with five fake leads and write down how you will notice if it breaks.",
quiz:[
["When should you automate a process?",["Before you try it","After running it by hand successfully","Never","Only on Fridays"],1,"Automating a broken process just breaks it faster."],
["What is the main risk of AI-written messages?",["They are too short","They can contain invented facts and sound generic","They cost money","They are too polite"],1,"Always check facts and edit in your own voice."]
]});

L({ p:12, n:8, t:"Reporting, security and cost control", min:9,
idea:"Know your numbers weekly, protect every login and review what you pay for each month.",
src:"",
md:`
## Reporting
A single sheet or dashboard is enough. Track weekly:
- Attempts by channel (calls, emails, social messages, videos).
- Replies or conversations by channel.
- Meetings booked and held.
- Deals won.
- Cost per booked meeting.

Use the daily numbers in your 30-day plan, or a spreadsheet, and connect your CRM when it helps. Do not drown in charts.

## Cost per booked meeting
Add up your monthly tool costs and your time. Divide by the meetings booked. If the cost per meeting rises, find the weak step in the funnel.

## Security basics
- A password manager for every login.
- Two-factor authentication on email, social accounts, the CRM and the sending tool.
- Separate accounts and logins for each tool. No shared passwords.
- Use separate browser profiles for outreach.
- Keep recovery emails and phones up to date.

## Data care
- Store lead data only where you need it.
- Back up your sheet or export your CRM monthly.
- Delete data on request.
- Never paste lists into tools you have not reviewed.

## Access control
When a team member leaves, remove their access to every tool the same day. Keep a list of who has access to what.

## Monthly cost review
List each tool, its purpose, cost, last time you used it and a keep or cancel decision. Cancel anything unused. Switch only if the new tool clearly beats the old one.

## Watch for tool sprawl
If you cannot explain in one sentence why you pay for a tool, cancel it.

## Disaster plan
What if your main domain is flagged, your calling number is spam-labelled or an account is locked? Keep spare domains, spare numbers and a written recovery checklist.

> Keep it boring
> Reliable beats clever. A stack that works every day beats an impressive stack that nobody maintains.
`,
drill:"Make your monthly tool list with cost and purpose. Turn on two-factor authentication everywhere you can, then cancel one tool you do not need.",
quiz:[
["What should you do when a team member leaves?",["Nothing","Remove their access to every tool the same day","Wait a month","Share their login"],1,"Same-day removal protects your data."],
["What is cost per booked meeting?",["Monthly costs divided by meetings booked","Number of calls","Price of one tool","Your salary"],0,"It shows whether your system is getting more or less efficient."]
]});

})(window.OSI);
