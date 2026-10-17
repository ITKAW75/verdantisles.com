# Verdant Isles

A walkable, browser-based golf adventure across five connected islands.

**[Play Verdant Isles](https://verdantisles.com)** · [Technical overview](docs/TECHNICAL.md) · [Asset credits](CREDITS.md)

## Why I built it

I built Verdant Isles to learn by making something I wanted to play. Golf gave me a familiar starting point; building a world around it gave me a reason to explore AI-assisted development, HTML, CSS, JavaScript, 3D assets, lighting, physics, and game design.

I used ChatGPT and Codex throughout development to help write code, investigate problems, and iterate. I directed the design through playtesting: changing a shot's feel, checking an island from another angle, spotting floating objects, and deciding what helped the experience. This project is a record of that learning process, including the trade-offs and things still to improve.

The idea stayed simple: hit the ball, walk to it, and enjoy the journey. No minimap, a small interface, and enough exploration to make the walk part of the game.

— Kristian Weeks

## The game

- Five connected holes, from a pirate landing to forest ruins and a timber cabin.
- A 14-club bag with club-specific flight, fade/draw selection, and a timed power meter.
- Rolling putts that respond to slope, surface resistance, and selected stroke strength.
- Bunkers, elevation changes, scorecards, and automatic progression to the next tee.
- Discoverable speed, jump, cart-mode, and rangefinder power-ups.
- Moving clouds, waves, wildlife, and restrained magical effects.

| Hole | Course area | Par |
| --- | --- | --- |
| 1 | Smuggler's Green | 3 |
| 2 | Elder Sanctuary | 3 |
| 3 | Sunken Keep | 5 |
| 4 | Highland Return | 5 |
| 5 | Timberglass Cove | 4 |

## Play

Use a desktop browser with WebGL enabled.

**WASD / arrow keys** to walk. **Drag** to look around. Walk to the ball and choose **Play ball**, select a club, aim, and stop the power meter to hit. Putts follow the terrain.

Desktop is the current focus. Mobile support is unfinished, and the detailed scene can be demanding on lower-powered hardware.

## Built with

| Part | Technology |
| --- | --- |
| Interface | HTML and CSS |
| Game logic | JavaScript ES modules |
| Rendering | Babylon.js 9.30.0 / WebGL |
| Models | GLB assets, including prepared photogrammetry scans |
| Materials | PBR textures, normal maps, and custom shaders |
| Simulation | Custom fixed-step flight, bounce, and rolling code |
| Hosting | Static files on GitHub Pages |
| Development tools | Node.js, Python asset utilities, and Blender |

The game runs in the browser. There is no application server, database, or build step required to serve this repository.

## Run locally

Download the repository, open a terminal in its top-level folder, and serve it with any static HTTP server. For example, if Python is installed:

```sh
python -m http.server 8000
```

Then open **http://localhost:8000**. Use a local server rather than double-clicking `index.html`, because the game loads JavaScript modules and assets.

## Explore the code

Start with [game.js](game.js) for the player and round flow, [clubs.js](clubs.js) for club tuning, and [physics.js](physics.js) for ball simulation.

The [technical overview](docs/TECHNICAL.md) explains the module layout, equations, rendering choices, and problems encountered along the way.

This repository currently contains the playable Pass 32 snapshot. The development checkout also has asset-preparation tools and a 66-test regression suite; those tools and tests are not part of this static publication snapshot.

## What I learned

Getting an asset into a scene is only the beginning. Terrain contact, scale, texture transparency, collision boundaries, and how an island looks from the next hole all matter.

The biggest lessons came from repeated playtesting: preserving good mechanics while changing scenery, keeping visible terrain consistent with movement and ball physics, and recognizing when more geometry was hurting performance rather than improving the experience.

## What's next

- Profile rendering and reduce the cost of distant scenery and water.
- Investigate the mobile launch issue and test a lighter scene.
- Explore loading and unloading course sections as the world grows.
- Continue refining placement, course readability, and the feel of play.

These are development goals, not features already implemented.

## Feedback

Found a bug or have an idea? [Open an issue](https://github.com/ITKAW75/verdantisles.com/issues). Include the hole, what happened, your browser, and a screenshot if possible. For performance issues, hardware details help too.

## Credits and reuse

The environment combines original game code with third-party assets. See [CREDITS.md](CREDITS.md) for sources and licenses.

This project is not affiliated with or endorsed by PING. Club names and loft references inform the game design; carry distances and shot behavior are game tuning, not real-world fitting advice.

Third-party assets retain their respective licenses. A license for the original project code has not yet been selected.
