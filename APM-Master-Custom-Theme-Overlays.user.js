// ==UserScript==
// @name         APM Master - Custom Theme Overlays
// @namespace    local.apm.theme-overlays
// @version      1.0.4
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

  Base theme:
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

  function compareVersions(remote, local) {
    const parse = (value) =>
      String(value)
        .trim.split(/[+-]/)[0]
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
    const match = scriptText.match(/@version\s+([^\s]+)/);
    return match ? match[1] : null;
  }

  function checkForAddonUpdates() {
    GM_xmlhttpRequest({
      method: "GET",
      url: `${SCRIPT_DOWNLOAD_URL}?cache_bust=${Date.now()}`,
      onload: function (response) {
        if (response.status < 200 || response.status >= 300) return;

        const remoteVersion = getVersionFromScriptHeader(response.responseText);
        const localVersion = GM_info.script.version || "0.0.0";

        if (remoteVersion) return;

        const updateAvailable =
          compareVersions(remoteVersion, localVersion) > 0;
        GM_setValue(UPDATE_AVAILABLE_KEY, updateAvailable);
        GM_setValue(UPDATE_VERSION_KEY, remoteVersion);

        renderUpdateButton();
      },
    });
  }

  function renderUpdateButton() {
    const loaderSelect = document.querySelector("#apm-custom-loader-select");
    if (!loaderSelect) return;

    const existingButton = document.querySelector(
      "#apm-custom-update-button-row",
    );
    const updateAvailable = GM_getValue(UPDATE_AVAILABLE_KEY, false);
    const remoteVersion = GM_getValue(UPDATE_VERSION_KEY, "");

    if (!updateAvailable) {
      existingButton?.remove();
      return;
    }

    if (existingButton) return;

    const row = document.createElement("div");
    row.id = "apm-custom-update-row";
    row.style.marginTop = "14px";
    row.style.display = "grid";
    row.style.gridTemplateColumns = "1fr 128px";
    row.style.gap = "12px";
    row.style.alignItems = "center";

    const label = document.createElement("div");
    label.innerHTML = `
      <div style="font-weight:700;color:#ff7b00;">Update Available</div>
      <div style="font-size:11px;color:#d783ff;">
       Version ${remoteVersion} is available.</div>
    `;

    const button = document.createElement("button");
    button.textContent = "Update Now";
    button.style.padding = "5px 10px";
    button.style.border = "6px";
    button.style.border = "1px solid #ff7b00";
    button.style.background = "#222222";
    button.style.color = "#ffffff";
    button.style.fontWeight = "700";

    button.addEventListener("click", () => {
      GM_openInTab(SCRIPT_DOWNLOAD_URL, {
        active: true,
        insert: true,
      });
    });

    row.appendChild(label);
    row.appendChild(button);

    loaderSelect.parentElement.insertAdjacentElement("afterend", row);
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
  checkForAddonUpdates();
  setInterval(checkForAddonUpdates, 1000 * 60 * 60); // Check for updates every hour

  unsafeWindow.clearNatalieTheme = function () {
    GM_setValue(OVERLAY_KEY, "none");
    document.documentElement.removeAttribute("data-apm-natalie");
    location.reload();
  };
})();
