# Pulse 369

An original browser VR fitness and rave studio created by Michael Hughes (MichaelWave369) using GPT Work on Larrina's workstation. It combines rhythm targets, music uploads, clans, shared workout rooms, training paths, missions, adaptive coach agents, achievements, and guided recovery. This project uses its own scenes, interface, choreography generator, and practice music; it does not contain Supernatural assets.

## Play

Use **Start session** to try desktop practice. Hit purple targets with A (high) / S (low) and lime targets with K (high) / L (low), or tap the on-screen pads as the targets reach you. Space or Escape pauses. The first targets arrive after a short warm-up.

Open the deployed studio in a compatible WebXR headset browser, sign in, and choose **Enter VR**. Swing or reach your left controller through purple targets and your right controller through lime targets. Boxing and martial strikes require controller movement; resting a hand on a strike target does not score. In Krav rhythm, hexagonal shields mark guard targets: meet them with the matching hand without impact velocity. Point at the floating pause or finish control and press the trigger. After a solo session, use Replay or Exit VR. There is no artificial locomotion.

The nine modes are Rave flow, Beat boxing, Krav rhythm, 369 breathing, Quiet mind meditation, Release & reset stretching, Slow flow yoga, Tai chi flow, and Qigong · Eight Brocades. Krav rhythm uses controlled Krav Maga-inspired strike and guard phrases, with grounded feet and no kicks or contact drills. Tai chi and the adapted eight-movement Baduanjin cycle use slow, mirrored hand guides. These are fitness adaptations, not assessments or certification of traditional technique.

Recovery routines are upright and can be seated. Coach avatars demonstrate seated routines from visible chairs; reach ranges shorten and lower accordingly. Gentle breathing uses 3 seconds in and 6 seconds out; the optional 369 pattern uses 3 in, 6 hold, and 9 out. Stay within a comfortable range, return to natural breathing whenever needed, and use the no-hold option freely.

## Sessions, worlds, and your crew

Choose among 40 session presets in Sessions, then customize the set in Studio. Durations are 1, 3, 5, 6, 9, 12, 15, 20, and 30 minutes. Continuous flow runs targets throughout; balanced sessions start with fewer targets and finish with a target-free cooldown. Intervals combine a warmup, 60 seconds of movement / 20 seconds of recovery, and a cooldown. All sets use the chosen uploaded or demo music.

Rave sessions have three dance styles: the original varied Free flow, rising alternating-hand Wave dance, and Open & return with close then outward reaches. Four new presets introduce these patterns at 3, 6, 9, and 15 minutes. Style-specific phrase callouts appear in the stage and VR display, with optional coach speech. The chart is identical for room peers and keeps the seated reach range and recovery intervals. Coaching responds to recent targets without changing the shared chart.

Four actual Three.js environments are included: Neon Temple with emissive arches and pillars, Orbital Rave with a planetary stage and star field, Aurora Sanctuary with procedural skies, mountains, and water, and Lantern Garden with a moonlit pavilion, glowing lanterns, bamboo, and stepping stones. Materials, lights, instanced scenery, and a procedural sky replace the original wireframe tunnel. No artificial camera travel or postprocessing is used. Lower visual motion freezes sky drift and beat brightness; breathing and hand guides still move to guide the exercise.

Nova, Atlas, Lumen, and Sage are local adaptive game agents. Sage specializes in gentle tai chi and qigong movement. The coaches demonstrate the actual approaching target positions or recovery movements, respond to the last 12 rhythm targets, combos, pauses, and planned breaks, and suggest sessions from saved timing history. Optional speech uses browser speech synthesis. Echo and Sol are clearly labeled virtual workout partners, with a choice of zero, one, or two partners. These agents are deterministic game AI, not cloud language models or conversational assistants; no model service or API key is configured, and no heart-rate readings are used for coaching decisions.

After a session, coach debriefs show recorded time, target timing, and a suggested next set. Suggestions account for early finishes, lower timing rates, longer active sets, and recent same-mode results. Comparisons describe game timing, not physical effort or form. Selecting no coach produces session notes instead. Yoga, stretching, tai chi, and qigong show movement numbers and 30-second countdowns in the studio and VR HUD. Gentle hand trails make the guide paths easier to follow; lower visual motion hides the trails. These are demonstration guides, not automatic form assessment.

## Training paths

Plans offers four ordered paths: First lights (7 sessions, 24 total minutes), Rave momentum (6 sessions, 53 minutes), Quiet practice (7 sessions, 44 minutes), and Guard & flow (6 sessions, 35 minutes). These are sessions to complete at your own pace, not daily deadlines or one continuous workout. Begin a path to save your next step to your account, then use Continue path when returning.

