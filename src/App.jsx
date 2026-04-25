import { useState, useEffect, useRef } from 'react'
import {
  Search, Database, Network, Shield,
  MessageSquare, Zap, Clock, Send, Radio,
  Activity, BarChart2
} from 'lucide-react'
import { processUserQuery } from './utils/ai-processor'
import { searchEntities } from './api/openmetadata'
import './index.css'

/* ── Suggested starter queries ────────────────────────────────────────────── */
const SUGGESTIONS = [
  'Find tables related to customer data',
  'Show me all dashboards',
  'Search for revenue metrics',
  'List tables with PII data',
  'Find sales pipeline data',
]

/* ─────────────────────────────────────────────────────────────────────────── */
function App() {
  const [query, setQuery]           = useState('')
  const [activeNav, setActiveNav]   = useState('chat')
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "GOOD MORNING, MCFLY! The temporal circuits are prime for early discovery. I am FLUX:// — your Conversational Metadata Navigator."
    if (hour < 18) return "GOOD AFTERNOON! The flux capacitor is at 88% capacity and climbing! I am FLUX:// — your Conversational Metadata Navigator."
    return "GREAT SCOTT! It's getting late in the timeline! I am FLUX:// — your Conversational Metadata Navigator, powered by the OpenMetadata MCP Server."
  }

  const [messages, setMessages]     = useState(() => {
    const saved = localStorage.getItem('flux_chat_history');
    if (saved) return JSON.parse(saved);
    return [{
      role: 'assistant',
      text: getGreeting() + '\n\nI can search data assets, trace lineage, check data quality, and surface governance policies. Ask me anything about your data catalog.',
      tool: null,
      ts: Date.now(),
    }];
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState({
    entities: '---',
    lineage:  '---',
    knowledgeNodes: '---',
    quality:  '98.2%',
    drift:    '0.000s',
  })
  const chatEndRef = useRef(null)

  /* Scroll to bottom & sync local storage on new message */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    localStorage.setItem('flux_chat_history', JSON.stringify(messages))
  }, [messages])

  const fetchStats = async () => {
    // 1. Fetch Entity count from OpenMetadata Sandbox
    try {
      const res = await searchEntities('*')
      const count = res?.hits?.total?.value
      if (count !== undefined) {
        setStats(prev => ({ ...prev, entities: count.toLocaleString() }))
      }
    } catch {/* sandbox may be rate-limited; keep placeholder */}

    // 2. Fetch RAG stats from local engine
    const startTime = performance.now();
    try {
      const res = await fetch('/api/rag_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'stats' })
      });
      const duration = (performance.now() - startTime) / 1000;
      const data = await res.json();
      if (data && !data.error) {
        // Dynamic quality score simulation based on real node count and usage
        const baseQuality = 98.0;
        const searchImpact = (data.searchCount || 0) * 0.01;
        const variance = ((data.knowledgeNodes % 100) / 100) + searchImpact; 
        const quality = Math.min(99.9, baseQuality + (variance % 1.9)).toFixed(1) + '%';
        
        setStats(prev => ({ 
          ...prev, 
          knowledgeNodes: data.knowledgeNodes?.toLocaleString() || prev.knowledgeNodes,
          lineage: data.lineageLinks?.toLocaleString() || prev.lineage,
          drift: duration.toFixed(3) + 's',
          quality: quality
        }));
      }
    } catch (err) {
      console.warn('[Stats] Failed to fetch RAG stats:', err);
    }
  }

  /* Fetch live stats from sandbox and local RAG engine */
  useEffect(() => {
    fetchStats()
  }, [])

  const handleSend = async (text = query) => {
    const q = text.trim()
    if (!q || isProcessing) return

    setMessages(prev => [...prev, { role: 'user', text: q, tool: null, ts: Date.now() }])
    setIsProcessing(true)
    setQuery('')

    try {
      const intent = await processUserQuery(q)
      // Refresh stats after every query to show activity
      fetchStats();
      if (intent.message) {
        const msgText = typeof intent.message === 'function' ? intent.message(q) : intent.message;
        /* Show AI reaction immediately */
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: msgText,
          tool: intent.tool,
          ts: Date.now(),
        }])
      }

      // If it's just a greeting or feeling, we already showed the message. We can stop here.
      if (intent.type === 'GREETING' || intent.type === 'FEELINGS') {
        setTimeout(() => setIsProcessing(false), 300)
        return
      }

      /* Execute the metadata or chat action */
      const result = await intent.action()
      let reply = ''
      
      if (intent.type === 'GENERAL_CHAT' || intent.type === 'DOCUMENTATION') {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
        if (!apiKey) {
          reply = "I am FLUX://, your OpenMetadata navigator! I currently operate within the boundaries of your data catalog. (To enable general conversational AI or RAG documentation, add `VITE_GEMINI_API_KEY` to your environment variables)."
        } else {
          try {
            let promptText = `You are FLUX://, a retro-futuristic data navigator chatbot. Keep your response concise, helpful, and slightly sci-fi themed. The user says: "${q}"`;
            
            if (intent.type === 'DOCUMENTATION') {
              const docsContext = result.map(doc => `[Source: ${doc.docTitle || doc.title || doc.url}]\n${doc.text || doc.markdown || doc.content}`).join('\n\n');
              promptText += `\n\nHere is some documentation retrieved from the database that might be relevant:\n${docsContext}\n\nPlease answer the user's query. Use the provided documentation if it is relevant and reliable, but also feel free to use your own broad knowledge if needed to give the best answer. Cite the sources if you use the provided documentation.`;
            }

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                tools: [{ googleSearch: {} }]
              })
            })
            const data = await res.json()
            reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "My language processors are experiencing interference."
          } catch (e) {
            reply = "I encountered temporal interference while trying to process that conversational request."
          }
        }
      } else {
        reply = formatResult(result, intent.type, q)
      }

      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: reply,
          tool: intent.tool,
          data: intent.type === 'GENERAL_CHAT' ? null : result,
          ts: Date.now(),
        }])
        setIsProcessing(false)
      }, 600)

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '⚠ TEMPORAL PARADOX DETECTED — Unable to reach the OpenMetadata sandbox. The flux capacitor may need recalibrating.\n\nTip: Make sure `npm run dev` is running so the /api proxy is active.',
        tool: null,
        ts: Date.now(),
      }])
      setIsProcessing(false)
    }
  }

  return (
    <div className="app-root scanline">

      {/* ── Sidebar ── */}
      <aside className="glass-panel sidebar">
        <div className="sidebar-logo">
          <div className="flux-core">
            <div className="flux-y" />
            <div className="flux-y" />
            <div className="flux-y" />
            <div className="pulse-ring" />
          </div>
          <h1>FLUX://<span className="text-neon-cyan glitch-text">01</span></h1>
        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">
          {[
            { id: 'chat',    icon: <MessageSquare size={16}/>, label: 'TEMPORAL CHAT' },
            { id: 'search',  icon: <Search        size={16}/>, label: 'DISCOVERY'     },
            { id: 'lineage', icon: <Network       size={16}/>, label: 'LINEAGE'        },
            { id: 'quality', icon: <Activity      size={16}/>, label: 'OBSERVABILITY'  },
            { id: 'govern',  icon: <Shield        size={16}/>, label: 'GOVERNANCE'     },
          ].map(n => (
            <a
              key={n.id}
              className={`nav-item ${activeNav === n.id ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(n.id)
                if (n.id !== 'chat') {
                  const prompts = {
                    search:  'Find tables related to sales data',
                    lineage: 'Show lineage for a data asset',
                    quality: 'Show data quality test results',
                    govern:  'Show governance policies',
                  }
                  handleSend(prompts[n.id])
                  setActiveNav('chat')
                }
              }}
            >
              {n.icon}
              <span>{n.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Flux compression bar */}
          <div className="flux-bar-wrap">
            <div className="flux-bar-header">
              <span className="flux-bar-label">FLUX COMPRESSION</span>
              <span className="flux-bar-status">ACTIVE</span>
            </div>
            <div className="flux-bar-track">
              <div className="flux-bar-fill" />
            </div>
            <div className="flux-bar-ghost"><Zap size={52}/></div>
          </div>

          <div className="status-row">
            <div className="status-col">
              <span className="status-key">TIME VARIANCE</span>
              <span className="status-val">+0.0004s</span>
            </div>
            <div className="status-dot" />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">

        {/* Stats row */}
        <header className="stats-row">
          <StatBox label="ENTITIES SCANNED" value={stats.entities} color="cyan"    />
          <StatBox label="LINEAGE LINKS"    value={stats.lineage}   color="magenta" />
          <StatBox label="KNOWLEDGE NODES"  value={stats.knowledgeNodes} color="neon" />
          <StatBox label="QUALITY SCORE"    value={stats.quality}   color="orange"  />
          <StatBox label="TEMPORAL DRIFT"   value={stats.drift}     color="white"   />
        </header>

        {/* Chat panel */}
        <main className="glass-panel chat-panel">
          <div className="chat-bg-icon"><Clock size={110}/></div>

          {/* Messages */}
          <div className="chat-messages scrollbar-hide">
            {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
            {isProcessing && <LoadingPulse />}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions (only before first user msg) */}
          {messages.length === 1 && (
            <div style={{ padding: '0 1.25rem 0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  style={{
                    background: 'rgba(0,255,255,0.05)',
                    border: '1px solid rgba(0,255,255,0.2)',
                    borderRadius: '4px',
                    color: 'rgba(0,255,255,0.7)',
                    fontSize: '0.62rem',
                    fontFamily: '"Orbitron", monospace',
                    letterSpacing: '0.08em',
                    padding: '0.35rem 0.65rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-bar">
            <div className="chat-input-wrap">
              <input
                className="chat-input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="INPUT TEMPORAL QUERY…"
                disabled={isProcessing}
              />
              <button
                className="chat-send-btn"
                onClick={() => handleSend()}
                disabled={isProcessing || !query.trim()}
                aria-label="Send message"
                title="Send (Enter)"
              >
                <Send size={20}/>
              </button>
            </div>
          </div>
        </main>

        {/* Footer bar */}
        <footer className="glass-panel footer-bar">
          <div className="footer-items">
            <span className="footer-item">SYSTEM: ONLINE</span>
            <span className="footer-item cyan">MCP: CONNECTED</span>
            <span className="footer-item" style={{color: 'rgba(0,255,255,0.35)'}}>
              {messages.length} MSG{messages.length !== 1 ? 'S' : ''}
            </span>
            <button 
              className="footer-item" 
              onClick={() => { localStorage.removeItem('flux_chat_history'); window.location.reload(); }} 
              style={{background: 'transparent', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', cursor: 'pointer', borderRadius: '4px', padding: '0 6px', fontSize: '0.6rem'}}
              title="Clear chat history from local storage"
            >
              CLEAR LOCAL DB
            </button>
          </div>
          <div className="footer-items">
            <span className="footer-item">LATENCY: 12ms</span>
            <span className="footer-item orange">BROWN-OUT PROTECTION: ON</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatResult(result, type, originalQuery) {
  if (!result) return 'No data found in the metadata timeline for this query.'

  if (['DISCOVERY', 'GENERAL', 'QUALITY', 'GOVERNANCE', 'PIPELINE', 'DASHBOARD'].includes(type)) {
    const hits = result?.hits?.hits || []
    if (!hits.length) {
      return `No entities found matching "${originalQuery}" in the OpenMetadata catalog. Try a broader term.`
    }
    const total = result?.hits?.total?.value ?? hits.length
    const list = hits.slice(0, 6).map(h => {
      const s = h._source || {}
      return `• ${s.name || s.displayName || 'Unknown'}  [${s.entityType || 'entity'}]${s.description ? '\n  ' + s.description.slice(0, 90) : ''}`
    }).join('\n')

    return `Found ${total.toLocaleString()} entities. Top results:\n\n${list}`
  }

  if (type === 'LINEAGE') {
    // The lineage API returns the entity + edges (upstreamEdges / downstreamEdges)
    // Nodes may be absent even when the call succeeds (sandbox has no ingested lineage)
    const entity   = result?.entity
    const upstream  = result?.upstreamEdges   || []
    const downstream = result?.downstreamEdges || []
    const nodes    = result?.nodes            || []

    // If we got back an entity object, show what we know
    if (entity?.name || entity?.fullyQualifiedName) {
      const fqn  = entity.fullyQualifiedName || entity.name
      const type = entity.type || 'entity'
      const upCount   = upstream.length
      const downCount = downstream.length
      const nodeCount = nodes.length

      if (upCount === 0 && downCount === 0) {
        return `Lineage scan complete for ${type}: "${fqn}"

• Upstream sources:   0  (no ingested lineage in this sandbox)
• Downstream targets: 0
• Total nodes:        ${nodeCount}

ℹ️  This entity exists in the catalog but has no lineage edges recorded yet. In a production OpenMetadata instance, lineage is auto-populated by dbt, Airflow, Spark, or manual tagging during ingestion.`
      }

      const upList   = upstream.slice(0,4).map(e => `  ↑ ${e.fromEntity?.fqn || e.fromEntity?.id || 'source'}`).join('\n')
      const downList = downstream.slice(0,4).map(e => `  ↓ ${e.toEntity?.fqn || e.toEntity?.id || 'target'}`).join('\n')

      return `Lineage graph for "${fqn}" [${type}]

Upstream (${upCount}):
${upList || '  none'}

Downstream (${downCount}):
${downList || '  none'}

Total graph nodes: ${nodeCount}`
    }

    // Fallback: lineage call failed or returned nothing — pivot to discovery
    const hits = result?.hits?.hits || []
    if (hits.length) {
      const list = hits.slice(0, 5).map(h => {
        const s = h._source || {}
        return `• ${s.name || s.displayName || 'Unknown'}  [${s.entityType || 'entity'}]`
      }).join('\n')
      return `Found ${hits.length} related entities (lineage API returned no graph for this query):\n\n${list}\n\nTip: Try searching by exact table name for lineage, e.g. "lineage for dim_customer"`
    }

    return 'No lineage data found. The OpenMetadata sandbox uses sample data with minimal lineage configuration. Try a production instance with dbt or Airflow ingestion enabled.'
  }

  return JSON.stringify(result, null, 2).slice(0, 600)
}

function StatBox({ label, value, color }) {
  // Simple animated counter effect on mount
  const [displayVal, setDisplayVal] = useState(0)
  const numericMatch = typeof value === 'string' ? value.replace(/,/g, '').match(/[\d.]+/) : null
  const target = numericMatch ? parseFloat(numericMatch[0]) : null

  useEffect(() => {
    if (target === null || isNaN(target)) {
      setDisplayVal(value)
      return
    }
    let start = 0
    const duration = 1500 // 1.5s boot sequence
    const startTime = performance.now()

    const animate = (currTime) => {
      const elapsed = currTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = Math.floor(progress * target)
      
      // Format back with the same suffix/prefix if needed, or just format number
      let formatted = current.toLocaleString()
      if (typeof value === 'string') {
        if (value.includes('%')) formatted += '%'
        if (value.includes('s') && !value.includes('s')) formatted += 's'
      }
      
      // Add 's' suffix if it was in the original
      if (typeof value === 'string' && value.endsWith('s')) formatted += 's'
      if (typeof value === 'string' && value.includes('.')) {
        // Keep decimals for things like drift
        formatted = (progress * target).toFixed(value.split('.')[1]?.length || 1)
        if (value.endsWith('s')) formatted += 's'
        if (value.endsWith('%')) formatted += '%'
      }

      setDisplayVal(formatted)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayVal(value)
      }
    }
    requestAnimationFrame(animate)
  }, [value, target])

  return (
    <div className="glass-panel stat-box glitch-hover">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${color}`}>{displayVal}</span>
    </div>
  )
}

function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i))
      i += 3 // 3 chars at a time for fast retro feel
      if (i > text.length + 3) {
        clearInterval(timer)
      }
    }, 15)
    return () => clearInterval(timer)
  }, [text])

  const lines = displayed.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <span key={i} style={{ display: 'block' }}>
          {line || '\u00A0'}
        </span>
      ))}
    </>
  )
}

