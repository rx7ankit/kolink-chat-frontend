# How premium SaaS launch films are built — notes for v3

I can't watch video, so these notes come from written breakdowns, case studies and practitioner guides.
Each technique says where it comes from and whether it fits koLink: a calm, editorial, pistachio-paper
brand built around a transit map.

## Techniques

| # | Technique | Where it comes from | Fit for koLink |
|---|---|---|---|
| 1 | **The camera does every transition, one action at a time.** No intro cards: the camera zooms into the action, whip-pans between screens and holds on the payoff, with a readable hold on each shot. Every shot must move the story forward ("because the user does X, the product does Y"). | Lago's write-up of building Linear-style launch films (no voiceover, no stock footage, real UI only) — [getlago.com/blog/we-killed-our-motion-design-job](https://getlago.com/blog/we-killed-our-motion-design-job) | **Yes.** It is the spine of v3: every shot ends on a reading hold. |
| 2 | **Screens bleed off the frame** instead of floating like small cards, and alternate aspect ratios reframe on a focal point instead of cropping blindly. | Same Lago/Linear rules | **Yes.** Macro shots and the 9:16 recompose. |
| 3 | **Animate at the speed of perception.** Short words shown one at a time, each held for about 5–7 frames to 1 beat, near reading speed. | Motionographer on Apple's "Don't Blink" — [motionographer.com](https://motionographer.com/2016/09/14/4-ways-dont-blink-is-a-masterclass-of-type-and-rhythm/) | **Yes.** The hook. |
| 4 | **Animate the signified.** The word does what it means: "re-engineered" gets re-engineered. | "Don't Blink" | **Yes.** "Missed replies" loses its letters, "200" counts up, "once" stays single while everything else multiplies, and the word "inbox" *becomes* the inbox. |
| 5 | **Time as a character / speed ramps.** Vary the tempo, melt into slow motion as a transition, then cut abruptly to a minimal frame. | "Don't Blink"; speed-ramp guidance (ramp to call attention to one moment, or as a transition) | **Yes.** Speed-ramped camera rides and pull-backs, plus a hard cut from chaos to calm paper. |
| 6 | **Break the plane.** Keep most of the film flat, then move into z-space once for emphasis and return. | "Don't Blink" (a jump into z-space to interrupt dense specs) | **Yes.** The transit map tilts into perspective for one POV ride, then flattens again. |
| 7 | **Hero reveal → details → context.** A slow entry, then macro detail shots, then the product in use. Light lines drawn along edges guide the eye. | Manfrotto's breakdown of Apple-style product films — [manfrotto.com](https://www.manfrotto.com/global-en/stories/how-to-shoot-cinematic-tech-videos-like-apple/) | **Partly.** Macro push-ins on Publish, ✓ Delivered and the ₹ price, each followed by a pull-back. A gentle light sweep on the green pill. No dramatic dark lighting (off-brand). |
| 8 | **Macro close-up, then pull back** to the whole thing. | Dyson WashG1 launch (close-up of the cleaner head, then pull back to the full machine), via Moonb's roundup — [moonb.io](https://www.moonb.io/blog/product-launch-video) | **Yes.** The single "price?" bubble pulls back to reveal a wall of forty. |
| 9 | **Exploded view "from the inside out".** Parts float apart in depth, then snap back together. | Meta Quest 3 launch (Moonb roundup); "exploded interface plane" UI components (21st.dev) | **Yes, once.** The Instagram post separates into header, media, comment and reply layers while the keyword is matched. |
| 10 | **Cursor choreography over real UI.** A cursor moves among real designs and drives the interface. | Figma Motion launch (Moonb roundup); Linear's real-interface walkthroughs | **Yes.** An eased cursor with hover states and click ripples on Publish, Send me the link and Send. |
| 11 | **Rack focus / depth of field.** For flat 2D layers, simulate it by animating blur on separate foreground and background layers over time. | ProVideo Coalition's simulated rack-focus composites; Apple Motion's focus behavior — [provideocoalition.com](https://www.provideocoalition.com/simulated_rack_focus_composites/amp) | **Yes.** The headline sharp over blurred UI, then the focus pulls to the UI. "What if you posted *once*?" pulls into focus word by word. |
| 12 | **Match cuts at peak speed.** Cut between elements while they move fastest, aligned in shape, position or direction. | Square brand motion guidance and motion-design skill guides | **Yes.** The Publish button becomes the POST capsule, the composer pill grows out of a row of tiles, legend shapes morph into one another, and the inbox diamond becomes the wipe. |
| 13 | **Activation motif.** Shapes touch and set each other off in a chain that fills the frame. | Figma Config 2024 open film (Relay + Chad Colby) — [itsnicethat.com](https://www.itsnicethat.com/features/figma-config-2024-identity-graphic-design-spotlight-090724) | **Yes.** The 8 channel tiles knock into each other in a chain and collapse into one line, which becomes the composer. |
| 14 | **Variable-font kinetic type.** Animate the weight axis continuously, per character, with stagger. Inter is a common choice. | FontLab "Variable fonts in motion and UI"; Framer variable-font components | **Yes.** Inter is variable on Google Fonts (`wght@100..900`): words slam in at 600–700 and relax to the brand's Light 300 on the beat. |
| 15 | **Mosaic / tile grids**, cropped interface fragments and list items ticking through line by line. | Raycast launch (highlighted emoji-tile grid, actions ticking line by line), via Moonb | **Yes.** A 4×2 channel grid, a wall of forty identical questions, and a callback later: the agent answers that same question once. |
| 16 | **Grain as texture,** done cheaply (Linear's mobile launch page uses CSS grain, not video). | Retros study of Linear's mobile launch | **Light touch.** A static paper grain on the background, matching the landing page's "paper" grain option. No animated noise (it fights H.264 and the calm brand). |
| 17 | **Cut on 2/4/8-beat phrases and put the biggest visual on the drop.** | Beat-sync editing guides | **Yes.** Already the v2 spine. Kept. |

**Rejected as off-brand:** glowing dark UI (Raycast/Pixel style), neon light sweeps, purple gradients,
character animation, AI-generated 3D worlds (Vercel Ship), and teal-and-orange grades.

## Picked for v3

1. A POV camera that rides the line in z-space (techniques 6, 5, 1)
2. Rack focus / depth of field (11)
3. An exploded UI (9)
4. Speed ramps (5)
5. Variable-weight kinetic type that animates the signified (3, 4, 14)
6. Macro close-ups that pull back, with cursor choreography (7, 8, 10)
7. Mosaic resolve and activation chain (13, 15)
8. Match cuts on shapes, plus a light sweep and paper grain as finish (12, 7, 16)
