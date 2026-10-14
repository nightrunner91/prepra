const DIAGRAM_GLYPHS = /[\u2500-\u257F\u2580-\u259F\u25A0-\u25FF]/;

function textOf(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (!node.children) return "";
  let out = "";
  for (const child of node.children) out += textOf(child);
  return out;
}

function visit(node) {
  if (!node.children) return;

  for (const child of node.children) {
    if (child.type === "element" && child.tagName === "pre") {
      const code = child.children?.find(
        (c) => c.type === "element" && c.tagName === "code",
      );
      if (DIAGRAM_GLYPHS.test(textOf(code ?? child))) {
        child.properties = {
          ...child.properties,
          "data-ascii-diagram": "",
        };
      }
    }
    visit(child);
  }
}

export default function rehypeAsciiDiagrams() {
  return function transform(tree) {
    visit(tree);
  };
}
