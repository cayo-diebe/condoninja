"""Generate original, short synthesized sound previews; no external samples."""
import math
import random
import subprocess
import tempfile
import wave
from array import array
from pathlib import Path

RATE = 44100
OUTPUT = Path(__file__).resolve().parents[1] / "assets/audio/previews"
OUTPUT.mkdir(parents=True, exist_ok=True)


def render(name, duration, variant):
    rng = random.Random(100 + variant)
    samples = []
    phase = 0.0
    noise = 0.0
    for i in range(round(duration * RATE)):
        t = i / RATE
        u = t / duration
        noise = .96 * noise + .04 * rng.uniform(-1, 1)
        if variant == 0:  # Soft, rounded low pulse with a descending tail.
            frequency = 66 + 46 * math.exp(-t * 11)
            envelope = (1 - math.exp(-t * 95)) * math.exp(-t * 5.5)
            tone = .76 * math.sin(phase) + .18 * math.sin(phase * 2) + .05 * math.sin(phase * 3)
            value = envelope * tone
        elif variant == 1:  # Slow shadow swell, then a soft low landing.
            frequency = 60 + 22 * (1 - u)
            envelope = math.sin(math.pi * u) ** 1.4
            tone = .63 * math.sin(phase) + .19 * math.sin(phase * 1.008) + .13 * math.sin(phase * 2)
            value = envelope * (tone + .25 * noise)
        elif variant == 2:  # A brief build-up resolving into a warm resonant pulse.
            frequency = 72 + 65 * math.exp(-max(t - .23, 0) * 9)
            envelope = (t / .23) ** 1.6 * .24 if t < .23 else math.exp(-(t - .23) * 4.2) * (1 - math.exp(-(t - .23) * 140))
            tone = .67 * math.sin(phase) + .2 * math.sin(phase * 2) + .07 * math.sin(phase * 3)
            value = envelope * (tone + .22 * noise)
        else:  # Two gentle bass beats, with a quiet electronic harmonic.
            frequency = 76 + 15 * math.exp(-t * 8)
            envelope = 0.0
            for start, gain in [(0, .65), (.26, 1)]:
                dt = t - start
                if dt >= 0:
                    envelope += gain * (1 - math.exp(-dt * 100)) * math.exp(-dt * 8)
            tone = .75 * math.sin(phase) + .17 * math.sin(phase * 2) + .04 * math.sin(phase * 4)
            value = envelope * tone
        phase += 2 * math.pi * frequency / RATE
        # Smooth both ends to avoid clicks, including on looping/replay.
        fade = min(1, t / .012) * min(1, (duration - t) / .09)
        samples.append(value * fade)

    peak = max(abs(value) for value in samples)
    pcm = array("h", (round(value / peak * .62 * 32767) for value in samples))
    with tempfile.TemporaryDirectory(prefix="ninja-sound-") as directory:
        source = Path(directory) / "preview.wav"
        with wave.open(str(source), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(RATE)
            output.writeframes(pcm.tobytes())
        target = OUTPUT / f"{name}.mp3"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), "-ar", "44100", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", "-map_metadata", "-1", str(target)], check=True)
        print(f"{target}: {duration:.2f}s, {target.stat().st_size} bytes")


for spec in [("01-pulso", .75, 0), ("02-sombra", 1.2, 1), ("03-despertar", 1.1, 2), ("04-energia", .95, 3)]:
    render(*spec)
