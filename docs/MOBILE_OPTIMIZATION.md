# Mobile UI/UX & Performance Optimization

This document outlines the systematic optimizations implemented to ensure the Niti Setu platform remains high-performing, accessible, and "Industry-Grade" on mobile devices (Android/iOS).

## 1. Responsive Layout & Navigation

### App Shell & AppShell Component

- **Mobile Header**: Introduced a fixed `MobileHeader` (visible < 1024px) providing logo branding and a hamburger menu.
- **Responsive Sidebar**: On desktop, the sidebar remains persistent. On mobile, it transforms into a slide-in drawer using `Framer Motion` with a backdrop overlay.
- **Z-Index Consistency**: Ensured a clear hierarchy where the sidebar drawer (z-index 2500) and chatbot (z-index 2200) overlay core content without clipping.

### Context-Aware Components

- **Dashboard**: Adjusted grid layouts from multiple columns to a single stack. Reduced padding and typography scales using a dynamic `isMobile` state.
- **Chat Interface**: The chat history sidebar now takes up a full-screen drawer on mobile, allowing the active chat feed more space.

## 2. Performance & GPU Gains (The "Zero-Hang" Fix)

Mobile devices, especially mid-range ones, struggle with heavy WebGL/GPU calculations. We implemented a "Strict-Perf" strategy:

- **WebGL Disabling**: Intensively animated background components (`Aurora`, `Silk`, `Plasma`, `FluidGlass`) are automatically disabled on screens < 1024px and replaced with lightweight CSS radial/linear gradients.
- **Animation Pruning**:
  - `AgriCard` hover effects and entry transitions are bypassed on mobile to reduce main-thread strain.
  - `PageWrapper` (Route transitions) skips animations on mobile for instant "app-like" navigation feedback.
- **CSS Shaving**:
  - Reduced `backdrop-filter: blur` from 32px to 4px on mobile globally.
  - Simplified `box-shadow` styles to reduce paint cycles.

## 3. Hardware Integration (Microphone/STT)

### HTTPS Security & Local Testing

Mobile browsers (Chrome/Safari) block microphone access on non-secure (HTTP) origins.

- **SSL for Local Dev**: Integrated `vite-plugin-mkcert` to provide local HTTPS, enabling microphone testing on developer networks.
- **Insecure Context Handling**: Updated `useVoice` hook to provide clear error messages ("HTTPS Required") instead of crashing when `navigator.mediaDevices` is missing.
- **Remote Testing**: Configured `localtunnel` (`npm run tunnel`) for zero-proxy/zero-warning testing on actual mobile hardware.

## 4. Native App Experience

- **Full-Screen Chat**: The Krishi Mitra chatbot window expands to 100% width/height on mobile for a focused typing experience.
- **Touch-Friendly Targets**: Increased button heights and spacing in high-interaction areas (Eligibility Form, Sidebar Links).
- **Auto-Zoom Prevention**: Set `font-size: 16px` on all mobile inputs to prevent iOS Safari from zooming in on focus.
