"""Original modal-synthesis studies, inspired by resonant acoustic instruments.

These are synthesized interpretations, not field recordings or authentic samples.
"""
import math
import random
import subprocess
import tempfile
import wave
from array import array
from pathlib import Path

RATE = 44100
OUTPUT = Path(__file__).resolve().parents[1] / "assets/audio/meditation"
SOUNDS = [
    # name, seconds, fundamental, partial ratios, amplitudes, attack, decay, beating
    ("15-sino-profundo", 3.8, 82, [1, 2.02, 2.74, 4.08, 5.43], [1, .43, .18, .10, .025], .014, .65, .45),
    ("16-tigela-serena", 4.5, 130, [1, 2.71, 4.92, 7.71], [1, .20, .045, .012], .045, .48, .8),
    ("17-gongo-suave", 4.2, 65, [1, 1.44, 1.93, 2.56, 3.13, 4.27], [1, .24, .32, .10, .08, .02], .085, .7, .3),
    ("18-sino-de-madeira", 2.5, 155, [1, 2.76, 5.4, 8.93], [1, .28, .045, .01], .006, 2.7, .05),
    ("19-tigela-friccionada", 5.0, 110, [1, 2.73, 4.94], [1, .16, .03], .7, .24, .65),
    ("20-ritual-dois-toques", 4.8, 98, [1, 2.03, 2.78, 4.15], [1, .34, .12, .035], .025, .85, .55),
]


def synth(spec, seed):
    name, duration, base, ratios, amplitudes, attack, decay, beating = spec
    rng = random.Random(seed)
    modes = [(base * r, a, k) for k, (r, a) in enumerate(zip(ratios, amplitudes))]
    samples = []
    soft_noise = 0
    strikes = [(0, 1)] if "dois" not in name else [(0, .65), (1.25, 1)]
    for i in range(round(duration * RATE)):
        t = i / RATE
        soft_noise = .98 * soft_noise + .02 * rng.uniform(-1, 1)
        value = 0
        for start, strength in strikes:
            dt = t - start
            if dt < 0:
                continue
            onset = 1 - math.exp(-dt / attack)
            for frequency, amplitude, k in modes:
                # Closely spaced modes create the slow beating of resonant metal.
                detune = beating * (1 + .23 * k)
                phase = math.tau * frequency * dt
                fundamental = .7 * math.sin(phase) + .3 * math.sin(phase + math.tau * detune * dt)
                envelope = math.exp(-dt * decay * (1 + .62 * k))
                if "friccionada" in name:
                    envelope *= .92 + .08 * math.sin(math.tau * .65 * dt)
                value += strength * onset * amplitude * envelope * fundamental
            value += .08 * strength * soft_noise * math.exp(-dt * 22)
        samples.append(value)
    # Quiet, diffused reflections: space without an exaggerated synthetic echo.
    wet = samples.copy()
    for seconds, gain in [(.037, .09), (.061, .07), (.101, .045), (.163, .025)]:
        delay = round(seconds * RATE)
        for i in range(delay, len(samples)):
            wet[i] += gain * samples[i - delay]
    for i in range(len(wet)):
        t = i / RATE
        fade = min(1, t / .006) * min(1, (duration - t) / .8)
        wet[i] *= fade
    peak = max(abs(x) for x in wet)
    return array("h", (round(x / peak * .50 * 32767) for x in wet))


OUTPUT.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="meditation-audio-") as temporary:
    for seed, spec in enumerate(SOUNDS):
        source = Path(temporary) / "source.wav"
        with wave.open(str(source), "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(synth(spec, seed))
        target = OUTPUT / f"{spec[0]}.mp3"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), "-c:a", "libmp3lame", "-b:a", "64k", "-map_metadata", "-1", str(target)], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(target), "-f", "null", "-"], check=True)
        print(f"{target.name}: {spec[1]}s, {target.stat().st_size / 1000:.1f} KB")
