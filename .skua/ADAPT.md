# SPDX-License-Identifier: BUSL-1.1
# Skua Image Adapt (trip_planner)

Use this workflow to let `codex` suggest container image changes without writing a Dockerfile.

1. During normal coding, when missing tools/dependencies block work, update:
   - `.skua/image-request.yaml`
2. On the host, apply latent request changes:
   - `skua adapt trip_planner`
3. Optional: ask Skua to run `codex` to discover wishlist changes automatically:
   - `skua adapt trip_planner --discover`
4. Start/restart with updated image config:
   - `skua run trip_planner`

Request rules:
- Prefer `packages` for apt package names.
- Only list missing packages/tools (do not include packages already installed).
- Infer required tooling from project files and real blockers encountered while working.
- Use `baseImage` to switch to a different base image.
- Use `fromImage` to adapt an existing working image as the parent image.
- Use `commands` for additional setup commands.
- Do not write a Dockerfile directly; only update `.skua/image-request.yaml`.
