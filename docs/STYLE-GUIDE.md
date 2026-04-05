# MultiAI Design System: Professionalism & Precision

This guide outlines the transition from a "Soft/Consumer" aesthetic to a "Professional/Technical" UI inspired by **shadcn/ui** and **Linear**.

## 1. The "Golden Ratio" of Corners
*   **Current:** ~32px (rounded-3xl). Feels bubbly and casual.
*   **Improvement:** **6px to 10px (rounded-md to rounded-xl).**
*   **Why:** Sharper corners signal precision and industrial-grade software.

## 2. Depth: Borders Over Shadows
*   **Current:** Heavy, blurry drop shadows to separate cards.
*   **Improvement:** Use **1px solid borders** (`border-slate-200`) and a very subtle "micro-shadow".
*   **Shadow Value:** `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);`

## 3. Background Strategy
*   **Current:** White cards on a light gray background.
*   **Improvement:** 
    *   **App Background:** `bg-slate-50` or a very faint `zinc-50`.
    *   **Sidebar/Navigation:** A slightly darker tint than the main content area to create a clear hierarchy.
    *   **Cards:** Pure white `bg-white`.

## 4. Typography Hierarchy
*   **Font Choice:** Use a high-quality sans-serif (Inter, Geist, or System San Francisco).
*   **Scale:**
    *   **Titles:** Semibold, tight letter-spacing (`tracking-tight`).
    *   **Labels:** Small (`text-sm`), medium weight.
    *   **Helper/Tips:** Tiny (`text-[11px]`), muted color (`text-slate-500`), and consider using a Monospace font for "prompt tips."

## 5. Components: shadcn/ui Patterns
*   **Buttons:** Avoid full-round pill shapes. Use `rounded-md`. Use a "Primary" button that is high contrast (Dark Gray/Black background with White text).
*   **Inputs:** Remove the thick borders. Use a thin 1px border that turns into a **2px ring** on focus.
*   **Empty States:** Use dashed borders (`border-dashed`) for areas where users need to drop files or add "Team Members."

## 6. Layout Spacing
*   **Rule of Thumb:** Increase your padding inside cards (`p-6`) but decrease the gap between sections. 
*   **Alignment:** Ensure every card edge aligns perfectly. In the current screenshot, the "Team Answers" and "Lead Expert" cards have different horizontal starting points—aligning these to a grid will instantly look 50% more professional.
