from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from textwrap import wrap
from zipfile import ZIP_DEFLATED, ZipFile

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_PPTX = ROOT / "docs" / "presentation" / "current_source_map_20260506.pptx"
OUT_DIR = ROOT / "docs" / "presentation" / "exports" / "current_source_map_20260506"

SLIDE_W = 1920
SLIDE_H = 1080
EMU_PER_PX = 6350

BG = "F7F3EC"
INK = "243126"
MUTED = "657064"
GOLD = "B88A44"
GREEN = "45624D"
PALE = "EFE6D7"
BLUE = "5D7182"
RED = "A25B4B"
WHITE = "FFFFFF"


@dataclass
class TextItem:
    x: int
    y: int
    w: int
    h: int
    text: str
    size: int
    color: str = INK
    bold: bool = False
    name: str = "Text"


@dataclass
class BoxItem:
    x: int
    y: int
    w: int
    h: int
    fill: str
    line: str | None = None
    radius: int = 18
    name: str = "Box"


@dataclass
class LineItem:
    x1: int
    y1: int
    x2: int
    y2: int
    color: str = GOLD
    width: int = 4
    name: str = "Line"


@dataclass
class SlideSpec:
    title: str
    subtitle: str
    body: list[str]
    accent: str = GOLD
    footer: str = "fragrance_questionnaire / 2026-05-06"
    boxes: list[BoxItem] = field(default_factory=list)
    texts: list[TextItem] = field(default_factory=list)
    lines: list[LineItem] = field(default_factory=list)


def px(value: int) -> str:
    return str(value * EMU_PER_PX)


def rgb(hex_color: str) -> str:
    return hex_color.replace("#", "").upper()


def para_xml(text: str, size: int, color: str, bold: bool = False) -> str:
    bold_attr = ' b="1"' if bold else ""
    runs = []
    for line in text.split("\n"):
        runs.append(
            f'<a:r><a:rPr lang="ja-JP" sz="{size * 100}"{bold_attr}>'
            f'<a:solidFill><a:srgbClr val="{rgb(color)}"/></a:solidFill>'
            '<a:latin typeface="Yu Gothic"/><a:ea typeface="Yu Gothic"/>'
            f'</a:rPr><a:t>{escape(line)}</a:t></a:r>'
        )
        runs.append("<a:br/>")
    if runs:
        runs.pop()
    return "<a:p>" + "".join(runs) + "</a:p>"


def textbox_xml(shape_id: int, item: TextItem) -> str:
    return f"""
    <p:sp>
      <p:nvSpPr><p:cNvPr id="{shape_id}" name="{escape(item.name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="{px(item.x)}" y="{px(item.y)}"/><a:ext cx="{px(item.w)}" cy="{px(item.h)}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/>
      </p:spPr>
      <p:txBody><a:bodyPr wrap="square" anchor="t"/><a:lstStyle/>{para_xml(item.text, item.size, item.color, item.bold)}</p:txBody>
    </p:sp>
    """


def box_xml(shape_id: int, item: BoxItem) -> str:
    line = (
        f'<a:ln w="{item.radius * 1000}"><a:solidFill><a:srgbClr val="{rgb(item.line)}"/></a:solidFill></a:ln>'
        if item.line
        else "<a:ln><a:noFill/></a:ln>"
    )
    return f"""
    <p:sp>
      <p:nvSpPr><p:cNvPr id="{shape_id}" name="{escape(item.name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="{px(item.x)}" y="{px(item.y)}"/><a:ext cx="{px(item.w)}" cy="{px(item.h)}"/></a:xfrm>
        <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="{rgb(item.fill)}"/></a:solidFill>
        {line}
      </p:spPr>
    </p:sp>
    """


def line_xml(shape_id: int, item: LineItem) -> str:
    x = min(item.x1, item.x2)
    y = min(item.y1, item.y2)
    w = abs(item.x2 - item.x1) or 1
    h = abs(item.y2 - item.y1) or 1
    return f"""
    <p:cxnSp>
      <p:nvCxnSpPr><p:cNvPr id="{shape_id}" name="{escape(item.name)}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr>
      <p:spPr>
        <a:xfrm><a:off x="{px(x)}" y="{px(y)}"/><a:ext cx="{px(w)}" cy="{px(h)}"/></a:xfrm>
        <a:prstGeom prst="straightConnector1"><a:avLst/></a:prstGeom>
        <a:ln w="{item.width * 12700}"><a:solidFill><a:srgbClr val="{rgb(item.color)}"/></a:solidFill></a:ln>
      </p:spPr>
    </p:cxnSp>
    """


