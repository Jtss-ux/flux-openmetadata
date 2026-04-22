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
  const [messages, setMessages]     = useState([
    {
      role: 'assistant',
      text: 'GREAT SCOTT! I am FLUX:// — your Conversational Metadata Navigator, powered by the OpenMetadata MCP Server.\n\nI can search data assets, trace lineage, check data quality, and surface governance policies. Ask me anything about your data catalog.',
      tool: null,
    }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState({
    entities: '—',
    lineage:  '45,102',
    quality:  '98.2%',
    drift:    '0.004s',
  })
  const chatEndRef = useRef(null)

  /* Scroll to bottom on new message */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Fetch live entity count from sandbox */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await searchEntities('*')
        const count = res?.hits?.total?.value
        if (count !== undefined) {
          setStats(prev => ({ ...prev, entities: count.toLocaleString() }))
        }
      } catch {/* sandbox may be rate-limited; keep placeholder */}
    }
    fetchStats()
  }, [])

  const handleSend = async (text = query) => {
    const q = text.trim()
    if (!q || isProcessing) return

    setMessages(prev => [...prev, { role: 'user', text: q, tool: null }])
    setIsProcessing(true)
    setQuery('')

    try {
      const intent = await processUserQuery(q)
      if (intent.message) {
        /* Show AI reaction immediately */
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: intent.message,
          tool: intent.tool,
        }])
      }

      // If it's just a greeting, we already showed the message. We can stop here.
      if (intent.type === 'GREETING') {
        setTimeout(() => setIsProcessing(false), 300)
        return
      }

      /* Execute the metadata or chat action */
      const result = await intent.action()
      let reply = ''
      
      if (intent.type === 'GENERAL_CHAT') {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (!apiKey) {
          reply = "I am FLUX://, your OpenMetadata navigator! I currently operate within the boundaries of your data catalog. (To enable general conversational AI, add `VITE_GEMINI_API_KEY` to your environment variables)."
        } else {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `You are FLUX://, a retro-futuristic data navigator chatbot. Keep your response concise and slightly sci-fi themed. The user says: ${result}` }] }]
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
        }])
        setIsProcessing(false)
      }, 600)

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '⚠ TEMPORAL PARADOX DETECTED — Unable to reach the OpenMetadata sandbox. The flux capacitor may need recalibrating.\n\nTip: Make sure `npm run dev` is running so the /api proxy is active.',
        tool: null,
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
            <span className="footer-item">BUFFER: 1.21GW</span>
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

  if (type === 'DISCOVERY' || type === 'GENERAL') {
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
  return (
    <div className="glass-panel stat-box">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${color}`}>{value}</span>
    </div>
  )
}

function ChatMessage({ msg }) {
  const isBot = msg.role === 'assistant'
  const lines = (msg.text || '').split('\n')
  /* Detect if message contains a JSON/code block */
  const hasCode = msg.text && msg.text.includes('{')

  return (
    <div className={`bubble-wrap ${isBot ? 'bot' : 'user'}`}>
      <div className={`bubble ${isBot ? 'bot' : 'user'}`}>
        <span className="bubble-tag">{isBot ? 'Flux Navigator' : 'Temporal User'}</span>

        {lines.map((line, i) => (
          <span key={i} style={{ display: 'block' }}>
            {line || '\u00A0'}
          </span>
        ))}

        {msg.tool && (
          <div className="tool-badge">
            <Zap size={8}/>
            {msg.tool}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingPulse() {
  return (
    <div className="loading-wrap">
      <div className="loading-bubble">
        <div className="dot-row">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
        <span className="loading-text">CALIBRATING TIME VESTIBULE…</span>
      </div>
    </div>
  )
}

export default App
