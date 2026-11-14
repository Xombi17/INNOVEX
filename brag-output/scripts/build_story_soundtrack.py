import subprocess
import os

AUDIO_DIR = "brag-output/assets/audio"
SFX_DIR = ".agents/skills/brag/assets/sfx"
MUSIC_FILE = ".agents/skills/brag/assets/music/happy-beats-business-moves-vol-11-by-ende-dot-app.mp3"
OUT_AUDIO = os.path.join(AUDIO_DIR, "soundtrack_story_64s.wav")
OUT_MP3 = os.path.join(AUDIO_DIR, "soundtrack_story_64s.mp3")

os.makedirs(AUDIO_DIR, exist_ok=True)

# 6 Story VO lines with measured durations and non-overlapping start times
# act1_vo: 5.35s
# act2_vo: 12.26s
# act3_vo: 12.79s
# act4_vo: 10.39s
# act5_vo: 8.98s
# act6_vo: 6.43s

vo_schedule = [
    { "id": "act1_vo", "start_sec": 0.6 },   # 0.60 -> 5.95s
    { "id": "act2_vo", "start_sec": 7.4 },   # 7.40 -> 19.66s
    { "id": "act3_vo", "start_sec": 21.0 },  # 21.00 -> 33.79s
    { "id": "act4_vo", "start_sec": 35.0 },  # 35.00 -> 45.39s
    { "id": "act5_vo", "start_sec": 46.5 },  # 46.50 -> 55.48s
    { "id": "act6_vo", "start_sec": 56.5 },  # 56.50 -> 62.93s
]

TOTAL_DUR = 64.0

filter_complex = [
    # Background music loops, trimmed to 64.0s, ducked under narration
    f"[0:a]aloop=loop=-1:size=2e+09,atrim=0:{TOTAL_DUR},asetpts=PTS-STARTPTS,volume=0.17,afade=t=in:ss=0:d=1.0,afade=t=out:st=61.5:d=2.5[music]",
    
    # 6 Narration lines
    f"[1:a]adelay={int(vo_schedule[0]['start_sec']*1000)}|{int(vo_schedule[0]['start_sec']*1000)},volume=1.25[vo1]",
    f"[2:a]adelay={int(vo_schedule[1]['start_sec']*1000)}|{int(vo_schedule[1]['start_sec']*1000)},volume=1.25[vo2]",
    f"[3:a]adelay={int(vo_schedule[2]['start_sec']*1000)}|{int(vo_schedule[2]['start_sec']*1000)},volume=1.25[vo3]",
    f"[4:a]adelay={int(vo_schedule[3]['start_sec']*1000)}|{int(vo_schedule[3]['start_sec']*1000)},volume=1.25[vo4]",
    f"[5:a]adelay={int(vo_schedule[4]['start_sec']*1000)}|{int(vo_schedule[4]['start_sec']*1000)},volume=1.25[vo5]",
    f"[6:a]adelay={int(vo_schedule[5]['start_sec']*1000)}|{int(vo_schedule[5]['start_sec']*1000)},volume=1.25[vo6]",

    # Precise SFX cues verified to exist
    "[7:a]adelay=4500|4500,volume=0.85[sfx_click]",      # 4.5s click Allow
    "[8:a]adelay=6800|6800,volume=0.75[sfx_cut]",        # 6.8s blackout cut
    "[9:a]adelay=9500|9500,volume=0.6[sfx_pulse1]",      # 9.5s hop 1
    "[10:a]adelay=12000|12000,volume=0.6[sfx_pulse2]",   # 12.0s hop 2
    "[11:a]adelay=14500|14500,volume=0.65[sfx_pulse3]",  # 14.5s hop 3
    "[12:a]adelay=25500|25500,volume=0.75[sfx_laser]",   # 25.5s laser cut
    "[13:a]adelay=35000|35000,volume=0.85[sfx_shield]",  # 35.0s hero shield slam
    "[14:a]adelay=48000|48000,volume=0.7[sfx_guard]",    # 48.0s pre-consent shield
    "[15:a]adelay=57000|57000,volume=0.8[sfx_bong]",     # 57.0s closing bell

    "[music][vo1][vo2][vo3][vo4][vo5][vo6][sfx_click][sfx_cut][sfx_pulse1][sfx_pulse2][sfx_pulse3][sfx_laser][sfx_shield][sfx_guard][sfx_bong]amix=inputs=16:duration=first:dropout_transition=2,volume=1.25[outa]"
]

cmd = [
    "ffmpeg", "-y",
    "-i", MUSIC_FILE,
    "-i", os.path.join(AUDIO_DIR, "act1_vo.mp3"),
    "-i", os.path.join(AUDIO_DIR, "act2_vo.mp3"),
    "-i", os.path.join(AUDIO_DIR, "act3_vo.mp3"),
    "-i", os.path.join(AUDIO_DIR, "act4_vo.mp3"),
    "-i", os.path.join(AUDIO_DIR, "act5_vo.mp3"),
    "-i", os.path.join(AUDIO_DIR, "act6_vo.mp3"),
    "-i", os.path.join(SFX_DIR, "interface/click_001.ogg"),
    "-i", os.path.join(SFX_DIR, "impact/impactPlate_heavy_000.ogg"),
    "-i", os.path.join(SFX_DIR, "interface/glitch_002.ogg"),
    "-i", os.path.join(SFX_DIR, "interface/glitch_004.ogg"),
    "-i", os.path.join(SFX_DIR, "interface/glitch_002.ogg"),
    "-i", os.path.join(SFX_DIR, "impact/impactPlate_heavy_002.ogg"),
    "-i", os.path.join(SFX_DIR, "impact/impactPlate_heavy_004.ogg"),
    "-i", os.path.join(SFX_DIR, "interface/select_008.ogg"),
    "-i", os.path.join(SFX_DIR, "interface/bong_001.ogg"),
    "-filter_complex", ";".join(filter_complex),
    "-map", "[outa]",
    "-c:a", "pcm_s16le",
    OUT_AUDIO
]

print("[FFmpeg] Mixing 16-channel 64s soundtrack...")
subprocess.run(cmd, check=True)

subprocess.run([
    "ffmpeg", "-y", "-i", OUT_AUDIO, "-c:a", "libmp3lame", "-b:a", "320k", OUT_MP3
], check=True)

res = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", OUT_MP3
], capture_output=True, text=True, check=True)
print(f"[Done] Rendered 64s soundtrack: {float(res.stdout.strip()):.2f}s -> {OUT_MP3}")