def slide_xml(spec: SlideSpec) -> str:
    elements: list[str] = []
    shape_id = 2
    elements.append(box_xml(shape_id, BoxItem(0, 0, SLIDE_W, SLIDE_H, BG, None, 0, "Background")))
    shape_id += 1
    for item in spec.boxes:
        elements.append(box_xml(shape_id, item))
        shape_id += 1
    for item in spec.lines:
        elements.append(line_xml(shape_id, item))
        shape_id += 1
    title = TextItem(92, 78, 1500, 112, spec.title, 44, INK, True, "Slide Title")
    subtitle = TextItem(94, 184, 1280, 64, spec.subtitle, 21, MUTED, False, "Slide Subtitle")
    elements.append(textbox_xml(shape_id, title))
    shape_id += 1
    elements.append(textbox_xml(shape_id, subtitle))
    shape_id += 1
    elements.append(box_xml(shape_id, BoxItem(96, 266, 230, 8, spec.accent, None, 4, "Accent Rule")))
    shape_id += 1
    body_text = "\n".join(f"• {line}" for line in spec.body)
    elements.append(textbox_xml(shape_id, TextItem(96, 322, 760, 620, body_text, 22, INK, False, "Body")))
    shape_id += 1
    for item in spec.texts:
        elements.append(textbox_xml(shape_id, item))
        shape_id += 1
    elements.append(textbox_xml(shape_id, TextItem(96, 1014, 1400, 32, spec.footer, 11, MUTED, False, "Footer")))
    sp_tree = "\n".join(elements)
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      {sp_tree}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def presentation_xml(slide_count: int) -> str:
    slide_ids = "\n".join(
        f'<p:sldId id="{256 + i}" r:id="rId{i + 2}"/>' for i in range(slide_count)
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>{slide_ids}</p:sldIdLst>
  <p:sldSz cx="{px(SLIDE_W)}" cy="{px(SLIDE_H)}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>"""


def rels_xml(slide_count: int) -> str:
    rels = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>'
    ]
    for i in range(slide_count):
        rels.append(
            f'<Relationship Id="rId{i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i + 1}.xml"/>'
        )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{''.join(rels)}</Relationships>"""


def content_types(slide_count: int) -> str:
    overrides = [
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    ]
    overrides.extend(
        f'<Override PartName="/ppt/slides/slide{i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(slide_count)
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  {''.join(overrides)}
</Types>"""


SLIDE_MASTER = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>"""

SLIDE_MASTER_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>"""

SLIDE_LAYOUT = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>"""

SLIDE_LAYOUT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>"""

THEME = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Current Source Map">
  <a:themeElements>
    <a:clrScheme name="Fragrance"><a:dk1><a:srgbClr val="243126"/></a:dk1><a:lt1><a:srgbClr val="F7F3EC"/></a:lt1><a:dk2><a:srgbClr val="45624D"/></a:dk2><a:lt2><a:srgbClr val="EFE6D7"/></a:lt2><a:accent1><a:srgbClr val="B88A44"/></a:accent1><a:accent2><a:srgbClr val="45624D"/></a:accent2><a:accent3><a:srgbClr val="5D7182"/></a:accent3><a:accent4><a:srgbClr val="A25B4B"/></a:accent4><a:accent5><a:srgbClr val="657064"/></a:accent5><a:accent6><a:srgbClr val="FFFFFF"/></a:accent6><a:hlink><a:srgbClr val="5D7182"/></a:hlink><a:folHlink><a:srgbClr val="657064"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="Fragrance"><a:majorFont><a:latin typeface="Yu Gothic"/><a:ea typeface="Yu Gothic"/></a:majorFont><a:minorFont><a:latin typeface="Yu Gothic"/><a:ea typeface="Yu Gothic"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Fragrance"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>"""


