// ─────────────────────────────────────────────
// ENGINE.JS — Scenario generation via Gemini
// Falls back to offline bank if API unavailable.
// ─────────────────────────────────────────────

const PROXY_URL = 'https://quiet-shape-b3c1.slop-runner.workers.dev';

// ── Offline scenario bank (8 per domain = 40 total) ──

const FALLBACK_SCENARIOS = {

  design: [
    {
      text: "Our team spent three weeks building a feature that automatically categorises a user's emails by urgency. We used our own email habits as the basis for the urgency model. The feature launched last Tuesday and we're already seeing strong adoption numbers — 2,000 installs in the first week. We're now planning v2 which will add calendar integration based on the same internal model.",
      primaryFlaw: 'BUILDER_BIAS',
      targetFlaw: { tag: 'BUILDER_BIAS', desc: "The urgency model was built on the team's own behaviour patterns, not those of actual users. The builder's assumptions were substituted for user research." }
    },
    {
      text: "We noticed users were dropping off on our checkout page so we immediately redesigned the layout, simplified the form fields, and added a progress bar. Drop-off rates improved 12%. We're now applying the same redesign approach to our onboarding flow, which also has high drop-off.",
      primaryFlaw: 'ASSUMPTION_SMUGGLING',
      targetFlaw: { tag: 'ASSUMPTION_SMUGGLING', desc: "The team assumed layout caused drop-off without interviewing users or diagnosing the root cause. A correlation was treated as confirmed insight." }
    },
    {
      text: "We are designing a meditation app for busy professionals. We've mapped out 14 core features including guided sessions, mood tracking, a social community, streaks, and a premium content marketplace. We plan to prototype all 14 features before any user testing so the first version feels complete and polished.",
      primaryFlaw: 'MISSING_FEEDBACK_LOOP',
      targetFlaw: { tag: 'MISSING_FEEDBACK_LOOP', desc: "Prototyping 14 features before any user testing inverts the design thinking process. Feedback should shape what gets built, not validate what's already fully built." }
    },
    {
      text: "We interviewed 50 users and found they struggle with managing finances. Based on this, we're building a feature that auto-categorises spending into buckets, includes a savings goal widget, a monthly report card, and a gamified challenge mode. We'll test once all four components are complete.",
      primaryFlaw: 'PREMATURE_SOLUTION',
      targetFlaw: { tag: 'PREMATURE_SOLUTION', desc: '"Struggling with finances" is too broad — four features were designed before the core problem was precisely defined and validated.' }
    },
    {
      text: "We've been asked to redesign our mobile app's navigation. After two hours of internal discussion, the team agreed the bottom navigation bar should be replaced with a hamburger menu. This will make the interface cleaner. We're scheduling development to begin next sprint.",
      primaryFlaw: 'ASSUMPTION_SMUGGLING',
      targetFlaw: { tag: 'ASSUMPTION_SMUGGLING', desc: "The navigation decision was made through internal debate, not user research. No users were consulted on whether the current navigation is actually their pain point." }
    },
    {
      text: "Our product team wants to build a social feature so users can share their progress with friends. We believe social features drive retention because we've seen it work at companies like Duolingo and Strava. We're scoping the feature now and will run a beta with 100 users once it's built.",
      primaryFlaw: 'BUILDER_BIAS',
      targetFlaw: { tag: 'BUILDER_BIAS', desc: "The decision to add social features is driven by what the team believes (based on competitor observation), not by any evidence that their specific users want or need social features." }
    },
    {
      text: "User research showed our customers feel overwhelmed when they first open the app. The solution is to add an onboarding tooltip tour that highlights each key feature. We've designed 12 tooltip steps. Once the tour is complete, users will be directed to the main dashboard.",
      primaryFlaw: 'PREMATURE_SOLUTION',
      targetFlaw: { tag: 'PREMATURE_SOLUTION', desc: "Feeling overwhelmed is a symptom, not a defined problem. A 12-step tooltip tour is a solution imposed before the root cause of overwhelm was identified — it may make things worse." }
    },
    {
      text: "We're redesigning our dashboard for enterprise clients. We've been collecting feature requests from our sales team for six months and have compiled a list of 47 requested features. We plan to prioritise based on request frequency and build the top 15. Design starts in two weeks.",
      primaryFlaw: 'ASSUMPTION_SMUGGLING',
      targetFlaw: { tag: 'ASSUMPTION_SMUGGLING', desc: "Feature requests from the sales team are a proxy for user needs, not user needs themselves. Sales teams filter requests through their own commercial lens, not user empathy." }
    }
  ],

  business: [
    {
      text: "We're building a B2B SaaS platform for small restaurants to manage reservations. Our value proposition is saving time on phone bookings. We plan to offer it free forever and grow through word of mouth. Once we hit 10,000 restaurants we'll explore monetisation options. Our key metric right now is the number of restaurants signed up.",
      primaryFlaw: 'REVENUE_UNDEFINED',
      targetFlaw: { tag: 'REVENUE_UNDEFINED', desc: '"Free forever with monetisation explored later" is not a revenue model. There is no mechanism by which this business captures value.' }
    },
    {
      text: "Our platform connects freelance designers with startups. We charge startups a 15% commission on every project. We measure success by the number of designer profiles created each month. Last month we added 340 new designer signups which is our best month yet.",
      primaryFlaw: 'METRIC_MISMATCH',
      targetFlaw: { tag: 'METRIC_MISMATCH', desc: "Designer signups are a supply-side vanity metric. They don't measure whether projects are being booked, which is the actual revenue driver." }
    },
    {
      text: "We're launching a consumer mental health journaling app with a £9.99/month subscription. We'll acquire users through Instagram ads targeting mindfulness enthusiasts. Once we have enough users, we plan to sell anonymised journaling data to academic researchers as a secondary revenue stream.",
      primaryFlaw: 'VALUE_PROP_VAGUE',
      targetFlaw: { tag: 'VALUE_PROP_VAGUE', desc: 'The value proposition — mental health journaling — is entirely generic. There is no specific differentiated problem being solved.' }
    },
    {
      text: "We sell project management software to enterprise teams. Our paying customers are IT managers. We've built the product for developers — CLI, GitHub integration, API-first features. We market it through LinkedIn ads targeting software engineers. Sales cycles are averaging 6 months and we don't know why.",
      primaryFlaw: 'SEGMENT_CONFLATION',
      targetFlaw: { tag: 'SEGMENT_CONFLATION', desc: 'The paying customer (IT managers) and the end user (developers) are different people — the product and marketing treat them as one.' }
    },
    {
      text: "We offer a freemium HR software product. Our free tier has 12,000 active companies. Our paid tier has 180 companies. We're planning to invest heavily in growing the free tier because we believe a larger free user base will eventually convert to paid. Marketing budget is doubling next quarter.",
      primaryFlaw: 'METRIC_MISMATCH',
      targetFlaw: { tag: 'METRIC_MISMATCH', desc: "With a 1.5% free-to-paid conversion rate, growing the free tier without addressing conversion is optimising the wrong metric. The business model isn't working, not the audience size." }
    },
    {
      text: "We're creating a marketplace for handmade goods. Sellers list for free. Buyers pay nothing to browse. We make money by charging a 3% transaction fee. Our costs include platform hosting, payment processing at 2.9%, customer support, and a 20-person engineering team. We're targeting £500k GMV in year one.",
      primaryFlaw: 'REVENUE_UNDEFINED',
      targetFlaw: { tag: 'REVENUE_UNDEFINED', desc: "3% transaction fee minus 2.9% payment processing leaves 0.1% net margin before all other costs. The unit economics make this revenue model structurally unworkable at the stated scale." }
    },
    {
      text: "Our B2B analytics tool serves marketing teams. We're proud of our NPS score of 62, which is above industry average. We present this NPS data to investors as the primary evidence of product-market fit. Our renewal rate last quarter was 71%.",
      primaryFlaw: 'METRIC_MISMATCH',
      targetFlaw: { tag: 'METRIC_MISMATCH', desc: "NPS measures likelihood to recommend, not product-market fit. A 71% renewal rate — meaning 29% of customers left — is the more telling metric and contradicts the NPS narrative." }
    },
    {
      text: "We're building a two-sided marketplace connecting tutors with students. Tutors keep 100% of their earnings — we never charge them. Students pay tutors directly. Our revenue comes from selling 'premium visibility' upgrades to tutors who want more students to find them.",
      primaryFlaw: 'VALUE_PROP_VAGUE',
      targetFlaw: { tag: 'VALUE_PROP_VAGUE', desc: "The value proposition to students — why they should use this marketplace over Google or direct referrals — is completely absent. Without a clear student value prop, the marketplace won't fill." }
    }
  ],

  market: [
    {
      text: "The productivity app market is massive — 3 billion smartphone users globally and everyone needs to be more productive. We're building a focus timer app. Our target market is anyone who wants to get more done. Because remote work is growing, the timing has never been better. We'll acquire users through the App Store.",
      primaryFlaw: 'SEGMENT_UNDEFINED',
      targetFlaw: { tag: 'SEGMENT_UNDEFINED', desc: '"Anyone who wants to be productive" has no bounded definition. Without a real segment, acquisition and retention are impossible to optimise.' }
    },
    {
      text: "We've validated strong product-market fit for our legal document tool. We've had 800 signups since launch and 4.8 stars on Product Hunt. We're planning to scale aggressively by spending £50k/month on Google ads. Our target customer is any business that deals with contracts.",
      primaryFlaw: 'FIT_ASSUMED',
      targetFlaw: { tag: 'FIT_ASSUMED', desc: 'Signups and Product Hunt ratings are interest signals, not evidence of product-market fit. Retention, repeat usage, and willingness to pay are the actual indicators.' }
    },
    {
      text: "We're entering corporate training. Our competitors are large LMS platforms like Cornerstone and SAP SuccessFactors. We'll differentiate on price — 80% cheaper. We'll acquire enterprise customers through cold email outreach to HR directors at companies with 500+ employees.",
      primaryFlaw: 'CHANNEL_MISMATCH',
      targetFlaw: { tag: 'CHANNEL_MISMATCH', desc: 'Cold email is a very low-conversion channel for enterprise software. Enterprise buyers require relationship sales, demos, security reviews, and procurement cycles.' }
    },
    {
      text: "The creator economy is exploding. Newsletter platforms are growing 40% year-on-year. We're launching a paid newsletter platform for independent journalists. This is clearly the right moment — the market conditions won't be this good again. We're targeting 500 paying newsletters in year one.",
      primaryFlaw: 'TIMING_UNVERIFIED',
      targetFlaw: { tag: 'TIMING_UNVERIFIED', desc: '"Market conditions won\'t be this good again" is stated as fact without data. It\'s rhetorical urgency, not a market insight.' }
    },
    {
      text: "We're building a project management tool specifically for architecture firms. Our research shows architects are deeply frustrated with generic tools like Asana and Monday.com. There are approximately 140,000 architecture firms in the US alone. We're pricing at £89/month per firm.",
      primaryFlaw: 'FIT_ASSUMED',
      targetFlaw: { tag: 'FIT_ASSUMED', desc: "Frustration with existing tools is not evidence of willingness to switch to and pay for a new product. Product-market fit requires validated demand for this specific solution, not just dissatisfaction with alternatives." }
    },
    {
      text: "We're launching a premium dog food subscription service targeting health-conscious pet owners. We'll sell through our own DTC website and drive traffic via Facebook and Instagram ads. Our CAC target is £25 and LTV is projected at £180 based on 18-month average subscription length.",
      primaryFlaw: 'CHANNEL_MISMATCH',
      targetFlaw: { tag: 'CHANNEL_MISMATCH', desc: "Facebook and Instagram ad CAC for subscription food products typically runs £60-120+, not £25. The channel-model fit is broken — the acquisition cost assumption makes the unit economics unworkable." }
    },
    {
      text: "AI writing tools are the fastest growing software category right now. Every company needs content. We're building an AI copywriting tool and our TAM is the entire content marketing industry worth £400 billion. We'll capture just 0.1% of this market in year one for £400 million in revenue.",
      primaryFlaw: 'SEGMENT_UNDEFINED',
      targetFlaw: { tag: 'SEGMENT_UNDEFINED', desc: 'The "entire content marketing industry" is not a serviceable segment. The 0.1% TAM calculation is a classic vanity exercise that reveals no actual go-to-market strategy.' }
    },
    {
      text: "We launched our B2B SaaS product six months ago and have 40 paying customers all acquired through founder outreach. We're now hiring a head of growth to scale. We believe we have product-market fit because our churn last month was 0% and customers say they love the product.",
      primaryFlaw: 'FIT_ASSUMED',
      targetFlaw: { tag: 'FIT_ASSUMED', desc: "40 founder-acquired customers with 0% churn over one month is insufficient evidence of product-market fit. Founder relationships suppress churn and outreach doesn't validate scalable acquisition." }
    }
  ],

  user: [
    {
      text: "Our fitness app sends users a push notification at 7am reminding them to log their workout. The reward is a streak counter that increments daily. Users receive a congratulations message when they complete a log. Retention after 30 days is 8% and we can't understand why engagement is dropping.",
      primaryFlaw: 'TRIGGER_EXTERNAL_ONLY',
      targetFlaw: { tag: 'TRIGGER_EXTERNAL_ONLY', desc: 'The only trigger is an external notification. There is no internal emotional driver — no connection to identity, aspiration, or fear — that would make the habit self-sustaining.' }
    },
    {
      text: "We're building a language learning app. To unlock the next lesson, users must answer 10 questions correctly in sequence. We believe this rigorous structure ensures deep learning and prevents users advancing before they're ready.",
      primaryFlaw: 'FRICTION_IGNORED',
      targetFlaw: { tag: 'FRICTION_IGNORED', desc: 'Requiring 10 sequential correct answers creates friction that exceeds most users\' motivation level early in habit formation, causing abandonment rather than mastery.' }
    },
    {
      text: "Our recipe app has 50,000 monthly active users who mainly open it while already in the kitchen. We send a 5pm push notification saying 'What's for dinner tonight?' Open rates are 3% and falling. Our plan is to increase notification frequency to twice daily.",
      primaryFlaw: 'BEHAVIOUR_ASSUMED',
      targetFlaw: { tag: 'BEHAVIOUR_ASSUMED', desc: "Increasing notifications assumes low engagement is caused by lack of reminders. But usage data shows users engage at point-of-need — a behaviour push notifications cannot manufacture." }
    },
    {
      text: "We run a professional networking platform. Users create profiles and connect with others. We've noticed 70% become inactive within 2 weeks. Our solution is weekly digest emails showing new people to connect with. We're also planning an AI-powered connection suggestion feature.",
      primaryFlaw: 'NO_INVESTMENT_MECHANIC',
      targetFlaw: { tag: 'NO_INVESTMENT_MECHANIC', desc: 'Nothing a user does on this platform makes it more valuable to them over time. There is no investment mechanic — no increasing cost to leaving — making churn structurally inevitable.' }
    },
    {
      text: "We're redesigning our e-commerce checkout to reduce cart abandonment. Users currently complete purchase in 4 steps. Our plan is to streamline this to a single page with all fields visible at once. We expect conversion to improve significantly after this change.",
      primaryFlaw: 'BEHAVIOUR_ASSUMED',
      targetFlaw: { tag: 'BEHAVIOUR_ASSUMED', desc: "Showing all fields at once on a single page can increase perceived complexity and cognitive load, potentially worsening abandonment. The assumption that fewer steps = less friction ignores how users actually process forms." }
    },
    {
      text: "Our meditation app gives users a badge after completing each session. After 7 consecutive days, they earn a 'Week Warrior' badge. After 30 days, a 'Monthly Master' badge. We've added 50 different badge types. Despite this, DAU has declined 22% over the past quarter.",
      primaryFlaw: 'TRIGGER_EXTERNAL_ONLY',
      targetFlaw: { tag: 'TRIGGER_EXTERNAL_ONLY', desc: "Badges are external rewards with no connection to why someone meditates. Without an internal trigger — stress, anxiety, a desire for calm — the habit has no emotional engine to sustain it." }
    },
    {
      text: "We want to increase daily active usage of our task management app. Our plan is to email users each morning with a 'Daily Digest' of their upcoming tasks. We'll also add a gamified points system where completing tasks earns coins redeemable for premium features.",
      primaryFlaw: 'FRICTION_IGNORED',
      targetFlaw: { tag: 'FRICTION_IGNORED', desc: "Both interventions add overhead to the user's workflow. Morning emails interrupt context. Coin systems require users to track a parallel economy. Neither reduces friction on the core behaviour — opening the app and completing tasks." }
    },
    {
      text: "Our SaaS tool for HR teams has strong activation but poor 90-day retention. Users set up the platform in week one and then usage drops sharply. We've run exit surveys and users say the product is 'good but not essential'. We plan to add more features to increase daily utility.",
      primaryFlaw: 'NO_INVESTMENT_MECHANIC',
      targetFlaw: { tag: 'NO_INVESTMENT_MECHANIC', desc: '"Good but not essential" directly signals a missing investment mechanic — the product doesn\'t accumulate value as users put more into it. Adding features won\'t fix a structural retention problem.' }
    }
  ],

  project: [
    {
      text: "We're rebuilding our checkout flow. Milestones: design mockups, frontend build, backend integration, QA, and launch. Frontend and backend will happen simultaneously to save time. Designer, two developers, and QA engineer are assigned. We've budgeted six weeks total.",
      primaryFlaw: 'DEPENDENCY_IGNORED',
      targetFlaw: { tag: 'DEPENDENCY_IGNORED', desc: 'Frontend and backend cannot be built simultaneously — the frontend depends on the API contracts and data structures the backend must define first.' }
    },
    {
      text: "Our Q3 goal is to improve user engagement. We'll work on improving onboarding, redesigning the dashboard, building a notification system, and adding a referral programme. Team of four, twelve weeks. Each team member picks up tasks as available. We'll review at quarter end.",
      primaryFlaw: 'OWNERSHIP_ABSENT',
      targetFlaw: { tag: 'OWNERSHIP_ABSENT', desc: 'Four parallel workstreams with no owner assigned to any of them. "Pick up tasks as available" is not a delivery plan — there is no accountability when things slip.' }
    },
    {
      text: "We scoped a three-month database migration from MySQL to PostgreSQL. In week four, the engineering lead suggested we also refactor the authentication system while in the codebase anyway. The project manager agreed. The revised timeline is now five months.",
      primaryFlaw: 'SCOPE_CREEP',
      targetFlaw: { tag: 'SCOPE_CREEP', desc: '"We\'re already in the codebase" is the classic scope creep justification. Authentication refactoring was added mid-project with no impact assessment or stakeholder approval.' }
    },
    {
      text: "We are building a new internal analytics dashboard for the sales team. The project will be done when the dashboard is built. Two engineers start Monday. The sales team expects it in six weeks. No further scoping has been done as we want to stay agile.",
      primaryFlaw: 'SCOPE_UNDEFINED',
      targetFlaw: { tag: 'SCOPE_UNDEFINED', desc: '"Done when the dashboard is built" is not a scope. No defined features, no agreed deliverables, no boundaries — the six-week estimate is baseless.' }
    },
    {
      text: "We're running a three-week sprint to build our new user onboarding flow. Tasks include: writing copy, designing screens, building the frontend, integrating with the backend API, and QA testing. All five tasks are assigned to different team members and will start on Monday simultaneously.",
      primaryFlaw: 'DEPENDENCY_IGNORED',
      targetFlaw: { tag: 'DEPENDENCY_IGNORED', desc: "Copy and design must precede frontend build. Frontend must be built before QA can test. Backend integration depends on the frontend existing. Starting all five tasks simultaneously ignores the entire dependency chain." }
    },
    {
      text: "Our product roadmap has 6 epics for Q2. Each epic has been assigned to one of our six engineers. There are no weekly check-ins planned — we trust the team to work autonomously and will do a full review at the end of the quarter. Stakeholders have been briefed on the plan.",
      primaryFlaw: 'OWNERSHIP_ABSENT',
      targetFlaw: { tag: 'OWNERSHIP_ABSENT', desc: 'Assigning engineers to epics is not the same as assigning ownership. Without check-ins, no one is accountable for progress, blockers, or scope integrity across the quarter.' }
    },
    {
      text: "We're building a new customer portal. Two weeks in, the Head of Sales asked us to add a live chat feature, as a competitor just launched one. The PM agreed it was important. A week later, the CEO asked for a custom branding option to be added too. The team is now three weeks behind.",
      primaryFlaw: 'SCOPE_CREEP',
      targetFlaw: { tag: 'SCOPE_CREEP', desc: 'Both additions are classic scope creep — reactive feature additions driven by external pressure without a formal scope change process, impact assessment, or timeline renegotiation.' }
    },
    {
      text: "We need to migrate 200,000 user records to a new data structure. The migration is scheduled for a Saturday maintenance window. Two engineers are assigned. There is no rollback plan documented. Testing will be done in production during the migration window itself.",
      primaryFlaw: 'SCOPE_UNDEFINED',
      targetFlaw: { tag: 'SCOPE_UNDEFINED', desc: 'A production data migration with no rollback plan, no pre-production testing, and no defined success or failure criteria is not a scoped project — it is a liability. The full scope of failure modes has not been defined.' }
    }
  ]
};

