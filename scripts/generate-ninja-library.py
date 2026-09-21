"""Ten original synthesized ninja-inspired UI sounds (no recorded samples)."""
import math
import random
import subprocess
import tempfile
import wave
from array import array
from pathlib import Path

RATE = 44100
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/audio/ninja-library"
TAU = math.tau


def ring(t, base, decay=5, brightness=.5):
    if t < 0:
        return 0
    # Inharmonic resonances evoke steel, rather than a musical sine chord.
    ratios = (1, 1.47, 2.09, 2.71, 3.83)
    return (1 - math.exp(-t * 650)) * sum(
        (brightness ** k) * math.sin(TAU * base * ratio * t)
        * math.exp(-t * decay * (1 + .42 * k))
        for k, ratio in enumerate(ratios)
    )


def thump(t, pitch=70, decay=10):
    if t < 0:
        return 0
    return (1 - math.exp(-t * 180)) * math.exp(-t * decay) * math.sin(TAU * (pitch * t + 3 * (1 - math.exp(-t * 18))))


SOUNDS = [
    ("05-katana", .95, "Katana", "Desembainhar: fricção curta e ressonância de aço."),
    ("06-corte-de-vento", .65, "Corte de vento", "Passagem rápida de lâmina, com um final grave."),
    ("07-duelo", .9, "Duelo", "Choque seco entre duas lâminas."),
    ("08-shuriken", .8, "Shuriken", "Três pequenos movimentos metálicos, em sequência."),
    ("09-bainha", .55, "Bainha", "Deslize curto seguido de um encaixe metálico."),
    ("10-gongo-da-sombra", 1.7, "Gongo da sombra", "Ressonância baixa, escura e cerimonial."),
    ("11-reflexao", 1.8, "Reflexão", "Dois tons suaves, espaçados, com cauda contemplativa."),
    ("12-passo-furtivo", .65, "Passo furtivo", "Dois impactos abafados, quase sem brilho metálico."),
    ("13-despertar-do-aco", 1.35, "Despertar do aço", "Crescimento de energia, grave e brilho de lâmina."),
    ("14-portal-neon", 1.25, "Portal neon", "Pulso eletrônico ascendente e reflexo metálico."),
]


def synth(index, duration):
    rng = random.Random(800 + index)
    samples = []
    low = 0
    for i in range(round(RATE * duration)):
        t = i / RATE
        n = rng.uniform(-1, 1)
        low = .88 * low + .12 * n
        high = n - low
        if index == 0:
            value = .5 * high * math.exp(-((t - .12) / .07) ** 2) + .45 * ring(t - .12, 610, 5, .45)
        elif index == 1:
            value = 2 * low * math.exp(-((t - .20) / .085) ** 2) + .24 * thump(t - .24, 86)
        elif index == 2:
            value = .48 * ring(t - .02, 430, 6, .65) + .28 * ring(t - .035, 683, 8, .5) + .18 * thump(t - .02, 100)
        elif index == 3:
            value = sum(g * (.32 * ring(t - start, base, 17, .4) + .3 * low * math.exp(-((t - start) / .025) ** 2)) for start, base, g in [(.04, 900, .6), (.18, 1120, .8), (.32, 720, 1)])
        elif index == 4:
            value = .9 * low * math.exp(-((t - .10) / .07) ** 2) + .3 * ring(t - .22, 370, 22, .5) + .6 * thump(t - .22, 110, 25)
        elif index == 5:
            value = .6 * ring(t, 115, 2.4, .65) + .2 * ring(t, 173, 3.3, .4)
        elif index == 6:
            value = .5 * ring(t, 294, 2.6, .18) + .32 * ring(t - .38, 440, 3, .12)
        elif index == 7:
            value = .6 * thump(t - .025, 66, 22) + .45 * thump(t - .24, 58, 20) + .7 * low * (math.exp(-((t - .04) / .025) ** 2) + .6 * math.exp(-((t - .255) / .03) ** 2))
        elif index == 8:
            value = .85 * low * math.exp(-((t - .27) / .13) ** 2) + .6 * thump(t - .36, 65, 4.5) + .28 * ring(t - .36, 510, 4, .3)
        else:
            envelope = math.sin(math.pi * t / duration) ** 2
            value = .45 * envelope * math.sin(TAU * (65 * t + 30 * t * t)) + .22 * ring(t - .48, 660, 5, .2) + .2 * envelope * math.sin(TAU * (130 * t + 60 * t * t))
        samples.append(value)
    # Short, quiet reflections add space without a long or large reverb tail.
    wet = samples.copy()
    for delay, gain in [(.043, .12), (.079, .07)]:
        offset = round(delay * RATE)
        for i in range(offset, len(samples)):
            wet[i] += samples[i - offset] * gain
    for i in range(len(wet)):
        wet[i] *= min(1, i / (RATE * .006)) * min(1, (len(wet) - 1 - i) / (RATE * .12))
    peak = max(abs(x) for x in wet)
    return array("h", (round(x / peak * .55 * 32767) for x in wet))


OUTPUT.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="ninja-library-") as directory:
    for index, (name, duration, title, description) in enumerate(SOUNDS):
        source = Path(directory) / "sound.wav"
        with wave.open(str(source), "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(synth(index, duration).tobytes())
        target = OUTPUT / f"{name}.mp3"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), "-ac", "1", "-b:a", "64k", "-map_metadata", "-1", str(target)], check=True)
        # Decode every output to ensure the exported file is valid.
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(target), "-f", "null", "-"], check=True)
        print(f"{title}: {duration:.2f}s · {target.stat().st_size / 1000:.1f} KB · {target}")
