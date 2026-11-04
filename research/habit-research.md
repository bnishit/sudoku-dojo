# Sudoku Dojo: building a daily habit without pressure

**Build a small, useful practice that is easy to resume after a break.** A learner who misses Tuesday should return on Wednesday to a welcoming exercise and see that their past progress still counts.

The main trap is optimizing for an unbroken streak while the learner stops enjoying or improving at Sudoku. No change is needed from you to accept that principle; the next decision is whether to make the **one-minute practice and forgiving weekly view** the first release.

## Top 10 recommendations for Sudoku Dojo

Effort is a rough product estimate: **S** = small, **M** = moderate, **L** = large. These are recommendations, not changes verified in the app.

1. **Offer one clear “Practice today” button.**  
   **Experience:** “Spot one technique” starts a short exercise immediately; other modes remain available.  
   **Principle:** BJ Fogg’s **B=MAP** says behavior needs motivation, ability, and a prompt together. Make the action easy when motivation is low. The model is a design framework, not proof that this button will retain users. [Fogg Behavior Model](https://www.behaviormodel.org/) **Effort: M**

2. **Count a meaningful minimum day.**  
   **Experience:** Completing one technique exercise, one lesson, a speed drill, or a puzzle counts as a practice day.  
   **Principle:** Lower friction, but require an actual attempt. Duolingo’s seven-day streak wager increased Day-7 retention by a reported 14% in its experiment; that does **not** establish the effect of Dojo’s proposed minimum. [Duolingo experiment](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/) **Effort: S**

3. **Make the weekly view the main progress display.**  
   **Experience:** “You practised 3 days this week” appears beside a simple seven-day calendar.  
   **Principle:** Show real consistency without making one missed day dominate. Research found that breaking a logged streak can reduce motivation; repair reduced that effect in the studies. A weekly view is a design hypothesis to test. [Silverman and Barasch](https://academic.oup.com/jcr/article/49/6/1095/6623414?guestAccessKey=1bb91501-7f0d-4dcc-806d-8124e533be13) **Effort: M**

4. **Help the learner pick a natural cue.**  
   **Experience:** After a first practice, optionally choose “After morning tea, I’ll do one Sudoku move.”  
   **Principle:** James Clear’s habit stacking links a new action to an existing one; Wendy Wood’s research emphasizes repeated action in a stable context and reducing friction. [Clear](https://jamesclear.com/habit-tracker); [Wood](https://www.psychologicalscience.org/journals/current-directions/09637214241246480/) **Effort: S**

5. **Give a warm restart after any break.**  
   **Experience:** “Welcome back. Ready for one move?” leads straight to a familiar exercise.  
   **Principle:** Clear’s “never miss twice” is a helpful prompt to return, not a rule to enforce. In Lally’s study, 82 participants supplied enough data; estimated time to near-maximum automaticity varied from 18 to 254 days, and one missed opportunity did not materially affect formation. The often-quoted 66 days was a median for a subset, not a deadline. [Lally study](https://onlinelibrary.wiley.com/doi/pdf/10.1002/ejsp.674) **Effort: S**

6. **Make improvement visible, not just activity.**  
   **Experience:** “You found 4 of 5 hidden singles without a hint” follows practice, with an explanation of the missed one.  
   **Principle:** Self-determination theory stresses **autonomy** (choice), **competence** (feeling capable), and **relatedness** (connection). Good Sudoku’s hints and busywork-reducing tools are a useful precedent, though their independent retention effect is not established here. [Education review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12276404/); [Good Sudoku](https://apps.apple.com/us/app/good-sudoku-by-zach-gage/id1489118195?platform=ipad) **Effort: M**

7. **Show the next real milestone.**  
   **Experience:** “Two lessons until your next belt” uses the existing lessons and stars.  
   **Principle:** The *goal-gradient effect* describes people increasing effort near a goal. *Endowed progress* gives apparent headway at the start; Dojo should use real completed work instead of fake stars. The cited studies concern loyalty programs, so application to Sudoku is an inference. [Goal-gradient research](https://business.columbia.edu/sites/default/files-efs/pubfiles/1200/goalgradient.pdf) **Effort: S**

8. **Keep the daily puzzle special, with an archive.**  
   **Experience:** Today’s puzzle is prominent, while yesterday’s remains playable without penalty.  
   **Principle:** A shared daily puzzle provides a natural reason to return and something to discuss; scarcity should not block learning. Chess.com offers a daily puzzle and a 48-hour streak grace period. Lichess’s Puzzle Streak tracks consecutive correct answers in a session, a different idea from a calendar streak. [Chess.com](https://support.chess.com/en/articles/8708990-how-does-the-daily-puzzle-work); [Lichess](https://lichess.org/page/blind-mode-tutorial) **Effort: M**

9. **Offer reminders the learner controls.**  
   **Experience:** “Add a daily calendar reminder” lets them choose the time, or decline.  
   **Principle:** A user-chosen cue supports autonomy. Duolingo has published work on choosing reminders and avoiding repetition, but that does not show that more reminders improve Dojo’s learning. [Duolingo notification research](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/) **Effort: S**

10. **Offer an optional, spoiler-free share.**  
    **Experience:** “Today: 3 techniques practised 🎯” can be copied or shared with a friend.  
    **Principle:** Connection can make practice enjoyable without public rankings. Elevate shows skill performance and comparisons; Brilliant counts three problems or a full concept toward a streak. These are precedents, not proof of their individual retention impact. [Elevate](https://elevateapp.com/); [Brilliant](https://brilliant.org/help/features/what-is-a-streak/) **Effort: M**

**Evidence boundary:** NYT Games’ one-a-day and sharing pattern is a useful reference, but its pages blocked direct access during this research; I cannot substantiate its archives or feature-level retention results here. Duolingo’s leagues rank weekly XP, but I found no reliable published causal estimate for their retention effect. [Duolingo leagues](https://blog.duolingo.com/duolingo-leagues-leaderboards/)

## A daily loop

Five minutes is a **starting design target**, not a scientifically established ideal. Let the learner stop sooner.

1. **Open:** “Today: practise one hidden single.” Tap **Start**.
2. **Recall:** See one short hint about what to look for.
3. **Try:** Make one move; ask for a hint if needed. A completed exercise is enough for a minimum day.
4. **Learn:** See why the move works, then optionally try two more examples.
5. **Finish:** “Practised today. You found 2 without hints.” Show weekly progress and a clear **Done** button.
6. **Optional:** Continue to the daily puzzle or share. Never require either.

## Streak & reward design spec

| Rule | Proposed behavior |
|---|---|
| Practice day | Count one completed exercise, lesson, drill, or puzzle. Opening the app alone does not count. |
| Main view | Show actual practice days this week; default to a personal goal of **3 days**, adjustable from 1–7. A learner who wants a daily habit can choose 7. |
| Daily streak | Keep an optional, accurately labeled count of consecutive calendar days with practice. A missed day ends it; retain the best streak and all prior progress. |
| Grace | Offer **one automatic rest day per rolling seven days** for an optional **continuity streak**. Label it “5 practice days + 1 rest day”; never call it six days of practice. No purchase or earned currency. |
| Longer break | Start a new streak on return. Show lifetime practice days and a neutral welcome; no repair task is required. |
| Rewards | Keep existing stars, belts and XP tied to completed work. Avoid escalating bonuses for simply returning. Allow sound and celebration to be muted. |
| Day boundary | Use the device’s local date; handle travel and clock changes conservatively. Keep a durable local record of actual practice dates. |

A Monday restart can also feel inviting: Milkman and colleagues found increased goal-related activity after calendar landmarks. Do not make someone wait until Monday to return. [Fresh start research](https://ideas.repec.org/a/inm/ormnsc/v60y2014i10p2563-2582.html)

## What to avoid

- **Guilt and threats:** “Your streak is in danger” turns a missed puzzle into a debt.
- **XP inflation or fake progress:** More points should not impersonate better understanding.
- **Notification spam:** No repeated nudges, escalating urgency, or default opt-in.
- **Forced competition or sharing:** Duolingo leagues rank XP; that may suit some learners, but it is not necessary for a private Sudoku habit.
- **Unbounded hooks:** Nir Eyal’s model uses trigger, action, variable reward, and investment. Treat it as a product framework, not evidence of learning; use interesting puzzles, not unpredictable rewards designed to prolong play. [Hooked model](https://www.nirandfar.com/download/Hooked_In_Real_Life_ebook.pdf)

## Technical notes for a no-backend PWA

- **Reliable scheduled reminders with the app closed:** Do not promise these from local storage alone. Standard web push needs a push sender—your backend or a third-party service—plus permission and a service worker. A service worker is browser-managed background code; it is not a dependable standalone alarm clock. [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers); [Microsoft](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/push)
- **iPhone and iPad:** On iOS/iPadOS 16.4+, web push is available to a **Home Screen web app** after a permission request triggered by a user action. It still needs a push sender. [WebKit](https://webkit.org/blog/13878/)
- **Android:** Supported browsers can receive web push with permission and a push sender; support and install behavior vary by browser. [Microsoft](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/push); [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- **No-server alternative:** Generate an optional recurring `.ics` calendar event. The learner imports it and their calendar app owns the reminders; behavior varies by calendar.
- **Install:** On supported Android browsers, offer the native install prompt when available. On iOS, explain **Share → Add to Home Screen**; the site cannot trigger the same install prompt. [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- **Share and storage:** Create a text share card locally, with copy fallback where sharing is unsupported. Local progress can be lost when site data is cleared and may not carry between browser and installed app; offer export/import before presenting it as permanent. [MDN Web Share](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)

## Sources

The linked studies, app documentation, and platform documentation above are the sources consulted. App feature descriptions are product precedents; except for the specifically identified Duolingo experiment, they should not be read as measured retention effects for Sudoku Dojo.

**Next step:** prototype the one-minute exercise and weekly view, then observe whether learners return after a missed day and can explain a technique—not just whether their streak grows.