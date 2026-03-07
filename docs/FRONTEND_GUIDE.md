# Frontend Documentation: Niti Setu

Niti Setu's frontend is a high-performance, responsive React application built with
Vite. It follows a **Glassmorphic Design System** for a premium, modern aesthetic.

## 🎨 Design System & UI Components

The UI is built using a custom "Glass" framework, utilizing **Tailwind CSS** and
**Framer Motion** combined with **React Bits** components for high-end micro-interactions
and complex animations.

- **Registration Wizard:** High-security 3-step verification flow featuring OTP entry, **Real-time Password Complexity Validation**, **Confirm Password Match Indicators**, and identity safeguards.
- **Identity Violation Alerts:** Prominent red toast notifications for unauthorized access attempts (e.g., password reset for non-existent accounts).
- **Dynamic Enrollment Opt-In:** An intelligent progressive disclosure UI ("Yes/No" toggle) that dynamically swaps colors based on the Light/Dark mode Tailwind variables (`var(--bg-glass)`, `var(--bg-primary)`) allowing bulk auto-selection of specific category schemes without overwhelming the user.
- **Google OAuth 2.0:** Secure, one-click login via a customized callback flow.
- **Resource Management Dashboard:** An enterprise-grade monitoring console featuring:
  - **Industrial KPI Strip:** Real-time capacity load bars and Mean Latency (ms) tracking.
  - **Multi-Pool Burn Rate Visualization:** Differentiates between `Registered` and `Public Guest` usage over a 7-day trailing history.
  - **Live Syncing Controller:** Manual "Pause/Resume" mechanism for client-side performance optimization.
  - **Adaptive Grid Layout:** Prevents layout overflow across various viewport sizes using a responsive card architecture.
- **Intelligent Sidebar Navigation:** Smooth framer-motion layout transitions that adapt perfectly between expanded and collapsed states. It includes a smart flexbox footer that prevents UI overlap when the window height is constrained, preserving all global controls (Logout, Notifications, Dark Mode, Language).
- **Premium Landing Navigation:**
  - **Smooth Scrolling Hash Links:** Native anchor link interception for seamless intra-page navigation.
  - **Floating Scroll Controls:** Context-aware Up/Down scroll arrows that adapt based on viewport position (hiding/showing based on absolute scroll bounds).
  - **Clickable Email Integration:** Direct `mailto:` action integrated directly into the navbar and footer.
- **Role Management Authority Control:** Action-specific icons and color-coded status badges that dynamically reflect user security tiers ("Manage Privileges" gear vs "Elevate Role" arrow).
- **Premium Krishi Mitra UI:** A completely revamped floating assistant featuring:
  - **Glassmorphic Home Tab:** Includes a high-impact hero section with decorative background elements and refined typography.
  - **Live Status Pulsing:** A real-time "AI Support Online" indicator with a pulsing glow effect to build user trust.
  - **Quick-Help Buttons:** Premium suggestion cards with micro-translations and sophisticated hover shadows.
  - **Smart Dictation Sync:** Deep integration with **Groq-Whisper** that automatically synchronizes speech-to-text transcripts directly into the chat input field, with specific UI states for "Listening" and "Transcribing".
  - **Refined Message Bubbles:** Distinctive gradient treatments and optimized border-radii for User vs. AI messages, maximizing readability.

## 🏗️ State Management & Data Flow

- **Authentication:** Dual-flow support for secure OTP-based registration and Google OAuth 2.0 via a customized secure callback flow. Includes real-time matching engines for password confirmation.
- **Chat Sessions:** Persistent conversation state managed via session IDs, allowing users to resume previous interactions with Krishi Mitra.
- **RAG Interface:** Communicates with the backend via axios with local caching (localStorage) for public eligibility checks.
- **Audio Pipeline:** Integrates the **Web Speech API** for real-time dictation and **ElevenLabs** for neural speech synthesis.
- **Telemetry Polling:** Visibility-aware data synchronization (30s interval) that automatically pauses when the browser tab is inactive to save system resources.

## ⚡ Performance Optimizations

- **Vite Execution:** Ultra-fast HMR and optimized production bundling.
- **Local Caching:** Profiles and recent eligibility results are stored locally to reduce redundant API calls.
- **Lazy Loading:** Dynamic imports for heavy analytics components (Recharts) to minimize initial bundle size.

---

## 📂 Directory Structure

- `/src/components`: UI building blocks (`GlassSurface`, `Aurora`, `Plasma`, `Silk`, `AgriCard`, etc.)
- `/src/pages`: Application views (`Dashboard`, `EligibilityCheck`, `ResourceManagement`, `ChatDashboard`, `Settings`, etc.)
- `/src/services`: API interaction logic, voice processing, and profile management.
- `/src/locales`: JSON-based translation files for regional support.
