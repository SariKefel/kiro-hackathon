(() => {
  const form = document.getElementById("check-in-form");
  const result = document.getElementById("result");
  const save = document.getElementById("save");
  let latitude = null;
  let longitude = null;
  let busy = false;
  function connection() {
    document.getElementById("connection").textContent = navigator.onLine
      ? "Device connection detected. Open responder home to retry delivery. Demo remote delivery remains unavailable."
      : "You are offline. Check-ins can be saved on this device.";
  }
  connection();
  window.addEventListener("online", connection);
  window.addEventListener("offline", connection);
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("rescuesync-demo-v1", 10);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("outbox", { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("clientRecordedAt", "clientRecordedAt");
        store.createIndex("[organizationId+incidentId]", ["organizationId", "incidentId"]);
        store.createIndex("[payload.userId+clientRecordedAt]", [
          "payload.userId",
          "clientRecordedAt",
        ]);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error("Storage upgrade blocked. Close other RescueSync tabs and retry."));
    });
  }
  async function count() {
    try {
      const db = await openDatabase();
      const request = db.transaction("outbox").objectStore("outbox").getAll();
      request.onsuccess = () => {
        document.getElementById("pending").textContent =
          `${request.result.filter((op) => op.status !== "confirmed").length} reports awaiting server confirmation on this device.`;
        db.close();
      };
      request.onerror = () => db.close();
    } catch {
      document.getElementById("pending").textContent =
        "Device storage could not be opened. Enable browser storage before checking in.";
    }
  }
  void count();
  document.getElementById("locate").addEventListener("click", () => {
    const feedback = document.getElementById("location");
    if (!navigator.geolocation) {
      feedback.textContent = "Device location unavailable. You can still save without it.";
      return;
    }
    feedback.textContent = "Requesting location permission...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        feedback.textContent = `Location attached: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}.`;
      },
      () => {
        feedback.textContent = "Location not shared. You can still save without it.";
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(form);
    const safetyStatus = data.get("status");
    if (!["safe", "needs_help", "unable_to_continue"].includes(safetyStatus)) return;
    busy = true;
    save.disabled = true;
    const operation = {
      id: crypto.randomUUID(),
      type: "personnel.check_in",
      version: 1,
      organizationId: "10000000-0000-4000-8000-000000000001",
      incidentId: "20000000-0000-4000-8000-000000000001",
      clientRecordedAt: new Date().toISOString(),
      payload: {
        userId: "demo-user-1",
        safetyStatus,
        message: document.getElementById("message").value.trim().slice(0, 500),
        latitude,
        longitude,
      },
      status: "saved_locally",
      attempts: 0,
      nextAttemptAt: 0,
      lastAttemptAt: null,
      serverReceivedAt: null,
      error: null,
    };
    let db;
    try {
      db = await openDatabase();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction("outbox", "readwrite");
        transaction.objectStore("outbox").add(operation);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
      form.hidden = true;
      result.textContent =
        "Saved locally. Your report has not been delivered to command. Reopen responder home when connected to review this report and retry sync.";
      await count();
    } catch {
      result.textContent =
        "Report could not be saved. Enable browser storage and try again. Nothing has been sent.";
      save.disabled = false;
    } finally {
      db?.close();
      busy = false;
      result.focus();
    }
  });
})();
