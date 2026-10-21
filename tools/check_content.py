"""學習內容檢查工具（SPEC 6.8）

用法：python3 tools/check_content.py
- 錯誤（ERROR）：必須修正才能推送
- 提醒（CHECK）：需要人工再看一次，確認沒問題即可
日文讀音以 pykakasi 獨立比對（pip install pykakasi），沒有安裝時略過該項。
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors, checks = [], []
err = lambda m: errors.append(m)
chk = lambda m: checks.append(m)

try:
    import pykakasi
    kks = pykakasi.kakasi()
except ImportError:
    kks = None
    chk("未安裝 pykakasi，略過日文讀音比對")

HIRA = re.compile(r"^[ぁ-ゖー]+$")
CJK = re.compile(r"[一-鿿]")
KK_OK = set("abdefghijklmnoprstuvwzæɑɔəɚɝɛɪʊʌʃʒθðŋˋˏḷṇ ")
VERSION = re.compile(r"^\d{4}\.\d{2}\.\d{2}$")


def load(name):
    data = json.loads((ROOT / "content" / name).read_text(encoding="utf-8"))
    if not VERSION.match(str(data.get("version", ""))):
        err(f"{name}: version 格式應為 YYYY.MM.DD")
    return data["items"]


def common(items, required):
    seen = set()
    for it in items:
        i = it.get("id", "?")
        if i in seen:
            err(f"{i}: id 重複")
        seen.add(i)
        for f in required:
            v = it.get(f)
            if v in (None, ""):
                err(f"{i}: 缺少欄位 {f}")
            elif isinstance(v, str) and v != v.strip():
                err(f"{i}: {f} 前後有多餘空白")


# ---------- 英文 ----------
en = load("english.json")
common(en, ["id", "level", "topic", "word", "pos", "zh", "example", "exampleZh", "kk"])
words = set()
for it in en:
    i, w = it["id"], it["word"]
    if not re.match(rf"^en_l{it['level']}_\d{{3}}$", i):
        err(f"{i}: id 與 level 不一致")
    if w.lower() in words:
        err(f"{i}: 單字重複 {w}")
    words.add(w.lower())
    bad = set(it.get("kk", "")) - KK_OK
    if bad:
        err(f"{i} {w}: KK 音標含不明符號 {''.join(sorted(bad))}")
    kk = it.get("kk", "")
    if " " not in w and kk.count("ˋ") > 1:
        err(f"{i} {w}: KK 主重音超過一個")
    # 例句要出現該單字（允許字尾變化）
    ex = it["example"].lower()
    stems = [t[: max(3, len(t) - 2)] for t in w.lower().split()]
    if not all(s in ex for s in stems):
        chk(f"{i} {w}: 例句中找不到這個單字 → {it['example']}")
    if not CJK.search(it["zh"]) or not CJK.search(it["exampleZh"]):
        err(f"{i} {w}: 中文欄位沒有中文")
    if not it["example"][0].isupper() or it["example"][-1] not in ".?!":
        chk(f"{i} {w}: 例句開頭大寫／句尾標點")

# ---------- 日文 ----------
ja = load("japanese.json")
common(ja, ["id", "type", "lesson"])


def hira(text):
    return "".join(x["hira"] for x in kks.convert(text))


def hep(text):
    return "".join(x["hepburn"] for x in kks.convert(text))


lessons = {}
row_lesson = {}
for it in ja:
    i = it["id"]
    lessons.setdefault(it["lesson"], []).append(it)
    if it["type"] == "kana":
        common([it], ["kana", "romaji", "row", "group", "script"])
        if not HIRA.match(it["kana"]):
            err(f"{i}: kana 不是平假名")
        if row_lesson.setdefault(it["row"], it["lesson"]) != it["lesson"]:
            err(f"{i}: 同一行的假名被分到不同天（{it['row']}）")
        if kks:
            ref = hep(it["kana"])
            if ref != it["romaji"]:
                chk(f"{i} {it['kana']}: 拼音 {it['romaji']}，比對工具為 {ref}")
    elif it["type"] == "phrase":
        common([it], ["ja", "kana", "romaji", "zh", "scene"])
        if not HIRA.match(it["kana"]):
            err(f"{i}: kana 欄位應全為平假名（可含ー）")
        if not CJK.search(it["zh"]):
            err(f"{i}: zh 沒有中文")
        if kks:
            ref = hira(it["ja"])
            if ref != it["kana"]:
                chk(f"{i} {it['ja']}: 平假名 {it['kana']}，比對工具為 {ref}")
            # 助詞 は／を 讀作 wa／o：兩邊都統一成 ha／o 再比對
            norm = lambda s: s.replace(" ", "").replace("wa", "ha").replace("wo", "o")
            mine = it["romaji"]
            ref_ro = hep(it["kana"])
            if norm(mine) != norm(ref_ro):
                chk(f"{i} {it['ja']}: 拼音 {it['romaji']}，比對工具為 {ref_ro}")
    else:
        err(f"{i}: 不明的 type {it['type']}")

for no, its in sorted(lessons.items()):
    if not 5 <= len(its) <= 8:
        chk(f"第 {no} 課有 {len(its)} 個（建議 5–8）")
nums = [it["lesson"] for it in ja]
if nums != sorted(nums):
    err("日文 lesson 編號沒有依順序排列")

# ---------- 結果 ----------
print(f"英文 {len(en)} 個、日文 {len(ja)} 個（{len(lessons)} 課）")
for m in errors:
    print("ERROR", m)
for m in checks:
    print("CHECK", m)
print(f"錯誤 {len(errors)}、需人工確認 {len(checks)}")
sys.exit(1 if errors else 0)
