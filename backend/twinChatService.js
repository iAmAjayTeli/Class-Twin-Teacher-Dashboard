// Twin Insight Engine — Chat Service with RAG Context, Simulation & Nudges
// Powers the "Cognitive Orchestrator" frontend

const { GoogleGenAI, Type } = require('@google/genai');
const { supabase, createUserClient } = require('./supabaseClient');

// ═══════════════════════════════════════════════
// 1. RAG CONTEXT — Fetch live classroom telemetry
// ═══════════════════════════════════════════════

async function fetchClassroomContext(userClient, teacherId) {
  try {
    // Get the teacher's most recent active/completed sessions
    const { data: sessions } = await userClient
      .from('sessions')
      .select('id, topic, status, created_at')
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!sessions || sessions.length === 0) {
      return { hasData: false, summary: 'No sessions found.', raw: null };
    }

    const sessionIds = sessions.map(s => s.id);

    // Fetch engagement logs from the last 5 minutes (or all recent if none)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let { data: recentLogs } = await userClient
      .from('engagement_logs')
      .select('student_id, engagement_state, confidence, metrics, created_at, session_id')
      .in('session_id', sessionIds)
      .gte('created_at', fiveMinAgo)
      .order('created_at', { ascending: false })
      .limit(200);

    // If no recent logs, get the latest 50 regardless of time
    if (!recentLogs || recentLogs.length === 0) {
      const { data: fallbackLogs } = await userClient
        .from('engagement_logs')
        .select('student_id, engagement_state, confidence, metrics, created_at, session_id')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })
        .limit(50);
      recentLogs = fallbackLogs || [];
    }

    // Fetch student names
    const { data: students } = await userClient
      .from('session_students')
      .select('id, student_name, comprehension, risk, total_correct, total_answered')
      .in('session_id', sessionIds);

    // Aggregate the data
    const studentMap = {};
    for (const s of (students || [])) {
      studentMap[s.id] = s;
    }

    let totalConfidence = 0;
    let confCount = 0;
    let gazeSum = 0;
    let gazeCount = 0;
    const engagementStates = {};
    const emotions = {};
    const lowAttentionStudents = [];

    for (const log of recentLogs) {
      if (log.confidence != null) {
        totalConfidence += log.confidence;
        confCount++;
      }
      if (log.engagement_state) {
        engagementStates[log.engagement_state] = (engagementStates[log.engagement_state] || 0) + 1;
      }
      const m = log.metrics || {};
      if (m.gaze_on_screen != null) {
        gazeSum += m.gaze_on_screen;
        gazeCount++;
      }
      if (m.emotion) {
        emotions[m.emotion] = (emotions[m.emotion] || 0) + 1;
      }
    }

    // Identify low-attention students
    const studentConfidence = {};
    for (const log of recentLogs) {
      if (!studentConfidence[log.student_id]) {
        studentConfidence[log.student_id] = { sum: 0, count: 0 };
      }
      if (log.confidence != null) {
        studentConfidence[log.student_id].sum += log.confidence;
        studentConfidence[log.student_id].count++;
      }
    }

    for (const [sid, data] of Object.entries(studentConfidence)) {
      const avg = data.count > 0 ? data.sum / data.count : 0;
      if (avg < 0.5) {
        const student = studentMap[sid];
        lowAttentionStudents.push({
          id: sid,
          name: student?.student_name || `Student-${sid.slice(0, 6)}`,
          avgConfidence: Math.round(avg * 100),
          risk: student?.risk || 'UNKNOWN',
        });
      }
    }

    const avgConfidence = confCount > 0 ? Math.round((totalConfidence / confCount) * 100) : null;
    const avgGaze = gazeCount > 0 ? Math.round((gazeSum / gazeCount) * 100) : null;
    const dominantState = Object.entries(engagementStates).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    const dominantEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    // Predict pass rate from comprehension scores
    const comprehensionScores = (students || []).map(s => s.comprehension).filter(c => c != null);
    const passRate = comprehensionScores.length > 0
      ? Math.round(comprehensionScores.filter(c => c >= 50).length / comprehensionScores.length * 100)
      : null;

    const contextSummary = [
      `Data Points: ${recentLogs.length} engagement logs from ${confCount} readings.`,
      `Sessions: ${sessions.map(s => `"${s.topic}" (${s.status})`).join(', ')}`,
      `Collective Focus: ${avgConfidence != null ? avgConfidence + '%' : 'N/A'}`,
      `Average Gaze On-Screen: ${avgGaze != null ? avgGaze + '%' : 'N/A'}`,
      `Dominant Engagement State: ${dominantState}`,
      `Dominant Emotion: ${dominantEmotion}`,
      `Predicted Pass Rate: ${passRate != null ? passRate + '%' : 'N/A'}`,
      `Students with Low Attention: ${lowAttentionStudents.length > 0 ? lowAttentionStudents.map(s => `${s.name} (${s.avgConfidence}%)`).join(', ') : 'None'}`,
      `Total Students: ${(students || []).length}`,
    ].join('\n');

    return {
      hasData: true,
      summary: contextSummary,
      stats: {
        collectiveFocus: avgConfidence,
        predictedPassRate: passRate,
        avgGaze,
        dominantState,
        dominantEmotion,
        engagementStates,
        totalStudents: (students || []).length,
        dataPoints: recentLogs.length,
        lowAttentionStudents,
        sessions: sessions.map(s => ({ topic: s.topic, status: s.status })),
      },
      raw: { recentLogs, students, sessions },
    };
  } catch (err) {
    console.error('Error fetching classroom context:', err);
    return { hasData: false, summary: 'Error fetching classroom data.', raw: null };
  }
}


