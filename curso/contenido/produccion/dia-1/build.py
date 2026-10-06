"""Ensambla un módulo del curso: diapositivas + narración + subtítulos -> MP4 y SRT.

Uso: python build.py manifest.json salida.mp4
Cada segmento del manifest: {"slide": "01", "audio": "01", "text": "..."}
Lee png/<slide>.png y audio/<audio>.mp3 desde la carpeta del manifest.
"""
import json, os, re, subprocess, sys, tempfile

import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
LEAD, TAIL, FADE = 0.35, 0.65, 0.25
W, H, FPS = 1920, 1080, 30


def duration(path):
    out = subprocess.run([FF, "-i", path], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def chunks(text, limit=78):
    """Parte el texto en frases cortas para subtítulos."""
    parts = re.split(r"(?<=[.!?:])\s+", text.strip())
    out = []
    for p in parts:
        words, line = p.split(), ""
        for w in words:
            if len(line) + len(w) + 1 > limit and line:
                out.append(line)
                line = w
            else:
                line = (line + " " + w).strip()
        if line:
            out.append(line)
    return out


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def render_captions(caps, folder):
    """Dibuja cada subtítulo como PNG transparente con la tipografía de la marca."""
    html = os.path.join(folder, "cap.html")
    fonts = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), "fonts", "fonts.css")
    with open(html, "w") as f:
        f.write(f"""<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://{fonts}">
<style>body{{margin:0;background:transparent}}.c{{width:{W}px;height:{H}px;position:relative}}
.c span{{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);max-width:1500px;text-align:center;
font-family:'Geist',sans-serif;font-weight:500;font-size:44px;line-height:1.3;color:#F3F5FF;padding:14px 30px;border-radius:18px;
background:rgba(4,5,11,.72);box-shadow:0 0 0 1px rgba(190,200,255,.16) inset}}</style></head><body>
{''.join(f'<div class="c" id="c{i}"><span>{c}</span></div>' for i, c in enumerate(caps))}</body></html>""")
    js = os.path.join(folder, "cap.js")
    with open(js, "w") as f:
        f.write(f"""const {{ chromium }} = require('playwright');
(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:{W},height:{H}}}}});
await p.goto('file://{html}');await p.evaluate(()=>document.fonts.ready);
for(let i=0;i<{len(caps)};i++){{await (await p.$('#c'+i)).screenshot({{path:'{folder}/cap'+i+'.png',omitBackground:true}});}}
await b.close();}})();""")
    npm_root = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True).stdout.strip()
    subprocess.run(["node", js], check=True, env={**os.environ, "NODE_PATH": npm_root})


def main():
    manifest, out_path = sys.argv[1], sys.argv[2]
    base = os.path.dirname(os.path.abspath(manifest))
    segs = json.load(open(manifest))
    work = tempfile.mkdtemp(dir=base)
    clips, srt, t0, n = [], [], 0.0, 1

    for k, seg in enumerate(segs):
        audio = os.path.join(base, "audio", seg["audio"] + ".mp3")
        slide = os.path.join(base, "png", seg["slide"] + ".png")
        adur = duration(audio)
        total = LEAD + adur + TAIL
        caps = chunks(seg["text"])
        folder = os.path.join(work, f"s{k}")
        os.makedirs(folder)
        render_captions(caps, folder)

        # tiempo de cada subtítulo proporcional a su longitud
        weights = [len(c) for c in caps]
        acc, spans = LEAD, []
        for c, wgt in zip(caps, weights):
            d = adur * wgt / sum(weights)
            spans.append((acc, acc + d))
            srt.append(f"{n}\n{ts(t0 + acc)} --> {ts(t0 + acc + d)}\n{c}\n")
            acc += d
            n += 1

        frames = int(total * FPS)
        inputs = ["-loop", "1", "-framerate", str(FPS), "-i", slide, "-i", audio]
        for i in range(len(caps)):
            inputs += ["-loop", "1", "-framerate", str(FPS), "-i", os.path.join(folder, f"cap{i}.png")]
        # zoom lento sobre la diapositiva, fundidos y subtítulos encima
        fc = (f"[0:v]scale={W*2}:{H*2},zoompan=z='1+0.035*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
              f":d={frames}:s={W}x{H}:fps={FPS},trim=duration={total},"
              f"fade=t=in:st=0:d={FADE},fade=t=out:st={total-FADE}:d={FADE}[v0]")
        last = "v0"
        for i, (a, b) in enumerate(spans):
            fc += f";[{last}][{i+2}:v]overlay=0:0:enable='between(t,{a:.3f},{b:.3f})':shortest=1[v{i+1}]"
            last = f"v{i+1}"
        fc += f";[1:a]adelay={int(LEAD*1000)}:all=1,apad=whole_dur={total}[a]"
        clip = os.path.join(work, f"clip{k}.mp4")
        subprocess.run([FF, "-y", "-loglevel", "error", *inputs, "-filter_complex", fc,
                        "-map", f"[{last}]", "-map", "[a]", "-t", f"{total:.3f}",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "160k", "-ar", "44100", clip], check=True)
        clips.append(clip)
        t0 += total
        print(f"segmento {k+1}/{len(segs)} listo ({total:.1f}s)")

    lst = os.path.join(work, "list.txt")
    with open(lst, "w") as f:
        f.writelines(f"file '{c}'\n" for c in clips)
    subprocess.run([FF, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", "-movflags", "+faststart", out_path], check=True)
    with open(os.path.splitext(out_path)[0] + ".srt", "w") as f:
        f.write("\n".join(srt))
    print(f"video: {out_path} · duración {t0:.1f}s")


if __name__ == "__main__":
    main()
