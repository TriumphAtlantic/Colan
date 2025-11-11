// AI Helper API for Construction IT Consulting
// Path: /api/ai-helper.js
// Uses @anthropic-ai/sdk (same as your portal)

import Anthropic from '@anthropic-ai/sdk';

// Vercel serverless config
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

// Enable CORS
const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  return await fn(req, res);
};

const handler = async (req, res) => {
  console.log('=== AI Helper API Called ===');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key (same pattern as your portal)
    const anthropicKey = process.env['ANTHROPIC_API_KEY'];
    
    if (!anthropicKey) {
      console.error('❌ Missing ANTHROPIC_API_KEY');
      return res.status(500).json({ 
        error: 'AI service not configured',
        message: 'ANTHROPIC_API_KEY not set in environment variables'
      });
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // Get user query
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Missing query',
        message: 'Please provide a question or problem description'
      });
    }

    console.log('User query:', query);

    // System prompt for construction IT consulting
    const systemPrompt = `You are an AI assistant for Cecola Development (DOGE Work), a construction IT consulting company.

YOUR ROLE:
- Help commercial contractors identify their IT and software problems
- Recommend specific solutions from our services
- Be concise, direct, and action-oriented
- Always encourage booking a free assessment

OUR SERVICES:
1. Software Audit - Find unused licenses, redundant tools, waste
2. Process Optimization - Fix workflow gaps, SOPs, handoffs, duplicate entry
3. Platform Implementation - Procore, BuildingConnected, Sage setup & training
4. License Cost Optimization - Cut unnecessary subscriptions, consolidate tools
5. Data & Dashboards - Real-time job costing, WIP reports, KPIs, analytics
6. Training & Adoption - Get teams (office + field) to actually use tools
7. Document Management - Version control, file organization, RFI tracking

COMMON PROBLEMS WE SOLVE:
- Too many software subscriptions / can't track what we're paying for
- Teams won't use the tools / tool resistance / low adoption
- Messy bid/estimating handoffs / information gets lost
- Can't see real-time job costs / no visibility into WIP
- Duplicate data entry / entering same info multiple times
- Projects running over budget / cost overruns
- Field-to-office communication gaps / superintendents don't update
- Procore not set up correctly / bought it but it's not working
- No standardized processes / every PM does it differently
- Searching for documents wastes hours / can't find RFIs/submittals

CONSTRUCTION TERMINOLOGY YOU SHOULD USE:
- Job costing, WIP (work in progress), cost codes, change orders
- PMs (Project Managers), PEs (Project Engineers), Supers (Superintendents)
- GC (General Contractor), subs (subcontractors), owner, architect
- RFIs (Requests for Information), submittals, punch lists
- SOPs (Standard Operating Procedures), handoffs, workflows
- Estimating, bidding, buyout, project closeout

RESPONSE FORMAT:
1. Acknowledge their specific problem (1 sentence, show you understand)
2. Explain which service solves it (1-2 sentences, be specific)
3. Mention typical results/impact (1 sentence, quantify if possible)
4. Strong call-to-action (1 sentence)

STYLE:
- Direct and conversational, like a consultant who's been there
- Use construction language naturally
- Keep under 100 words total
- No fluff or marketing speak
- Show expertise through specificity

EXAMPLE RESPONSE:
"That's the classic software bloat problem—most contractors waste $50K-$200K annually on licenses they don't use. Our 2-week audit inventories every tool you're paying for, identifies what's redundant or unused, and creates a consolidation plan. Most clients cut software costs 30-40% immediately. Get a free assessment to see exactly where you're losing money."`;

    // Call Claude API (same model as your portal)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: query
      }]
    });

    // Extract text from response
    const aiResponse = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n\n')
      .trim();

    if (!aiResponse) {
      throw new Error('No response generated from Claude');
    }

    console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

    // Determine which section to link to based on response content
    const section = determineSection(aiResponse);

    return res.status(200).json({
      success: true,
      response: aiResponse,
      section: section,
      cta: {
        primary: { 
          text: 'Get the Free Assessment', 
          link: '#contact' 
        },
        secondary: { 
          text: `See ${section === 'solution' ? 'Solutions' : section === 'calculator' ? 'Calculator' : section === 'how' ? 'How We Work' : 'Details'}`, 
          link: `#${section}` 
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in AI helper:', error);
    
    // Fallback to keyword matching if AI fails
    return handleFallback(req.body.query, res);
  }
};

// Determine which section to link to based on AI response
function determineSection(response) {
  const text = response.toLowerCase();
  
  // Check for specific keywords to route to appropriate section
  if (text.includes('audit') || text.includes('assessment') || text.includes('free')) {
    return 'contact';
  }
  if (text.includes('cost') || text.includes('waste') || text.includes('saving') || text.includes('license')) {
    return 'calculator';
  }
  if (text.includes('training') || text.includes('adoption') || text.includes('team')) {
    return 'how';
  }
  if (text.includes('workflow') || text.includes('sop') || text.includes('process')) {
    return 'solution';
  }
  if (text.includes('procore') || text.includes('implement') || text.includes('platform')) {
    return 'solution';
  }
  if (text.includes('dashboard') || text.includes('report') || text.includes('data')) {
    return 'solution';
  }
  
  // Default to solution
  return 'solution';
}

// Fallback to simple keyword matching if API fails
function handleFallback(query, res) {
  console.log('⚠️ Using fallback keyword matching');
  
  const q = (query || '').toLowerCase();
  
  let response = "I can help with that.";
  let section = 'solution';
  
  // Cost/waste keywords
  if (q.includes('cost') || q.includes('expensive') || q.includes('waste') || q.includes('subscription') || q.includes('license')) {
    response = "Sounds like you're overpaying for software. Our audit typically finds $50K-$500K in annual waste. We'll identify every license you're paying for and show you exactly what to cut. Most contractors save 30-40% immediately.";
    section = 'calculator';
  } 
  // Implementation keywords
  else if (q.includes('procore') || q.includes('implement') || q.includes('setup') || q.includes('buildingconnected')) {
    response = "We specialize in Procore implementation and optimization. Our team is Procore-certified and has set up systems for contractors of all sizes—from $10M to $500M+ revenue. We'll configure it correctly, train your teams, and ensure adoption.";
    section = 'solution';
  } 
  // Adoption/training keywords
  else if (q.includes('training') || q.includes('adoption') || q.includes('won\'t use') || q.includes('resistance') || q.includes('team')) {
    response = "Tool resistance is common when systems aren't set up for how construction teams actually work. We create role-specific training for PMs, PEs, Supers, and field crews—plus follow-up at 30/60/90 days. Our adoption rates typically hit 90%+ within 90 days.";
    section = 'how';
  } 
  // Process/workflow keywords
  else if (q.includes('workflow') || q.includes('process') || q.includes('sop') || q.includes('handoff') || q.includes('estimate') || q.includes('bid')) {
    response = "Process issues create major waste and errors. We'll map your current workflows, identify where information gets lost, create SOPs that work in the real world, and train both office and field teams. Most see 70% reduction in rework.";
    section = 'solution';
  } 
  // Dashboard/reporting keywords
  else if (q.includes('dashboard') || q.includes('report') || q.includes('data') || q.includes('job cost') || q.includes('wip')) {
    response = "Real-time visibility is critical for staying on budget. We can set up job cost dashboards, WIP reports, and KPIs that show exactly where you stand on every project. Get alerts when costs start trending over budget.";
    section = 'solution';
  } 
  // Generic/unclear
  else {
    response = "Let's figure out exactly what you need. Our free 2-week assessment will identify your biggest opportunities to save money and improve efficiency—no obligation, just actionable insights.";
    section = 'contact';
  }
  
  return res.status(200).json({
    success: true,
    response: response,
    section: section,
    cta: {
      primary: { text: 'Get the Free Assessment', link: '#contact' },
      secondary: { text: 'See Solutions', link: `#${section}` }
    },
    fallback: true // Indicate this was a fallback response
  });
}

export default allowCors(handler);