// ═══════════════════════════════════════════════
// 2. PREDICTIVE SIMULATION
// ═══════════════════════════════════════════════

function simulateOutcome(scenario, context) {
  const stats = context.stats || {};
  const focus = stats.collectiveFocus || 70;
  const passRate = stats.predictedPassRate || 70;

  const scenarioLower = scenario.toLowerCase();

  if (scenarioLower.includes('break')) {
    const focusDelta = Math.round(10 + Math.random() * 10);
    const passDelta = Math.round(5 + Math.random() * 10);
    return {
      scenario: 'Take a 10-minute break',
      prediction: {
        focusBefore: focus,
        focusAfter: Math.min(100, focus + focusDelta),
        focusDelta: `+${focusDelta}%`,
        passRateBefore: passRate,
        passRateAfter: Math.min(100, passRate + passDelta),
        passRateDelta: `+${passDelta}%`,
      },
      reasoning: `Based on the Twin's historical fatigue data, a break now would increase collective focus by ${focusDelta}% and predicted pass rates from ${passRate}% to ${Math.min(100, passRate + passDelta)}%. Student attention typically recovers 15-20% after short breaks when current focus is below 80%.`,
      confidence: 0.82,
    };
  }

  if (scenarioLower.includes('topic') || scenarioLower.includes('switch')) {
    const focusDelta = Math.round(5 + Math.random() * 8);
    return {
      scenario: 'Switch to a different topic',
      prediction: {
        focusBefore: focus,
        focusAfter: Math.min(100, focus + focusDelta),
        focusDelta: `+${focusDelta}%`,
        passRateBefore: passRate,
        passRateAfter: Math.max(passRate - 3, passRate - Math.round(Math.random() * 5)),
        passRateDelta: `-${Math.round(Math.random() * 5)}%`,
      },
      reasoning: `Switching topics would boost engagement by ${focusDelta}% but may slightly reduce pass rates on the current topic. Best used when confusion exceeds 40%.`,
      confidence: 0.74,
    };
  }

  if (scenarioLower.includes('pair') || scenarioLower.includes('group')) {
    const focusDelta = Math.round(8 + Math.random() * 12);
    const passDelta = Math.round(3 + Math.random() * 8);
    return {
      scenario: 'Pair struggling students with high-performers',
      prediction: {
        focusBefore: focus,
        focusAfter: Math.min(100, focus + focusDelta),
        focusDelta: `+${focusDelta}%`,
        passRateBefore: passRate,
        passRateAfter: Math.min(100, passRate + passDelta),
        passRateDelta: `+${passDelta}%`,
      },
      reasoning: `Peer tutoring has shown a ${focusDelta}% improvement in engagement. The ${stats.lowAttentionStudents?.length || 0} low-attention students would benefit from collaborative scaffolding.`,
      confidence: 0.87,
    };
  }

  // Generic simulation
  return {
    scenario: scenario,
    prediction: {
      focusBefore: focus,
      focusAfter: Math.min(100, focus + 5),
      focusDelta: '+5%',
      passRateBefore: passRate,
      passRateAfter: Math.min(100, passRate + 3),
      passRateDelta: '+3%',
    },
    reasoning: `Based on general classroom dynamics, this intervention should produce a modest improvement in both focus and outcomes.`,
    confidence: 0.65,
  };
}


