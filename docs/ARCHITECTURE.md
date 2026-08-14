# GIGAH\RUSH — Architecture Specification

## 1. DDA Raycasting Math
Digital Differential Analyzer steps through the 128³ toroidal voxel grid in $\mathcal{O}(D)$ time.

$$\Delta x = \sqrt{1 + \left(\frac{\text{rayDirY}}{\text{rayDirX}}\right)^2}, \quad \Delta y = \sqrt{1 + \left(\frac{\text{rayDirX}}{\text{rayDirY}}\right)^2}$$

## 2. Samosbor Atmospheric Cellular Automata
Purple gas density propagates through adjacent voxel cells using 3D diffusion matrices with airlock boundary conditions.
