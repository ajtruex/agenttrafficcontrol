# TODO: Calming Control Room MVP v1

## Phase 0: Scaffold (30–45 min)

- [ ] Initialize Next.js project: `npx create-next-app@latest calming-control-room --ts --eslint --tailwind`
- [ ] Install dependencies: `npm install zustand` and `npm install -D @types/offscreencanvas`
- [ ] Create directory structure:
  - [ ] `app/` (page.tsx, globals.css)
  - [ ] `components/` (RadarCanvas.tsx, MetricsBar.tsx, WorkTable.tsx, ControlBar.tsx)
  - [ ] `lib/` (types.ts, constants.ts, rng.ts, simBridge.ts)
  - [ ] `workers/` (engine.worker.ts)
  - [ ] `public/audio/` (placeholder for v1+1)
- [ ] Set up Worker build config in next.config.js

## Phase 1: Red Thread First Pixel (30–60 min)

- [ ] Create `lib/simBridge.ts`:
  - [ ] Define SimMsg union type (snapshot, tick, deps_cleared, start_item, complete_item)
  - [ ] Define SimIntent union type (set_running, set_plan, set_seed, set_speed, request_snapshot)
  - [ ] Implement Worker transport abstraction
- [ ] Create `workers/engine.worker.ts` bootstrap:
  - [ ] Init function with plan stub and seed
  - [ ] Emit initial `{type:'snapshot', state}` message
  - [ ] Implement tick loop emitting `{type:'tick', tick_id, ...}`
  - [ ] Handle intents from UI (set_running, request_snapshot)
- [ ] Create Zustand store:
  - [ ] Store shape: {items, agents, metrics, seed, running, tick_id}
  - [ ] Reducers for snapshot, tick diffs, intents
  - [ ] Batching logic (~100–200ms throttle)
- [ ] Create `app/page.tsx`:
  - [ ] Initialize Worker and simBridge
  - [ ] Connect store to Worker messages
  - [ ] Render minimal layout: tick counter display + Run/Pause button
- [ ] Validate end-to-end:
  - [ ] Visible tick counter incrementing on start
  - [ ] Run/Pause toggle works
  - [ ] No console errors

## Phase 2: Real Items & Table (MVP Core)

- [ ] Create `lib/types.ts`:
  - [ ] Status type ('queued' | 'assigned' | 'in_progress' | 'blocked' | 'done')
  - [ ] WorkItem interface with all fields from spec
  - [ ] Agent interface with position/motion state
  - [ ] ProjectMetrics interface
  - [ ] AppState interface
- [ ] Create `lib/constants.ts`:
  - [ ] COST_PER_TOKEN_USD = 0.000002
  - [ ] MAX_CONCURRENT = 12
  - [ ] V_MIN = 0.002, V_MAX = 0.010
  - [ ] TRAIL_DECAY = 0.08
  - [ ] RING_COUNT = 5
  - [ ] SECTORS and SECTOR_COLORS
- [ ] Implement state machine in Worker:
  - [ ] Item spawn → queued
  - [ ] Dependency resolver: queued → assigned when deps cleared
  - [ ] Start cadence: assigned → in_progress (Poisson stagger)
  - [ ] Tick loop: update tps (wobble), tokens_done, eta_ms
  - [ ] Completion: in_progress → done, trigger flare, delete agent
- [ ] Implement metrics calculations:
  - [ ] active_agents = count agents
  - [ ] total_tokens = sum item.tokens_done
  - [ ] total_spend_usd = total_tokens \* COST_PER_TOKEN_USD
  - [ ] live_tps = sum tps for in_progress items
  - [ ] live_spend_per_s = live_tps \* COST_PER_TOKEN_USD
  - [ ] completion_rate = done_count / eligible_count
- [ ] Create `components/WorkTable.tsx`:
  - [ ] Columns: ID | Sector | Status | Tokens (done/est) | TPS (cur / min–max) | ETA | Deps | Agent
  - [ ] Sort by status then ID
  - [ ] Status color chips
  - [ ] Sector badges
  - [ ] Truncate long deps lists (+n more)
  - [ ] Live updates from store
- [ ] Create `components/MetricsBar.tsx`:
  - [ ] Display: Active Agents, Total Tokens, Total Spend ($USD), Live TPS, Live Spend/sec, Completion Rate %
  - [ ] Large text counters (no charts in v1)
  - [ ] Auto-update from store
- [ ] Implement dependency resolver in Worker:
  - [ ] Detect cycles via DFS; warn and break edge if found
  - [ ] Mark items eligible when all deps satisfied
  - [ ] Compute eligible_count for completion rate denominator
- [ ] Acceptance test:
  - [ ] Start plan spawns items in table
  - [ ] Statuses progress over time (queued → assigned → in_progress → done)
  - [ ] Metrics counters update and stay in sync
  - [ ] Active agents count matches in_progress items

## Phase 3: Plans & Seeds (Determinism)

- [ ] Create `lib/rng.ts`:
  - [ ] Implement seeded PRNG (xorshift or mulberry32)
  - [ ] Deterministic randomization throughout
- [ ] Create plan generators in Worker:
  - [ ] **Calm**: 12 items, 2 sectors (Planning, Build), shallow deps (A1→A2, B1→B2...)
  - [ ] **Rush**: 28 items, 4 sectors, parallel branches, shorter estimates, higher tps variance
  - [ ] **Web**: 20 items, 3 sectors, diamond dependency graph
- [ ] Implement dynamic TPS wobble:
  - [ ] Each in_progress item: tps = clamp(min, max, tps + noise) per tick
  - [ ] Use PRNG (Perlin-lite or AR(1)) for bounded wobble
  - [ ] Map tps to agent speed v linearly into [V_MIN, V_MAX]
