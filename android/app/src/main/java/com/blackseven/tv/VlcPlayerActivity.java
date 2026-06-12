package com.blackseven.tv;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;

import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;
import org.videolan.libvlc.util.VLCVideoLayout;

import java.util.ArrayList;

/**
 * The Few — Lecteur plein écran libVLC. Décode TOUT (HEVC/AC-3…) avec repli
 * logiciel automatique, indépendamment du décodeur matériel de l'appareil.
 * « Retour » ferme l'Activity et revient à l'app.
 */
public class VlcPlayerActivity extends Activity {

    private LibVLC libVLC;
    private MediaPlayer mediaPlayer;
    private VLCVideoLayout videoLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        videoLayout = new VLCVideoLayout(this);
        setContentView(videoLayout);

        ArrayList<String> options = new ArrayList<>();
        options.add("--no-drop-late-frames");
        options.add("--no-skip-frames");
        options.add("--network-caching=1500");
        libVLC = new LibVLC(this, options);
        mediaPlayer = new MediaPlayer(libVLC);
        mediaPlayer.attachViews(videoLayout, null, false, false);

        String url = getIntent().getStringExtra("url");
        if (url == null) {
            finish();
            return;
        }
        Media media = new Media(libVLC, Uri.parse(url));
        // HW préféré, repli logiciel automatique si le codec n'est pas géré.
        media.setHWDecoderEnabled(true, false);
        mediaPlayer.setMedia(media);
        media.release();
        mediaPlayer.play();
    }

    @Override
    protected void onDestroy() {
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
