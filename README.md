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
