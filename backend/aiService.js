// ClassTwin AI Service — Claude API Integration for AI Insights

async function getAIInsight(sessionData) {
  const { topic, round, totalRounds, classAvg, onTrack, atRisk, highRisk, missedConcept, trend } = sessionData;

  const prompt = `
You are an AI teaching assistant analyzing a live classroom session.

Topic: "${topic}"
Round: ${round} of ${totalRounds}

Class comprehension data:
- Average score: ${classAvg}%
- Students ON_TRACK: ${onTrack}
- Students AT_RISK: ${atRisk}
- Students HIGH_RISK: ${highRisk}
- Most missed concept this round: "${missedConcept}"
- Class trend: ${trend}

Give the teacher:
1. One specific action to take RIGHT NOW (max 12 words)
2. One concept to revisit (exact name)
3. A class health score from 0 to 100

Respond ONLY in JSON. No extra text, no markdown:
{
  "action": "...",
  "revisit": "...",
  "healthScore": 72
}
`;

  // Try Claude API if key exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (apiKey && apiKey !== 'your_key_here') {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const data = await response.json();
      const content = data.content?.[0]?.text;
      if (content) {
        return JSON.parse(content);
      }
    } catch (err) {
      console.error('Claude API error, falling back to simulated insights:', err.message);
    }
  }

  // Simulated AI insights (fallback)
  return generateSimulatedInsight(sessionData);
}

function generateSimulatedInsight({ classAvg, highRisk, missedConcept, trend }) {
  const actions = [
    `Slow down — ${highRisk} students lost on ${missedConcept}`,
    `Re-explain ${missedConcept} with a visual example now`,
    `Pause and ask students to discuss ${missedConcept} in pairs`,
    `Give a 30-second recap on ${missedConcept} before continuing`,
    `Ask a follow-up question on ${missedConcept} to verify understanding`
  ];

  const healthScore = Math.min(100, Math.max(0, 
    classAvg + (trend === 'stable' ? 5 : -10)
  ));

  return {
    action: actions[Math.floor(Math.random() * actions.length)],
    revisit: missedConcept || 'Previous concept',
    healthScore: Math.round(healthScore)
  };
}

module.exports = { getAIInsight };
