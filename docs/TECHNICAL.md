# Technical overview

Verdant Isles · Pass 32

This is a static HTML/JavaScript game with a custom golf simulation and Babylon.js rendering. The numbers below describe the current implementation, not a physically certified golf model.

## Code map

| Files | Responsibility |
| --- | --- |
| [index.html](../index.html), [style.css](../style.css) | Interface and controls |
| [game.js](../game.js) | Input, movement, shot flow, scorecards, and progression |
| [clubs.js](../clubs.js), [swing-meter.js](../swing-meter.js) | Club definitions, stroke ranges, and power timing |
| [physics.js](../physics.js) | Terrain queries, flight, collision, bounce, roll, and cup capture |
| [courses.js](../courses.js) and area layout modules | Tees, cups, surface regions, and terrain definitions |
| [realm.js](../realm.js), [babylon-render.js](../babylon-render.js) | Scene construction, lighting, water, and rendering |
| [crossing-mesh.js](../crossing-mesh.js) | Bridge geometry and terrain-fitted walking heights |
| [visibility.js](../visibility.js) | Distance-based visibility for placed scenery |
| [cloud-sky.js](../cloud-sky.js), [course-magic.js](../course-magic.js) | Moving clouds and ambient effects |
| [cart.js](../cart.js), [jump.js](../jump.js), [rangefinder.js](../rangefinder.js) | Exploration mechanics |

## Units and simulation

World distances use meters, with Y as the vertical axis. Club carries are defined in yards and converted using 0.9144 meters per yard. Putting ranges use feet, converted using 0.3048 meters per foot.

Ball simulation advances in fixed **1/120-second** steps. An accumulator separates physics updates from rendering frames; incoming frame time is clamped to 0.25 seconds.

## Power and flight

The power meter oscillates between 1% and 100%. Its minimum-to-maximum sweep takes 1.6 seconds for woods, 2.0 for irons, 2.5 for wedges, and 3.2 for putting.

Requested distance is:

```text
distance = configured carry × power fraction × lie factor
```

For drivers and irons hit from sand, the lie factor is **0.40**, a 60% reduction in requested carry. It is not a 60% reduction applied directly to velocity. Fairway woods, wedges, and putters do not receive this specific launch penalty; surface resistance and impact behavior still apply.

Launch height is derived from requested carry and a tuned launch angle, with additional height scaling for woods and irons. Using gravity g = 9.81 m/s², the initial vertical speed is based on sqrt(2gh), and horizontal speed on carry divided by estimated flight time.

Woods and irons receive a flight-profile adjustment. Fade and draw use signed lateral acceleration that develops during flight. This is a gameplay approximation, not a complete aerodynamic drag, spin, or Magnus-force simulation.

Non-putting shots include small randomized launch and landing variations. Wedge-specific bounce and retained horizontal speed make higher-lofted wedges stop differently from lower-lofted wedges.

## Putting and rolling

Touch, Roll, and Lag select nominal full-power flat-green ranges of **12, 35, and 150 feet**. These are game stroke strengths, not physical putter-face grooves.

Initial putting speed is:

```text
v = sqrt(2 × 0.34 × requested distance in meters)
```

Terrain slope is sampled with central differences, using a 0.035-meter offset. Rolling acceleration uses the shallow-slope approximation:

```text
acceleration = -(5/7) × g × terrain gradient
```

The 5/7 term models the rotational inertia of a rolling solid sphere. Surface resistance then reduces horizontal speed each step:

| Surface | Rolling deceleration (m/s²) |
| --- | ---: |
| Green | 0.34 |
| Fringe | 0.80 |
| Fairway | 1.05 |
| Rough | 2.10 |
| Sand | 3.40 |

These are tuned deceleration values, not dimensionless friction coefficients. Uphill and downhill putts therefore travel different distances at the same selected strength.

## Collision and cup capture

Airborne impacts use the terrain normal, surface-dependent restitution, and retained tangential velocity. Solid-object collisions use simplified horizontal boundaries with height checks.

The visible ball radius is 0.055 meters for readability. Cup capture checks the ball's path segment within 0.26 meters of the cup and requires horizontal speed below 1.75 m/s, with an additional height condition. Capture transitions into a 0.48-second drop animation. These tolerances intentionally favor playable browser golf over regulation-scale simulation.

## Terrain and rendering

Surface queries distinguish green, fringe, fairway, rough, and sand. The terrain functions support both gameplay and scene construction. Bridge approaches blend into the shore across their width, and walking heights follow the fitted surface.

Babylon renders PBR models, textured ground, shadows, water, and atmosphere. Assets are self-hosted under [assets/](../assets/), and the engine is under [vendor/](../vendor/). Blender and Python were used during asset preparation; neither is a runtime dependency.

Scenery visibility checks run every 250 ms with an 18-meter hysteresis margin to reduce repeated toggling. Hiding an object reduces rendering work but does not unload its assets.

## Problems addressed during development

- **Floating trees and rocks:** corrected placement and terrain contact instead of relying on object origin alone.
- **Cross-shaped foliage and harsh edges:** repaired alpha handling and reviewed plant placement.
- **Uneven bridges:** fitted shore connections and synchronized walking heights.
- **Water color seams:** replaced an abrupt shoreline-region switch with a continuous distance calculation.
- **Flat-looking terrain:** blended rough textures and added subtle green detail without changing golf slopes.
- **Putting that felt too weak:** tuned available stroke ranges and retained the selected strength between shots.
- **Repetitive scenery:** used placement, scale, and restrained wildlife behavior to support exploration.

## Validation and limits

The development checkout's 66 automated tests passed for this snapshot, covering clubs, terrain, shots, progression, exploration mechanics, and bridge fitting. Earlier browser checks exercised all five holes. This public static snapshot does not include that test runner or test directory, and the tests are not a guarantee of performance on every device.

All five areas currently load into memory. There is distance culling, but no section unloading or seamless asset streaming. The ocean is particularly geometry-heavy. Mobile launch failures remain unresolved, and persistent round saves are not implemented.

The next engineering priority is measurement: profile CPU/GPU time and asset memory, optimize a bounded section, and verify results before expanding the world further.
