import { Check, Copy } from "@phosphor-icons/react";
import { useRef, useState, type ReactNode } from "react";

const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "of",
  "in",
  "while",
  "do",
  "new",
  "class",
  "extends",
  "super",
  "this",
  "typeof",
  "instanceof",
  "await",
  "async",
  "try",
  "catch",
  "finally",
  "throw",
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "switch",
  "case",
  "default",
  "break",
  "continue",
  "delete",
  "void",
  "yield",
  "import",
  "export",
  "from",
  "static",
  "get",
  "set",
]);

const TOKEN_PATTERN =
  /\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b/g;

function tokenClass(token: string, rest: string): string {
  if (token.startsWith("//") || token.startsWith("/*")) {
    return "text-text-tertiary italic";
  }
  if (
    token.startsWith("'") ||
    token.startsWith('"') ||
    token.startsWith("`")
  ) {
    return "text-pale-red-text";
  }
  if (/^\d/.test(token)) return "text-pale-blue-text";
  if (KEYWORDS.has(token)) return "text-accent font-semibold";
  if (/^\s*\(/.test(rest)) return "text-pale-blue-text";
  return "";
}

function highlight(code: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const pattern = new RegExp(TOKEN_PATTERN.source, "g");

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }

    const token = match[0];
    const rest = code.slice(match.index + token.length);
    const className = tokenClass(token, rest);

    nodes.push(
      className ? (
        <span key={`${match.index}-${token}`} className={className}>
          {token}
        </span>
      ) : (
        token
      ),
    );

    lastIndex = match.index + token.length;
  }

  if (lastIndex < code.length) nodes.push(code.slice(lastIndex));
  return nodes;
}

interface CodeBlockProps {
  code: string;
  label?: string;
  className?: string;
}

export function CodeBlock({ code, label = "JavaScript", className = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Буфер обмена может быть недоступен — молча игнорируем.
    }
  }

  return (
    <div
      className={`overflow-hidden border-2 border-border bg-surface-alt ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b-2 border-border px-3 py-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary transition-colors hover:text-accent"
          aria-label="Скопировать код"
        >
          {copied ? <Check size={13} weight="bold" /> : <Copy size={13} />}
          {copied ? "Скопировано" : "Копировать"}
        </button>
      </div>
      <pre className="max-h-[420px] overflow-auto p-3 text-[12.5px] leading-relaxed text-text sm:p-4 sm:text-[13px]">
        <code className="font-mono">{highlight(code)}</code>
      </pre>
    </div>
  );
}