// ── Session-aware random picker ───────────────

const _shownFallbacks = { design: [], business: [], market: [], user: [], project: [] };

function getOfflineScenario(domainId) {
  const pool = FALLBACK_SCENARIOS[domainId];
  let available = pool.map((_, i) => i).filter(i => !_shownFallbacks[domainId].includes(i));
  if (available.length === 0) {
    _shownFallbacks[domainId] = [];
    available = pool.map((_, i) => i);
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  _shownFallbacks[domainId].push(pick);
  return { ...pool[pick], domain: domainId, isFallback: true };
}

// ── Gemini via Cloudflare Worker proxy ────────

async function generateScenario(domainId) {
  const framework = FRAMEWORKS[domainId];
  if (!framework) throw new Error('Invalid domain');

  const flaws = framework.flaws;
  const targetFlaw = flaws[Math.floor(Math.random() * flaws.length)];

  const prompt = `You are a scenario generator for a game called Slop Runner.
Write a realistic business or product scenario (90 to 120 words) for the domain: ${framework.fullName}.
Embed exactly ONE flaw: ${targetFlaw.tag} — defined as: ${targetFlaw.desc}
The scenario must sound like a real team's project brief or strategy note.
The flaw should be present but subtle — do NOT name or label it in the text.
Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation.
Required fields: "text" (the scenario), "primaryFlaw" (exactly: ${targetFlaw.tag}), "domain" (exactly: ${domainId})`;

  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 500 }
      })
    });

    if (!res.ok) throw new Error(`Worker ${res.status}`);

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty response');

    const clean = raw.replace(/```json\s*|```\s*/g, '').trim();
    const parsed = JSON.parse(clean);
    if (!parsed.text || !parsed.primaryFlaw) throw new Error('Malformed JSON');

    return { text: parsed.text, primaryFlaw: parsed.primaryFlaw, domain: domainId, targetFlaw, isFallback: false };

  } catch (err) {
    console.warn('Gemini unavailable, using offline scenario:', err.message);
    return getOfflineScenario(domainId);
  }
}

