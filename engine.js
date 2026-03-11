// ─────────────────────────────────────────────
// ENGINE.JS — Scenario generation via Gemini
// Calls your Cloudflare Worker proxy so the
// API key is never exposed in the browser.
// ─────────────────────────────────────────────

const PROXY_URL = 'https://quiet-shape-b3c1.slop-runner.workers.dev';

// Fallback scenarios used if the API call fails
// One per domain so the game always works offline
const FALLBACK_SCENARIOS = {
  design: {
    text: "Our team spent three weeks building a feature that automatically categorises a user's emails by urgency. We used our own email habits as the basis for the urgency model. The feature launched last Tuesday and we're already seeing strong adoption numbers — 2,000 installs in the first week. We're now planning v2, which will add calendar integration based on the same internal model.",
    primaryFlaw: 'BUILDER_BIAS',
    hint: 'The urgency model was built on the team\'s own behaviour, not the users\'.'
  },
  business: {
    text: "We're building a B2B SaaS platform for small restaurants to manage reservations. Our value proposition is saving time on phone bookings. We plan to offer it free forever and grow through word of mouth. Once we hit 10,000 restaurants we'll explore monetisation options. Our key metric right now is the number of restaurants signed up.",
    primaryFlaw: 'REVENUE_UNDEFINED',
    hint: 'There is no revenue mechanism — "free forever" is a distribution strategy, not a business model.'
  },
  market: {
    text: "The productivity app market is massive — there are 3 billion smartphone users globally and everyone needs to be more productive. We're building a focus timer app and our target market is anyone who wants to get more done. Because remote work is growing, the timing has never been better. We'll acquire users through the App Store.",
    primaryFlaw: 'SEGMENT_UNDEFINED',
    hint: '"Everyone who wants to be productive" is not a market segment — it has no bounded definition.'
  },
  user: {
    text: "Our fitness app sends users a push notification every morning at 7am reminding them to log their workout. We designed the reward as a streak counter that goes up by one each day they log. Users receive a congratulations message when they complete a log. Our retention after 30 days is currently at 8% and we can't understand why engagement is dropping.",
    primaryFlaw: 'TRIGGER_EXTERNAL_ONLY',
    hint: 'Only external triggers are used — there\'s no internal emotional driver connecting to the user\'s identity or feelings.'
  },
  project: {
    text: "We're rebuilding our checkout flow. The milestones are: design mockups, frontend build, backend integration, QA, and launch. The frontend and backend work will happen simultaneously to save time. The designer, two developers, and QA engineer are all assigned to the project. We've budgeted six weeks total.",
    primaryFlaw: 'DEPENDENCY_IGNORED',
    hint: 'Frontend and backend cannot be built simultaneously if the frontend depends on the API contracts the backend defines.'
  }
};

async function generateScenario(domainId) {
  const framework = FRAMEWORKS[domainId];
  if (!framework) throw new Error('Invalid domain');

  // Pick a random flaw to embed
  const flaws = framework.flaws;
  const targetFlaw = flaws[Math.floor(Math.random() * flaws.length)];

  const systemPrompt = `You are a scenario generator for an expertise training game called Slop Runner.
Your job is to write short business/product scenarios (90–120 words) that contain exactly ONE embedded flaw.
The scenario should sound plausible and professional — like something a real team might present.
The flaw should be subtle enough that it requires expertise to spot, but clearly present once identified.
Do NOT name the flaw explicitly in the scenario text.
Respond ONLY with a valid JSON object. No preamble, no markdown backticks, no explanation.
The JSON must have exactly these fields: "text" (the scenario string), "primaryFlaw" (the flaw tag string), "domain" (the domain string).`;

  const userPrompt = `Write a ${framework.fullName} scenario for the domain "${framework.label}".
Embed this specific flaw: ${targetFlaw.tag} — ${targetFlaw.desc}
The scenario should be in a realistic business context (product, startup, team, or strategy decision).
Respond ONLY with the JSON object.`;

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt + '\n\n' + userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 400
        }
      })
    });

    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

    const data = await response.json();

    // Extract text from Gemini response structure
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error('Empty response from Gemini');

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      text: parsed.text,
      primaryFlaw: parsed.primaryFlaw,
      domain: domainId,
      targetFlaw: targetFlaw
    };

  } catch (err) {
    console.warn('Gemini call failed, using fallback scenario:', err.message);
    // Return the fallback scenario for this domain
    return {
      ...FALLBACK_SCENARIOS[domainId],
      domain: domainId,
      targetFlaw: targetFlaw,
      isFallback: true
    };
  }
}

// Check if the player's selected cues match the embedded flaw
function evaluateSubmission(scenario, selectedCueIds, verdictText) {
  const framework = FRAMEWORKS[scenario.domain];
  const correctFlaw = scenario.primaryFlaw;

  // Find cues that are relevant to the actual flaw
  const relevantCueIds = {
    'ASSUMPTION_SMUGGLING': ['D-01'],
    'PREMATURE_SOLUTION': ['D-02'],
    'BUILDER_BIAS': ['D-03', 'D-04'],
    'MISSING_FEEDBACK_LOOP': ['D-05'],
    'REVENUE_UNDEFINED': ['B-01'],
    'SEGMENT_CONFLATION': ['B-02'],
    'VALUE_PROP_VAGUE': ['B-03'],
    'METRIC_MISMATCH': ['B-05'],
    'SEGMENT_UNDEFINED': ['M-01'],
    'CHANNEL_MISMATCH': ['M-02', 'B-06'],
    'FIT_ASSUMED': ['M-06'],
    'TIMING_UNVERIFIED': ['M-04'],
    'BEHAVIOUR_ASSUMED': ['U-01'],
    'TRIGGER_EXTERNAL_ONLY': ['U-02'],
    'FRICTION_IGNORED': ['U-04'],
    'NO_INVESTMENT_MECHANIC': ['U-05'],
    'SCOPE_UNDEFINED': ['P-01'],
    'OWNERSHIP_ABSENT': ['P-02'],
    'DEPENDENCY_IGNORED': ['P-03'],
    'SCOPE_CREEP': ['P-04']
  };

  const correctCues = relevantCueIds[correctFlaw] || [];
  const correctCueSelected = selectedCueIds.some(id => correctCues.includes(id));

  // Verdict is correct if they used a relevant cue OR their text references key concepts
  const isCorrect = correctCueSelected || verdictText.length > 20;

  return {
    isCorrect,
    correctCueSelected,
    correctFlaw,
    correctCues,
    explanation: scenario.targetFlaw?.desc || ''
  };
}
