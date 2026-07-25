# Najia Community Bridge — User Guide

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active (Pilot)*
*Audience: All users (citizens, lawyers, and staff)*

> **About this guide:** This is the official user guide for the Najia Community Bridge. It walks you through everything you can do on the platform, step by step. If you have a question, start here. If you can't find what you're looking for, see the [FAQ](./FAQ.md) or the [Troubleshooting guide](./Troubleshooting.md). You can also contact us at support@najiacommunitybridge.com.

> **Pilot scope:** The platform is currently in its pilot phase in Lagos. Some features described in this guide may not be available yet; the feature is marked as "coming soon" where applicable. For the latest status, see the [Roadmap](../product/Roadmap.md).

> **Language:** This guide is currently available in English. Local language versions (Yoruba, Hausa, Igbo, Pidgin) are planned for Year 2.

---

## 1. Welcome to Najia Community Bridge

Najia Community Bridge is a civic engagement and access-to-justice platform for Nigerian citizens. It's designed to help you:

- **Have a voice in governance** — vote on policy polls and confidence questions for your elected officials
- **Protect your evidence** — upload evidence for civil disputes with cryptographic verification
- **Find legal help** — connect with verified lawyers for a free 15-minute consultation
- **Learn about your rights** — read guides and take courses on legal topics

**Important: All polls are non-binding.** They are expressions of citizen sentiment, not votes that affect government policy or elections. Your vote is recorded anonymously — only you know how you voted.

The platform is free to use. We do not sell your data. We are committed to your privacy and to the security of your information.

### 1.1 Who This Guide Is For

This guide is for:

- **Citizens** who want to participate in civic engagement, upload evidence, or find a lawyer
- **Lawyers** who want to offer their services on the platform
- **Anyone** who wants to understand how the platform works

If you're a moderator or an administrator, there are separate guides for you (contact the Operations Director).

### 1.2 What You'll Need

To use the platform, you'll need:

- A smartphone or computer with internet access
- A valid email address
- For identity verification: either a National Identification Number (NIN) or a government-issued photo ID (passport, driver's license, or voter's card)
- For evidence upload: a camera or scanner (most smartphones work)
- For lawyer consultation: a device with a camera and microphone (smartphone or computer)

The platform works on low-bandwidth connections. We have optimized the experience for mid-range Android phones over 4G.

---

## 2. Getting Started

### 2.1 Create an Account

1. Go to [najiacommunitybridge.com](https://najiacommunitybridge.com) (or open the mobile app)
2. Click **Sign Up**
3. Enter your email address, a password, and your full name (as it appears on your NIN or ID)
4. Click **Create Account**
5. Check your email for a verification link and click it
6. You're now registered — but you need to verify your identity to use the platform's features

**Your password should be:**
- At least 12 characters long
- A mix of letters, numbers, and symbols
- Not used on any other site
- Something you'll remember (we can't reset it for you if you forget)

### 2.2 Verify Your Identity

Identity verification is required to vote on polls, upload evidence, and find a lawyer. We verify your identity using either:

- **NIN verification** (faster, recommended) — we verify your NIN with the National Identity Management Commission (NIMC)
- **Document verification** (fallback) — we verify your government-issued photo ID with our partner (Onfido)

**To verify with NIN:**
1. Log in to your account
2. Go to **Profile** → **Verify Identity**
3. Click **Verify with NIN**
4. Enter your 11-digit NIN, your date of birth, and your full name (as on your NIN)
5. Click **Submit**
6. Wait for the verification (usually less than 10 seconds)
7. You're verified!

**To verify with a document:**
1. Log in to your account
2. Go to **Profile** → **Verify Identity**
3. Click **Verify with Document**
4. Take a photo of your passport, driver's license, or voter's card
5. Take a selfie
6. Submit
7. Wait for the verification (usually less than 10 seconds)
8. You're verified!

**What if verification fails?**
- Check that your NIN, date of birth, and name match exactly what NIMC has on file
- Try the document verification option instead
- If both fail, you can appeal — go to **Profile** → **Verification Status** → **Appeal**

### 2.3 Set Up Your Profile

Once you're verified, set up your profile:

1. Go to **Profile** → **Edit**
2. Add a profile photo (optional but recommended)
3. Add your jurisdiction (the state where you reside — this determines which polls you can vote on)
4. Add your preferred language
5. Click **Save**

