// ==UserScript==
// @name         APM Master - Custom Theme Overlays
// @namespace    local.apm.theme-overlays
// @version      1.0.6
// @description  Adds custom overlay themes to APM Master
// @match        https://*.eam.hxgnsmartcloud.com/*
// @match        https://*.eam.aws.a2z.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_info
// @connect      raw.githubusercontent.com
// @updateURL    https://raw.githubusercontent.com/Alfonso099/APM-Master---Custom-Theme-Overlays/main/APM-Master-Custom-Theme-Overlays.user.js
// @downloadURL  https://raw.githubusercontent.com/Alfonso099/APM-Master---Custom-Theme-Overlays/main/APM-Master-Custom-Theme-Overlays.user.js
// @homepageURL  https://github.com/Alfonso099/APM-Master---Custom-Theme-Overlays
// @supportURL   https://github.com/Alfonso099/APM-Master---Custom-Theme-Overlays/issues
// ==/UserScript==

/*
  APM Master - Custom Theme Overlays

  This is a companion Tampermonkey script for APM Master.
  It does not replace or edit the official APM Master script.

  Base theme:0
  - Uses APM Dark Classic as the safe base theme.

  Current features:
  - Custom Overlay selector
  - Natalie overlay
  - Loading Style selector
  - Pink Bolt loader
  - Pink Elmo GIF loader option
  - Elmo Fire GIF loader option
  - Update checker for new versions of this script
  - Clear Natalie Theme button in console
*/

