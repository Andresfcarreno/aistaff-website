#!/usr/bin/env python3
"""Genera index.html (home simple) desde tools/home_template.html.
Precios y planes: tools/plans.json · menú de sectores: tools/sectors_menu.json."""
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = open(os.path.join(R, "tools", "home_template.html"), encoding="utf-8").read()
plans = json.load(open(os.path.join(R, "tools", "plans.json"), encoding="utf-8"))
secs = json.load(open(os.path.join(R, "tools", "sectors_menu.json"), encoding="utf-8"))
t = t.replace("%%PLANS%%", json.dumps(plans, ensure_ascii=False)).replace("%%SECTORS%%", json.dumps(secs, ensure_ascii=False))
open(os.path.join(R, "index.html"), "w", encoding="utf-8").write(t)
print("wrote index.html", len(t))