A path step advances only after a completed session of the correct activity with at least the full planned duration. Music, seated movement, pace, and environment can be adjusted. Partial or shorter sessions still save to personal goals, and repeating earlier steps is practice. Out-of-order claims, duplicate saves, or simultaneous completions cannot skip ahead. Progress and completion timestamps are durable; reopening a finished path does not reset it. Each path earns a unique completion achievement.

Set up with my clan prepares the next path session in clan workout setup. Session cards also have a Clan shortcut, and clan setup filters presets by activity. Personal path selection stays private and is not imposed on room peers. A matching shared workout can advance your own selected step; sharing minutes with clan goals still requires the separate contribution choice.

## Your music

Download your own Suno songs as MP3 or WAV and import them in My music. The app accepts up to 60 uploads, each under 24 MB. Audio is decoded to estimate BPM; adjust BPM and beat offset if needed. This is a BPM-driven choreography generator, not a studio-authored song map. Music repeats until the session ends. Three original synthesized practice tracks are included.

Uploads are private to their owner. A track must be explicitly enabled for room sharing before a host can use it. Only members of a room using that track can retrieve its audio. Music is streamed with HTTP byte-range support; executable or unsupported file signatures are rejected. Imported music rights remain with the uploader; no automatic Suno account connection or licensed catalog is included.

## Together

Use the studio's Share control to grant access before sending friends a room code. People sign in with ChatGPT and choose a room name in My goals. Create a room using the current session, or join by a six-character code. Everyone enables audio and marks ready before the host starts an eight-second countdown. The existing audience is preserved when publishing updates.

The server supplies one future start time, run id, track configuration, and chart seed. Local audio seeks to the shared timeline. A participant's pause is personal; Resume catches up to the room and skips targets missed while paused. Paused time does not count toward goals. Text chat and simple head/hand companion avatars are real server-backed features. Presence and poses update once a second; this is not high-frequency motion replication or voice chat. Rooms support up to 12 participants, expire after four hours, and close when the host leaves. Closed rooms are not replayed; create a new room for another shared session.

## Clans

Create a clan or join using an eight-character invite code. Accounts can belong to three clans, each with up to 48 members. Membership limits are enforced inside database writes as well as in the interface. Clans have a lasting roster, text chat, a leader, weekly active and mindful minute goals, and a completed-session goal. The leader can edit goals and the shared week timezone, remove members, or transfer leadership. A leader with other members must transfer before leaving; the final member closes the clan and invalidates its code.

Clan workouts use the existing synchronized room system with any session preset and duration. Clan rooms appear only to members, and a room code cannot bypass clan membership. A studio invite is still required before a person can use a clan code.

Choose **Contribute next workout** in Clans, or select a clan in Studio, to contribute a session's minutes and completion count. Sharing is off by default and resets after each finished workout. Clan views show only opted-in weekly aggregate totals; private session history and heart-rate summaries are never included. Joining a clan does not share older workouts, and a retry cannot retroactively change sharing consent. Leaving or removal deletes shared contributions, removes access to clan rooms, and preserves private workout records. Active clan minutes include rave, boxing, and Krav rhythm; other modes contribute mindful minutes. Every member sees the same Monday boundary in the clan's timezone, including daylight-saving changes.

## Progress

Goals cover weekly active session minutes, completed sessions, and mindful minutes, with three presets and custom targets. A saved history records complete and partial sessions, time, best combo, and VR versus desktop. Records are owned by the signed-in user. Session saves use stable ids to prevent duplicates when retried. Time and scores are client-reported; they are not biometric measurements, verified physical effort, medical outcomes, or calorie estimates.

Missions contains a 20-mission journey across five chapters and 32 achievement badges, including four training-path completion awards. The fourth chapter adds martial rhythm, tai chi, Eight Brocades, shared yoga, and clan contributions. The fifth adds Wave dance and Open & return missions that require the matching recorded dance style. Accepting a mission selects an appropriate preset. Only sessions tagged with that accepted mission, saved after acceptance, count toward its criteria; cumulative minutes and targets can include partial sessions, while completion missions require complete sessions of the specified minimum duration. Clan missions require an actual opted-in contribution. Choose Continue mission to resume after returning to the studio. You can explore the chapters in any order.

Mission completion and achievement awards are derived on the server from the user's saved sessions, with unique durable awards and retry-safe timestamps. Previous sessions can earn lifetime achievements but cannot retroactively finish an unaccepted mission. Shared-workout awards require the supplied run to match an actual room membership, start time, mode, and another participant; a solo room or invented room id does not qualify. Personal missions are not shared as room configuration. Game scores remain client-reported, so this is not an anti-cheat leaderboard.

## Custom missions

