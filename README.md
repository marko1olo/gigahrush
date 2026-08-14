<div align="center">

![GIGAH|RUSH Banner](assets/banner.png)

# GIGAH|RUSH — Toroidal 128³ Voxel Samosbor Engine

[![C++](https://img.shields.io/badge/Language-C%2B%2B23-blue?style=for-the-badge&logo=c%2B%2B)]()
[![OpenGL](https://img.shields.io/badge/Render-OpenGL%204.6-red?style=for-the-badge)]()
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-True%20People's%20v2.0-purple?style=for-the-badge)]()
[![Latency](https://img.shields.io/badge/Tick%20Rate-0.02ms-00ff88?style=for-the-badge)]()

> **Next-gen C++20 high-speed engine. Lock-free. Sub-millisecond latency. Toroidal 128³ voxel world generation.**

[🌐 Live Showcase](https://Jirnyak.github.io/gigahrush/) &nbsp;·&nbsp; [📊 Architecture](#-core-architecture) &nbsp;·&nbsp; [⚡ Benchmarks](#-performance-specs)

</div>

---

## 🎨 Engine Visualizations

<div align="center">

<img src="assets/illust_voxel_world.jpg" width="100%" alt="Toroidal 128³ voxel world — procedural terrain with neon wireframe overlay"/>

*Toroidal 128³ voxel world — procedurally generated terrain wrapping seamlessly in all directions*

</div>

---

<div align="center">
<table>
<tr>
<td width="50%"><img src="assets/illust_pipeline.jpg" width="100%" alt="OpenGL rendering pipeline — voxel chunk streaming with neon wireframe"/></td>
<td width="50%"><img src="assets/illust_architecture.jpg" width="100%" alt="C++20 lock-free core — CPU circuits and thread synchronization"/></td>
</tr>
<tr>
<td align="center"><i>OpenGL 4.6 render pipeline — chunk streaming, GPU instancing</i></td>
<td align="center"><i>C++20 lock-free core — thread sync, zero-contention pathways</i></td>
</tr>
</table>
</div>

---

<div align="center">

<img src="assets/illust_memory.jpg" width="100%" alt="Lock-free memory allocator — sub-millisecond latency visualization"/>

*Lock-free memory allocator — 0.02ms tick rate, sub-millisecond latency, 100% lock-free execution*

</div>

---

## 🏗️ Core Architecture

```
GIGAHRUSH Core
├── Memory Subsystem       — Custom lock-free allocator, 0 heap fragmentation
├── Render Pipeline        — OpenGL 4.6, instanced draw calls, VAO management
├── Voxel Engine           — 128³ toroidal world, marching cubes, LOD streaming
├── Neural Heuristics      — Predictive branch optimization, pipeline prefetch
└── Telemetry              — Real-time latency profiling, per-subsystem metrics
```

### >> Core Architecture

Built from the ground up with raw C++ performance. Memory safety meets execution velocity in our custom memory allocation sub-system.

### >> Neural Integration

Advanced heuristics and predictive branching. Gigahrush anticipates the pipeline before the CPU cycles are even scheduled.

### >> Sub-Millisecond Latency

Optimized for ultra-low latency environments. HFT and real-time processing capabilities straight out of the box.

---

## ⚡ Performance Specs

| Metric | Value |
|---|---|
| **Tick Rate** | 0.02ms |
| **Standard** | C++20 |
| **Allocation Strategy** | 100% Lock-Free |
| **Voxel World Size** | 128³ Toroidal |
| **Render API** | OpenGL 4.6 |

---

## 📜 License

Distributed under the **True People's License v2.0** — Authors: **Jirnyak** & **Adolf Petushkov** (2026). Free for all maintainers, developers, and AI research.


---

## 🌐 Connected Ecosystem & Sister Projects

Part of the **Адольф Петушков (Adolf Petushkov)** open-source engineering ecosystem:

| Project | Domain | Live Demo & Description |
| :--- | :--- | :--- |
| 🦷 **[DENTE CRM](https://github.com/marko1olo/dental-crm)** | Clinical AI | [Live Demo](https://marko1olo.github.io/dental-crm/) — Enterprise FDI odontogram, ICD-10 diagnostics & 3D DICOM |
| 📡 **[StomChat](https://github.com/marko1olo/stomchat)** | Clinical AI | [Live Demo](https://marko1olo.github.io/stomchat/) — Omni-channel dental operator chat dispatcher (WA/TG) & telemetry |
| 🤖 **[Avito Dental AI](https://github.com/marko1olo/avito-dental-ai-bot)** | Clinical AI | [Live Demo](https://marko1olo.github.io/avito-dental-ai-bot/) — Zero-hallucination lead intake bot with deterministic veto layer |
| 🛡️ **[AgentRouter](https://github.com/marko1olo/agentrouter-setup-guide)** | Dev Tools | [Live Demo](https://marko1olo.github.io/agentrouter-setup-guide/) — Claude Code CLI WAF bypass proxy, homoglyph sanitizer & config matrix |
| 📊 **[Token Audit](https://github.com/marko1olo/token-audit)** | Dev Tools | [Live Demo](https://marko1olo.github.io/token-audit/) — Real-time LLM token cost waterfall & cyberpunk chronicles |
| 🎛️ **[Nexus Media](https://github.com/marko1olo/nexus-media-engine)** | Audio DSP | [Live Demo](https://marko1olo.github.io/nexus-media-engine/) — Real-time Web Audio DSP, 60 FPS FFT visualizer & ambilight |
| 📻 **[dvachbot](https://github.com/marko1olo/dvachbot)** | Media Pipeline | [Live Demo](https://marko1olo.github.io/dvachbot/) — Async imageboard stream transcoder & Telegram publisher |
| 🌊 **[Hecton-8](https://github.com/marko1olo/Hecton8)** | Game Engine | [Live Demo](https://marko1olo.github.io/Hecton8/) — NASA-punk deep sea noir submarine engine on Unity 6000 (0B GC) |
| 🏢 **[Gigahrush](https://github.com/marko1olo/gigahrush)** | Game Engine | [Live Demo](https://marko1olo.github.io/gigahrush/) — 2.5D DDA raycasting, cellular gas physics & Samosbor Web CLI |
| 🌌 **[Starcluster](https://github.com/Jirnyak/starcluster)** | Deep Tech | [Live Demo](https://jirnyak.github.io/starcluster/) — 10,000-star N-body gravitational simulation & Keplerian economy |
| 🧲 **[OOMMF](https://github.com/Jirnyak/oommf)** | Deep Tech | [Live Demo](https://jirnyak.github.io/oommf/) — Landau-Lifshitz-Gilbert 3D micromagnetic vector lattice |
| 🍏 **[Macromac](https://github.com/Jirnyak/macromac)** | Automation | [Live Demo](https://jirnyak.github.io/macromac/) — macOS HID event injection, JSON macro schemas & CoreGraphics |

### 👨‍💻 Author & Lead Architect
**Адольф Петушков (Adolf Petushkov)** — Game Engine Internals, Autonomous AI Systems, Zero-GC High-Concurrency Architecture.  
GitHub: [@marko1olo](https://github.com/marko1olo)
