// Android bits: hardware back button, opening links in other apps, the share sheet, and text shared into the app (e.g. from Google Maps).
// Loaded lazily so the app also runs in a plain browser.
import { App } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Share } from "@capacitor/share";

// Links go to the system (Google Maps app or browser). On Android a top-level navigation away from the app is handed to another app by Capacitor.
export function openExternal(url) {
  if (!/^https:\/\//i.test(url)) return;
  if (Capacitor.isNativePlatform()) window.location.href = url; else window.open(url, "_blank", "noopener");
}

// Returns "shared", "cancelled", "copied" (no share sheet available: text copied) or "failed".
export async function share({ title, text }) {
  try {
    if (Capacitor.isNativePlatform()) { await Share.share({ title, text, dialogTitle: title }); return "shared"; }
    if (navigator.share) { await navigator.share({ title, text }); return "shared"; }
  } catch (e) {
    if (e && /cancel|abort/i.test(String(e.name || "") + String(e.message || ""))) return "cancelled";
  }
  try { await navigator.clipboard.writeText(text); return "copied"; } catch (e) { return "failed"; }
}

export function init(h) {
  App.addListener("backButton", () => {
    if (h.isOpen()) { h.close(); return; }
    if (h.home() !== false) return;
    App.exitApp();
  });
  if (Capacitor.isNativePlatform() && h.onShared) {
    const Incoming = registerPlugin("Incoming");
    const take = () => Incoming.take().then(r => { if (r && r.text) h.onShared(r.text); }).catch(() => {});
    take();
    window.addEventListener("stayka-share", take);
    App.addListener("resume", take);
  }
}