Use **Create mission** in Missions to name a personal goal, choose any activity, active or mindful movement, or a specific mode, then set a target in minutes or completed sessions. Minute targets allow 1–2,000 minutes; session targets allow 1–100 sessions. The Rave 18, Calm 9, and Move 369 buttons fill the form for review. Saving creates the mission; choosing Continue mission selects a short matching preset. You can adjust its duration, music, and seated option. Only sessions tagged with this personal mission and saved after creation count. Minute goals include matching partial workouts; session goals require completion and at least one minute. The studio shows the selected goal and whether the activity matches. Completing one and three personal missions earns two unique achievements.

Clan leaders can create shared custom missions in either mission space or the clan board. Every current member sees the aggregate progress. These count matching opted-in clan contributions recorded after creation and after the contributor joined, without exposing private session IDs or heart-rate data. A workout can contribute to all matching active goals in its selected clan. Set up group workout prepares the matching activity in clan setup; the separate contribution toggle remains off by default and resets after a workout. Membership and leadership permissions are enforced for viewing, creation, and archiving. Transferring leadership transfers mission management; leaving removes access and shared contributions. Completed shared milestones retain their completion timestamp even when membership later changes, and do not grant personal mission achievements.

Personal spaces and clans each allow 12 active custom missions, enforced atomically for concurrent creation. Completed or archived missions release a slot. Targets are fixed after creation. Archive confirmation stops new progress and preserves the mission record; later workouts still save privately. The board shows active missions first and up to 100 recent mission records. Private tags never enter shared room configuration, duplicate saves cannot reassign tags or dance styles, and personal achievement counts include the full saved mission history.

## Optional heart-rate monitor

Choose Connect monitor in Studio, then select a Bluetooth device supporting the standard Heart Rate Service (`0x180D`) and Heart Rate Measurement (`0x2A37`). This requires HTTPS, a user gesture, and a browser that implements Web Bluetooth; device and headset browser support varies. Watches without the standard service are not automatically supported. Unsupported browsers can run every workout without a monitor.

The app parses 8- and 16-bit little-endian BPM values, handles contact flags, and rejects truncated packets. Disconnection clears the display immediately, and notifications older than 10 seconds are marked stale. Live BPM appears in the studio panel and VR HUD. Paused sessions and pre-start countdowns do not contribute samples.

Save private session summary is off by default. When selected, the account can save only average / minimum / maximum BPM and sample count for the active session. No raw sensor stream or device identifier is persisted, no sensor data goes to room peers, and sensor readings do not guide the coach or produce calorie/medical interpretations. A saved summary can be removed in My goals without deleting the workout.

## Architecture

React 19 / Vinext, Three.js / WebXR, Web Audio, D1 for structured data, and R2 for audio. Platform identity headers authorize every API request. No secrets or authentication tokens are stored in browser code. Database changes are generated Drizzle migrations; runtime routes do not create tables. Private-site access stays under the Sites platform policy.

The component catalog supplies tabs, select controls, toggles, sliders, progress, and removal confirmation. The studio includes responsive touch controls, lower visual motion, a seated reach range, keyboard controls, and optional spoken recovery cues. Experimental browser WebMCP tools can read or configure a session when supported; their presence is feature-detected.

## Verify

Run `node node_modules/typescript/bin/tsc --noEmit` and `node scripts/verify-game.mjs`. Build with the Sites build helper, then run `node scripts/verify-studio.mjs` against the built Worker. The integration test uses temporary Miniflare D1/R2 resources and separate test identities, not production records.

Verified: 81 game and sensor checks plus 130 Worker integration checks. Coverage includes deterministic wave/groove and strike/guard charts, recent-target coaching, private and shared custom mission criteria, concurrent mission capacity, archiving, style-specific awards, aggregate privacy, stationary guard versus moving strike collisions, seated reaches, bounded mindful hand guides and countdowns, the eight-movement cycle, breath phases, interval breaks, full 30-minute maps, adaptive coaching and debriefs, mission and path criteria, pause accounting, cancellation, standard sensor packets, the notification/disconnection path, opt-in summaries and deletion, identity, idempotent awards, two-user synchronization, real shared-run credit, clan access and role enforcement, private versus opted-in contributions, canonical save retries, leadership transfer, removal and private-data preservation, concurrent membership and path progress, ordered path completion and unique awards, timezone/DST boundaries, uploads, byte ranges, private audio, and server-rendered controls.

Not physically verified: GPU rendering in a headset, comfort and ergonomics, haptics, headset browser sign-in, Bluetooth permission prompts or a physical monitor, or real network audio drift. Browser UI/WebMCP QA was unavailable in this workspace because the required browser-control skill was absent. A real-device playthrough is needed before treating this as a production fitness release or app-store headset application.