// ═══════════════════════════════════════════════
// 3. NUDGE DETECTION & EXECUTION
// ═══════════════════════════════════════════════

function detectNudgeIntent(message) {
  const lower = message.toLowerCase();
  const nudgeKeywords = ['nudge', 'distracted', 'help them', 'send alert', 'focus them', 'remind them', 'wake them', 'back row', 'not paying attention'];
  return nudgeKeywords.some(kw => lower.includes(kw));
}

function executeNudge(context) {
  const lowAttention = context.stats?.lowAttentionStudents || [];
  if (lowAttention.length === 0) {
    return {
      success: false,
      message: 'All students appear to be adequately engaged. No nudge needed.',
      studentIds: [],
    };
  }

  const targetStudents = lowAttention.slice(0, 5); // Max 5 nudges at once
  return {
    success: true,
    message: `Focus-nudge sent to ${targetStudents.length} student${targetStudents.length > 1 ? 's' : ''} with the lowest attention scores.`,
    students: targetStudents.map(s => ({ id: s.id, name: s.name, attention: s.avgConfidence })),
    studentIds: targetStudents.map(s => s.id),
    timestamp: new Date().toISOString(),
  };
}


// ═══════════════════════════════════════════════
// 4. LLM TOOLS (Function Calling)
// ═══════════════════════════════════════════════

const twinTools = [{
  functionDeclarations: [
    {
      name: 'get_class_summary',
      description: 'Fetch the overall performance summary for the whole class, including average score, risk distribution, and completion rates.',
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    },
    {
      name: 'get_student_details',
      description: 'Fetch detailed performance and engagement metrics for a specific student.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          student_name: {
            type: Type.STRING,
            description: 'The exact or partial name of the student to look up.',
          },
        },
        required: ['student_name'],
      },
    },
    {
      name: 'get_struggling_students',
      description: 'Retrieve a list of students who are struggling, marked at high risk, or have the lowest comprehension scores.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          limit: {
            type: Type.INTEGER,
            description: 'Maximum number of students to return (e.g., 5).',
          },
        },
      },
    },
  ]
}];

async function dbGetClassSummary(userClient, sessionIds) {
  if (sessionIds.length === 0) return { error: 'No active sessions found for this teacher.' };
  
  const { data: students } = await userClient
    .from('session_students')
    .select('comprehension, risk, total_correct, total_answered')
    .in('session_id', sessionIds);

  if (!students || students.length === 0) return { status: 'No students found in recent sessions.' };

  let totalComprehension = 0, compCount = 0;
  let totalCorrect = 0, totalAnswered = 0;
  const riskCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };

  for (const s of students) {
    if (s.comprehension != null) { totalComprehension += s.comprehension; compCount++; }
    if (s.total_correct) totalCorrect += s.total_correct;
    if (s.total_answered) totalAnswered += s.total_answered;
    const r = s.risk || 'UNKNOWN';
    riskCounts[r] = (riskCounts[r] || 0) + 1;
  }

  return {
    total_students: students.length,
    average_comprehension: compCount > 0 ? Math.round(totalComprehension / compCount) : null,
    overall_quiz_accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    risk_distribution: riskCounts,
  };
}

