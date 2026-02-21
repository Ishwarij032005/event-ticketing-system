---
description: how to run the full system verification
---

To run the full verification of the Event Ticketing System:

1. **Ensure Servers are Running**:
   - Backend: `cd backend; go run cmd/api/main.go` (Port 8081)
   - Frontend: `cd frontend; npm run dev` (Port 5173)

2. **Run Verification Script**:
   // turbo
   Run the following command from the root directory:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\verify_test.ps1
   ```

3. **Check Results**:
   The script will output `[PASS]` or `[FAIL]` for each feature and provide a summary at the end.