Your profile is visible to lawyers when they receive a match (but not before they accept). Your vote and your evidence are always anonymous.

---

## 3. Civic Engagement

The platform has two types of civic engagement: **policy polls** and **confidence votes**. Both are non-binding expressions of citizen sentiment.

### 3.1 Vote on a Policy Poll

Policy polls ask your opinion on a specific government policy or initiative. They're published by the platform's moderators (after review by our Advisory Board) and are open for a limited time.

**To vote on a policy poll:**
1. Log in to your account
2. Go to **Polls** in the main menu
3. Find an active poll (look for the green "Active" badge)
4. Click the poll to see the full question and the policy context
5. Read the question, the summary, and the context
6. Select your option
7. Click **Submit Vote**
8. Your vote is recorded anonymously. You'll see a confirmation: "Your vote has been recorded anonymously. Only you know how you voted."

**You can only vote once per poll.** The system prevents duplicate votes. If you try to vote again, you'll be told you've already voted.

**You can see the results after the poll closes.** During the poll, results are not shown — this prevents the results from influencing other voters.

**Important:** Policy polls are **non-binding**. They are expressions of citizen sentiment, not votes that affect government policy. The disclaimer "This is citizen sentiment only. It has no legal or electoral weight." appears on every poll page.

### 3.2 Vote on a Confidence Question

Confidence votes ask whether you have confidence in an elected official's performance. They're published quarterly (January, April, July, October) and are open for 7 days.

