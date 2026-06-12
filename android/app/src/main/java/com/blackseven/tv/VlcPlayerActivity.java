package com.blackseven.tv;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;

import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;
import org.videolan.libvlc.util.VLCVideoLayout;

import java.util.ArrayList;

/**
 * The Few — Lecteur plein écran libVLC.
 * Décodage 100% LOGICIEL forcé : l'image ne dépend pas du décodeur matériel
 * de la box (cause des écrans noirs HEVC/AC-3). Anti-gel : reconnexion auto.
 * Un état s'affiche à l'écran (connexion / erreur) au lieu d'un noir muet.
 */
public class VlcPlayerActivity extends Activity {

    private LibVLC libVLC;
    private MediaPlayer mediaPlayer;
    private VLCVideoLayout videoLayout;
    private TextView statusView;
    private String url;
    private boolean isLive = true;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private long lastProgressAt = 0L;
    private long pendingSeekMs = -1L; // reprise VOD après reconnexion
    private boolean recovering = false;

    private static final long FROZEN_MS = 15000L;   // gel toléré avant reconnexion
    private static final long WATCHDOG_MS = 4000L;   // période de surveillance

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#0E0E0E"));
        videoLayout = new VLCVideoLayout(this);
        root.addView(videoLayout, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        statusView = new TextView(this);
        statusView.setText("Connexion au flux…");
        statusView.setTextColor(Color.parseColor("#C6A664"));
        statusView.setTextSize(22f);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.CENTER;
        root.addView(statusView, lp);
        setContentView(root);

        url = getIntent().getStringExtra("url");
        isLive = getIntent().getBooleanExtra("live", true);
        if (url == null) {
            finish();
            return;
        }

        ArrayList<String> options = new ArrayList<>();
        options.add("--no-drop-late-frames");
        options.add("--no-skip-frames");
        // Plus de tampon = moins de gels sur réseau instable.
        options.add("--network-caching=3000");
        options.add("--live-caching=3000");
        options.add("--rtsp-tcp");
        // Meilleure qualité : toujours la rendition adaptative la plus haute.
        options.add("--adaptive-logic=highest");
        libVLC = new LibVLC(this, options);

        mediaPlayer = new MediaPlayer(libVLC);
        mediaPlayer.setEventListener(this::onPlayerEvent);

        // Attache une fois la surface posée. TextureView (4e param = true) :
        // rend l'image DANS la hiérarchie de vues -> aucun problème de fond
        // opaque/superposition (cause d'écran noir avec SurfaceView).
        videoLayout.post(() -> {
            if (mediaPlayer == null) return;
            mediaPlayer.attachViews(videoLayout, null, false, true);
            lastProgressAt = System.currentTimeMillis();
            playMedia();
            handler.postDelayed(watchdog, WATCHDOG_MS);
        });
    }

    private void playMedia() {
        Media media = new Media(libVLC, Uri.parse(url));
        // Décodage LOGICIEL forcé : image garantie quel que soit le codec,
        // même sans décodeur matériel HEVC/AC-3 sur la box.
        media.setHWDecoderEnabled(false, false);
        mediaPlayer.setMedia(media);
        media.release();
        mediaPlayer.play();
    }

    private void setStatus(final String text) {
        handler.post(() -> {
            if (statusView == null) return;
            if (text == null) {
                statusView.setVisibility(android.view.View.GONE);
            } else {
                statusView.setVisibility(android.view.View.VISIBLE);
                statusView.setText(text);
            }
        });
    }

    private void onPlayerEvent(MediaPlayer.Event event) {
        switch (event.type) {
            case MediaPlayer.Event.TimeChanged:
            case MediaPlayer.Event.Playing:
                lastProgressAt = System.currentTimeMillis();
                recovering = false;
                setStatus(null); // lecture en cours : on masque l'état
                if (pendingSeekMs >= 0 && event.type == MediaPlayer.Event.Playing) {
                    final long seek = pendingSeekMs;
                    pendingSeekMs = -1L;
                    handler.postDelayed(() -> {
                        if (mediaPlayer != null) mediaPlayer.setTime(seek);
                    }, 800);
                }
                break;
            case MediaPlayer.Event.Buffering:
                lastProgressAt = System.currentTimeMillis();
                break;
            case MediaPlayer.Event.EncounteredError:
                setStatus("⚠️ Erreur de lecture — reconnexion…");
                if (isLive) recover();
                break;
            case MediaPlayer.Event.EndReached:
                if (isLive) {
                    setStatus("Reconnexion au direct…");
                    recover(); // le live ne « finit » pas : on reconnecte
                } else {
                    finish();
                }
                break;
            default:
                break;
        }
    }

    // Surveillance : si plus aucune progression depuis FROZEN_MS, on reconnecte.
    private final Runnable watchdog = new Runnable() {
        @Override
        public void run() {
            if (mediaPlayer != null) {
                long idle = System.currentTimeMillis() - lastProgressAt;
                if (!recovering && idle > FROZEN_MS) {
                    setStatus("Reconnexion…");
                    recover();
                }
                handler.postDelayed(this, WATCHDOG_MS);
            }
        }
    };

    private void recover() {
        if (mediaPlayer == null || recovering) return;
        recovering = true;
        // VOD : on note où reprendre (léger retour arrière pour le confort).
        if (!isLive) {
            long t = mediaPlayer.getTime();
            pendingSeekMs = t > 30000 ? t - 30000 : 0;
        }
        lastProgressAt = System.currentTimeMillis();
        try {
            mediaPlayer.stop();
        } catch (Exception ignored) {
        }
        playMedia();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.detachViews();
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (libVLC != null) {
            libVLC.release();
            libVLC = null;
        }
        super.onDestroy();
    }
}
