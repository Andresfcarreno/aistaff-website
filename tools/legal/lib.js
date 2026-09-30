// Tiny DSL -> .docx builder for AI Staff legal documents.
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, LevelFormat, Header, Footer, PageNumber, BorderStyle, PageBreak,
  TabStopType, VerticalAlign,
} = require("docx");

const NAVY = "0A1A33", BLUE = "1F6FEB", MUTED = "5B6B82", LINE = "C9D3E3", SOFT = "EEF3FC";
const W = 12240, MARGIN = 1260, CW = W - 2 * MARGIN; // content width in DXA

// **bold** and __underline blank__ inline markup
function runs(text, base = {}) {
  const out = [];
  String(text).split("\n").forEach((line, li) => {
    line.split(/(\*\*[^*]+\*\*|~[^~]+~)/).forEach((part, pi) => {
      if (!part) return;
      const brk = li > 0 && pi === 0 ? { break: 1 } : {};
      if (part.startsWith("**")) out.push(new TextRun({ ...base, ...brk, text: part.slice(2, -2), bold: true }));
      else if (part.startsWith("~")) out.push(new TextRun({ ...base, ...brk, text: part.slice(1, -1), italics: true }));
      else out.push(new TextRun({ ...base, ...brk, text: part }));
    });
    if (li > 0 && !line) out.push(new TextRun({ break: 1 }));
  });
  return out;
}
const P = (text, o = {}) => new Paragraph({ spacing: { after: 110, line: 290 }, ...o, children: runs(text, o.run || {}) });

function cell(content, width, o = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map(t =>
    t instanceof Paragraph ? t : new Paragraph({ spacing: { before: 40, after: 40 }, children: runs(t, { size: o.size || 19, bold: o.bold, color: o.color }) }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA }, children: paras, verticalAlign: VerticalAlign.CENTER,
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
  });
}
const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

function table(widthsPct, rows, o = {}) {
  const widths = widthsPct.map(p => Math.round(CW * p / 100));
  widths[widths.length - 1] = CW - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: widths, borders,
    rows: rows.map((r, i) => new TableRow({
      tableHeader: o.header && i === 0,
      children: r.map((c, j) => cell(c, widths[j], o.header && i === 0 ? { bold: true, fill: NAVY, color: "FFFFFF" }
        : (o.labelCol && j === 0 ? { bold: true, fill: SOFT } : (o.hl && o.hl.includes(i) ? { fill: SOFT } : {})))),
    })),
  });
}

function build(spec) {
  const kids = [];
  let art = 0, clause = 0, annex = false;
  const spacer = () => new Paragraph({ spacing: { after: 60 }, children: [] });
  for (const [k, v, x] of spec.body) {
    switch (k) {
      case "title":
        kids.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "AI STAFF", bold: true, color: BLUE, size: 20, characterSpacing: 60 })] }));
        kids.push(new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 80 }, children: [new TextRun({ text: v, bold: true, color: NAVY, size: 44 })] }));
        if (x) kids.push(new Paragraph({ spacing: { after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } }, children: [new TextRun({ text: x, color: MUTED, size: 22 })] }));
        break;
      case "art":
        art++; clause = 0;
        kids.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, spacing: { before: 260, after: 100 },
          children: [new TextRun({ text: `${spec.artWord} ${art}. `, bold: true, color: BLUE, size: 23 }), new TextRun({ text: v, bold: true, color: NAVY, size: 23 })] }));
        break;
      case "annex":
        art = 0; annex = true;
        kids.push(new Paragraph({ children: [new PageBreak()] }));
        kids.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 60 }, children: [new TextRun({ text: v, bold: true, color: NAVY, size: 34 })] }));
        if (x) kids.push(new Paragraph({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 6 } }, children: [new TextRun({ text: x, color: MUTED, size: 20 })] }));
        break;
      case "h":
        kids.push(new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: v, bold: true, color: NAVY, size: 21 })] }));
        break;
      case "c": // numbered clause
        clause++;
        kids.push(new Paragraph({ spacing: { after: 100, line: 290 }, indent: { left: 540, hanging: 540 }, alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: `${art}.${clause}\t`, bold: true, color: NAVY }), ...runs(v)], tabStops: [{ type: TabStopType.LEFT, position: 540 }] }));
        break;
      case "p": kids.push(P(v, { alignment: AlignmentType.JUSTIFIED })); break;
      case "note":
        kids.push(new Paragraph({ spacing: { before: 80, after: 140 }, shading: { type: ShadingType.CLEAR, color: "auto", fill: SOFT },
          border: { left: { style: BorderStyle.SINGLE, size: 24, color: BLUE, space: 8 } }, indent: { left: 160, right: 160 },
          children: runs(v, { size: 19, color: NAVY }) }));
        break;
      case "ul":
        v.forEach(t => kids.push(new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60, line: 280 }, indent: { left: x ? 1080 : 900, hanging: 300 }, children: runs(t) })));
        kids.push(spacer());
        break;
      case "check":
        v.forEach(t => kids.push(new Paragraph({ spacing: { after: 70 }, indent: { left: 360 }, children: [new TextRun({ text: "☐  ", size: 24 }), ...runs(t)] })));
        break;
      case "table": kids.push(table(x.w, v, x)); kids.push(spacer()); break;
      case "fields": // label | blank
        kids.push(table(x || [38, 62], v.map(r => Array.isArray(r) ? r : [r, ""]), { labelCol: true })); kids.push(spacer());
        break;
      case "sig": {
        const half = [50, 50];
        const block = who => [`**${who.title}**`, ...who.lines.map(l => l), " ", "Signature : ________________________", `${spec.dateWord} : ____________________`];
        kids.push(new Paragraph({ keepNext: true, spacing: { before: 240 }, children: [] }));
        kids.push(new Table({
          width: { size: CW, type: WidthType.DXA }, columnWidths: [CW / 2, CW / 2],
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
          rows: [new TableRow({ cantSplit: true, children: v.map(w => new TableCell({ width: { size: CW / 2, type: WidthType.DXA }, margins: { right: 200 },
            children: block(w).map(t => new Paragraph({ spacing: { after: 100 }, children: runs(t.replace("Signature :", spec.sigWord + " :"), { size: 20 }) })) })) })],
        }));
        break;
      }
      case "pb": kids.push(new Paragraph({ children: [new PageBreak()] })); break;
      case "sp": kids.push(spacer()); break;
    }
  }
  const doc = new Document({
    creator: "AI Staff", title: spec.docTitle, description: spec.docTitle,
    styles: { default: { document: { run: { font: "Arial", size: 20, color: "1B2433" } } } },
    numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 300 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: W, height: 15840 }, margin: { top: 1200, bottom: 1100, left: MARGIN, right: MARGIN, header: 560, footer: 520 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `AI Staff · ${spec.short}`, color: MUTED, size: 16 })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: `${spec.footer} · ${spec.pageWord} `, color: MUTED, size: 16 }),
        new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 16 }),
        new TextRun({ text: " / ", color: MUTED, size: 16 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], color: MUTED, size: 16 }),
        new TextRun({ text: `   ·   ${spec.initWord} : ______ / ______`, color: MUTED, size: 16 }),
      ] })] }) },
      children: kids,
    }],
  });
  return Packer.toBuffer(doc).then(b => { fs.writeFileSync(spec.out, b); console.log("wrote", spec.out); });
}
module.exports = { build };
