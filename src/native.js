// Android hardware back button: close the open sheet, then go back to "Today", then leave the app.
import { App } from "@capacitor/app";

export function init(h) {
  App.addListener("backButton", () => {
    if (h.isOpen()) { h.close(); return; }
    if (h.home() !== false) return;
    App.exitApp();
  });
}
