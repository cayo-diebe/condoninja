"""Single original synthesized large-drum hit, inspired by odaiko.
Not an acoustic recording. Requires Python 3 and FFmpeg.
"""
import math
import random
import subprocess
import tempfile
import wave
from array import array
from pathlib import Path

RATE = 44100
DURATION = 3.4
target = Path(__file__).resolve().parents[1] / "assets/audio/meditation/21-odaiko-toque-unico.mp3"
target.parent.mkdir(parents=True, exist_ok=True)
rng = random.Random(210)
samples = []
low = 0.0
mid = 0.0
# Inharmonic drumhead modes, with higher modes damping much faster than the body.
modes = [(49, 1.0, 1.65), (78, .55, 2.7), (104, .34, 3.8),
         (132, .23, 5), (168, .14, 7), (221, .09, 11), (315, .045, 19)]
for i in range(round(RATE * DURATION)):
    t = i / RATE
    noise = rng.uniform(-1, 1)
    low += .018 * (noise - low)
    mid += .24 * (noise - mid)
    onset = 1 - math.exp(-t * 650)
    body = 0
    for frequency, amplitude, decay in modes:
        # Small initial pitch relaxation evokes a struck membrane, not a sine kick.
        phase = math.tau * frequency * (t + .12 * .027 * (1 - math.exp(-t / .027)))
        body += amplitude * math.sin(phase) * math.exp(-t * decay)
    stick = .48 * (mid - low) * math.exp(-t * 80)
    skin = 1.5 * low * math.exp(-t * 12)
    samples.append(onset * (body + stick + skin))

# Restrained room reflections, all derived from the same single strike.
wet = samples.copy()
for seconds, gain in [(.029, .10), (.047, .075), (.073, .055), (.113, .035), (.173, .02)]:
    offset = round(seconds * RATE)
    for i in range(offset, len(wet)):
        wet[i] += samples[i - offset] * gain
for i in range(len(wet)):
    wet[i] = math.tanh(wet[i] * .65) * min(1, i / (RATE * .002)) * min(1, (len(wet) - 1 - i) / (RATE * .5))
peak = max(abs(x) for x in wet)
pcm = array("h", (round(x / peak * .63 * 32767) for x in wet))
with tempfile.TemporaryDirectory(prefix="odaiko-hit-") as directory:
    source = Path(directory) / "hit.wav"
    with wave.open(str(source), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-c:a", "libmp3lame", "-b:a", "64k", "-map_metadata", "-1", str(target)], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(target), "-f", "null", "-"], check=True)
print(f"{target}: {DURATION}s, {target.stat().st_size / 1000:.1f} KB")
