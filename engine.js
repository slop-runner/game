// ─────────────────────────────────────────────
// ENGINE.JS — Scenario generation via Gemini
// Calls Cloudflare Worker proxy so the API key
// is never exposed in the browser.
// ─────────────────────────────────────────────

const PROXY_URL = 'https://quiet-shape-b3c1.slop-runner.workers.dev';

// ── Offline scenario bank (4 per domain = 20 total) ──

const FALLBACK_SCENARIOS = {
  design: [
    {
      text: "Our team spent three weeks building a feature that automatically categorises a user's emails by urgency. We used our own email habits as the basis for the urgency model. The feature launched last Tuesday and we're already seeing strong adoption numbers — 2,000 installs in the first week. We're now planning v2 which will add calendar integration based on the same internal model.",
      primaryFlaw: 'BUILDER_BIAS',
      targetFlaw: { tag: 'BUILDER_BIAS', desc: "The urgency model was built on the team's own behaviour patterns, not those of actual users. The builder's habits were substituted for user research." }
    },
    {
      text: "We noticed that users were dropping off on our checkout page so we immediately redesigned the layout, simplified the form fields, and added a progress bar. We shipped the update two weeks later. Drop-off rates improved by 12%. We're now applying the same redesign approach to our onboarding flow, which also has high drop-off.",
      primaryFlaw: 'ASSUMPTION_SMUGGLING',
      targetFlaw: { tag: 'ASSUMPTION_SMUGGLING', desc: "The team assumed the layout caused drop-off without interviewing users or diagnosing the actual root cause. A correlation was treated as a confirmed insight." }
    },
    {
      text: "We are designing a new meditation app for busy professionals. We've already mapped out 14 core features including guided sessions, mood tracking, a social community, streaks, and a marketplace for premium content. We plan to prototype all 14 features before any user testing so the first version feels complete and polished when we show it to users.",
      primaryFlaw: 'MISSING_FEEDBACK_LOOP',
      targetFlaw: { tag: 'MISSING_FEEDBACK_LOOP', desc: "Prototyping all 14 features before any user testing inverts the design thinking process. Feedback should shape what gets built, not validate what's already fully built." }
    },
    {
      text: "We interviewed 50 users and found they struggle with managing their finances. Based on this, we're building a feature that automatically categorises their spending into buckets. The feature will include a savings goal widget, a monthly report card, and a gamified challenge mode. We'll test it once all three components are ready.",
      primaryFlaw: 'PREMATURE_SOLUTION',
      targetFlaw: { tag: 'PREMATURE_SOLUTION', desc: '"Struggling with finances" is too broad — three separate features were designed before the core problem was precisely defined and validated with users.' }
    }
  ],
  business: [
    {
      text: "We're building a B2B SaaS platform for small restaurants to manage reservations. Our value proposition is saving time on phone bookings. We plan to offer it free forever and grow through word of mouth. Once we hit 10,000 restaurants we'll explore monetisation options. Our key metric right now is the number of restaurants signed up.",
      primaryFlaw: 'REVENUE_UNDEFINED',
      targetFlaw: { tag: 'REVENUE_UNDEFINED', desc: '"Free forever with monetisation explored later" is not a revenue model. There is no mechanism by which this business captures value from the value it creates.' }
    },
    {
      text: "Our platform connects freelance designers with startups. We charge startups a 15% commission on every project booked. Our value proposition is quality-vetted designers at startup-friendly rates. We measure success by the number of designer profiles created each month. Last month we added 340 new designer signups which is our best month yet.",
      primaryFlaw: 'METRIC_MISMATCH',
      targetFlaw: { tag: 'METRIC_MISMATCH', desc: "Designer signups are a supply-side vanity metric. They don't measure whether projects are being booked, which is the actual revenue driver for a commission-based model." }
    },
    {
      text: "We're launching a consumer mental health journaling app. Our business model is a £9.99/month subscription. We'll acquire users through Instagram ads targeting people interested in mindfulness. Once we have enough users, we plan to sell anonymised journaling data to academic researchers as a secondary revenue stream.",
      primaryFlaw: 'VALUE_PROP_VAGUE',
      targetFlaw: { tag: 'VALUE_PROP_VAGUE', desc: 'The value proposition — mental health journaling — is entirely generic. There is no specific problem being solved that differentiates this from dozens of existing apps.' }
    },
    {
      text: "We sell project management software to enterprise teams. Our paying customers are IT managers who approve software budgets. We've built the product for developers — it has a CLI, GitHub integration, and API-first features. We market it through LinkedIn ads targeting software engineers. Sales cycles are averaging 6 months and we're not sure why.",
      primaryFlaw: 'SEGMENT_CONFLATION',
      targetFlaw: { tag: 'SEGMENT_CONFLATION', desc: 'The paying customer (IT managers) and the end user (developers) are different people with different needs — the product and marketing treat them as the same person.' }
    }
  ],
  market: [
    {
      text: "The productivity app market is massive — there are 3 billion smartphone users globally and everyone needs to be more productive. We're building a focus timer app and our target market is anyone who wants to get more done. Because remote work is growing, the timing has never been better. We'll acquire users through the App Store.",
      primaryFlaw: 'SEGMENT_UNDEFINED',
      targetFlaw: { tag: 'SEGMENT_UNDEFINED', desc: '"Anyone who wants to be productive" has no bounded definition. Without a real segment, acquisition, positioning, and retention are all impossible to optimise.' }
    },
    {
      text: "We've validated strong product-market fit for our legal document tool. We know this because we've had 800 signups since launch and 4.8 stars on Product Hunt. We're now planning to scale aggressively by spending £50k/month on Google ads. Our target customer is any business that deals with contracts.",
      primaryFlaw: 'FIT_ASSUMED',
      targetFlaw: { tag: 'FIT_ASSUMED', desc: 'Signups and Product Hunt ratings are interest signals, not evidence of product-market fit. Retention, repeat usage, and willingness to pay are the actual indicators.' }
    },
    {
      text: "We're entering the corporate training market. Our competitors are large LMS platforms like Cornerstone and SAP SuccessFactors. We'll differentiate on price — our tool costs 80% less. We'll acquire enterprise customers through cold email outreach to HR directors at companies with 500+ employees.",
      primaryFlaw: 'CHANNEL_MISMATCH',
      targetFlaw: { tag: 'CHANNEL_MISMATCH', desc: 'Cold email to enterprise HR directors is a very low-conversion channel for software purchases. Enterprise buyers require relationship sales, demos, security reviews, and procurement processes.' }
    },
    {
      text: "The creator economy is exploding right now. Newsletter platforms are growing at 40% year-on-year. We're launching a paid newsletter platform for independent journalists. This is clearly the right moment to enter — the market conditions won't be this good again. We're targeting 500 paying newsletters in year one.",
      primaryFlaw: 'TIMING_UNVERIFIED',
      targetFlaw: { tag: 'TIMING_UNVERIFIED', desc: '"The market conditions won\'t be this good again" is a timing claim stated as fact. It\'s a rhetorical assertion used to justify urgency rather than a data-backed market insight.' }
    }
  ],
  user: [
    {
      text: "Our fitness app sends users a push notification every morning at 7am reminding them to log their workout. We designed the reward as a streak counter that goes up by one each day they log. Users receive a congratulations message when they complete a log. Our retention after 30 days is 8% and we can't understand why engagement is dropping.",
      primaryFlaw: 'TRIGGER_EXTERNAL_ONLY',
      targetFlaw: { tag: 'TRIGGER_EXTERNAL_ONLY', desc: 'The only trigger is an external notification. There is no internal emotional driver — no connection to identity, aspiration, or pain — that would make the habit self-sustaining.' }
    },
    {
      text: "We're building a language learning app. Users progress through daily lessons and earn badges for completing each level. To unlock the next lesson, users must answer 10 questions correctly in sequence. We believe this rigorous structure will ensure deep learning and prevent users from advancing before they're ready.",
      primaryFlaw: 'FRICTION_IGNORED',
      targetFlaw: { tag: 'FRICTION_IGNORED', desc: 'Requiring 10 sequential correct answers creates high friction that exceeds most users\' motivation level, especially early in habit formation — resulting in abandonment, not mastery.' }
    },
    {
      text: "Our recipe app has 50,000 monthly active users who mainly open it while already in the kitchen. We send a push notification at 5pm saying \'What\'s for dinner tonight?\' to re-engage users. Open rates are at 3% and falling. Our plan is to increase notification frequency to twice daily to improve re-engagement.",
      primaryFlaw: 'BEHAVIOUR_ASSUMED',
      targetFlaw: { tag: 'BEHAVIOUR_ASSUMED', desc: "Increasing notifications assumes users aren't engaging due to lack of reminders. But the usage data shows users engage at point-of-need — a behaviour notifications can't manufacture." }
    },
    {
      text: "We run a professional networking platform. Users create a profile, connect with others, and can message contacts. We've noticed 70% of users become inactive within 2 weeks. Our solution is to send weekly digest emails showing new people they could connect with. We're also planning an AI-powered connection suggestion feature.",
      primaryFlaw: 'NO_INVESTMENT_MECHANIC',
      targetFlaw: { tag: 'NO_INVESTMENT_MECHANIC', desc: 'Nothing a user does on this platform makes it more valuable to them over time. There is no investment mechanic — no increasing cost to leaving — so churn is structurally inevitable.' }
    }
  ],
  project: [
    {
      text: "We're rebuilding our checkout flow. The milestones are: design mockups, frontend build, backend integration, QA, and launch. The frontend and backend work will happen simultaneously to save time. The designer, two developers, and QA engineer are all assigned to the project. We've budgeted six weeks total.",
      primaryFlaw: 'DEPENDENCY_IGNORED',
      targetFlaw: { tag: 'DEPENDENCY_IGNORED', desc: 'Frontend and backend cannot be built simultaneously — the frontend depends on the API contracts and data structures the backend must define first.' }
    },
    {
      text: "Our Q3 goal is to improve user engagement. To achieve this we'll work on improving the onboarding flow, redesigning the dashboard, building a new notification system, and adding a referral programme. We have a team of four and twelve weeks. Each team member will pick up tasks as they become available and we'll review progress at the end of the quarter.",
      primaryFlaw: 'OWNERSHIP_ABSENT',
      targetFlaw: { tag: 'OWNERSHIP_ABSENT', desc: 'Four parallel workstreams with no owner assigned to any of them. "Pick up tasks as available" is not a delivery plan — there is no accountability when things slip.' }
    },
    {
      text: "We scoped a three-month project to migrate our database from MySQL to PostgreSQL. In week four, the engineering lead suggested we also refactor the authentication system while we're in the codebase since we'll be touching those files anyway. The project manager agreed it made sense. The revised timeline is now five months.",
      primaryFlaw: 'SCOPE_CREEP',
      targetFlaw: { tag: 'SCOPE_CREEP', desc: '"We\'re already in the codebase" is the classic scope creep justification. Authentication refactoring was added mid-project with no impact assessment or stakeholder approval.' }
    },
    {
      text: "We are building a new internal analytics dashboard for our sales team. The project will be done when the dashboard is built. Two engineers start Monday. The sales team has been told it will be ready in six weeks. No further scoping has been done as we want to stay agile and respond to what the sales team needs as we go.",
      primaryFlaw: 'SCOPE_UNDEFINED',
      targetFlaw: { tag: 'SCOPE_UNDEFINED', desc: '"Done when the dashboard is built" is not a scope. There are no defined features, no agreed deliverables, and no boundaries — making the six-week estimate completely baseless.' }
    }
  ]
};

// ── Session-aware random picker (no repeats per session) ──

const _shownFallbacks = { design: [], business: [], market: [], user: [], project: [] };

function getOfflineScenario(domainId) {
  const pool = FALLBACK_SCENARIOS[domainId];
  let available = pool.map((s, i) => i).filter(i => !_shownFallbacks[domainId].includes(i));
  if (available.length === 0) {
    _shownFallbacks[domainId] = [];
    available = pool.map((_, i) => i);
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  _shownFallbacks[domainId].push(pick);
  return { ...pool[pick], domain: domainId, isFallback: true };
}

// ── Gemini scenario generator via Worker proxy ──

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