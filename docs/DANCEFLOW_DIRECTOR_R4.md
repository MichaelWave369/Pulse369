# DanceFlow R4: Dance Director

**Experimental authored animation layer, not motion capture or clinical fitness assessment.**

## Goal
The DanceFlow instructor now uses recognizable visual movement styles and choreographic transitions, rather than showing the same torso/legs with only the wrists changing.

## Styles
R4 derives style from the existing R0/R2 movement vocabulary without changing `pulse369.choreography.v1` JSON:

| Cue style | Direction | Decorative body motion |
| --- | --- | --- |
| groove | HOUSE GROOVE | Small sideways shoulder/hip rhythms and a loose upper-body bounce |
| funk | FUNK POPS | Emphatic elbow placement, lowered torso, staccato pulses |
| disco | DISCO SHAPES | Upright pose, diagonal shoulder/arm silhouette |
| gentle | EASY FLOW | Neutral quiet figure in class warm-up/cooldown |

These are **illustrated teaching cues**. They are **not measured, calibrated dance technique**, biomechanical models, or mandatory lower-body exercise instructions. All styles visually plant their feet and remain inside a bounded instructor diagram. A viewer can dance standing in place or use a seated adaptation.

## Phrase transitions
- `sampleDirectedPose` blends both body posture and hand gestures between adjacent authored counts using the proven R3 beat easing. If an R2 chart crosses from groove to funk between phrases, the instructor finishes the gesture/style transition by the next count rather than popping into a new pose.
- Two-count and one-count **coming-up** reminders use authored phrase boundaries. No machine-learning prediction or music analysis is involved.
- Both the R2 creator and R1 class/Quest coach reuse the director's deterministic model. Local songs and the manual BPM/offset continue driving the same Web Audio timeline.
- Performance expression is **Subtle** or **Showtime**. This is purely visual. **Reduced Motion** makes the coach hold each count statically without rhythmic sway/interpolation.

## Preserved constraints
- R0/R1/R2 functionality, local MP3/WAV file handling, import/export format, audio privacy and existing score gates remain intact.
- Quest hand controller proximity continues to match the **original static authored target rings**, *not* the new decorative skeletal styling. It is not a new exercise/dance grading system.
- No cameras, body tracking, foot tracking, fitness/calorie/heart rate interpretation, pose recording, song recording, analytics or cloud sync.
- The original authenticated Pulse369 application is separate. Real headset QA and physical comfort testing are still required.

## Automated and manual acceptance
- `node --test portal/dance-director.test.mjs`: distinct silhouettes, continuous motions across 8-count style changes, planted feet, expression levels, reduced motion, phrase reminders, and the R1/R2 integration contract.
- Existing `motion-coach.test.mjs`, `dance-class.test.mjs`, `choreo-model.test.mjs` and portal Vite build also execute in the CI workflow.
- Verify on desktop that creator R2 step 7 transitions toward step 8/phrase 2 without snapping, and that the banner changes from HOUSE GROOVE to FUNK POPS at phrase 2. Try 96/112/128 BPM.
- In R1, verify warm-up and cooldown show EASY FLOW while imported/custom song dance phase shows the correct authored style. Check 3/5/10 minute modes and seated/standing adaptations.
- Test reduced motion at each style and the Subtle/Showtime toggle. Watch out for flashing, visual discomfort, or unexpected motion, and simplify further if it bothers the wearer.
- Quest Browser: manually check visual occlusion, consistent avatar world-space scaling, repeated enter/exit and safe ring access. Passing CI is not real Quest acceptance.

## Next
True dance education needs original expert-authored choreographic sequences, meaningful footwork instructions with accessible seated alternatives, and later optional *hardware-proven* tracking. A procedural instructor is a helpful visual starting point, not a substitute for a dance teacher.
