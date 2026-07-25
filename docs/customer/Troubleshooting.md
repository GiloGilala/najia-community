# Najia Community Bridge — Troubleshooting Guide

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active (Pilot)*
*Audience: All users*

> **About this guide:** This is the official troubleshooting guide for the Najia Community Bridge. If something isn't working, start here. If you can't find your issue, see the [FAQ](./FAQ.md) or the [User Guide](./User%20Guide.md). You can also contact us at support@najiacommunitybridge.com.

> **How to use this guide:** The issues are organized by area (Account, Civic Engagement, Evidence, etc.). Use Ctrl+F (or Cmd+F on Mac) to search for keywords. The most common issues are at the top of each section.

> **Before you start:** Most issues can be resolved by one of these quick checks:
> 1. **Refresh the page** (Ctrl+R or Cmd+R)
> 2. **Clear your browser cache** (or try a different browser)
> 3. **Check your internet connection**
> 4. **Log out and log back in**
> 5. **Check the [status page](https://status.najiacommunitybridge.com)** (forthcoming) — if there's a known issue, it'll be listed there
>
> If the quick checks don't resolve the issue, find your specific problem below.

---

## Account and Login

### I can't log in — "Invalid email or password"

**Likely cause:** Incorrect email or password.

**Solution:**
1. Double-check that you're using the correct email address (the one you registered with)
2. Double-check your password (case-sensitive)
3. Try resetting your password (see below)
4. If you've tried multiple times, wait 15 minutes — the system rate-limits failed login attempts

**If that doesn't work:**
- Contact support@najiacommunitybridge.com with your email address. We'll verify your account and help you regain access.

---

### I forgot my password

**Solution:**
1. Go to the login page and click **Forgot Password**
2. Enter your email address
3. Check your email for a password reset link (check spam/junk if you don't see it)
4. Click the link and set a new password
5. Log in with your new password

**If that doesn't work:**
- The reset email may take up to 5 minutes to arrive
- If you don't receive it after 10 minutes, contact support@najiacommunitybridge.com

---

### I never received the email verification link

**Likely cause:** The email is in your spam/junk folder, or the email address was entered incorrectly.

**Solution:**
1. Check your spam/junk folder
2. Check that you entered the correct email address
3. Wait 5 minutes — emails can be delayed
4. Try **Resend Verification Email** from the login page

**If that doesn't work:**
- The email may have been blocked by your email provider. Contact support@najiacommunitybridge.com and we'll verify the email address.

---

### I want to change my email address

**Solution:**
1. Go to **Profile** → **Settings** → **Email**
2. Enter your new email address
3. Verify the new email address (we'll send a verification link)
4. Your email is updated

**Note:** Changing your email does not change your account. You can still log in with your old email until you verify the new one.

---

### I want to change my password

**Solution:**
1. Go to **Profile** → **Settings** → **Password**
2. Enter your current password
3. Enter your new password (at least 12 characters, mix of letters, numbers, and symbols)
4. Confirm your new password
5. Click **Change Password**

**Note:** Changing your password logs you out of all other devices. You'll need to log in again on each device.

---

### I want to delete my account

**Solution:**
1. Go to **Profile** → **Settings** → **Delete Account**
2. Read the deletion information (what's deleted, what's retained, the 30-day grace period)
3. Confirm the deletion
4. Your account enters a 30-day grace period
5. To restore your account during the grace period, log in and click **Restore Account**
6. After 30 days, your account and PII are permanently deleted

**If that doesn't work:**
- Contact support@najiacommunitybridge.com if you have questions about what will be deleted

---

## Identity Verification

### My NIN verification is failing

**Likely cause:** The NIN, date of birth, or name you entered doesn't match what NIMC has on file.

**Solution:**
1. Double-check your NIN (it should be 11 digits)
2. Double-check your date of birth (in the format YYYY-MM-DD)
3. Double-check your full name (it should match exactly what NIMC has, including any middle names)
4. Try the document verification option instead (see below)

**If that doesn't work:**
- NIMC may have outdated records. Visit the nearest NIMC enrollment center to update your records.
- You can appeal the failure: go to **Profile** → **Verification Status** → **Appeal**. Our team will review within 5 business days.

---

### My document verification is failing

**Likely cause:** The document is unclear, expired, or doesn't match the selfie.

**Solution:**
1. Make sure your document is not expired
2. Make sure the document is well-lit and all text is legible
3. Make sure your face is clearly visible in the selfie (no sunglasses, hats, or masks)
4. Make sure the document and selfie are taken in good lighting

**If that doesn't work:**
- Try a different document (passport, driver's license, or voter's card)
- Try the NIN verification option instead
- You can appeal the failure: go to **Profile** → **Verification Status** → **Appeal**

---

### Verification is taking a long time

**Likely cause:** NIMC or Onfido is experiencing high load, or there's a network issue.

**Solution:**
1. Wait 5 minutes and try again
2. Check the [status page](https://status.najiacommunitybridge.com) for any known issues
3. If the issue persists for more than 30 minutes, contact support@najiacommunitybridge.com

---

### I passed verification but my status still says "Unverified"

**Likely cause:** The page needs to be refreshed, or there's a delay in the system.

**Solution:**
1. Refresh the page (Ctrl+R or Cmd+R)
2. Log out and log back in
3. Wait 5 minutes — sometimes there's a delay

**If that doesn't work:**
- Contact support@najiacommunitybridge.com with your email address. We'll check the verification status on our end.

---

## Civic Engagement

### I can't vote — "Verification required"

**Likely cause:** You haven't completed identity verification.

**Solution:**
1. Go to **Profile** → **Verification Status**
2. If you see "Not verified," click **Verify Now** and complete the verification
3. Once verified, return to the poll and vote

**If that doesn't work:**
- It may take a few minutes for the verification to propagate. Wait 5 minutes and try again.
- Contact support@najiacommunitybridge.com if the issue persists.

---

### I can't vote — "You're not in this poll's jurisdiction"

**Likely cause:** The poll is limited to a specific state or LGA, and your profile says you're in a different one.

**Solution:**
1. Go to **Profile** → **Settings** → **Jurisdiction**
2. Update your jurisdiction to the correct one
3. Return to the poll and vote

**If you believe your jurisdiction is correct:**
- Contact support@najiacommunitybridge.com and we'll investigate

---

### I can't vote — "You've already voted in this poll"

**Likely cause:** You've already voted in this poll. The platform prevents duplicate votes.

**Solution:**
- You cannot vote again. Your previous vote is recorded.
- If you believe you haven't voted (e.g., someone else used your account), contact support@najiacommunitybridge.com immediately.

---

### I voted but want to change my vote

**Likely cause:** Votes cannot be changed after submission.

**Solution:**
- This is by design — it prevents last-minute manipulation and ensures the integrity of the vote.
- Wait for the poll to close to see the results.

**If you believe your vote was submitted in error:**
- Contact support@najiacommunitybridge.com. We can verify the vote was recorded but cannot change it.

---

### The poll results are not showing

**Likely cause:** The poll is still active, or the results have not been computed yet.

**Solution:**
1. Check the poll's status — it will say "Active" (voting in progress), "Closed" (voting ended, results pending), or "Results Available"
2. If the poll is "Closed" but results are not yet available, wait — results are usually computed within a few minutes of the poll closing
3. If the poll is "Active," results are intentionally hidden until the poll closes (to prevent the bandwagon effect)

---

### I don't see any polls in my jurisdiction

**Likely cause:** There are no active polls in your jurisdiction right now.

**Solution:**
- Check back later — new polls are published regularly
- Subscribe to the newsletter to be notified of new polls
- Suggest a poll topic: go to **Polls** → **Suggest a Topic**

---

### My poll topic suggestion was rejected

**Likely cause:** The topic was outside the platform's scope, was a duplicate, or didn't meet the Advisory Board's criteria.

**Solution:**
- Read the rejection reason (provided in the notification)
- If you have questions, contact support@najiacommunitybridge.com
- You can suggest a new topic with adjustments based on the feedback

---

## Evidence and Disputes

### My evidence upload is failing

**Likely cause:** File too large, unsupported format, or network issue.

**Solution:**
1. Check the file size — the limit is 100 MB
2. Check the file format — supported: JPG, PNG, WebP, MP4, AVI, WebM, MP3, WAV, M4A, PDF, DOCX, TXT
3. Check your internet connection
4. Try uploading from a different network (e.g., switch from Wi-Fi to mobile data)
5. Try uploading a smaller file (compress images or videos before uploading)

**If that doesn't work:**
- Contact support@najiacommunitybridge.com with the file type and size

---

### My evidence was flagged as "Medium confidence" by the AI detection

**Likely cause:** The automated check detected some indicators of possible AI manipulation. This does not mean the file is definitely manipulated — it's a probabilistic signal.

**Solution:**
- The file is still available on the platform
- A notice is shown to anyone viewing the file (including a matched lawyer)
- If you believe the flag is incorrect, you can appeal: go to the evidence detail page and click **Appeal**
- Provide context (where the file came from, what it shows) in the appeal

---

### My evidence was flagged as "High confidence" by the AI detection

**Likely cause:** The automated check strongly indicated AI manipulation. The file is held for moderator review before becoming visible to others.

**Solution:**
- The file is in "Under Review" status
- A moderator will review within 24 hours
- If the moderator approves the file, it becomes active
- If the moderator restricts or removes the file, you'll be notified with the reason
- You can appeal the moderator's decision

---

### My evidence shows "Not verified" (integrity)

**Likely cause:** This is rare and indicates a serious issue. The file's current bytes don't match the original upload.

**Solution:**
- This should never happen under normal operation
- Contact support@najiacommunitybridge.com immediately
- The file has been quarantined for investigation
- Do not delete the original file from your device (we may need it)

---

### I can't see my evidence

**Likely cause:** The evidence may be filtered, archived, or associated with a case you don't have access to.

**Solution:**
1. Check the **Evidence** section for all your evidence
2. Use the filters to narrow down (by date, type, status, case)
3. If the evidence is associated with a case, it may be visible in the case detail page

---

### I can't delete my evidence

**Likely cause:** The evidence is part of an active or closed case and cannot be deleted to preserve the integrity of the case record.

**Solution:**
- If the evidence is part of a closed case, contact support@najiacommunitybridge.com to discuss your options
- If the evidence is not part of a case, you should be able to delete it from the evidence detail page

---

### I want to edit my evidence after uploading

**Likely cause:** The file itself cannot be edited (to preserve integrity).

**Solution:**
- You can edit the **description** and **tags** of your evidence at any time
- You cannot edit the file itself. To replace the file, delete the old evidence and upload the new one.

---

## Finding a Lawyer

### I can't find a lawyer matching my case

**Likely cause:** No lawyers on the platform match your specific case (combination of case type, jurisdiction, and budget).

**Solution:**
1. Expand your budget range (some lawyers may have lower or higher fees)
2. Try a different jurisdiction (if the case can be pursued in a different state)
3. Wait — more lawyers are joining the platform regularly. We'll notify you when one matches.

---

### The lawyer I selected didn't respond

**Likely cause:** The lawyer has 24 hours to respond. They may be busy or may have missed the notification.

**Solution:**
1. Wait — they may still respond within 24 hours
2. If 24 hours have passed, the match has expired. Select another lawyer from your match results.
3. If you keep getting non-responses, contact support@najiacommunitybridge.com and we'll investigate

---

### The consultation didn't happen (lawyer no-show)

**Likely cause:** The lawyer may have had an emergency, or there may have been a technical issue.

**Solution:**
1. Wait 5 minutes after the scheduled time — the lawyer may be late
2. If the lawyer doesn't join within 5 minutes, you can leave the consultation room
3. You're offered a re-match with another lawyer
4. Contact support@najiacommunitybridge.com if you have concerns about the lawyer's behavior

---

### I can't join the consultation

**Likely cause:** Browser or device issue, or the consultation hasn't started yet.

**Solution:**
1. Check that the consultation time has arrived
2. Refresh the page
3. Try a different browser (Chrome is recommended)
4. Check your camera and microphone permissions
5. If on mobile, try the mobile app
6. Contact support@najiacommunitybridge.com if the issue persists

---

### The consultation ended early

**Likely cause:** Technical issue, or one party left.

**Solution:**
1. Check with the lawyer (via the platform's reconnection option, if available)
2. If the consultation cannot be resumed, you can schedule a new one
3. If this happens repeatedly with the same lawyer, consider selecting a different lawyer
4. Contact support@najiacommunitybridge.com if you have concerns

---

### I engaged the lawyer but the engagement isn't going well

**Likely cause:** The engagement is outside the platform, so the platform cannot intervene in the engagement itself.

**Solution:**
1. Discuss your concerns directly with the lawyer
2. If the issue is about the lawyer's professional conduct, contact the Nigerian Bar Association
3. If the issue is about the platform (e.g., matching, payment), contact support@najiacommunitybridge.com
4. You can leave a review of the lawyer after the engagement is complete

---

### I want to leave a review but haven't engaged the lawyer

**Likely cause:** Reviews are only available after a documented engagement with the lawyer.

**Solution:**
- The platform does not see your engagement (it's between you and the lawyer)
- If you've engaged the lawyer, you can confirm the engagement in the post-consultation prompt, and the review form will open
- If you haven't engaged the lawyer, you cannot leave a review

---

### I left a review but it's not showing

**Likely cause:** Reviews go through moderation before becoming public. The moderation SLA is 24 hours.

**Solution:**
1. Wait 24 hours
2. Check the review status in **Profile** → **My Reviews**
3. If the review is "Approved" but not showing publicly, refresh the page
4. If the review is "Removed," you'll be notified with the reason
5. If the review is "Appealed" and you're waiting for the appeal decision, wait for the moderator

---

## Legal Literacy

### I can't enroll in a module

**Likely cause:** You need a verified account to enroll.

**Solution:**
1. Verify your identity (see the Account and Verification section)
2. Try enrolling again

---

### My progress isn't being saved

**Likely cause:** The module may be loading from cache, or there's a network issue.

**Solution:**
1. Refresh the page
2. Check your internet connection
3. Try the mobile app
4. If the issue persists, contact support@najiacommunitybridge.com

---

### The quiz isn't accepting my answer

**Likely cause:** The answer may be incorrect, or there's a glitch.

**Solution:**
1. Re-read the question and the relevant section
2. Try a different answer
3. If you believe the answer is correct, contact support@najiacommunitybridge.com with the question and the answer you chose

---

## The Blog

### I can't comment on a blog post

**Likely cause:** You need a verified account to comment.

**Solution:**
1. Verify your identity
2. Try commenting again

---

### My comment isn't appearing

**Likely cause:** Comments go through moderation before becoming visible. The moderation SLA is 24 hours.

**Solution:**
1. Wait 24 hours
2. Check the comment status in **Profile** → **My Comments**
3. If the comment is "Pending," it's in the moderation queue
4. If the comment is "Removed," you'll be notified with the reason
5. If the comment is "Approved" but not showing, refresh the page

---

### I reported a comment but nothing happened

**Likely cause:** Reports go through the same moderation queue as comments. The SLA is 24 hours.

**Solution:**
1. Wait 24 hours
2. If you don't see action after 24 hours, contact support@najiacommunitybridge.com with the comment link

---

## Technical Issues

### The page won't load

**Likely cause:** Network issue, browser issue, or the platform is down.

**Solution:**
1. Check your internet connection
2. Refresh the page (Ctrl+R or Cmd+R)
3. Try a different browser (Chrome is recommended)
4. Check the [status page](https://status.najiacommunitybridge.com) for any known issues
5. If the issue persists, contact support@najiacommunitybridge.com

---

### The page loads but looks broken

**Likely cause:** Browser cache issue, or an unsupported browser.

**Solution:**
1. Clear your browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Try a different browser (Chrome, Firefox, Safari, or Edge — last 2 versions)
3. Try an incognito/private window
4. If the issue persists, contact support@najiacommunitybridge.com with a screenshot

---

### The mobile app won't open

**Likely cause:** App needs an update, or there's a device issue.

**Solution:**
1. Check for app updates in the App Store or Play Store
2. Restart the app
3. Restart your device
4. Reinstall the app (your account is preserved)
5. If the issue persists, contact support@najiacommunitybridge.com with your device model and OS version

---

### The mobile app is slow

**Likely cause:** Low-bandwidth connection, or the app needs optimization.

**Solution:**
1. Check your internet connection
2. Try connecting to Wi-Fi instead of mobile data (or vice versa)
3. Enable "Reduced Data Mode" in the app settings
4. Close other apps that may be using bandwidth
5. If the issue persists, contact support@najiacommunitybridge.com

---

### I'm getting a security warning in my browser

**Likely cause:** The platform's SSL certificate is expired, or there's a man-in-the-middle attempt.

**Solution:**
1. **Do not proceed** if you see a security warning
2. Take a screenshot of the warning
3. Contact support@najiacommunitybridge.com immediately
4. If you can confirm the certificate is valid (e.g., the warning is from an outdated browser), try a different browser

---

### The platform is down (everyone is affected)

**Likely cause:** A platform outage.

**Solution:**
1. Check the [status page](https://status.najiacommunitybridge.com) for the latest status
2. If the status page is also down, the issue is likely with our hosting provider
3. Try again in 15–30 minutes — most outages are resolved within an hour
4. Follow our social media (forthcoming) for updates
5. If the outage is prolonged, contact support@najiacommunitybridge.com

---

### I think my account has been hacked

**Likely cause:** Your password may have been compromised, or someone has gained access to your account.

**Solution:**
1. **Change your password immediately** (Profile → Settings → Password)
2. **Log out of all devices** (Profile → Settings → Security → Log Out All Devices)
3. **Check your account activity** (Profile → Settings → Activity) for any actions you don't recognize
4. **Enable biometric login** (if available) for an extra layer of security
5. **Contact support@najiacommunitybridge.com** to report the suspected compromise
6. If you use the same password on other sites, change those too

---

## When to Contact Support

Contact support@najiacommunitybridge.com when:
- You've tried the solutions above and the issue persists
- The issue is not covered in this guide
- You have a security concern
- You have a privacy concern
- You have a question about the platform's policies

**When contacting support, please include:**
- Your email address (the one you registered with)
- A clear description of the issue
- What you've already tried
- Screenshots or screen recordings (if applicable)
- The time the issue occurred

**Response time:** We respond within 1 business day. For urgent issues (security, account compromise), we respond within 1 hour during business hours.

---

## Appendix A: The Quick Checklist

When something isn't working, try these steps in order:

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Clear your browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. **Check your internet connection**
4. **Try a different browser** (Chrome is recommended)
5. **Log out and log back in**
6. **Check the [status page](https://status.najiacommunitybridge.com)** for known issues
7. **Search this troubleshooting guide** for your specific issue
8. **Search the [FAQ](./FAQ.md)** for general questions
9. **Contact support@najiacommunitybridge.com** if all else fails

## Appendix B: Error Messages

This section explains the most common error messages and what they mean.

| Error message | What it means | What to do |
|---------------|---------------|------------|
| "Invalid email or password" | The email or password is incorrect | Double-check, or reset your password |
| "Rate limit exceeded" | You've made too many requests in a short time | Wait 15 minutes and try again |
| "Verification required" | You need to verify your identity | Go to Profile → Verify Now |
| "Not in this poll's jurisdiction" | The poll is for a different state or LGA | Check your profile jurisdiction |
| "You've already voted" | You've submitted a vote in this poll | You can't vote again |
| "Poll not active" | The poll is not currently open for voting | Check back when the poll is active |
| "File too large" | The file exceeds 100 MB | Compress the file or use a smaller file |
| "Unsupported file type" | The file format is not supported | Use a supported format (see Evidence section) |
| "Integrity compromised" | The file's bytes don't match the original | Contact support immediately |
| "Case not found" | The case ID is invalid or you don't have access | Check the case ID or contact support |
| "Match expired" | The lawyer didn't respond within 24 hours | Select another lawyer |
| "No shows" | The lawyer didn't join the consultation | Leave the room and re-match |
| "Permission denied" | You don't have permission to perform this action | Check your role or contact support |
| "Server error" | Something went wrong on our end | Try again, or contact support |

## Appendix C: Contact Information

- **General:** info@najiacommunitybridge.com
- **Support:** support@najiacommunitybridge.com
- **Security:** security@najiacommunitybridge.com
- **Privacy:** privacy@najiacommunitybridge.com
- **Legal:** legal@najiacommunitybridge.com
- **Press:** press@najiacommunitybridge.com
- **Pilot:** pilot@najiacommunitybridge.com

## Appendix D: Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Content Lead + Operations Director | Initial troubleshooting guide for the Lagos pilot. Covers 50+ specific issues organized by area: Account and Login (6), Identity Verification (4), Civic Engagement (7), Evidence and Disputes (7), Finding a Lawyer (7), Legal Literacy (3), The Blog (3), Technical Issues (7), and When to Contact Support. The guide uses a consistent structure for each issue (Symptom → Likely Cause → Solution → If That Doesn't Work) and includes a Quick Checklist, an Error Messages table, and contact information. The most important additions are the "what to include when contacting support" guidance and the Error Messages table, which together reduce ticket resolution time and improve the support experience. |