function ChatMessage({ msg }) {
  const isBot = msg.role === 'assistant'
  const timeStr = msg.ts ? new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const isRecent = msg.ts && (Date.now() - msg.ts < 5000)

  // Only typewrite if it's a bot message AND it's less than 5 seconds old (new message)
  const shouldTypewrite = isBot && isRecent

  return (
    <div className={`bubble-wrap ${isBot ? 'bot' : 'user'}`}>
      <div className={`bubble ${isBot ? 'bot' : 'user'}`}>
        <span className="bubble-tag">
          {isBot ? 'Flux Navigator' : 'Temporal User'}
          {timeStr && <span style={{ marginLeft: '0.5rem', opacity: 0.5 }}>{timeStr}</span>}
        </span>

        {shouldTypewrite ? (
          <TypewriterText text={msg.text || ''} />
        ) : (
          (msg.text || '').split('\n').map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {line || '\u00A0'}
            </span>
          ))
        )}

        {msg.tool && (
          <div className="tool-badge active-tool">
            <Zap size={8}/>
            {msg.tool}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingPulse() {
  const phrases = [
    "CALIBRATING TIME VESTIBULE…",
    "ROUTING THROUGH MCP WORMHOLE…",
    "BYPASSING MAINFRAME SECURITY…",
    "ACCESSING TEMPORAL ARCHIVES…",
    "SCANNING OPENMETADATA FABRIC…",
  ]
  const [text, setText] = useState(phrases[0])

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % phrases.length;
      setText(phrases[i])
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="loading-wrap">
      <div className="loading-bubble">
        <div className="dot-row">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
        <span className="loading-text glitch-text">{text}</span>
      </div>
    </div>
  )
}

export default App
