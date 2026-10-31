---
name: vgpu
description: >-
  Build, debug, test, and optimize WebGPU projects using vgpu, its CLI, or @vgpu
  packages. Use for vgpu API questions, WGSL workflows, browser or Node rendering,
  integrations, testing, performance work, and Blender asset modeling, baking,
  and runtime integration. Treat the documentation bundled with the target project's
  installed vgpu package as the authority for that project.
---

# vgpu Agent Skill

This skill guides AI agents in building, troubleshooting, testing, and optimizing WebGPU applications using `vgpu` (Vercel Labs), `@vgpu` packages, and WGSL shader modules.

---

## 1. Core Principle: Local Package Authority

This skill is intentionally **version-neutral**. Treat the documentation bundled directly inside the target project's installed `vgpu` package as the single source of truth:

* Do **not** guess or infer API shapes from remembered training APIs or remote git branches when local package docs exist.
* Verify what version is installed in the target project's `package.json` or lockfile (`pnpm-lock.yaml`, `package-lock.json`, etc.).
* Consult the bundled documentation directly through the local CLI tools.

---

## 2. Local CLI Discovery & Documentation Commands

When querying docs, diagnostics, or error codes, execute the project-local `vgpu` binary using the repository's active package manager. Avoid bare global execution when project-local packages are available:

* **pnpm:** `pnpm exec vgpu docs <subcommand>`
* **npm:** `npm exec --no -- vgpu docs <subcommand>`
* **bun:** `bun x --no-install vgpu docs <subcommand>`
* **yarn:** `yarn exec vgpu docs <subcommand>`

### Key Documentation Commands
* **Inspect Version:**
  ```bash
  pnpm exec vgpu --version
  ```
* **Browse or Read a Doc Topic / Symbol:**
  ```bash
  pnpm exec vgpu docs cat "<topic, symbol, or relative path>"
  ```
  *Examples:*
  ```bash
  pnpm exec vgpu docs cat getting-started.md
  pnpm exec vgpu docs cat Surface
  ```
* **Find Symbols, Topics, or Error Codes:**
  ```bash
  pnpm exec vgpu docs find "<term or error code>"
  ```
* **Grep Documentation Content:**
  ```bash
  pnpm exec vgpu docs grep -i "<query>"
  ```
* **Start Local Read-Only MCP Server:**
  ```bash
  pnpm exec vgpu mcp
  ```

---

## 3. WebGPU Architecture & Workflows

### 3.1 Context & Lifecycle
* Use single-context initialization:
  ```typescript
  import { init, surface, effect } from "vgpu";
  
  const gpu = await init();
  ```
* Connect to DOM canvas or headless surface cleanly without hidden global side-effects:
  ```typescript
  const canvas = document.querySelector("canvas")!;
  const canvasSurface = surface(gpu, canvas);
  ```

### 3.2 Typed WGSL Shader Modules
* Treat `.wgsl` files like first-class TypeScript modules with automated binding reflection.
* Do not manually hand-code binding layouts when `vgpu` reflects them directly from shader inputs/uniforms.

### 3.3 Multi-Runtime & Testing Support
* **Browser:** Standard WebGPU canvas surface.
* **Headless Node.js:** Dawn-backed rendering (e.g., via `@vgpu/adapter-node`) for server-side generation, CI image snapshot testing, or headless compute jobs.
* **Mock / Deterministic Testing:** Validate shader pipelines and state transitions headlessly in automated test suites without requiring a physical display.

### 3.4 3D Assets & Blender Pipeline
* Follow low-overhead asset validation, high/low-poly baking workflows (normal, ambient occlusion, roughness), and runtime instance/transform management when loading 3D assets or GLTF/GLB models.