def slide_specs() -> list[SlideSpec]:
    return [
        SlideSpec(
            "現行正本マップ",
            "非QRの現状を正本化し、QRは後続課題として切り分ける",
            [
                "現行のHTML/CSS/JS/DB連携状態を非QR部分の正本にする",
                "QR導線は消さず、運用処理の残作業として維持する",
                "過去資料は削除せず、参照専用として整理する",
            ],
            boxes=[
                BoxItem(1040, 310, 690, 120, PALE, GOLD, name="Now Box"),
                BoxItem(1040, 470, 690, 120, "E8EFE8", GREEN, name="QR Box"),
                BoxItem(1040, 630, 690, 120, "E9EDF0", BLUE, name="Archive Box"),
            ],
            texts=[
                TextItem(1080, 334, 610, 52, "非QR = 現状実装を正本", 26, INK, True, "Now Text"),
                TextItem(1080, 494, 610, 52, "QR = 後続課題として維持", 26, GREEN, True, "QR Text"),
                TextItem(1080, 654, 610, 52, "過去資料 = archiveへ退避", 26, BLUE, True, "Archive Text"),
            ],
        ),
        SlideSpec(
            "フォルダの役割",
            "作業時に迷わないよう、現在資料・参照資料・過去実体を分離する",
            [
                "`docs/` は現在仕様と参照資料の入口",
                "`docs/archive/` は過去資料と旧前提の保存場所",
                "`archived/` は旧コード・旧画面実体の隔離場所",
            ],
            accent=GREEN,
            boxes=[
                BoxItem(980, 300, 270, 150, "E8EFE8", GREEN, name="Docs"),
                BoxItem(1320, 300, 270, 150, PALE, GOLD, name="Assets"),
                BoxItem(980, 540, 270, 150, "F2E8E4", RED, name="Archive"),
                BoxItem(1320, 540, 270, 150, "E9EDF0", BLUE, name="Archived"),
            ],
            texts=[
                TextItem(1018, 340, 220, 44, "docs/", 28, GREEN, True, "Docs Label"),
                TextItem(1358, 340, 220, 44, "assets/", 28, GOLD, True, "Assets Label"),
                TextItem(1018, 580, 220, 44, "archive/", 28, RED, True, "Archive Label"),
                TextItem(1358, 580, 220, 44, "archived/", 28, BLUE, True, "Archived Label"),
            ],
        ),
        SlideSpec(
            "現在の読み順",
            "通常作業では正本資料を先に読み、過去資料は必要時だけ照合する",
            [
                "00〜06 の設計資料を優先する",
                "SPEC / SCORING / MATERIALS は個別仕様",
                "IMPLEMENTATION_LOG は経緯。旧パスは当時の記録",
            ],
            accent=BLUE,
            boxes=[BoxItem(980, 312, 660, 410, WHITE, BLUE, name="Reading Order")],
            texts=[
                TextItem(1030, 350, 560, 52, "1. AGENTS.md", 24, INK, True, "Read 1"),
                TextItem(1030, 422, 560, 52, "2. docs/00〜06", 24, INK, True, "Read 2"),
                TextItem(1030, 494, 560, 52, "3. SPEC / SCORING / MATERIALS", 24, INK, True, "Read 3"),
                TextItem(1030, 566, 560, 52, "4. IMPLEMENTATION_LOG", 24, MUTED, False, "Read 4"),
                TextItem(1030, 638, 560, 52, "5. docs/archive は照合用", 24, MUTED, False, "Read 5"),
            ],
        ),
        SlideSpec(
            "QR導線の扱い",
            "現在仕様から消さず、会員導線とは混ぜずに後続作業へ残す",
            [
                "QR商品ページ、設定、依頼保存の入口は現行実装に残す",
                "作成可否判断、メール、発送、期限、集計は後続課題",
                "QR第三者を会員DBに入れない方針は維持する",
            ],
            accent=RED,
            boxes=[
                BoxItem(1010, 330, 620, 95, "E8EFE8", GREEN, name="Implemented"),
                BoxItem(1010, 475, 620, 95, "F2E8E4", RED, name="Remaining"),
                BoxItem(1010, 620, 620, 95, PALE, GOLD, name="Boundary"),
            ],
            texts=[
                TextItem(1050, 352, 540, 40, "入口実装は維持", 25, GREEN, True, "Implemented Text"),
                TextItem(1050, 497, 540, 40, "運用処理は後続", 25, RED, True, "Remaining Text"),
                TextItem(1050, 642, 540, 40, "会員導線とは分離", 25, GOLD, True, "Boundary Text"),
            ],
        ),
        SlideSpec(
            "移動した資料",
            "旧パスを役割別の場所へ移し、現在の参照先を明確にする",
            [
                "deep-research は archive/research",
                "旧PPTX は archive/presentation",
                "参照画像は assets/layout-reference",
                "設定メモは archive/user-settings",
                "prototype は archived/prototypes",
            ],
            accent=GOLD,
            boxes=[BoxItem(940, 304, 770, 480, WHITE, GOLD, name="Moved Table")],
            texts=[
                TextItem(990, 345, 690, 48, "旧資料は削除せず、参照専用へ", 28, INK, True, "Moved Title"),
                TextItem(990, 425, 690, 220, "root deep-research -> docs/archive/research\nold PPTX -> docs/archive/presentation\nlayout images -> docs/assets/layout-reference\nuser SQL notes -> docs/archive/user-settings\nprototype -> archived/prototypes", 21, MUTED, False, "Moved Body"),
            ],
        ),
        SlideSpec(
            "運用ルール",
            "今後の実装で資料が再び混ざらないようにする",
            [
                "現在仕様は `docs/` の正本に追記する",
                "完了済み・旧前提は `docs/archive/` に退避する",
                "旧HTMLや旧JSは `archived/` に隔離する",
                "QR関連は後続課題として残し、非QR正本と混在させない",
            ],
            accent=GREEN,
            boxes=[
                BoxItem(960, 320, 680, 90, "E8EFE8", GREEN, name="Rule 1"),
                BoxItem(960, 445, 680, 90, PALE, GOLD, name="Rule 2"),
                BoxItem(960, 570, 680, 90, "E9EDF0", BLUE, name="Rule 3"),
            ],
            texts=[
                TextItem(1000, 344, 600, 36, "正本は短く、現在判断を残す", 23, GREEN, True, "Rule Text 1"),
                TextItem(1000, 469, 600, 36, "過去資料は履歴として残す", 23, GOLD, True, "Rule Text 2"),
                TextItem(1000, 594, 600, 36, "旧実体は現行導線と混ぜない", 23, BLUE, True, "Rule Text 3"),
            ],
        ),
    ]


