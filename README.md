# Composite Confidence Score

**7-axis weighted confidence function for AI output quality assessment.**

![Status](https://img.shields.io/badge/status-production-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## The problem

Single-number confidence scores (0.0 to 1.0) are ubiquitous in AI systems and nearly useless for decision-making. When a model says it's "87% confident," you don't know if that's because the evidence is strong but the reasoning is shaky, or the reasoning is airtight but the source is unreliable. A scalar hides the *shape* of uncertainty.

## The equation

```
CCS = Σ(w_i × c_i)    where i ∈ {1..7}
```

Seven orthogonal axes, each scored independently on [0, 1], combined with tunable weights that sum to 1:

| Axis | Symbol | What it measures |
|------|--------|-----------------|
| **Evidence** | c₁ | Strength and quantity of supporting data |
| **Reasoning** | c₂ | Logical coherence of the inference chain |
| **Calibration** | c₃ | Historical accuracy in this domain (track record) |
| **Source** | c₄ | Reliability and independence of information sources |
| **Domain** | c₅ | System competence and training coverage for this topic |
| **Coherence** | c₆ | Internal consistency of the output (no contradictions) |
| **Meta** | c₇ | Confidence in the confidence assessment itself (recursive) |

### Default weights

```
evidence:    0.20
reasoning:   0.20
calibration: 0.15
source:      0.15
domain:      0.12
coherence:   0.10
meta:        0.08
```

Evidence and reasoning dominate because they're the most actionable. Meta is lowest because recursive confidence is inherently noisy — but it's included because sometimes the system genuinely doesn't know what it doesn't know.

### Why multiplicative collapse matters

A critical property: if *any single axis* drops to zero, the CCS should effectively collapse regardless of other axes. Strong evidence + zero source reliability = untrustworthy. The weighted sum doesn't enforce this automatically — that's why the [Assertion Router](https://github.com/duke-of-beans/assertion-router) applies per-axis floors. Two or more axes below floor → INVESTIGATIVE mode, regardless of the composite score.

This is the same insight behind the [Multiplicative Composition](https://github.com/duke-of-beans/multiplicative-composition) framework: independent dimensions compose multiplicatively, and zero on any dimension collapses the whole.

## TypeScript interfaces

```typescript
export interface ConfidenceAxes {
  evidence: number;
  reasoning: number;
  calibration: number;
  source: number;
  domain: number;
  coherence: number;
  meta: number;
}

export interface CCSConfig {
  weights: Record<keyof ConfidenceAxes, number>;
  floors: Partial<Record<keyof ConfidenceAxes, number>>;
}

export interface CCSResult {
  score: number;
  axes: ConfidenceAxes;
  weakAxes: (keyof ConfidenceAxes)[];
  profile: 'strong' | 'mixed' | 'weak' | 'collapsed';
}
```

## Reference implementation

```typescript
const DEFAULT_WEIGHTS: Record<keyof ConfidenceAxes, number> = {
  evidence: 0.20, reasoning: 0.20, calibration: 0.15,
  source: 0.15, domain: 0.12, coherence: 0.10, meta: 0.08
};

export function computeCCS(axes: ConfidenceAxes, config?: Partial<CCSConfig>): CCSResult {
  const weights = config?.weights ?? DEFAULT_WEIGHTS;
  const floors = config?.floors ?? {};

  const score = (Object.keys(weights) as (keyof ConfidenceAxes)[])
    .reduce((sum, axis) => sum + weights[axis] * axes[axis], 0);

  const weakAxes = (Object.entries(floors) as [keyof ConfidenceAxes, number][])
    .filter(([axis, floor]) => axes[axis] < floor)
    .map(([axis]) => axis);

  const profile = weakAxes.length >= 3 ? 'collapsed'
    : weakAxes.length >= 1 ? 'mixed'
    : score >= 0.8 ? 'strong' : 'weak';

  return { score: Math.round(score * 1000) / 1000, axes, weakAxes, profile };
}
```

## Production status

In production since March 2026. The production implementation includes adaptive weight tuning via IMPRINT session reflections, domain-specific weight profiles (research queries weight `source` higher, creative tasks weight `coherence` higher), and historical calibration tracking per entity.

## Prior art

- **Bayesian calibration** — Dawid (1982), well-calibrated probability assessors
- **Multi-criteria decision analysis (MCDA)** — Belton & Stewart (2002)
- **Epistemic uncertainty decomposition** — Hüllermeier & Waegeman (2021)
- **Selective prediction** — Geifman & El-Yaniv (2017), confidence-based abstention

## Part of the cognitive stack

- [Assertion Router](https://github.com/duke-of-beans/assertion-router) — uses CCS to route outputs through 4 epistemic modes
- [Veto Authority](https://github.com/duke-of-beans/veto-authority) — triggers REFUSE when CCS drops below safety floor
- [Cognitive Stack](https://github.com/duke-of-beans/cognitive-stack) — the full 10-system architecture

---

*Built by [David Kirsch](https://github.com/duke-of-beans). MIT License.*