- [ ] Add URL seed parameter:
  - [ ] Parse `?seed=` query param on page load
  - [ ] Default to 'auto' if not provided
  - [ ] Restart plan when seed changes
- [ ] Persist controls in localStorage:
  - [ ] Selected plan, seed, speed multiplier
- [ ] Create `components/ControlBar.tsx`:
  - [ ] Run/Pause toggle
  - [ ] Plan dropdown (Calm/Rush/Web)
  - [ ] Seed text input + apply button
  - [ ] Speed selector (×1, ×2, ×3)
- [ ] Acceptance test:
  - [ ] Given fixed seed & plan, ordering of starts & completions is reproducible
  - [ ] Metrics computed match deterministic expectations
  - [ ] Plan restart on seed/plan change resets state properly

## Phase 4: Radar Basics (Canvas Rendering)

- [ ] Create `components/RadarCanvas.tsx`:
  - [ ] Initialize `<canvas>` with fullscreen sizing
  - [ ] useRef for canvas and offscreen buffer
  - [ ] devicePixelRatio clamp ≤ 2
- [ ] Implement radar static layer (offscreen canvas):
  - [ ] Draw 4–5 concentric rings
  - [ ] Add faint tick marks
  - [ ] Blit to main canvas each frame (static caching)
- [ ] Draw center glyph:
  - [ ] Subtle outlined square (checkbox)
- [ ] Implement agent rendering:
  - [ ] Only show agents for items in `in_progress`
  - [ ] Draw rotated triangle arrow for each agent
  - [ ] Short, fading trail (use globalAlpha decay 0.08 per frame)
  - [ ] Agent label: `agent_id / work_item_id` (small text)
- [ ] Implement agent motion:
  - [ ] Spawn at random angle on rim: (cos θ, sin θ)
  - [ ] Cubic Bézier path with tangentially perturbed control points
  - [ ] Progress param advances each frame based on agent speed v
  - [ ] Add small lateral noise for life
- [ ] Implement speed mapping:
  - [ ] v = lerp(V_MIN, V_MAX, (tps - tps_min) / (tps_max - tps_min))
  - [ ] Update agent position each frame based on dt and v
- [ ] Implement completion flare:
  - [ ] When agent reaches center, emit `complete_item` event
  - [ ] Draw 200–400ms expanding ring animation (easing out)
  - [ ] Tick center checkbox briefly
  - [ ] Remove agent from display
- [ ] Implement sector color coding:
  - [ ] Map agent color by item.sector using SECTOR_COLORS
- [ ] Optimize rendering:
  - [ ] requestAnimationFrame loop reads shallow store snapshot
  - [ ] Avoid forcing React re-render each frame
  - [ ] Apply state diffs to store at throttled cadence (100–200ms)
- [ ] Acceptance test:
  - [ ] In-progress items appear on radar
  - [ ] Agents move toward center smoothly
  - [ ] Only in_progress is visualized (queued/assigned/blocked hidden)
  - [ ] Completion flare plays
  - [ ] At least 55fps with 12 concurrent agents

## Phase 5: Polish & Testing

- [ ] Performance optimization:
  - [ ] Motion buffer with decaying trails (globalAlpha 0.08)
  - [ ] Cull agents outside view bounds
  - [ ] Auto-reduce trail length if FPS < 45
  - [ ] Auto-reduce max concurrent if FPS < 45
- [ ] Radar enhancements:
  - [ ] Agent label fade when near/far from center
  - [ ] Hide labels on crowding (grid occupancy check)
  - [ ] Implement legend showing sectors and colors
  - [ ] Label truncation if too long
- [ ] Error handling:
  - [ ] Detect cycles in deps via DFS; warn and break edge
  - [ ] Handle missing dep IDs: treat as unmet, keep queued
  - [ ] Clamp NaN/Infinity TPS to [tps_min, tps_max]
  - [ ] State desync recovery: request full snapshot
  - [ ] Debounce canvas resize, redraw static layer
- [ ] Unit tests (Vitest):
  - [ ] Status transitions given deps and starts
  - [ ] TPS wobble boundedness
  - [ ] tps → speed mapping correctness
  - [ ] Metrics calculations (tokens, spend, completion_rate)
  - [ ] Dependency resolver and cycle detection
  - [ ] PRNG determinism
- [ ] Integration tests (Playwright):
  - [ ] App boots, receives snapshot, tick counter increments
  - [ ] Run/Pause toggle works
  - [ ] Plan dropdown changes plan and restarts
  - [ ] Seed parameter works and is reproducible
  - [ ] Speed multiplier affects motion and tick cadence
  - [ ] Table populates and updates in sync with radar
  - [ ] Metrics stay in sync with table state
  - [ ] Snapshot handshake works
  - [ ] Out-of-order tick messages ignored by tick_id
  - [ ] No runtime errors for 10 minutes under Rush plan
- [ ] Browser testing:
  - [ ] Fullscreen on desktop
  - [ ] Maintain ≥55fps with 12 concurrent agents
  - [ ] Responsive to window resize
- [ ] Optional v1+1 features (if time):
  - [ ] Lo-fi audio player (Howler.js) with crossfade
  - [ ] Screenshot/WebM record button
  - [ ] Sector filter chips
  - [ ] TPS sparklines

## Acceptance Criteria (v1)

- [ ] Red thread: UI receives snapshot, tick indicator visible and incrementing; Run/Pause toggle works
- [ ] Table-first: Plan spawns items; table populates; statuses progress; metrics update
- [ ] Radar: In-progress items move toward center; labels visible; completion flare plays
- [ ] Stability: No console errors for 10 minutes under Rush plan
