const MD_LINK = /\.md(?=([?#]|$))/i;

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;

function visit(node, callback) {
  callback(node);
  if (node.children) {
    for (const child of node.children) {
      visit(child, callback);
    }
  }
}

export default function rehypeMarkdownLinks() {
  return function transform(tree) {
    visit(tree, (node) => {
      if (node.type !== "element" || node.tagName !== "a") return;

      const href = node.properties?.href;
      if (typeof href !== "string") return;
      if (EXTERNAL.test(href)) return;
      if (!MD_LINK.test(href)) return;

      node.properties.href = href.replace(/\.md(?=([?#]|$))/i, "");
    });
  };
}