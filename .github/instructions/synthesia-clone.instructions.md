---
applyTo: "app/synthesiaClone/**/*.ts,app/synthesiaClone/**/*.tsx,app/synthesiaClone/**/*.css,app/synthesiaClone/**/*.module.css"
---

For `app/synthesiaClone` changes, keep the mobile layout compact by default:

- On small screens, preserve `1px` outer padding/gaps around the main content area unless the user explicitly asks to change it.
- Do not reintroduce default `8px` mobile padding for the Synthesia workspace container.
- Keep the piano keyboard visually realistic: black keys should remain clearly shorter than white keys and should not visually dominate the full keyboard height.
