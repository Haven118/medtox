# MedTox Report Fix TODO

## Steps:
- [x] Step 1: Edit data/panel_keywords.json - Rename 'cannabis_panel' key to 'cannabinoid_panel' to match panels.json
- [x] Step 2: Edit data/panels.json - Add missing panels: poison_panel, alcohol_panel, stimulant_panel, sedative_panel, prescription_panel, heavy_metals_panel, hallucinogen_panel, dui_panel, general_tox (map to standard_uds)
- [x] Step 3: Edit tox-server/server.js - Add debug console.log to /api/tox/panel endpoint
- [x] Step 4: Restart tox-server (kill terminal, cd tox-server && node server.js)
- [x] Step 5: Test ReportWizard: input 'weed' → expect cannabinoid_panel/THC, 'poisoning' → poison_panel
- [x] Step 6: Verify different reports, PDF download
- [ ] Step 4: Restart tox-server (kill terminal, cd tox-server && node server.js)
- [ ] Step 5: Test ReportWizard: input 'weed' → expect cannabinoid_panel/THC, 'poisoning' → poison_panel
- [ ] Step 6: Verify different reports, PDF download
- [ ] COMPLETE: attempt_completion

