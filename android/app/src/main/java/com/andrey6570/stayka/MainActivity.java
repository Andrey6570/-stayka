package com.andrey6570.stayka;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final Object LOCK = new Object();
    private static String pendingText = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(IncomingPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null) getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        readShare(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (readShare(intent) && getBridge() != null) {
            getBridge().triggerWindowJSEvent("stayka-share");
        }
    }

    // Text sent to the app with the system Share menu (for example a place from Google Maps).
    private boolean readShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction()) || !"text/plain".equals(intent.getType())) return false;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        intent.removeExtra(Intent.EXTRA_TEXT);
        if (text == null || text.trim().isEmpty()) return false;
        synchronized (LOCK) {
            pendingText = text.length() > 2000 ? text.substring(0, 2000) : text;
        }
        return true;
    }

    static String takePending() {
        synchronized (LOCK) {
            String t = pendingText;
            pendingText = null;
            return t;
        }
    }
}
