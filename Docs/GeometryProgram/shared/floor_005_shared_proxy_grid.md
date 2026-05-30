# Shared Tool: Proxy Grids

Purpose: bounded math on coarse grids before stamping into the 1024x1024 `World`.

Recommended module:

- `src/gen/proxy_grid.ts`

Supported sizes:

- 16x16 or 32x32: macro tiles and route descriptors
- 64x64 or 128x128: graph search, Potts domains, path entropy
- 128x128 or 256x256: tensor fields, erosion, reaction diffusion, fog fields

Required features:

- toroidal coordinate conversion
- seeded deterministic sampling
- protected mask support
- raster stamping helpers
- descriptor extraction

Forbidden:

- saving proxy grids
- full-world candidate loops
- hidden renderer state

Validation:

- proxy-to-world conversion wraps correctly
- protected masks block rasterization
- deterministic from seed
