# Najia Community Bridge — Frequently Asked Questions

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active (Pilot)*
*Audience: All users*

> **About this FAQ:** This is the official FAQ for the Najia Community Bridge. If you have a question, start here. If you can't find what you're looking for, see the [User Guide](./User%20Guide.md) or the [Troubleshooting guide](./Troubleshooting.md). You can also contact us at support@najiacommunitybridge.com.

> **How to use this FAQ:** The questions are organized by topic. Use Ctrl+F (or Cmd+F on Mac) to search for keywords. The most common questions are at the top of each section.

---

## General

### What is the Najia Community Bridge?

The Najia Community Bridge is a civic engagement and access-to-justice platform for Nigerian citizens. It's designed to help you:

- Have a voice in governance (vote on policy polls and confidence questions)
- Protect your evidence (upload evidence for civil disputes with cryptographic verification)
- Find legal help (connect with verified lawyers for a free 15-minute consultation)
- Learn about your rights (read guides and take courses on legal topics)

The platform is free to use, non-commercial, and committed to your privacy.

### Is the platform free?

Yes, for citizens. The platform is funded by grants, donations, and optional fees from lawyers (a flat monthly subscription, not a percentage of legal fees). You will never be charged for using the platform as a citizen. The free 15-minute consultation with a lawyer is paid for by the platform, not by you.

### Is the platform a court or a legal service?

No. The platform is not a court, a jury, a law enforcement agency, or a legal service provider. We do not:
- Adjudicate disputes
- Provide legal advice (the lawyers do, but the platform does not)
- Enforce judgments
- Replace the formal legal system

We connect you with tools (polls, evidence, lawyers) that help you engage with governance and the legal system, but we are not a substitute for any of those institutions.

### Who runs the platform?