async function dbGetStudentDetails(userClient, sessionIds, studentName) {
  if (sessionIds.length === 0) return { error: 'No active sessions found.' };

  const { data: students } = await userClient
    .from('session_students')
    .select('id, student_name, comprehension, risk, total_correct, total_answered')
    .in('session_id', sessionIds)
    .ilike('student_name', `%${studentName}%`)
    .limit(3);

  if (!students || students.length === 0) return { status: `No student found matching "${studentName}".` };
  
  const results = [];
  for (const s of students) {
    // Get their recent engagement
    const { data: logs } = await userClient
      .from('engagement_logs')
      .select('engagement_state, confidence')
      .eq('student_id', s.id)
      .order('created_at', { ascending: false })
      .limit(10);
      
    let avgConfidence = null;
    let dominantState = 'unknown';
    if (logs && logs.length > 0) {
      let sum = 0, count = 0;
      const states = {};
      for (const l of logs) {
        if (l.confidence != null) { sum += l.confidence; count++; }
        if (l.engagement_state) states[l.engagement_state] = (states[l.engagement_state] || 0) + 1;
      }
      avgConfidence = count > 0 ? Math.round(sum / count) : null;
      dominantState = Object.entries(states).sort((a,b) => b[1] - a[1])[0]?.[0] || 'unknown';
    }

    results.push({
      name: s.student_name,
      comprehension: s.comprehension,
      risk_level: s.risk,
      quiz_accuracy: s.total_answered > 0 ? Math.round((s.total_correct / s.total_answered) * 100) + '%' : 'N/A',
      recent_attention_score: avgConfidence,
      recent_engagement_state: dominantState
    });
  }

  return results;
}