// ── Submission evaluator ──────────────────────

function evaluateSubmission(scenario, selectedCueIds, verdictText) {
  const correctFlaw = scenario.primaryFlaw;

  const relevantCueIds = {
    'ASSUMPTION_SMUGGLING':  ['D-01'],
    'PREMATURE_SOLUTION':    ['D-02'],
    'BUILDER_BIAS':          ['D-03', 'D-04'],
    'MISSING_FEEDBACK_LOOP': ['D-05'],
    'REVENUE_UNDEFINED':     ['B-01'],
    'SEGMENT_CONFLATION':    ['B-02'],
    'VALUE_PROP_VAGUE':      ['B-03'],
    'METRIC_MISMATCH':       ['B-05'],
    'SEGMENT_UNDEFINED':     ['M-01'],
    'CHANNEL_MISMATCH':      ['M-02', 'B-06'],
    'FIT_ASSUMED':           ['M-06'],
    'TIMING_UNVERIFIED':     ['M-04'],
    'BEHAVIOUR_ASSUMED':     ['U-01'],
    'TRIGGER_EXTERNAL_ONLY': ['U-02'],
    'FRICTION_IGNORED':      ['U-04'],
    'NO_INVESTMENT_MECHANIC':['U-05'],
    'SCOPE_UNDEFINED':       ['P-01'],
    'OWNERSHIP_ABSENT':      ['P-02'],
    'DEPENDENCY_IGNORED':    ['P-03'],
    'SCOPE_CREEP':           ['P-04']
  };

  const correctCues = relevantCueIds[correctFlaw] || [];
  const correctCueSelected = selectedCueIds.some(id => correctCues.includes(id));
  const hasVerdict = verdictText.trim().length > 20;
  const isCorrect = correctCueSelected || hasVerdict;

  return { isCorrect, correctCueSelected, correctFlaw, correctCues, explanation: scenario.targetFlaw?.desc || '' };
}
