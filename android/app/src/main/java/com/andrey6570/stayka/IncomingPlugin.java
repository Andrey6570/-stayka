package com.andrey6570.stayka;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Hands the text that was shared into the app (if any) to the web code, once.
@CapacitorPlugin(name = "Incoming")
public class IncomingPlugin extends Plugin {
    @PluginMethod
    public void take(PluginCall call) {
        JSObject result = new JSObject();
        String text = MainActivity.takePending();
        if (text != null) result.put("text", text);
        call.resolve(result);
    }
}
