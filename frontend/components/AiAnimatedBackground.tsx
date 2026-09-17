"use client";

import React, { useEffect, useRef } from "react";

// Crisp, readable, professional code statements sized cleanly
const CODE_SNIPPETS = [
  "def audit_request(req):",
  "  token = req.headers.get('Auth')",
  "  if not verify_jwt(token):",
  "    raise UnauthorizedError()",
  "  cursor.execute(sql, (uid,))",
  "  # [AUDIT] sanitize input",
  "  clean = sanitize(req.query)",
  "  hash = hashlib.sha256(clean)",
  "  validate_csrf(req.token)",
  "  assert compare_digest(hash)",
  "  return JsonResponse(200)",
  "[RULE_CWE89: SQLi -> SAFE]",
  "[RULE_CWE798: SECRETS -> PASS]",
  "[RULE_CWE639: IDOR -> VERIFIED]",
  "[AST_WALK: CallNode inspected]",
  "[ENTROPY: 4.82 Shannon Check]",
  "[TAINT_TRACK: DB Query Sink]",
  "[PASS: Zero token exposure]",
  "const token = req.headers.auth;",
  "if (!user.isAdmin) return 403;",
  "const hash = pbkdf2(pwd, salt);",
  "jwt.verify(token, JWT_SECRET);",
  "app.use(cors({ origin: internal }));",
  "sanitizeHtml(userInput);",
  "if (bcrypt.compare(pwd, hash))",
  "Strict-Transport: max-age=1yr",
  "Content-Security: default 'self'",
  "X-Content-Type-Options: nosniff",
  "re.compile(r'^[a-zA-Z0-9]+$')",
  "0x7F454C46 SHA256_VERIFIED",
  "db.query(sql, [userId]);",
  "rate_limiter.consume(client_ip);",
  "class ASTVisitor(ast.NodeVisitor):",
  "  def visit_Call(self, node):",
  "  def visit_Assign(self, node):",
  "POST /api/v1/auth HTTP/2.0 200",
  "pragma foreign_keys = ON;",
  "secrets.token_urlsafe(32)",
];

const FONT_SIZE = 18; // Clean, readable font
const ROW_SPACING = 30; // Row height for readability
const SPOTLIGHT_RADIUS = 240; // Soft cursor spotlight
const FADE_SPEED = 0.08; // Smooth transition
const AMBIENT_OPACITY = 0.08; // Subtle, low-intensity brightness

interface Column {
  x: number;
  items: string[];
  offsetY: number;
  speed: number;
}

export const AiAnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const activeRef = useRef(0);
  const targetActiveRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let columns: Column[] = [];
    let animationId: number;

    const buildColumns = () => {
      const colWidth = 360;
      const colCount = Math.max(Math.ceil(width / colWidth) + 1, 3);
      const rowsPerCol = Math.ceil(height / ROW_SPACING) + 6;

      columns = Array.from({ length: colCount }, (_, colIdx) => {
        const items: string[] = [];
        for (let r = 0; r < rowsPerCol; r++) {
          items.push(CODE_SNIPPETS[(colIdx * 5 + r) % CODE_SNIPPETS.length]);
        }

        return {
          x: colIdx * colWidth + 16,
          items,
          offsetY: (colIdx * 90) % (rowsPerCol * ROW_SPACING),
          // Slower, smooth speed
          speed: 0.3 + (colIdx % 3) * 0.1,
        };
      });
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      buildColumns();
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const excluded = target?.closest("[data-scanner-exclude]");
      mouseRef.current = { x: e.clientX, y: e.clientY };
      targetActiveRef.current = excluded ? 0 : 1;
    };

    const handleWindowLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) targetActiveRef.current = 0;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleWindowLeave);

    const draw = () => {
      activeRef.current += (targetActiveRef.current - activeRef.current) * FADE_SPEED;
      const spotlightFade = activeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Deep obsidian dark base background (#080c14)
      ctx.fillStyle = "rgba(8, 12, 20, 1)";
      ctx.fillRect(0, 0, width, height);

      const { x: mx, y: my } = mouseRef.current;

      ctx.font = `600 ${FONT_SIZE}px 'JetBrains Mono', 'Fira Code', Consolas, monospace`;
      ctx.textBaseline = "top";

      for (const col of columns) {
        col.offsetY += col.speed;
        const cycleHeight = col.items.length * ROW_SPACING;

        for (let row = 0; row < col.items.length; row++) {
          const rawY = (col.offsetY + row * ROW_SPACING) % cycleHeight;
          const py = rawY - ROW_SPACING;

          if (py < -ROW_SPACING || py > height + ROW_SPACING) continue;

          const text = col.items[row];

          const lineCenterX = col.x + 120;
          const lineCenterY = py + FONT_SIZE / 2;
          const dist = Math.hypot(lineCenterX - mx, lineCenterY - my);

          let spotlightAlpha = 0;
          if (dist < SPOTLIGHT_RADIUS && spotlightFade > 0.001) {
            const proximity = 1 - dist / SPOTLIGHT_RADIUS;
            spotlightAlpha = proximity * proximity * spotlightFade;
          }

          // Lower intensity, subtle brightness everywhere
          const totalAlpha = Math.min(AMBIENT_OPACITY + spotlightAlpha * 0.35, 0.45);
          if (totalAlpha < 0.02) continue;

          // ALL CODE IS THE SAME UNIFORM COLOR: Calm Cyber Cyan
          ctx.fillStyle = `rgba(6, 182, 212, ${totalAlpha})`;

          if (spotlightAlpha > 0.08) {
            ctx.shadowColor = "rgba(6, 182, 212, 0.3)";
            ctx.shadowBlur = 4;
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillText(text, col.x, py);
          ctx.shadowBlur = 0;
        }
      }

      // Soft low-intensity aura directly under cursor
      if (spotlightFade > 0.02) {
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, SPOTLIGHT_RADIUS);
        glow.addColorStop(0, `rgba(6, 182, 212, ${0.08 * spotlightFade})`);
        glow.addColorStop(1, "rgba(8, 12, 20, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mx, my, SPOTLIGHT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleWindowLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0, pointerEvents: "none" }}
    />
  );
};

export default AiAnimatedBackground;