def package_files(slides: list[SlideSpec]) -> dict[str, str]:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    files = {
        "[Content_Types].xml": content_types(len(slides)),
        "_rels/.rels": """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>""",
        "docProps/core.xml": f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>現行正本マップ</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified></cp:coreProperties>""",
        "docProps/app.xml": f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Codex</Application><PresentationFormat>16:9</PresentationFormat><Slides>{len(slides)}</Slides></Properties>""",
        "ppt/presentation.xml": presentation_xml(len(slides)),
        "ppt/_rels/presentation.xml.rels": rels_xml(len(slides)),
        "ppt/slideMasters/slideMaster1.xml": SLIDE_MASTER,
        "ppt/slideMasters/_rels/slideMaster1.xml.rels": SLIDE_MASTER_RELS,
        "ppt/slideLayouts/slideLayout1.xml": SLIDE_LAYOUT,
        "ppt/slideLayouts/_rels/slideLayout1.xml.rels": SLIDE_LAYOUT_RELS,
        "ppt/theme/theme1.xml": THEME,
    }
    for i, spec in enumerate(slides, 1):
        files[f"ppt/slides/slide{i}.xml"] = slide_xml(spec)
        files[f"ppt/slides/_rels/slide{i}.xml.rels"] = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>"""
    return files


def write_pptx(slides: list[SlideSpec]) -> None:
    OUT_PPTX.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUT_PPTX, "w", ZIP_DEFLATED) as zf:
        for name, data in package_files(slides).items():
            zf.writestr(name, data.encode("utf-8"))


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/YuGothB.ttc" if bold else "C:/Windows/Fonts/YuGothM.ttc"),
        Path("C:/Windows/Fonts/msgothic.ttc"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, fill: str, width_chars: int, line_gap: int = 8) -> None:
    x, y = xy
    for raw in text.split("\n"):
        lines = wrap(raw, width=width_chars, break_long_words=False) or [""]
        for line in lines:
            draw.text((x, y), line, font=font, fill=f"#{fill}")
            y += font.size + line_gap


def write_pngs(slides: list[SlideSpec]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for idx, spec in enumerate(slides, 1):
        img = Image.new("RGB", (SLIDE_W, SLIDE_H), f"#{BG}")
        draw = ImageDraw.Draw(img)
        for box in spec.boxes:
            draw.rounded_rectangle(
                (box.x, box.y, box.x + box.w, box.y + box.h),
                radius=box.radius,
                fill=f"#{box.fill}",
                outline=f"#{box.line}" if box.line else None,
                width=3 if box.line else 1,
            )
        for line in spec.lines:
            draw.line((line.x1, line.y1, line.x2, line.y2), fill=f"#{line.color}", width=line.width)
        draw.text((92, 76), spec.title, font=load_font(58, True), fill=f"#{INK}")
        draw_wrapped(draw, (96, 184), spec.subtitle, load_font(28), MUTED, 44, 10)
        draw.rounded_rectangle((96, 266, 326, 274), radius=4, fill=f"#{spec.accent}")
        body_font = load_font(29)
        y = 322
        for line in spec.body:
            draw_wrapped(draw, (96, y), f"• {line}", body_font, INK, 35, 8)
            y += 82
        for item in spec.texts:
            draw_wrapped(draw, (item.x, item.y), item.text, load_font(item.size + 4, item.bold), item.color, max(8, item.w // max(item.size, 1)), 8)
        draw.text((96, 1014), spec.footer, font=load_font(16), fill=f"#{MUTED}")
        img.save(OUT_DIR / f"slide_{idx:02}.png")


def main() -> None:
    slides = slide_specs()
    write_pptx(slides)
    write_pngs(slides)
    print(f"pptx={OUT_PPTX}")
    print(f"png_dir={OUT_DIR}")
    print(f"slides={len(slides)}")


if __name__ == "__main__":
    main()