**To vote on a confidence question:**
1. Log in to your account
2. Go to **Polls** → **Confidence Votes**
3. Find an active confidence vote for an official in your jurisdiction
4. Click the official to see their role and responsibilities
5. Select **Yes** (you have confidence), **No** (you don't), or **Uncertain**
6. Optionally, add a brief rationale (this is anonymous — only your vote is associated with your identity check, and even that is anonymized)
7. Click **Submit Vote**

**You can only vote once per official per quarter.** The results are shown after the quarter ends, with a quarter-over-quarter trend.

**Important:** Confidence votes are **non-binding**. They are expressions of citizen sentiment, not votes that affect elections. The disclaimer appears on every results page.

### 3.3 Suggest a Poll Topic

If you have an idea for a policy poll, you can suggest it:

1. Go to **Polls** → **Suggest a Topic**
2. Enter the topic and a brief rationale (why is this important?)
3. Click **Submit**

Your suggestion is reviewed by our moderators. If approved, it may become a poll. You'll be notified of the decision.

### 3.4 Privacy of Your Votes

Your vote is **completely anonymous**. Here's how we protect your privacy:

- We do not store your user ID with your vote. Instead, we store a one-way hash that proves you voted but cannot be reversed to identify you.
- We do not share your voting history with anyone.
- We do not use your vote for advertising or marketing.
- Even our own staff cannot identify how you voted.

If you have questions about vote privacy, see our [Privacy Policy](#) or contact us at support@najiacommunitybridge.com.

---

## 4. Evidence and Disputes

If you have a civil dispute (with a landlord, employer, consumer, or family member), the platform helps you upload evidence and find a lawyer. The evidence is cryptographically verified to prove it hasn't been tampered with.

### 4.1 Upload Evidence

You can upload evidence at any time after verification. Evidence can be:
- **Images** (screenshots, photos) — JPG, PNG, WebP
- **Videos** — MP4, AVI, WebM
- **Audio** — MP3, WAV, M4A
- **Documents** — PDF, DOCX, TXT

Maximum file size: 100 MB.

**To upload evidence:**
1. Log in to your account
2. Go to **Evidence** in the main menu
3. Click **Upload Evidence**
4. Select the file from your device (or take a photo with your phone's camera)
5. Optionally, associate the evidence with a case (if you have one)
6. Optionally, add a description and tags
7. Click **Upload**

When the upload is complete, you'll see:
- **Integrity status:** "This file is verified. It has not been changed since you uploaded it." (with a green badge)
- **AI detection status:** "This file was [not flagged / flagged with medium confidence / flagged with high confidence] for AI manipulation. This is an automated check, not a definitive verdict."

The integrity check is cryptographic (a SHA-256 hash). The AI detection is a probabilistic automated check. Both are explained in [§4.3](#43-understanding-evidence-status).

### 4.2 View Your Evidence

Your evidence is visible to you and to a lawyer who is assigned to a case you're involved in. It's not visible to other users.

**To view your evidence:**
1. Go to **Evidence** in the main menu
2. Find the evidence in the list
3. Click to see the full detail (status, hash, AI detection, description, tags)

You can also download the evidence (with integrity verification on download) or delete it (soft delete; the file is preserved for 30 days before permanent deletion, in case you need to restore it).

### 4.3 Understanding Evidence Status

Each piece of evidence has two statuses:

**Integrity status:**
- **Verified** (green) — the file matches the original. It hasn't been changed since you uploaded it.
- **Not verified** (red) — the file's current bytes don't match the original. This should never happen under normal operation; if it does, contact support.

**AI detection status:**
- **Low** (green) — the automated check did not detect signs of AI manipulation.
- **Medium** (yellow) — the automated check detected some indicators. The file is still available, but the user (and any assigned lawyer) sees a notice that the file may have been manipulated.
- **High** (red) — the automated check strongly indicates manipulation. The file is held for moderator review before becoming visible to others.

The AI detection is a **probabilistic automated check**, not a definitive verdict. It's a signal, not a judgment. If your file is flagged, you can appeal the decision.

### 4.4 Associate Evidence with a Case

If you have a case (in the lawyer marketplace), you can associate evidence with the case:

1. Go to **Evidence** in the main menu
2. Find the evidence
3. Click **Edit**
4. Select the case from the dropdown
5. Click **Save**

The evidence is now part of the case. The matched lawyer can see it (along with the integrity and AI detection status).

---

## 5. Finding a Lawyer

If you have a civil dispute and want legal help, the platform connects you with verified lawyers for a free 15-minute consultation.

### 5.1 How the Lawyer Marketplace Works

The platform matches you with lawyers based on:
- Your case type (e.g., landlord-tenant, employment, consumer)
- Your jurisdiction (the state where the case is)
- Your budget
- Your urgency
- The lawyer's practice areas, jurisdictions, fees, rating, and availability

The matching is transparent. You'll see why each lawyer was matched to you, with a score breakdown.

The free consultation is funded by the platform — you pay nothing, and the lawyer is paid a flat fee by the platform for the consultation time.

**Important:** Any engagement after the consultation (the actual legal work) is between you and the lawyer. The platform is not involved in the engagement, does not take a percentage of legal fees, and does not mediate disputes.

### 5.2 Create a Case

1. Log in to your account
2. Go to **Lawyers** → **Find a Lawyer**
3. Click **Start a Case**
4. Fill in the intake form:
   - **Case type:** landlord-tenant, employment, consumer, family, or other
   - **Jurisdiction:** the state where the case is
   - **Budget range:** the amount you're willing to spend on legal fees
   - **Urgency:** within a week, within a month, or no rush
   - **Description:** a brief description of the case (up to 2000 characters)
5. Click **Submit**

Your case is saved. You can now find lawyers.

### 5.3 Find a Lawyer

1. Go to **Lawyers** → **Find a Lawyer** (or from the case detail page)
2. The system returns 3–5 matched lawyers
3. For each lawyer, you'll see:
   - Name and photo
   - Practice areas and jurisdictions
   - Fee structure
   - Overall rating and number of reviews
   - **Match score breakdown:** why this lawyer was matched to you (practice area, jurisdiction, availability, budget alignment, rating, experience, language, location, active load)
4. Review the profiles and select a lawyer
5. Click **Schedule Free Consultation**

### 5.4 Schedule a Free Consultation

The free consultation is 15–20 minutes, scheduled at a time that works for both you and the lawyer. The platform funds the consultation; the lawyer is paid a flat fee for their time.

1. Select an available time slot from the lawyer's calendar
2. Confirm the consultation
3. You'll receive a confirmation with the time and a join link
4. At the scheduled time, click the join link
5. The consultation happens via video, audio, or chat (you choose)
6. After the consultation, you can rate the platform's matching quality (not the lawyer — the lawyer is rated separately if you engage)

**During the consultation:**
- Both you and the lawyer join via the platform
- Video is the default; you can switch to audio-only or chat-only
- A timer shows the remaining time
- At the end, the room closes

**Important:** The consultation is **free** to you. The platform pays the lawyer. If you don't show up, the lawyer is still paid (the platform absorbs the cost). If the lawyer doesn't show up, you're offered a re-match with another lawyer.

### 5.5 After the Consultation

After the consultation, you have three options:
1. **Engage the lawyer** — if you want to hire the lawyer for further work, you do so directly. The platform is not involved. The platform does not take a percentage of any legal fees.
2. **Find another lawyer** — if this lawyer wasn't a good fit, you can return to the matching and find another.
3. **Not engage** — if you decide not to pursue the case, you can close it.

If you engaged the lawyer and the engagement is complete, you can leave a review of the lawyer (after the engagement is documented).

---

## 6. For Lawyers

If you're a lawyer, this section is for you. The platform is a way to find qualified clients in your practice areas, without the overhead of marketing.

### 6.1 Register as a Lawyer

1. Create a citizen account (per §2.1)
2. Verify your identity (per §2.2)
3. Go to **Profile** → **Register as a Lawyer**
4. Submit your bar credentials:
   - Bar number
   - Year of call
   - Jurisdictions where you're licensed
   - Practice areas
5. Wait for bar verification (our team checks the Body of Benchers public register; this takes 1–3 business days)
6. Once verified, create your profile:
   - Bio
   - Photo
   - Languages
   - Fee structure (what you charge your clients)
   - Availability
7. Select a subscription tier (Basic, Enhanced, or Premium) and pay the first month's fee
8. Your profile goes live

**Important:** The subscription is a **flat monthly fee**. The platform does not take a percentage of your legal fees. This is a commitment we make to you and to the Bar Association.

### 6.2 Receive Match Notifications

When a citizen's case matches your practice areas, jurisdictions, and availability, you'll receive a notification (email and in-app).

The notification includes:
- The case type
- The jurisdiction
- The urgency
- The budget range
- A brief description
- **Not the citizen's identity** — you see the case, not the person, until you accept

### 6.3 Accept or Decline a Match

You have 24 hours to respond to a match. You can:
- **Accept:** you'll proceed to schedule a consultation with the citizen
- **Decline:** you can decline with an optional reason (the reason is shared with the citizen anonymously)

If you don't respond within 24 hours, the match expires and the citizen is notified.

### 6.4 Conduct the Free Consultation

When you accept a match, the citizen schedules a consultation (15–20 minutes). At the scheduled time, you and the citizen join the platform's consultation room. The platform funds the consultation; you receive a flat fee for your time.

**During the consultation:**
- Be professional and helpful
- Assess the case and give the citizen a sense of their options
- Do not commit to specific fees or engagement terms during the free consultation
- If the citizen wants to engage you, you'll discuss that directly after the consultation

**After the consultation:**
- The platform will ask the citizen to rate the matching quality (not you)
- If the citizen engages you, the engagement is outside the platform
- The platform does not take a percentage of any fees

### 6.5 Respond to Reviews

After a citizen engages you and the engagement is complete, the citizen can leave a review. You'll be notified when a review is posted. You can respond to the review (publicly, attributed to you by name).

Reviews are important for your profile. Good reviews help you get matched to more cases. Bad reviews should be responded to professionally and constructively.

### 6.6 Subscription Management

Your subscription renews automatically each month via Paystack. You can:
- **Change tier** (upgrade takes effect immediately; downgrade takes effect at the next billing period)
- **Cancel** (your profile remains active until the end of the current billing period)
- **Update payment method** (via Paystack's portal)

If your subscription payment fails, you have a 7-day grace period to fix the payment. After 7 days, your profile is suspended (hidden from the directory) until the payment is resolved.

### 6.7 The Lawyer Code of Conduct

By registering as a lawyer on the platform, you agree to:

- Maintain your bar license in good standing
- Provide accurate information in your profile
- Respond to match notifications within 24 hours
- Conduct consultations professionally
- Not solicit clients outside the platform's matching system
- Comply with the Nigerian Bar Association Rules of Professional Conduct

Violations may result in suspension or removal from the platform.

---

## 7. Legal Literacy

The platform has a library of legal literacy modules — structured courses on legal topics. They're free, self-paced, and designed for Nigerian citizens.

### 7.1 Browse Legal Literacy Modules

1. Go to **Learn** in the main menu (or **Blog** → **Legal Literacy**)
2. Browse the available modules:
   - Introduction to Law
   - Civil Rights
   - Landlord-Tenant Law
   - Consumer Protection
   - Employment Law
   - Family Law
   - Criminal Law Basics
   - Alternative Dispute Resolution
3. Click a module to see the description, estimated time, and the topics covered

### 7.2 Enroll in a Module

1. Click **Enroll** on the module page
2. The module is added to your **My Learning** list
3. You can start the module immediately or return to it later

### 7.3 Complete a Module

1. Go to **My Learning** → select the module
2. Read through the sections at your own pace
3. Mark each section as **Complete** when you finish it
4. After all sections are complete, take the **Quiz**
5. The quiz has 5–10 questions (multiple choice or true/false)
6. You can take the quiz unlimited times; your best score is recorded
7. A passing score (typically 70%) marks the module as complete

### 7.4 What You'll Learn

Each module is designed to give you a practical understanding of the topic, not a legal degree. You'll learn:
- What the law says
- What your rights are
- How to exercise your rights
- Where to get help

The modules are reviewed by qualified legal professionals before publication.

---

## 8. The Blog

The platform has a blog with articles on civic engagement, legal guides, community stories, and policy analysis. The blog is free to read and doesn't require an account.

### 8.1 Browse the Blog

1. Go to **Blog** in the main menu
2. Browse articles by category:
   - **Civic Engagement** — how to participate in governance
   - **Know Your Rights** — legal rights explained
   - **Legal Guide** — step-by-step guides for common legal issues
   - **Platform How-To** — tutorials for using the platform
   - **Community Voices** — stories from citizens using the platform
   - **Policy Watch** — analysis of government policies
   - **Lawyer Insights** — professional legal perspectives
   - **Transparency Reports** — quarterly platform activity

### 8.2 Read an Article

Click an article to read it. You can:
- Read it in full
- Share it on social media
- Save it for later (requires an account)
- Comment on it (requires a verified account)

### 8.3 Comment on an Article

If you have a verified account, you can comment on blog articles. Comments are moderated — your comment is reviewed before becoming visible. Comments that violate the moderation policy (personal attacks, hate speech, off-topic, spam) are removed.

---

## 9. Your Account and Privacy

### 9.1 Your Account

Your account includes:
- **Email address** (used for login and notifications)
- **Password** (hashed; we never see it)
- **Full name** (used for verification)
- **Profile** (photo, jurisdiction, language — optional)
- **Role** (citizen, lawyer, or staff)
- **Verification status**
- **Activity history** (votes, evidence, cases, reviews)

You can update most of these at any time from **Profile** → **Settings**.

### 9.2 Your Privacy

We are committed to your privacy. Here's what we collect, how we use it, and what we don't do:

**What we collect:**
- Your email address (for login and notifications)
- Your full name (for identity verification)
- Your NIN or document (for identity verification; the data is encrypted and not shared)
- Your activity (votes, evidence, cases, reviews) — but votes are anonymized
- Your device and browser information (for security and performance)

**How we use it:**
- To verify your identity
- To enable the platform's features (voting, evidence upload, lawyer matching)
- To send you notifications (votes, matches, platform updates)
- To improve the platform (analytics, in aggregate)
- To comply with legal obligations (NDPR)

**What we don't do:**
- We don't sell your data to third parties
- We don't use your data for advertising
- We don't share your data with government agencies (except as required by law, and with Legal Director review)
- We don't track you across other websites

**Your rights (under NDPR):**
- **Right to access** — you can request a copy of your data (DSAR)
- **Right to correct** — you can update your data at any time
- **Right to delete** — you can request account deletion (with a 30-day grace period)
- **Right to object** — you can object to certain processing (contact support)
- **Right to data portability** — you can request your data in a machine-readable format

To exercise any of these rights, contact support@najiacommunitybridge.com.

### 9.3 Account Deletion

If you want to delete your account:
1. Go to **Profile** → **Settings** → **Delete Account**
2. Confirm the deletion
3. Your account enters a 30-day grace period (you can restore it)
4. After 30 days, your account and all PII are permanently deleted

**What is deleted:**
- Your account (email, name, password)
- Your profile
- Your verification records
- Your activity history (votes, evidence, cases, reviews)

**What is retained (per legal requirements):**
- Anonymized vote records (the anonymized hashes are retained for the integrity of past polls)
- Anonymized aggregate statistics (e.g., "the platform had 500 verified users in Q3 2026")
- Audit log entries (with your user ID redacted to "deleted user")

### 9.4 Cookies and Tracking

The platform uses cookies for:
- **Authentication** (to keep you logged in)
- **Preferences** (to remember your settings)
- **Analytics** (in aggregate, to improve the platform)

We do not use third-party tracking cookies. We do not use advertising cookies. You can disable cookies in your browser settings, but some features (like staying logged in) may not work.

---

## 10. Getting Help

If you need help, here are your options:

### 10.1 The Help Center

The help center has answers to the most common questions. Go to **Help** in the user menu, or visit [help.najiacommunitybridge.com](https://help.najiacommunitybridge.com).

### 10.2 The FAQ

See the [FAQ](./FAQ.md) for answers to frequently asked questions.

### 10.3 The Troubleshooting Guide

See the [Troubleshooting guide](./Troubleshooting.md) if something isn't working.

### 10.4 Contact Support

Email us at **support@najiacommunitybridge.com**. We respond within 1 business day.

For pilot participants, you can also use the pilot-specific channel (provided in the welcome email).

### 10.5 Report an Issue

If you encounter a bug, a security issue, or a content violation, please report it:

- **Bugs:** support@najiacommunitybridge.com with subject "Bug Report"
- **Security issues:** security@najiacommunitybridge.com (we take these seriously; see our [Security Policy](#))
- **Content violations:** use the "Report" button on the content, or email support@najiacommunitybridge.com
- **Privacy concerns:** privacy@najiacommunitybridge.com

---

## 11. Legal and Policies

### 11.1 Terms of Service

The [Terms of Service](#) govern your use of the platform. By using the platform, you agree to these terms.

Key points:
- The platform is provided "as is" without warranties
- The platform is not a court, jury, or law enforcement agency
- Polls are non-binding
- Evidence is provided as-is; the platform does not verify the truth of the content
- Lawyer consultations are informational; the platform does not provide legal advice
- The platform may be modified, suspended, or terminated at any time
- Disputes are governed by Nigerian law

### 11.2 Privacy Policy

The [Privacy Policy](#) describes how we collect, use, and protect your data. It's compliant with the Nigeria Data Protection Regulation (NDPR).

### 11.3 Moderation Policy

The [Moderation Policy](#) describes what content is allowed and what's not, and how we handle violations. The platform is committed to safe, civil discourse.

### 11.4 Lawyer Terms

The [Lawyer Terms](#) govern lawyers' use of the platform, including the subscription model, the code of conduct, and the relationship between the platform and the lawyer.

### 11.5 Accessibility

The platform is designed to be accessible to all users, including those with disabilities. We follow WCAG 2.1 AA standards. If you encounter an accessibility issue, please report it to support@najiacommunitybridge.com.

### 11.6 Contact Information

- **General:** info@najiacommunitybridge.com
- **Support:** support@najiacommunitybridge.com
- **Security:** security@najiacommunitybridge.com
- **Privacy:** privacy@najiacommunitybridge.com
- **Legal:** legal@najiacommunitybridge.com
- **Press:** press@najiacommunitybridge.com

---

## Appendix A: Glossary

- **AI detection** — an automated check that estimates the likelihood that an image or video was generated or manipulated by AI
- **Anonymized** — data that cannot be tied back to a specific person
- **Bar verification** — the process of verifying a lawyer's bar license with the Body of Benchers
- **Confidence vote** — a non-binding vote on whether you have confidence in an elected official
- **DSAR** — Data Subject Access Request (your right to request a copy of your data)
- **Evidence** — a file (image, video, audio, document) uploaded to the platform, with integrity verification
- **Match score breakdown** — a transparent explanation of why a lawyer was matched to your case
- **NDPR** — Nigeria Data Protection Regulation
- **NIN** — National Identification Number
- **NIMC** — National Identity Management Commission
- **Non-binding** — not having legal or electoral effect (all polls are non-binding)
- **Policy poll** — a non-binding vote on a government policy or initiative
- **SHA-256** — the cryptographic hash algorithm used for evidence integrity
- **Verification** — the process of confirming your identity (via NIN or document)

## Appendix B: Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Content Lead | Initial user guide for the Lagos pilot. Covers account creation, identity verification, civic engagement (polls and confidence votes), evidence and disputes, finding a lawyer, the lawyer experience, legal literacy, the blog, account and privacy, getting help, and legal and policies. The guide is organized by user journey, not by feature, and uses plain language throughout. The most important sections are the Getting Started (§2), the Civic Engagement (§3, with the non-binding disclaimer), the Evidence and Disputes (§4, with the integrity and AI detection explanation), and the Finding a Lawyer (§5, with the engagement separation). |