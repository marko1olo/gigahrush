# 🏢 GIGAH\RUSH — 2.5D DDA Raycaster & Toroidal Voxel Samosbor Engine

[![Live Surface](https://img.shields.io/badge/Live_Showcase-GitHub_Pages-e11d48?style=for-the-badge&logo=github)](https://marko1olo.github.io/gigahrush/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-22c55e?style=for-the-badge&logo=pwa)](https://marko1olo.github.io/gigahrush/manifest.json)
[![AI Index](https://img.shields.io/badge/LLM_Search-llms.txt-38bdf8?style=for-the-badge)](https://marko1olo.github.io/gigahrush/llms.txt)
[![C++23](https://img.shields.io/badge/C%2B%2B-23-00599C?style=for-the-badge&logo=cplusplus)](https://isocpp.org/)
[![OpenGL](https://img.shields.io/badge/OpenGL-4.6_Core-5586A4?style=for-the-badge&logo=opengl)](https://www.opengl.org/)

A high-speed 2.5D DDA (Digital Differential Analyzer) raycaster and toroidal 128³ voxel atmospheric simulator exploring the infinite Soviet megastructure of Samosbor, purple gas diffusion mechanics, and lock-free chunk memory management.

---

## 🏛️ Raycasting & Cellular Automata Pipeline

```mermaid
graph LR
    Camera[Player Vector & FOV Cone] -->|DDA Step| Grid[Toroidal 128³ Voxel Grid]
    Grid -->|Wall / Texture Hit| Render[Vertical Scanline Texture Mapper]
    Gas[Purple Gas Automata] -->|Cellular Diffusion| Fluid[Atmospheric Pressure Field]
    Fluid -->|Hazard Fog| Shading[Distance Attenuation & Dithering]
    Render --> Framebuffer[Direct Pixel Buffer Blit]
    Shading --> Framebuffer
```

---

## 🔬 Technical Highlights

- **Fast DDA Raycasting:** Sub-millisecond wall traversal with exact Euclidean distance correction (zero fish-eye distortion).
- **Lock-Free Chunk Storage:** Cache-line aligned linear arrays for toroidal voxel traversal without heap fragmentation.
- **Atmospheric Cellular Automata:** Real-time gas density propagation, airlock pressure equalization, and hazard radar sweeps.

---

### 👨‍💻 Lead Architect
**Адольф Петушков (Adolf Petushkov)** — Game Engine Internals & Systems Engineering.  
GitHub: [@marko1olo](https://github.com/marko1olo)
