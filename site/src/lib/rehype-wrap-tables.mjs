function visit(node) {
  if (!node.children) return;

  node.children = node.children.map((child) => {
    if (child.type === "element" && child.tagName === "table") {
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [child],
      };
    }

    visit(child);
    return child;
  });
}

export default function rehypeWrapTables() {
  return function transform(tree) {
    visit(tree);
  };
}
