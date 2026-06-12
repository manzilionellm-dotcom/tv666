package com.blackseven.tv;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;

import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;
import org.videolan.libvlc.util.VLCVideoLayout;

import java.util.ArrayList;

/**
 * The Few — Lecteur plein écran libVLC. Décode TOUT (HEVC/AC-3…) avec repli
 * logiciel. Anti-gel : si l'image se fige (plus de progression), reconnexion
 * automatique (live = rattrape le direct ; VOD = reprend où on en était).
 */
public class VlcPlayerActivity extends Activity {

    private LibVLC libVLC;
    private MediaPlayer mediaPlayer;
    private VLCVideoLayout videoLayout;
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

        videoLayout = new VLCVideoLayout(this);
        setContentView(videoLayout);

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
        libVLC = new LibVLC(this, options);

        mediaPlayer = new MediaPlayer(libVLC);
        mediaPlayer.setEventListener(this::onPlayerEvent);

        // On attend que la VLCVideoLayout soit posée (surface prête) avant
        // d'attacher la vue et de lancer : évite l'écran noir. TextureView
        // (4e param true) rend dans la hiérarchie de vues -> plus fiable sur TV.
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
        media.setHWDecoderEnabled(true, false); // HW préféré, repli logiciel auto
        mediaPlayer.setMedia(media);
        media.release();
        mediaPlayer.play();
    }

    private void onPlayerEvent(MediaPlayer.Event event) {
        switch (event.type) {
            case MediaPlayer.Event.TimeChanged:
            case MediaPlayer.Event.Buffering:
            case MediaPlayer.Event.Playing:
                // Activité de lecture/tampon = pas gelé.
                lastProgressAt = System.currentTimeMillis();
                recovering = false;
                if (pendingSeekMs >= 0 && event.type == MediaPlayer.Event.Playing) {
                    final long seek = pendingSeekMs;
                    pendingSeekMs = -1L;
                    handler.postDelayed(() -> {
                        if (mediaPlayer != null) mediaPlayer.setTime(seek);
                    }, 800);
                }
                break;
            case MediaPlayer.Event.EncounteredError:
            case MediaPlayer.Event.EndReached:
                if (isLive) recover(); // le live ne « finit » pas : on reconnecte
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
