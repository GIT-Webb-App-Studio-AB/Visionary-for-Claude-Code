# Reaction Diffusion

**Category:** extended
**Motion tier:** Kinetic

## Typography
- **Display font:** Space Mono — scientific notation for biological processes
- **Body font:** Space Mono Regular
- **Tracking:** 0em | **Leading:** 1.5

## Colors
- **Background:** #000000 (generated — algorithm determines visual field)
- **Primary action:** #FFFFFF (concentration high)
- **Accent:** #000000 (concentration low)
- **Elevation model:** none — the pattern IS the surface

## Motion
- **Tier:** Kinetic
- **Spring tokens:** N/A — continuous Turing pattern simulation
- **Enter animation:** pattern emerges from noise over 2–4 seconds; UI elements overlay
- **Forbidden:** static backgrounds, CSS-only patterns, fixed color beyond monochrome base

## Spacing
- **Base grid:** 8px for UI overlay; 1px for canvas simulation
- **Border-radius vocabulary:** 0px for UI chrome; organic patterns from algorithm

## Code Pattern
```javascript
// Gray-Scott model — recommended parameters for spot patterns
const feed = 0.055;
const kill = 0.062;
const Da = 1.0;   // diffusion rate A
const Db = 0.5;   // diffusion rate B
const dt = 1.0;

// Each frame: apply Laplacian convolution + reaction terms
// A' = A + (Da * lapA - A*B*B + feed*(1-A)) * dt
// B' = B + (Db * lapB + A*B*B - (kill+feed)*B) * dt
```

## Slop Watch
- Gray-Scott requires double-buffering (read from buffer A, write to buffer B, swap) — single-buffer updates cause race conditions in the convolution
- Feed/kill parameter space is extremely sensitive: changing feed by 0.005 can shift from spots to stripes to labyrinthine patterns; document the values used
