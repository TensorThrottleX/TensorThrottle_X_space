# Universal Asset Registry

The Universal Asset Registry eliminates all hardcoded paths across the application. It takes a `dimension` and an `id` and computes the deterministic path for all related media assets.

## Interface
```typescript
interface AssetPackage {
  id: string
  dimension: string
  videoUrl: string | null
  audioUrl: string | null
  coverUrl: string | null
  theme?: 'dark' | 'bright' | 'dynamic'
  metadataUrl: string | null
}
```
