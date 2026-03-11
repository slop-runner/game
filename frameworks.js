const FRAMEWORKS = {
  design: {
    id: 'design',
    label: 'DESIGN',
    fullName: 'Design Thinking',
    color: '#E63B2E',
    accent: '#FF6B5B',
    description: 'Did we understand the person before building the solution?',
    cues: [
      { id: 'D-01', text: 'Who was actually interviewed?', flags: 'Solution built on assumptions — no real user research cited' },
      { id: 'D-02', text: 'Problem skipped — jumped to solution', flags: 'Ideation happened before Define; classic premature solutioning' },
      { id: 'D-03', text: 'Need stated as a feature', flags: 'User need described as product feature, not a verb or behaviour' },
      { id: 'D-04', text: "Whose emotion is this?", flags: "Pain point cited is the builder's frustration, not the user's" },
      { id: 'D-05', text: 'Prototype ≠ product — test it first', flags: 'Scenario moves from idea to launch with no feedback loop' },
      { id: 'D-06', text: 'What does success look like for the user?', flags: 'No definition of a good outcome from the user perspective' }
    ],
    flaws: [
      { tag: 'ASSUMPTION_SMUGGLING', desc: 'A conclusion stated as user insight with no research cited' },
      { tag: 'PREMATURE_SOLUTION', desc: 'Solution described before the problem is clearly defined' },
      { tag: 'BUILDER_BIAS', desc: 'The user need is actually what the builder wants to make' },
      { tag: 'MISSING_FEEDBACK_LOOP', desc: 'No testing or iteration step present' }
    ]
  },
  business: {
    id: 'business',
    label: 'BUSINESS',
    fullName: 'Business Modelling',
    color: '#1A6BFF',
    accent: '#4D8FFF',
    description: 'How does this actually make money and sustain itself?',
    cues: [
      { id: 'B-01', text: "Where's the revenue logic?", flags: 'Revenue stream absent, vague, or disconnected from value proposition' },
      { id: 'B-02', text: 'Who is the paying customer?', flags: 'Customer segment undefined or conflated with the end user' },
      { id: 'B-03', text: "What's the actual value delivered?", flags: 'Value proposition is generic, not specific to a real problem' },
      { id: 'B-04', text: 'Cost structure is invisible', flags: 'Business plan has no mention of what it costs to run this' },
      { id: 'B-05', text: 'Vanity metric — not a driver', flags: 'Metric cited does not connect to revenue or retention' },
      { id: 'B-06', text: 'Channel mismatch', flags: 'Route to customers does not fit the product type or segment' }
    ],
    flaws: [
      { tag: 'REVENUE_UNDEFINED', desc: 'No clear mechanism for how money is made' },
      { tag: 'SEGMENT_CONFLATION', desc: 'End user and paying customer treated as identical' },
      { tag: 'VALUE_PROP_VAGUE', desc: 'Benefit described generically without specificity' },
      { tag: 'METRIC_MISMATCH', desc: 'Measuring the wrong thing for the stated business goal' }
    ]
  },
  market: {
    id: 'market',
    label: 'MARKET',
    fullName: 'Market Thinking',
    color: '#00A878',
    accent: '#00D49A',
    description: 'Does this fit the actual market conditions it needs to survive in?',
    cues: [
      { id: 'M-01', text: 'Market defined too broadly', flags: '"Everyone" cited — no real bounded target market' },
      { id: 'M-02', text: "Channel doesn't reach this market", flags: 'Acquisition channel described will not reach the stated segment' },
      { id: 'M-03', text: "Model doesn't match market size", flags: 'Revenue model requires large market but segment is small' },
      { id: 'M-04', text: 'Timing claim — verify this', flags: '"Market is ready now" stated without evidence' },
      { id: 'M-05', text: 'Competitor blind spot', flags: 'Solution described as if no alternatives exist' },
      { id: 'M-06', text: 'Product-market fit assumed, not tested', flags: 'Strong fit asserted without any validation evidence' }
    ],
    flaws: [
      { tag: 'SEGMENT_UNDEFINED', desc: 'No clear, bounded target market identified' },
      { tag: 'CHANNEL_MISMATCH', desc: 'Acquisition route incompatible with the defined segment' },
      { tag: 'FIT_ASSUMED', desc: 'Market-product fit claimed without validation evidence' },
      { tag: 'TIMING_UNVERIFIED', desc: 'Market readiness stated without data' }
    ]
  },
  user: {
    id: 'user',
    label: 'USER',
    fullName: 'User Thinking',
    color: '#9B5DE5',
    accent: '#C084FC',
    description: 'Does this account for how people actually behave, not how we wish they would?',
    cues: [
      { id: 'U-01', text: 'Behaviour assumed, not observed', flags: 'Product plan assumes user actions with no behavioural evidence' },
      { id: 'U-02', text: "What's the internal trigger?", flags: 'External trigger described but no internal emotional driver identified' },
      { id: 'U-03', text: 'Reward is predictable — no hook', flags: 'Fixed reward offered; no variable reward mechanism to drive habit' },
      { id: 'U-04', text: 'Too much friction for this action', flags: 'Required action demands too much effort for the motivation level' },
      { id: 'U-05', text: 'Investment step missing', flags: 'No mechanism for users to invest to increase switching cost' },
      { id: 'U-06', text: 'Pain point vague', flags: 'Emotional driver cited is too abstract to design for' }
    ],
    flaws: [
      { tag: 'BEHAVIOUR_ASSUMED', desc: 'User actions described without grounding in real behaviour data' },
      { tag: 'TRIGGER_EXTERNAL_ONLY', desc: 'Only external triggers defined; no internal emotional driver' },
      { tag: 'FRICTION_IGNORED', desc: 'Required action is too effortful for the motivation level' },
      { tag: 'NO_INVESTMENT_MECHANIC', desc: 'Nothing makes users more invested over time' }
    ]
  },
  project: {
    id: 'project',
    label: 'PROJECT',
    fullName: 'Project Thinking',
    color: '#F4A124',
    accent: '#FFC85A',
    description: 'Is this executable? Can someone actually ship this?',
    cues: [
      { id: 'P-01', text: 'Scope undefined', flags: 'No clear statement of what is or is not included in this work' },
      { id: 'P-02', text: 'No owner assigned', flags: 'Task or milestone has no responsible individual named' },
      { id: 'P-03', text: 'Dependency not mapped', flags: 'Tasks listed in parallel that have a dependency order' },
      { id: 'P-04', text: 'Scope creep signal', flags: 'Mid-plan addition of work not in the original scope' },
      { id: 'P-05', text: 'Milestone is not a milestone', flags: 'Called a milestone but is actually a task — no clear deliverable' },
      { id: 'P-06', text: 'Blocker not addressed', flags: 'A constraint or risk is mentioned but no resolution is shown' }
    ],
    flaws: [
      { tag: 'SCOPE_UNDEFINED', desc: 'Boundaries of the work are not clearly stated' },
      { tag: 'OWNERSHIP_ABSENT', desc: 'No accountability assigned to tasks or milestones' },
      { tag: 'DEPENDENCY_IGNORED', desc: 'Execution order not respected; sequential tasks treated as parallel' },
      { tag: 'SCOPE_CREEP', desc: 'Work grows in the scenario beyond what was originally defined' }
    ]
  }
};

const FRAMEWORK_ORDER = ['design', 'business', 'market', 'user', 'project'];

const RANKS = [
  { name: 'NOVICE', minXP: 0, color: '#8A9BB0' },
  { name: 'ANALYST', minXP: 500, color: '#00A878' },
  { name: 'STRATEGIST', minXP: 1500, color: '#1A6BFF' },
  { name: 'DIRECTOR', minXP: 3500, color: '#9B5DE5' },
  { name: 'PRINCIPAL', minXP: 7000, color: '#F4A124' }
];

function getRank(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
}