The platform is run by the Najia Community Bridge team, a civic technology organization committed to citizen empowerment. We are funded by grants and donations, not by political parties or commercial interests. Our [quarterly transparency reports](#) detail our funding, our activities, and our impact.

### Where is the platform available?

The platform is currently in its pilot phase in Lagos, Nigeria. We plan to expand to other states in 2026–2027 and to all 36 states + FCT in Year 2 (2027–2028). The exact timeline is in our [Roadmap](../product/Roadmap.md).

### What languages does the platform support?

Currently, the platform is in English. We plan to add Yoruba, Hausa, Igbo, and Pidgin in Year 2. If you speak another language and would like to help with translations, contact us at support@najiacommunitybridge.com.

---

## Account and Verification

### How do I create an account?

Go to [najiacommunitybridge.com](https://najiacommunitybridge.com) and click **Sign Up**. You'll need an email address, a password, and your full name (as it appears on your NIN or ID). For detailed instructions, see the [User Guide §2.1](./User%20Guide.md#21-create-an-account).

### Do I need to verify my identity?

You can create an account without verifying your identity, but you'll need to verify to:
- Vote on polls and confidence questions
- Upload evidence
- Find a lawyer
- Comment on blog posts
- Enroll in legal literacy modules

Without verification, you can only read content (blog posts, legal literacy modules, lawyer profiles). For detailed instructions, see the [User Guide §2.2](./User%20Guide.md#22-verify-your-identity).

### What is the difference between NIN verification and document verification?

- **NIN verification** uses your National Identification Number (NIN) to verify your identity with the National Identity Management Commission (NIMC). It's faster (usually less than 10 seconds) and uses data you already have.
- **Document verification** uses a government-issued photo ID (passport, driver's license, or voter's card) plus a selfie. It's a fallback for users who don't have a NIN or whose NIN verification fails.

Both are equally valid. Choose the one that works for you.

### What if my verification fails?

First, double-check that your NIN, date of birth, and name match exactly what NIMC has on file (for NIN verification) or that your document is clear and legible (for document verification). If verification still fails, you can appeal — go to **Profile** → **Verification Status** → **Appeal**. Our team will review your case within 5 business days.

### Is my data safe?

Yes. We use industry-standard encryption (TLS 1.3 in transit, AES-256 at rest) and we never sell your data. We are compliant with the Nigeria Data Protection Regulation (NDPR). For the full details, see our [Privacy Policy](#).

### Can I have more than one account?

No. One person, one account. If you have a legitimate reason to need a second account (e.g., you're a journalist with a work and personal identity), contact support@najiacommunitybridge.com.

### Can I delete my account?

Yes. Go to **Profile** → **Settings** → **Delete Account**. Your account enters a 30-day grace period (you can restore it). After 30 days, your account and all personal data are permanently deleted. For details, see the [User Guide §9.3](./User%20Guide.md#93-account-deletion).

---

## Civic Engagement

### Are the polls binding?

**No. All polls are non-binding expressions of citizen sentiment.** They have no legal or electoral weight. The government is not obligated to act on the results. The polls exist to inform policymakers and the public about what citizens think, and to create a record of public opinion over time.

The disclaimer "This is citizen sentiment only. It has no legal or electoral weight." appears on every poll page and every results page.

### Are my votes anonymous?

**Yes. Your votes are completely anonymous.** Here's how we protect your privacy:
- We do not store your user ID with your vote. Instead, we store a one-way hash that proves you voted but cannot be reversed to identify you.
- We do not share your voting history with anyone.
- Even our own staff cannot identify how you voted.

For the full technical details, see our [Privacy Policy](#) and the [User Guide §3.4](./User%20Guide.md#34-privacy-of-your-votes).

### Can I change my vote?

No. Once you submit a vote, it cannot be changed. This is by design — it prevents last-minute manipulation. If your views change during a poll, that's part of the deliberative process; the vote records what you believed at the moment you voted.

### Can I see who else voted and how?

No. Votes are anonymous, so we cannot show you who voted or how they voted. We can only show you aggregate results (e.g., "62% of voters chose Yes"). This is a core privacy commitment.

### Can I see the results during a poll?

No. Results are not shown during the voting period. This prevents the results from influencing other voters (a phenomenon called "bandwagon effect" or "underdog effect"). Results are shown after the poll closes.

### What's the difference between a policy poll and a confidence vote?

- **Policy poll:** asks your opinion on a specific government policy or initiative. Examples: "Should Lagos invest in more bus rapid transit?" "Should the new education policy be adopted?"
- **Confidence vote:** asks whether you have confidence in an elected official's performance. Examples: "Do you have confidence in Governor X?" "Do you have confidence in House Member Y?"

Both are non-binding. Both are anonymous. Both are quarterly or as-needed. Confidence votes happen on a fixed schedule (January, April, July, October); policy polls happen as topics are approved by our Advisory Board.

### Can I suggest a poll topic?

Yes. Go to **Polls** → **Suggest a Topic**, enter the topic and a brief rationale, and submit. Your suggestion is reviewed by our moderators. If approved, it may become a poll. You'll be notified of the decision.

### How does the Advisory Board work?

The Advisory Board is an independent body of experts (in law, political science, civil society, technology, journalism, and academia) that reviews every poll draft before publication. They ensure polls are:
- Neutral (no leading or biased language)
- Relevant (current and meaningful to citizens)
- Actionable (results can inform policy discussion)
- Appropriate (within the platform's scope, which is non-binding civic engagement, not electoral politics)

The AB is independent of the platform's staff. Their composition is documented in our [governance section](#).

### Will the government see the results?

Yes. The aggregate results are public. Anyone can see them, including the government. The results inform the public conversation; they don't obligate the government to act.

### Does the platform endorse any candidate or party?

**No.** The platform is strictly non-partisan. We do not endorse, support, or oppose any candidate, party, or political position. The Advisory Board reviews polls for neutrality, and we have strict rules against using the platform for political campaigning.

---

## Evidence and Disputes

### What is evidence on the platform?

Evidence is a file (image, video, audio, or document) that you upload to the platform to support a civil dispute. The platform verifies the file's integrity (it hasn't been changed since you uploaded it) and runs an AI manipulation check (to flag files that may have been AI-generated or altered).

### What file types are supported?

- **Images:** JPG, PNG, WebP
- **Videos:** MP4, AVI, WebM
- **Audio:** MP3, WAV, M4A
- **Documents:** PDF, DOCX, TXT

Maximum file size: 100 MB.

### What does "Verified" mean on my evidence?

"Verified" means the file's current bytes match the original bytes that were uploaded. The platform uses a cryptographic hash (SHA-256) to verify this. If the file has been changed in any way (even by one byte), the verification will fail.

This protects you from someone claiming your evidence was altered after you uploaded it.

### What does the AI detection status mean?

The AI detection is an automated check that estimates the likelihood that an image or video was generated or manipulated by AI. It has three levels:
- **Low:** the check did not detect signs of AI manipulation
- **Medium:** the check detected some indicators (the file is still available, but with a notice)
- **Important:** the check strongly indicates manipulation (the file is held for moderator review)

The AI detection is a **probabilistic automated check**, not a definitive verdict. It's a signal, not a judgment. If your file is flagged, you can appeal the decision.

### Can the AI detection make a mistake?

Yes. The AI detection is not perfect. It can have false positives (flagging a real file as manipulated) and false negatives (missing a manipulated file). The platform's moderators review all High-confidence flags before any action is taken.

### What if my evidence is flagged as potentially AI-manipulated?

If your evidence is flagged, you can:
- **Appeal** the decision — go to the evidence detail page and click "Appeal"
- **Provide context** — explain where the file came from, what it shows, and any other relevant information
- A moderator will review the appeal within 24 hours

### Who can see my evidence?

- **You:** always
- **A lawyer matched to your case:** yes, but only after you engage them (and only in the context of the case)
- **Other users:** no
- **Platform staff:** only as needed for moderation or technical support

Your evidence is not shared with anyone else.

### Can I delete my evidence?

Yes. Go to the evidence detail page and click **Delete**. The file is soft-deleted (preserved for 30 days in case you need to restore it) and then permanently deleted. If the evidence is part of a closed case, you may not be able to delete it (to preserve the integrity of the case record). Contact support if you have questions.

### Can I edit my evidence after uploading?

You can edit the **description** and **tags** of your evidence at any time. You cannot edit the file itself (the integrity check would fail). If you need to replace the file with a corrected version, delete the old evidence and upload the new one.

### Is my evidence used for training AI models?

**No.** Your evidence is not used for training AI models. The AI detection models are trained on publicly available datasets, not on user-uploaded evidence.

---

## Finding a Lawyer

### How does the lawyer matching work?

The platform matches you with lawyers based on:
- Your case type (e.g., landlord-tenant, employment, consumer)
- Your jurisdiction (the state where the case is)
- Your budget
- Your urgency
- The lawyer's practice areas, jurisdictions, fees, rating, and availability

The matching is transparent — you'll see why each lawyer was matched to you, with a score breakdown.

### Is the consultation really free?

**Yes, the 15-minute consultation is completely free to you.** The platform pays the lawyer a flat fee for their consultation time. This is funded by the platform's grants and donations, not by you.

### What happens after the consultation?

After the consultation, you have three options:
1. **Engage the lawyer** — if you want to hire the lawyer for further work, you do so directly. The platform is not involved.
2. **Find another lawyer** — if this lawyer wasn't a good fit, you can return to the matching.
3. **Not engage** — if you decide not to pursue the case, you can close it.

### Does the platform take a percentage of legal fees?

**No.** The platform charges lawyers a flat monthly subscription. The platform does not take a percentage of legal fees, consultation fees, or any fee that flows from a lawyer-client engagement. This is a commitment we make to you, to the lawyers, and to the Nigerian Bar Association.

### Can the lawyer see my identity before the consultation?

**No.** The lawyer sees the case (type, jurisdiction, urgency, budget, description) but not your name, photo, or contact information. The lawyer accepts or declines based on the case, not the person. Your identity is revealed only at the consultation, when both parties join the platform's consultation room.

### What if the lawyer doesn't show up?

If the lawyer doesn't show up within 5 minutes of the scheduled time, you're offered:
- A re-match with another lawyer, or
- A full refund of the consultation fee (which the platform pays the lawyer)

You're never charged for a consultation, so the refund is to the platform, not to you.

### What if I don't show up?

If you don't show up, the lawyer is still paid for the consultation time. The platform absorbs the cost. We do this to protect lawyers' time and to encourage them to participate in the marketplace.

### How do I know a lawyer is legitimate?

Every lawyer on the platform is verified through the Body of Benchers public register. Their bar number, year of call, and jurisdictions are confirmed before they can list on the platform. If you have concerns about a specific lawyer, contact support@najiacommunitybridge.com.

### Can I see reviews of lawyers?

Yes. Each lawyer's profile shows their overall rating, the number of reviews, and the most recent reviews. Reviews are from verified citizens who have completed a documented engagement with the lawyer. The lawyer can respond to reviews publicly.

### How do I leave a review for a lawyer?

After you complete a consultation AND have a documented engagement with the lawyer, you'll receive a prompt to leave a review. The review includes:
- An overall rating (1–5 stars)
- Category ratings (communication, expertise, responsiveness, value)
- A text review (50–2000 characters)
- The requirement that you confirm an engagement happened (the platform does not see the engagement; you confirm it)

Reviews are moderated before becoming public. You can appeal if your review is removed.

### What if I have a complaint about a lawyer?

If you have a complaint about a lawyer's behavior on the platform, contact support@najiacommunitybridge.com. We take all complaints seriously. We may suspend or remove the lawyer from the platform if the complaint is substantiated.

For complaints about a lawyer's professional conduct (separate from the platform), contact the Nigerian Bar Association.

---

## Legal Literacy

### What are legal literacy modules?

Legal literacy modules are structured courses on legal topics. They're free, self-paced, and designed for Nigerian citizens. Examples:
- Introduction to Law
- Civil Rights
- Landlord-Tenant Law
- Consumer Protection
- Employment Law
- Family Law
- Criminal Law Basics
- Alternative Dispute Resolution

### How long does a module take?

Each module takes 20–60 minutes, depending on the topic. You can pause and resume at any time.

### Do I get a certificate?

Not in the pilot. Completion is marked in your profile ("Module X completed"). Formal certificates are a Year 2 feature.

### Are the modules reviewed by lawyers?

Yes. Every module is reviewed by a qualified legal professional before publication. The modules are designed to give you a practical understanding of the topic, not a legal degree.

### Can I take a module without an account?

You can read modules without an account, but to enroll (and track your progress), you need a verified account.

### Can I suggest a module?

Yes. Use the "Suggest a topic" feature in the Learn section. Your suggestion is reviewed by our content team.

---

## The Blog

### What kind of content is on the blog?

The blog has articles on:
- **Civic Engagement** — how to participate in governance
- **Know Your Rights** — legal rights explained
- **Legal Guide** — step-by-step guides for common legal issues
- **Platform How-To** — tutorials for using the platform
- **Community Voices** — stories from citizens using the platform
- **Policy Watch** — analysis of government policies
- **Lawyer Insights** — professional legal perspectives
- **Transparency Reports** — quarterly platform activity

### Who writes the blog?

The blog is written by our content team, with contributions from lawyers, civil society organizations, and guest experts. All content is reviewed before publication (fact-check, legal review, accessibility check).

### Can I comment on articles?

Yes, if you have a verified account. Comments are moderated before becoming visible. Comments that violate our moderation policy (personal attacks, hate speech, off-topic, spam) are removed.

### Can I write for the blog?

We're always looking for contributors. If you're a writer, a lawyer, or a subject matter expert and would like to contribute, contact us at content@najiacommunitybridge.com.

---

## Privacy and Data

### What data does the platform collect?

We collect:
- Your email address (for login and notifications)
- Your full name (for identity verification)
- Your NIN or document (for identity verification; the data is encrypted and not shared)
- Your activity (votes, evidence, cases, reviews) — but votes are anonymized
- Your device and browser information (for security and performance)

For the full details, see our [Privacy Policy](#).

### Does the platform sell my data?

**No. We never sell your data to third parties.** This is a core commitment.

### Does the platform share my data with the government?

**Only as required by law, and with Legal Director review.** The platform does not voluntarily share user data with government agencies. If we receive a legal request (e.g., a court order), the Legal Director reviews it, and we comply only with valid legal process. We will notify affected users unless prohibited by law.

### Can I request a copy of my data?

Yes. This is your right under the NDPR. Go to **Profile** → **Settings** → **Request My Data** or email privacy@najiacommunitybridge.com. We'll provide a copy of your data in a machine-readable format (JSON) within 30 days.

### Can I correct my data?

Yes. Most of your data can be updated at any time from **Profile** → **Settings**. For data that cannot be self-updated (e.g., verification records), contact support@najiacommunitybridge.com.

### How long does the platform keep my data?

We keep your data for as long as your account is active. If you delete your account, your data is deleted within 30 days (with limited exceptions for legal hold). Anonymized aggregate statistics (e.g., "the platform had 500 verified users in Q3 2026") may be retained indefinitely. Anonymized vote records are retained for the integrity of past polls.

### Is my data stored in Nigeria?

Yes. All data is stored on a self-hosted server in Nigeria. We do not use offshore cloud providers. This is to comply with the NDPR data sovereignty requirement.

---

## Technical Questions

### What devices does the platform support?

The platform works on:
- Modern web browsers (Chrome, Firefox, Safari, Edge — last 2 versions)
- iOS devices (iOS 14+, via the Expo app)
- Android devices (Android 8+, via the Expo app)

### Does the platform work on low-bandwidth connections?

Yes. The platform is optimized for low-bandwidth connections. Images are compressed, data usage is minimized, and the mobile app supports offline reading of previously loaded content.

### Can I use the platform without a smartphone?

Yes. The web app works on any modern browser, including on a computer or a feature phone with internet access (via the mobile web, not the app).

### What if the platform is down?

If the platform is down, you can:
- Check the [status page](https://status.najiacommunitybridge.com) (forthcoming)
- Try again in a few minutes
- Contact support@najiacommunitybridge.com to report the issue

### Is the platform open source?

Parts of the platform are open source (the MDX components, some utilities). The core platform is not currently open source, but we may consider it in the future.

---

## For Lawyers

### How do I register as a lawyer?

1. Create a citizen account and verify your identity
2. Go to **Profile** → **Register as a Lawyer**
3. Submit your bar credentials
4. Wait for bar verification (1–3 business days)
5. Create your profile and select a subscription tier
6. Your profile goes live

For detailed instructions, see the [User Guide §6.1](./User%20Guide.md#61-register-as-a-lawyer).

### How much does the subscription cost?

The subscription is a flat monthly fee, not a percentage of legal fees. The tiers are:
- **Basic:** ₦3,000/month
- **Enhanced:** ₦7,000/month
- **Premium:** ₦15,000/month

These prices are for the pilot and may change in Phase 2.

### Can I try the platform for free?

Not in the pilot. We may offer a free trial in Phase 2.

### How do I get matched to cases?

When a citizen's case matches your practice areas, jurisdictions, and availability, you'll receive a notification. You can accept or decline within 24 hours.

### Can I see the citizen's identity before accepting?

No. You see the case (type, jurisdiction, urgency, budget, description) but not the citizen's name, photo, or contact information. This is to protect the citizen from being declined based on demographics.

### How is my rating calculated?

Your rating is the average of all reviews you've received from verified citizens who completed a documented engagement with you. The rating has four categories: communication, expertise, responsiveness, and value. Your overall rating is the weighted average.

### What if I get a bad review?

You can respond to the review publicly. Be professional and constructive. If the review violates our moderation policy (defamation, hate speech, off-topic), you can report it for moderation review.

### Can I delete a bad review?

No. Reviews are immutable once public. This is to preserve the integrity of the public record. If a review is removed by moderation (for policy violations), the removal is documented but the original text is retained in the audit log.

### What if I have a complaint about a user?

If a user is abusive or violates our terms, report the interaction to support@najiacommunitybridge.com. We may suspend or remove the user from the platform.

### Can I advertise my services on the platform?

No. Lawyer advertising is restricted by the Nigerian Bar Association. The platform does not allow paid advertising. Your profile is your professional presence; the matching algorithm determines your visibility.

### What if my bar license lapses?

If your bar license lapses, you must notify the platform within 30 days. Your profile will be suspended until the license is renewed. Failure to notify is grounds for permanent removal.

---

## Pilot-Specific Questions

### What is the pilot?

The pilot is the first phase of the platform, limited to 500 verified users in Lagos. The pilot runs from August 2026 to January 2027. The purpose of the pilot is to validate the model, gather feedback, and prepare for national expansion.

### How do I join the pilot?

The pilot cohort is selected by the project team. If you're interested in joining, you can:
- Fill out the [pilot interest form](https://najiacommunitybridge.com/pilot-interest)
- Email pilot@najiacommunitybridge.com
- Ask someone who's already in the pilot to refer you

### What do I get for being in the pilot?

Pilot participants get:
- Early access to the platform
- Direct communication with the project team
- A say in the platform's development (your feedback is prioritized)
- Recognition in the pilot cohort (in the final transparency report)

### What are my obligations as a pilot participant?

Pilot participants are asked to:
- Use the platform regularly (at least once a week)
- Provide feedback (via the in-app feedback mechanism, the weekly survey, and the pilot channel)
- Report any issues or concerns
- Respect the platform's terms and policies

### What happens after the pilot?

After the pilot, the platform expands to all Lagos residents (Phase 2), then to other states (Year 2), then nationally. Pilot participants will have early access to the expanded platform and their feedback will continue to inform the development.

### Can I leave the pilot?

Yes. You can delete your account at any time. The pilot is voluntary, and you can withdraw without any consequences.

### Will the pilot affect my privacy?

The pilot uses the same privacy protections as the full platform. Your data is protected by the NDPR and our Privacy Policy. Pilot participants are not subject to any additional data collection.

### How is the pilot funded?

The pilot is funded by grants from civic technology funders (Luminate, Open Society, Ford Foundation) and Nigerian philanthropic foundations. The pilot does not accept funding from political parties, candidates, or commercial interests that could create a conflict of interest.

### Who is on the Advisory Board?

The Advisory Board is composed of:
- 2 legal experts
- 1 political scientist
- 2 civil society leaders
- 1 technology expert
- 1 journalist/media professional
- 1 academic/researcher

The AB is independent of the platform's staff. Their names and biographies are available in the [governance section](#) of the platform.

### How is the platform held accountable?

The platform publishes [quarterly transparency reports](#) that detail:
- Platform activity (users, polls, evidence, cases)
- Financial summary (revenue, costs, funding)
- Operational metrics (uptime, incidents, response times)
- Compliance (NDPR, Bar Association engagement)

The reports are public. The platform's leadership is accountable to the Board and to the public.

---

## Getting Help

### How do I contact support?

Email **support@najiacommunitybridge.com**. We respond within 1 business day.

### What are the support hours?

Monday–Friday, 9:00–17:00 Lagos time. After-hours support is best-effort for urgent issues (P1 incidents).

### Can I get help in my language?

Currently, support is in English. Local language support is planned for Year 2.

### What if I have an accessibility issue?

Please report it to support@najiacommunitybridge.com. We follow WCAG 2.1 AA standards and want to know if we're falling short.

### What if I have a security concern?

Email **security@najiacommunitybridge.com**. We take security seriously and will respond promptly.

### What if I have a privacy concern?

Email **privacy@najiacommunitybridge.com**. We will respond within 5 business days.

---

## Appendix A: Quick Reference

### Contact Information

- **General:** info@najiacommunitybridge.com
- **Support:** support@najiacommunitybridge.com
- **Security:** security@najiacommunitybridge.com
- **Privacy:** privacy@najiacommunitybridge.com
- **Legal:** legal@najiacommunitybridge.com
- **Press:** press@najiacommunitybridge.com
- **Pilot:** pilot@najiacommunitybridge.com

### Key Links

- **Platform:** [najiacommunitybridge.com](https://najiacommunitybridge.com)
- **User Guide:** [User Guide](./User%20Guide.md)
- **Troubleshooting:** [Troubleshooting](./Troubleshooting.md)
- **Status Page:** [status.najiacommunitybridge.com](https://status.najiacommunitybridge.com) (forthcoming)

### Key Principles

- **All polls are non-binding.** Citizen sentiment, not legal action.
- **Your votes are anonymous.** We cannot identify how you voted.
- **Your evidence is verified.** Cryptographic integrity, not just metadata.
- **Lawyer consultations are free.** Paid by the platform, not by you.
- **The platform does not take a percentage of legal fees.** A flat subscription for lawyers.
- **Your data is protected.** NDPR-compliant, stored in Nigeria, never sold.

## Appendix B: Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Content Lead | Initial FAQ for the Lagos pilot. Covers 60+ questions organized by topic: General (7), Account and Verification (7), Civic Engagement (10), Evidence and Disputes (10), Finding a Lawyer (12), Legal Literacy (5), The Blog (4), Privacy and Data (7), Technical Questions (5), For Lawyers (12), Pilot-Specific Questions (10), and Getting Help (6). The most important questions are the non-binding disclaimer (Civic Engagement), the vote anonymity explanation (Civic Engagement), the evidence integrity and AI detection explanation (Evidence), and the fee model explanation (For Lawyers). The FAQ is the "quick answer" complement to the User Guide's "full explanation". |