(function () {
  const OVERLAY_KEY = "apm_custom_overlay_theme";
  const BASE_THEME = "theme-dark";
  const LOADER_KEY = "apm_custom_loader_style";

  const SCRIPT_DOWNLOAD_URL =
    "https://raw.githubusercontent.com/Alfonso099/APM-Master---Custom-Theme-Overlays/main/APM-Master-Custom-Theme-Overlays.user.js";

  const UPDATE_AVAILABLE_KEY = "apm_custom_theme_update_available";
  const UPDATE_VERSION_KEY = "apm_custom_theme_update_version";
  const UPDATE_STATUS_KEY = "apm_custom_theme_update_status";

  function compareVersions(remote, local) {
    const parse = (value) =>
      String(value)
        .trim()
        .split(/[+-]/)[0]
        .split(".")
        .map((part) => parseInt(part, 10) || 0);

    const r = parse(remote);
    const l = parse(local);
    const max = Math.max(r.length, l.length);

    for (let i = 0; i < max; i++) {
      const rv = r[i] || 0;
      const lv = l[i] || 0;

      if (rv > lv) return 1;
      if (rv < lv) return -1;
    }
    return 0;
  }

  function getVersionFromScriptHeader(scriptText) {
    const match = scriptText.match(/\/\/\s*@version\s+([^\s]+)/);
    return match ? match[1] : null;
  }

  function setUpdateStatus(message, type = "idle") {
    GM_setValue(UPDATE_STATUS_KEY, message);

    const status = document.querySelector("#apm-custom-update-status");
    const button = document.querySelector("#apm-custom-update-row button");

    if (status) {
      status.textContent = message;
      status.style.color =
        type === "error"
          ? "#ff4d4d"
          : type === "current"
            ? "#4dff4d"
            : type === "available"
              ? "#ff7b00"
              : "#d783ff";
    }

    if (button) {
      button.textContent =
        type === "available" ? "Update Now" : "Check for Updates";
      button.dataset.updateAvailable = type === "available" ? "true" : "false";
    }
  }

  function checkForAddonUpdates(force = false) {
    setUpdateStatus("Checking for updates...", "idle");

    const lastChecked = GM_getValue("apm_custom_theme_last_update_check", 0);
    const now = Date.now();
    const oneHour = 1000 * 60 * 60;

    if (!force && now - lastChecked < oneHour) {
      const lastStatus = GM_getValue(
        UPDATE_STATUS_KEY,
        "Checked recently. Try again later.",
      );
      setUpdateStatus(lastStatus, "idle");
      return;
    }

    GM_xmlhttpRequest({
      method: "GET",
      url: `${SCRIPT_DOWNLOAD_URL}?cache_bust=${Date.now()}`,
      onload: function (response) {
        if (response.status < 200 || response.status >= 300) {
          setUpdateStatus(
            `Update check failed: HTTP ${response.status}`,
            "error",
          );
          return;
        }

        const remoteVersion = getVersionFromScriptHeader(response.responseText);
        const localVersion = GM_info?.script?.version || "0.0.0";

        if (!remoteVersion) {
          setUpdateStatus("Failed to read remote version.", "error");
          return;
        }

        const updateAvailable =
          compareVersions(remoteVersion, localVersion) > 0;

        GM_setValue(UPDATE_VERSION_KEY, remoteVersion);
        GM_setValue(UPDATE_AVAILABLE_KEY, updateAvailable);
        GM_setValue("apm_custom_theme_last_update_check", Date.now());

        if (updateAvailable) {
          setUpdateStatus(
            `Update available: ${localVersion} → ${remoteVersion}`,
            "available",
          );
        } else {
          setUpdateStatus(`Up to date: ${localVersion}`, "current");
        }
      },
      onerror: function () {
        setUpdateStatus("Failed to check for updates.", "error");
      },
    });
  }

  function openAddonUpdatePage() {
    GM_openInTab(SCRIPT_DOWNLOAD_URL, {
      active: true,
      insert: true,
    });
  }

  function renderUpdateButton() {
    const loaderSelect = document.querySelector("#apm-custom-loader-select");
    if (!loaderSelect) return;
    if (document.querySelector("#apm-custom-update-row")) return;

    const row = document.createElement("div");
    row.id = "apm-custom-update-row";
    row.style.marginTop = "14px";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr 128px";
    row.style.gap = "12px";
    row.style.alignItems = "center";

    const label = document.createElement("div");
    label.innerHTML = `
    <div style="font-weight:700;color:#fff;">Addon Updates</div>
    <div id="apm-custom-update-status" style="font-size:11px;color:#d783ff;">
      ${GM_getValue(UPDATE_STATUS_KEY, "Manual update check available.")}
    </div>
  `;

    const button = document.createElement("button");
    button.id = "apm-custom-update-button";
    button.textContent = GM_getValue(UPDATE_AVAILABLE_KEY, false)
      ? "Update Now"
      : "Check";
    button.dataset.updateAvailable = GM_getValue(UPDATE_AVAILABLE_KEY, false)
      ? "true"
      : "false";

    button.style.padding = "5px 10px";
    button.style.borderRadius = "6px";
    button.style.border = "1px solid #ff7b00";
    button.style.background = "#222222";
    button.style.color = "#ffffff";
    button.style.fontWeight = "700";
    button.style.cursor = "pointer";

    button.addEventListener("click", () => {
      if (button.dataset.updateAvailable === "true") {
        openAddonUpdatePage();
        return;
      }

      checkForAddonUpdates(true);
    });

    row.appendChild(label);
    row.appendChild(button);

    loaderSelect.closest("div").insertAdjacentElement("afterend", row);
  }

  function applyLoader() {
    const overlay = GM_getValue(OVERLAY_KEY, "none");
    const loader = GM_getValue(LOADER_KEY, "theme-default");

    document.documentElement.removeAttribute("data-apm-loader");

    if (loader === "default") {
      return;
    }

    if (loader === "theme-default") {
      if (overlay === "natalie") {
        document.documentElement.setAttribute("data-apm-loader", "pink-bolt");
      }
      return;
    }

    document.documentElement.setAttribute("data-apm-loader", loader);
  }

  function applyOverlay() {
    const overlay = GM_getValue(OVERLAY_KEY, "none");

    document.documentElement.removeAttribute("data-apm-natalie");

    if (overlay === "natalie") {
      GM_setValue("apm_v1_ui_theme", BASE_THEME);
      localStorage.setItem("apm_v1_ui_theme", BASE_THEME);
      document.documentElement.setAttribute("data-apm-theme", BASE_THEME);
      document.documentElement.setAttribute("data-apm-natalie", "true");
    }
  }

  applyOverlay();
  applyLoader();

  GM_addStyle(/* css */ `
    html[data-apm-natalie="true"] {
      color-scheme: dark;

      --apm-text-primary: #ff00ff;
      --apm-text-secondary: #ff66ff;
      --apm-text-muted: #c084fc;

      --apm-accent: #ff00ff;
      --apm-accent-hover: #ff66ff;
      --apm-accent-soft: rgba(255, 0, 255, 0.18);

      --apm-bg-primary: #1f1f1f;
      --apm-bg-secondary: #222222;
      --apm-bg-tertiary: #2b2b2b;
      --apm-border: #444444;
    }

    html[data-apm-natalie="true"],
    html[data-apm-natalie="true"] body,
    html[data-apm-natalie="true"] .x-body,
    html[data-apm-natalie="true"] .x-viewport,
    html[data-apm-natalie="true"] .x-panel,
    html[data-apm-natalie="true"] .x-panel-body,
    html[data-apm-natalie="true"] .x-window,
    html[data-apm-natalie="true"] .x-window-body,
    html[data-apm-natalie="true"] .x-tabpanel-child,
    html[data-apm-natalie="true"] .x-container {
      background-color: #1f1f1f !important;
      color: #ff00ff !important;
    }

    html[data-apm-natalie="true"] .x-form-item-label,
    html[data-apm-natalie="true"] .x-form-display-field,
    html[data-apm-natalie="true"] .x-grid-cell,
    html[data-apm-natalie="true"] .x-grid-cell-inner,
    html[data-apm-natalie="true"] .x-column-header,
    html[data-apm-natalie="true"] .x-toolbar,
    html[data-apm-natalie="true"] .x-btn-inner,
    html[data-apm-natalie="true"] .x-tab-inner {
      color: #ff00ff !important;
    }

    html[data-apm-natalie="true"] .x-form-field,
    html[data-apm-natalie="true"] input,
    html[data-apm-natalie="true"] textarea,
    html[data-apm-natalie="true"] .x-boundlist,
    html[data-apm-natalie="true"] .x-boundlist-item {
      background-color: #222222 !important;
      color: #ff00ff !important;
      border-color: #444444 !important;
    }

    html[data-apm-natalie="true"] .x-column-header,
    html[data-apm-natalie="true"] .x-column-header-default,
    html[data-apm-natalie="true"] .x-grid-header-ct {
      background: #444444 !important;
      border-color: #333333 !important;
      color: #ff00ff !important;
    }

    html[data-apm-natalie="true"] .x-grid-row-selected .x-grid-cell,
    html[data-apm-natalie="true"] .x-boundlist-selected {
      background-color: #315d63 !important;
      color: #ff00ff !important;
    }

    html[data-apm-natalie="true"] a {
      color: #00aaff !important;
    }

    /* Natalie SVG Loading Animation */

    html[data-apm-natalie="true"] .x-mask-msg,
    html[data-apm-natalie="true"] #processing-request-container {
  background: #111 !important;
  border: 1px solid #ff00ff !important;
  color: #ff00ff !important;
  box-shadow: 0 0 18px #ff00ff !important;
}

/* Recolor APM's built-in lightning bolt for Natalie */
html[data-apm-natalie="true"] .lightning-bolt {
  fill: #ff00ff !important;
  stroke: #ffb3ff !important;
  stroke-width: 0.4px !important;
  filter:
    drop-shadow(0 0 6px #ff00ff)
    drop-shadow(0 0 14px #ff00ff)
    drop-shadow(0 0 28px #ff00ff) !important;
}

html[data-apm-natalie="true"] .rain-cloud-always,
html[data-apm-natalie="true"] .rain-cloud-hover,
html[data-apm-natalie="true"] .center-lightning {
  color: #ff66ff !important;
}

@keyframes center-bolt-flash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }

  10% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
    filter: drop-shadow(0 0 20px rgba(255, 0, 255, 0.8));
  }

  20% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }

  30% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
    filter: drop-shadow(0 0 40px rgba(255, 0, 255, 1));
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
    filter: drop-shadow(0 0 10px rgba(255, 0, 255, 0));
  }
}

html[data-apm-loader="pink-bolt"] .lightning-bolt {
  fill: #ff00ff !important;
}

/*
=====================================
Loader Style: Pink Bolt
Keeps normal APM loader, just recolors it
=====================================
*/

html[data-apm-loader="pink-bolt"] .x-mask-msg,
html[data-apm-loader="pink-bolt"] #processing-request-container {
  background: #111 !important;
  border: 1px solid #ff00ff !important;
  color: #ff00ff !important;
  box-shadow: 0 0 18px #ff00ff !important;
}

html[data-apm-loader="pink-bolt"] .x-mask-msg-text,
html[data-apm-loader="pink-bolt"] #processing-request-container .x-mask-msg-text {
  color: #ff00ff !important;
  text-shadow: 0 0 8px #ff00ff !important;
}

html[data-apm-loader="pink-bolt"] .lightning-bolt {
  fill: #ff00ff !important;
  stroke: #ffb3ff !important;
  stroke-width: 0.4px !important;
  filter:
    drop-shadow(0 0 6px #ff00ff)
    drop-shadow(0 0 14px #ff00ff)
    drop-shadow(0 0 28px #ff00ff) !important;
}

html[data-apm-loader="pink-bolt"] .rain-cloud-always,
html[data-apm-loader="pink-bolt"] .rain-cloud-hover,
html[data-apm-loader="pink-bolt"] .center-lightning {
  color: #ff66ff !important;
}

@keyframes center-bolt-flash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }

  10% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
    filter: drop-shadow(0 0 20px rgba(255, 0, 255, 0.8));
  }

  20% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1);
  }

  30% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
    filter: drop-shadow(0 0 40px rgba(255, 0, 255, 1));
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5);
    filter: drop-shadow(0 0 10px rgba(255, 0, 255, 0));
  }
}


/* ============================
   Loader Style: Pink Elmo GIF Only
   Completely replaces APM loader contents
   ============================ */

html[data-apm-loader="pink-elmo-gif"] #processing-request-container,
html[data-apm-loader="pink-elmo-gif"] .x-mask-msg {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  color: transparent !important;
  font-size: 0 !important;
  line-height: 0 !important;
}

/* Hide everything APM puts inside the loader */
html[data-apm-loader="pink-elmo-gif"] #processing-request-container *,
html[data-apm-loader="pink-elmo-gif"] .x-mask-msg * {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Hide APM thunder/bolt overlay too */
html[data-apm-loader="pink-elmo-gif"] .center-lightning,
html[data-apm-loader="pink-elmo-gif"] .thunder-overlay,
html[data-apm-loader="pink-elmo-gif"] .lightning-bolt {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  animation: none !important;
}

/* Show only the GIF */
html[data-apm-loader="pink-elmo-gif"] #processing-request-container::before,
html[data-apm-loader="pink-elmo-gif"] .x-mask-msg::before {
  content: "";
  display: block;
  width: 360px;
  height: 360px;
  margin: 0 auto;
  background-image: url("https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeThsbGdhNmE1aWkydmNxa3Rta3JxaTV1YXJzZzA4dWpvcm9paWV2dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/AglgRgRkHBR2R5Bh4R/giphy.gif");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* ============================
   Loader Style: Elmo Fire GIF Only
   Completely replaces APM loader contents
   ============================ */

html[data-apm-loader="elmo-fire-gif"] #processing-request-container,
html[data-apm-loader="elmo-fire-gif"] .x-mask-msg {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  color: transparent !important;
  font-size: 0 !important;
  line-height: 0 !important;
}

/* Hide everything APM puts inside the loader */
html[data-apm-loader="elmo-fire-gif"] #processing-request-container *,
html[data-apm-loader="elmo-fire-gif"] .x-mask-msg * {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Hide APM thunder/bolt overlay too */
html[data-apm-loader="elmo-fire-gif"] .center-lightning,
html[data-apm-loader="elmo-fire-gif"] .thunder-overlay,
html[data-apm-loader="elmo-fire-gif"] .lightning-bolt {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  animation: none !important;
}

/* Show only the GIF */
html[data-apm-loader="elmo-fire-gif"] #processing-request-container::before,
html[data-apm-loader="elmo-fire-gif"] .x-mask-msg::before {
  content: "";
  display: block;
  width: 360px;
  height: 360px;
  margin: 0 auto;
  background-image: url("https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3kzd3kzY2lobGdxaWFtMTk2cWMxMXJub3Nvdm9xODJwangxMndjbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Lopx9eUi34rbq/giphy.gif");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* ============================
   Loader Style: Aurora Borealis
   Covers the top half of the screen with a moving aurora effect
   Completely replaces APM loader contents
   ============================ */

html[data-apm-loader="aurora-borealis"] #processing-request-container,
html[data-apm-loader="aurora-borealis"] .x-mask-msg {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  color: transparent !important;
  font-size: 0 !important;
  line-height: 0 !important;
  min-height: 0 !important;
  min-width: 0 !important;
}

/* Hide normal APM loader contents */
html[data-apm-loader="aurora-borealis"] #processing-request-container *,
html[data-apm-loader="aurora-borealis"] .x-mask-msg * {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Hide APM thunder/bolt overlay */
html[data-apm-loader="aurora-borealis"] .center-lightning,
html[data-apm-loader="aurora-borealis"] .thunder-overlay,
html[data-apm-loader="aurora-borealis"] .lightning-bolt {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  animation: none !important;
}

/* Dark sky background */
html[data-apm-loader="aurora-borealis"] #processing-request-container::before,
html[data-apm-loader="aurora-borealis"] .x-mask-msg::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 50vh;
  z-index: 999998;
  pointer-events: none;

  background:
    radial-gradient(circle at 20% 20%, rgba(0, 255, 170, 0.30) 0%, transparent 32%),
    radial-gradient(circle at 80% 30%, rgba(120, 80, 255, 0.30) 0%, transparent 34%),
    linear-gradient(
      180deg,
      rgba(3, 8, 25, 0.96) 0%,
      rgba(4, 12, 35, 0.92) 50%,
      rgba(3, 8, 20, 0.00) 100%
    );

  overflow: hidden;
  animation: aurora-sky-pulse 5s ease-in-out infinite alternate;
}

/* Moving aurora effect */
html[data-apm-loader="aurora-borealis"] #processing-request-container::after,
html[data-apm-loader="aurora-borealis"] .x-mask-msg::after {
  content: "";
  position: fixed;
  top: -8vh;
  left: -20vw;
  width: 140vw;
  height: 58vh;
  z-index: 999999;
  pointer-events: none;

  background:
    linear-gradient(
      105deg,
      transparent 0%,
      rgba(0, 255, 190, 0.00) 20%,
      rgba(0, 255, 190, 0.60) 40%,
      rgba(0, 120, 255, 0.35) 60%,
      rgba(190, 80, 255, 0.55) 80%,
      rgba(0, 255, 170, 0.35) 100%
      transparent 88%
    ),
    linear-gradient(
      75deg,
      transparent 0%,
      rgba(255, 0, 255, 0.20) 20%,
      rgba(0, 255, 200, 0.45) 40%,
      rgba(0, 120, 255, 0.28) 60%,
      transparent 85%
    );

  filter: blur(18px) saturate(1.35);
  opacity: 0.85;
  transform: skew(-8deg);
  animation: aurora-flow 7s ease-in-out infinite alternate;
}

/* Small loading text */
html[data-apm-loader="aurora-borealis"] body ::after{
  content: "Loading...";
  position: fixed;
  top: 43vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999999;
  pointer-events: none;

  color: #ccfff4;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-shadow:
    0 0 8px rgba(0, 255, 200, 0.9),
    0 0 18px rgba(160, 80, 255, 0.75),
  animation: aurora-text-pulse 1.6s ease-in-out infinite alternate;
}

@keyframes aurora-flow {
  0% {
    transform: translateX(-6vw) translateY(0) skewy(-10deg) scale(1.02);
    opacity: 0.65;
    filter: blur(20px) saturate(1.2);
  }

  50% {
    transform: translateX(3vw) translateY(4vh) skewy(-4deg) scale(1.5);
    opacity: 0.65;
    filter: blur(20px) saturate(1.2);
  }

  100% {
    transform: translateX(9vw) translateY(-1vh) skewy(-12deg) scale(.95);
    opacity: 0.78;
    filter: blur(22px) saturate(1.35);
  }
}

@keyframes aurora-sky-pulse {
  0% {
    filter: brightness(0.85);
  }

  100% {
    filter: brightness(1.15);
  }
}

@keyframes aurora-text-pulse {
  0% {
    opacity: 0.65;
  }

  100% {
    opacity: 1;
  }
}

  `);

  function addOverlayDropdown() {
    const themeSelect = document.querySelector("#cc-setting-theme");
    if (!themeSelect) return;
    if (document.querySelector("#apm-custom-overlay-select")) return;

    const wrapper = document.createElement("div");
    wrapper.style.marginTop = "14px";
    wrapper.style.display = "grid";
    wrapper.style.gridTemplateColumns = "1fr 128px";
    wrapper.style.gap = "12px";
    wrapper.style.alignItems = "center";

    const label = document.createElement("div");
    label.innerHTML = `
      <div style="font-weight:700;color:#fff;">Custom Overlay</div>
      <div style="font-size:11px;color:#d783ff;">Adds personal colors on top of Dark Classic.</div>
    `;

    const select = document.createElement("select");
    select.id = "apm-custom-overlay-select";
    select.innerHTML = `
      <option value="none">None</option>
      <option value="natalie">Natalie</option>
    `;
    select.value = GM_getValue(OVERLAY_KEY, "none");

    select.addEventListener("change", () => {
      GM_setValue(OVERLAY_KEY, select.value);
      applyOverlay();
      applyLoader();
      location.reload();
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    const loaderWrapper = document.createElement("div");
    loaderWrapper.style.marginTop = "14px";
    loaderWrapper.style.display = "grid";
    loaderWrapper.style.gridTemplateColumns = "1fr 128px";
    loaderWrapper.style.gap = "12px";
    loaderWrapper.style.alignItems = "center";

    const loaderLabel = document.createElement("div");
    loaderLabel.innerHTML = `
  <div style="font-weight:700;color:#fff;">Loading Style</div>
  <div style="font-size:11px;color:#d783ff;">Changes the APM loading animation.</div>
`;

    const loaderSelect = document.createElement("select");
    loaderSelect.id = "apm-custom-loader-select";
    loaderSelect.innerHTML = `
  <option value="theme-default">Theme Default</option>
  <option value="default">APM Default</option>
  <option value="pink-bolt">Pink Bolt</option>
  <option value="pink-elmo-gif">Pink Elmo GIF</option>
  <option value="elmo-fire-gif">Elmo Fire GIF</option>
  <option value="aurora-borealis">Aurora Borealis</option>
`;
    loaderSelect.value = GM_getValue(LOADER_KEY, "theme-default");

    loaderSelect.addEventListener("change", () => {
      GM_setValue(LOADER_KEY, loaderSelect.value);
      applyLoader();
      location.reload();
    });

    loaderWrapper.appendChild(loaderLabel);
    loaderWrapper.appendChild(loaderSelect);

    themeSelect.closest("div").insertAdjacentElement("afterend", loaderWrapper);
    themeSelect.closest("div").insertAdjacentElement("afterend", wrapper);
  }

  setInterval(addOverlayDropdown, 1000);
  setInterval(renderUpdateButton, 1000);

  setTimeout(() => checkForAddonUpdates(false), 3000);
  setInterval(() => checkForAddonUpdates(false), 1000 * 60 * 60);

  unsafeWindow.clearNatalieTheme = function () {
    GM_setValue(OVERLAY_KEY, "none");
    document.documentElement.removeAttribute("data-apm-natalie");
    location.reload();
  };
})();