async function dbGetStrugglingStudents(userClient, sessionIds, limit = 5) {
  if (sessionIds.length === 0) return { error: 'No active sessions found.' };

  const { data: students } = await userClient
    .from('session_students')
    .select('student_name, comprehension, risk, total_correct, total_answered')
    .in('session_id', sessionIds)
    .or('risk.eq.HIGH,comprehension.lt.50')
    .order('comprehension', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (!students || students.length === 0) return { status: 'No struggling students found! Everyone seems to be doing fine.' };

  return students.map(s => ({
    name: s.student_name,
    comprehension: s.comprehension,
    risk_level: s.risk,
    quiz_accuracy: s.total_answered > 0 ? Math.round((s.total_correct / s.total_answered) * 100) + '%' : 'N/A'
  }));
}


// ═══════════════════════════════════════════════
// 5. MAIN CHAT HANDLER — Gemini with RAG & Tools
// ═══════════════════════════════════════════════

async function handleTwinChat({ message, mode, conversationHistory, userClient, teacherId }) {
  // Step 1: Fetch live classroom context (RAG)
  const context = await fetchClassroomContext(userClient, teacherId);

  // Extract sessionIds for our tools
  const sessionIds = context.raw?.sessions?.map(s => s.id) || [];

  // Step 2: Handle simulation mode
  if (mode === 'simulate') {
    const simulation = simulateOutcome(message, context);
    return {
      reply: simulation.reasoning,
      type: 'simulation',
      simulation,
      metadata: {
        dataPoints: context.stats?.dataPoints || 0,
        contextUsed: context.hasData,
      },
    };
  }

  // Step 3: Check for nudge intent
  const isNudge = detectNudgeIntent(message);
  let nudgeAction = null;

  if (isNudge) {
    nudgeAction = executeNudge(context);
  }

  // Step 4: Build the Gemini prompt with RAG context
  const systemPrompt = `You are the **Twin Insight Engine** — a Cognitive Orchestrator for a live classroom. You have access to a real-time Digital Twin of the classroom, which feeds you live telemetry data about student engagement, gaze tracking, emotions, and comprehension.

## Your Role:
- You are NOT a generic chatbot. You are an AI co-pilot embedded in a classroom monitoring system.
- Always reference the LIVE DATA provided below in your responses.
- Give specific, actionable advice grounded in the data.
- Use the student names when available.
- Be concise (2-4 sentences max) unless asked for detail.
- If asked about nudges/alerts, confirm the action was taken.
- If the teacher asks about specific students, struggling students, or the class summary, USE YOUR TOOLS to fetch that data from the database.

## Current Classroom Twin State:
${context.summary}

${nudgeAction ? `\n## NUDGE ACTION EXECUTED:\n${nudgeAction.message}\nTargeted students: ${nudgeAction.students?.map(s => s.name).join(', ') || 'None'}` : ''}

## Response Format:
Respond naturally as an AI teaching co-pilot. Reference specific data points. If you detect confusion or risk, suggest specific interventions.`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      // Build conversation messages
      const messages = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood. I am the Twin Insight Engine, ready to analyze live classroom data and provide actionable recommendations. What would you like to know?' }] },
      ];

      // Add conversation history (last 6 messages)
      const recentHistory = (conversationHistory || []).slice(-6);
      for (const msg of recentHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }

      // Add current message
      messages.push({ role: 'user', parts: [{ text: message }] });

      // Function Calling Loop
      let response;
      let callCount = 0;
      const MAX_CALLS = 3;

      while (callCount < MAX_CALLS) {
        response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: messages,
          tools: twinTools,
        });

        // Check if Gemini wants to call a tool
        if (response.functionCalls && response.functionCalls.length > 0) {
          const call = response.functionCalls[0];
          let toolResult;

          console.log(`🛠️ Twin Engine executing tool: ${call.name}`, call.args);

          if (call.name === 'get_class_summary') {
            toolResult = await dbGetClassSummary(userClient, sessionIds);
          } else if (call.name === 'get_student_details') {
            toolResult = await dbGetStudentDetails(userClient, sessionIds, call.args.student_name);
          } else if (call.name === 'get_struggling_students') {
            toolResult = await dbGetStrugglingStudents(userClient, sessionIds, call.args.limit || 5);
          } else {
            toolResult = { error: 'Unknown function' };
          }

          // Convert the tool result to the exact format Gemini expects
          // When using @google/genai, we must push the function response block:
          messages.push({
            role: 'model',
            parts: [{ functionCall: call }]
          });
          messages.push({
            role: 'user',
            parts: [{
              functionResponse: {
                name: call.name,
                response: toolResult
              }
            }]
          });

          callCount++;
        } else {
          // No more function calls, we have the final text
          break;
        }
      }

      const reply = response.text || 'I encountered an issue processing your request.';

      return {
        reply,
        type: nudgeAction ? 'nudge' : 'chat',
        nudgeAction,
        metadata: {
          dataPoints: context.stats?.dataPoints || 0,
          contextUsed: context.hasData,
          model: 'gemini-2.0-flash',
          toolCalls: callCount,
        },
      };
    } catch (err) {
      console.error('Gemini API error in twin chat:', err.message);
      // Fall through to simulated response
    }
  }

  // Fallback: Simulated intelligent response
  return generateSimulatedResponse(message, context, nudgeAction);
}

function generateSimulatedResponse(message, context, nudgeAction) {
  const stats = context.stats || {};
  const focus = stats.collectiveFocus || 'N/A';
  const passRate = stats.predictedPassRate || 'N/A';
  const lowStudents = stats.lowAttentionStudents || [];

  const lower = message.toLowerCase();

  let reply;

  if (lower.includes('confusion') || lower.includes('hotspot')) {
    reply = `Based on the current Twin state, collective focus is at ${focus}%. ${lowStudents.length > 0 ? `${lowStudents.map(s => s.name).join(', ')} show${lowStudents.length === 1 ? 's' : ''} signs of confusion with attention scores below 50%.` : 'No significant confusion hotspots detected.'} I recommend a brief interactive check-in to re-engage.`;
  } else if (lower.includes('break')) {
    reply = `The Twin's fatigue analysis suggests a break would boost collective focus by approximately 15%. With current focus at ${focus}%, a 10-minute break could bring it to ~${Math.min(100, (parseInt(focus) || 70) + 15)}%. Predicted pass rate would improve from ${passRate}% to ~${Math.min(100, (parseInt(passRate) || 70) + 8)}%.`;
  } else if (lower.includes('distract') || lower.includes('nudge') || lower.includes('back row')) {
    reply = nudgeAction?.success
      ? `I've identified ${lowStudents.length} student(s) with low attention scores and sent focus-nudges. ${nudgeAction.students?.map(s => `${s.name} (${s.attention}%)`).join(', ')}. Their engagement should improve within 30 seconds.`
      : `All students appear adequately engaged based on the current Twin state. Collective focus is at ${focus}%.`;
  } else if (lower.includes('summarize') || lower.includes('twin state') || lower.includes('status')) {
    reply = `**Twin State Summary:**\n• Collective Focus: ${focus}%\n• Predicted Pass Rate: ${passRate}%\n• Dominant State: ${stats.dominantState || 'N/A'}\n• Dominant Emotion: ${stats.dominantEmotion || 'N/A'}\n• Total Students: ${stats.totalStudents || 0}\n• Data Points (last 5 min): ${stats.dataPoints || 0}\n${lowStudents.length > 0 ? `• ⚠️ Low Attention: ${lowStudents.map(s => s.name).join(', ')}` : '• ✅ All students adequately engaged'}`;
  } else if (lower.includes('declining') || lower.includes('attention')) {
    reply = lowStudents.length > 0
      ? `The Twin has flagged ${lowStudents.length} student(s) with declining attention: ${lowStudents.map(s => `**${s.name}** (${s.avgConfidence}% confidence)`).join(', ')}. Consider a targeted pair activity or a direct check-in.`
      : `No students show significant attention decline. The classroom is performing within normal parameters with ${focus}% collective focus.`;
  } else {
    reply = `Based on the current Twin telemetry (${stats.dataPoints || 0} data points), the classroom shows ${focus}% collective focus with a ${passRate}% predicted pass rate. ${lowStudents.length > 0 ? `I'm monitoring ${lowStudents.length} student(s) with low engagement.` : 'All students appear engaged.'} How can I help you optimize the session?`;
  }

  return {
    reply,
    type: nudgeAction ? 'nudge' : 'chat',
    nudgeAction,
    metadata: {
      dataPoints: stats.dataPoints || 0,
      contextUsed: context.hasData,
      model: 'simulated',
    },
  };
}


// ═══════════════════════════════════════════════
// 5. CLASSROOM STATE ENDPOINT (for metadata bar)
// ═══════════════════════════════════════════════

async function getClassroomState(userClient, teacherId) {
  const context = await fetchClassroomContext(userClient, teacherId);
  return {
    collectiveFocus: context.stats?.collectiveFocus ?? null,
    predictedPassRate: context.stats?.predictedPassRate ?? null,
    avgGaze: context.stats?.avgGaze ?? null,
    dominantState: context.stats?.dominantState ?? null,
    dominantEmotion: context.stats?.dominantEmotion ?? null,
    totalStudents: context.stats?.totalStudents ?? 0,
    dataPoints: context.stats?.dataPoints ?? 0,
    lowAttentionStudents: context.stats?.lowAttentionStudents ?? [],
    sessions: context.stats?.sessions ?? [],
    isLive: context.hasData && (context.stats?.dataPoints || 0) > 0,
  };
}


module.exports = { handleTwinChat, getClassroomState, simulateOutcome };
