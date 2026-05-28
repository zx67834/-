import argparse
import json
import time
import urllib.error
import urllib.request
from datetime import datetime


DEFAULT_BACKEND = "http://127.0.0.1:7007"
DEFAULT_ALERT_TO = "墨墨"
BLOCKED_ALERT_TARGETS = {"文件传输助手"}


class BackendError(RuntimeError):
    pass


def post_json(url, payload, timeout=90):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise BackendError(f"Backend returned HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise BackendError(f"Backend request failed: {exc}") from exc


def analyze_text(backend, text, model=None):
    payload = {"text": text}
    if model:
        payload["model"] = model
    result = post_json(f"{backend.rstrip('/')}/api/analyze/text", payload)
    if not result.get("success"):
        raise BackendError(result.get("error") or "Backend analysis failed")
    return result.get("analysis") or {}


def risk_rank(level):
    return {"low": 1, "medium": 2, "high": 3}.get(str(level).lower(), 0)


def clean_message_text(message):
    text = str(message).strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in ("'", '"'):
        text = text[1:-1]
    return text.strip()


def message_to_record(session, message):
    message_type = type(message).__name__
    text = clean_message_text(message)
    return {
        "session": str(session),
        "message_type": message_type,
        "text": text,
        "is_incoming": message_type == "FriendMessage",
        "is_self": message_type == "SelfMessage",
        "is_system": message_type in {"SysMessage", "TimeMessage", "RecallMessage"},
        "is_plain_text": bool(text and not text.startswith("[")),
    }


def is_plain_incoming_text(record):
    return (
        record["message_type"] == "FriendMessage"
        and record["is_plain_text"]
    )


def message_fingerprint(record):
    return f"{record['session']}|{record['message_type']}|{record['text']}"


class MessageDeduper:
    def __init__(self, max_size=500):
        self._seen = set()
        self._order = []
        self._max_size = max_size

    def is_new(self, record):
        key = message_fingerprint(record)
        if key in self._seen:
            return False
        self._seen.add(key)
        self._order.append(key)
        while len(self._order) > self._max_size:
            old = self._order.pop(0)
            self._seen.discard(old)
        return True


def show_desktop_alert(title, text):
    try:
        import ctypes

        ctypes.windll.user32.MessageBoxW(0, text[:900], title, 0x30)
    except Exception as exc:
        print(f"[WARN] desktop alert failed: {exc}")


def _chat_names_match(expected, actual):
    expected = str(expected or "").strip()
    actual = str(actual or "").strip()
    if not expected or not actual:
        return False
    return expected in actual or actual in expected


def should_skip_record(record, exclude_sessions):
    if not is_plain_incoming_text(record):
        return True
    session = record["session"].strip()
    if session in exclude_sessions:
        return True
    return False


def build_alert_message(session, source_text, analysis):
    risk_level = str(analysis.get("risk_level") or "unknown").lower()
    risk_label = {
        "high": "高风险",
        "medium": "中风险",
        "low": "低风险",
    }.get(risk_level, risk_level)

    confidence = analysis.get("confidence")
    confidence_text = ""
    if isinstance(confidence, (int, float)):
        confidence_text = f" 置信度：{confidence:.0%}"

    summary = analysis.get("summary") or "检测到疑似诈骗风险"
    reasons = "；".join(str(item) for item in (analysis.get("reasons") or [])[:3])
    suggestions = "；".join(str(item) for item in (analysis.get("suggestions") or [])[:3])
    if not reasons:
        reasons = "消息内容包含可疑诱导信息"
    if not suggestions:
        suggestions = "请勿转账，勿提供验证码、密码或银行卡信息，先通过官方渠道核实。"

    preview = source_text.strip().replace("\r", " ").replace("\n", " ")
    if len(preview) > 80:
        preview = preview[:80] + "..."

    return (
        "反诈小助手提醒：\n"
        f"检测到来自「{session}」的疑似{risk_label}消息。{confidence_text}\n"
        f"摘要：{summary}\n"
        f"风险点：{reasons}\n"
        f"建议：{suggestions}\n"
        f"原消息：{preview}\n"
        f"时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )


class WeChatBridge:
    def __init__(self):
        from wxauto import WeChat

        self.wx = WeChat()

    @property
    def nickname(self):
        return getattr(self.wx, "nickname", "")

    def sessions(self):
        return self.wx.GetSessionList()

    def current_messages(self, limit=10):
        messages = self.wx.GetAllMessage()
        if limit and limit > 0:
            messages = messages[-limit:]
        return [message_to_record("CURRENT", item) for item in messages]

    def send_text(self, to, text):
        target = str(to).strip()
        body = str(text).strip()
        if not target:
            raise ValueError("empty alert target")
        if not body:
            raise ValueError("empty alert message")
        if target in BLOCKED_ALERT_TARGETS:
            raise ValueError(
                f"alert target「{target}」已禁用，请改用「{DEFAULT_ALERT_TO}」等会话接收提醒"
            )

        opened = self.wx.ChatWith(target)
        time.sleep(0.6)
        current = (self.wx.CurrentChat() or "").strip()
        if opened is False or not _chat_names_match(target, current):
            raise RuntimeError(
                f"无法切换到聊天「{target}」，当前窗口是「{current or '未知'}」"
            )

        import pyperclip
        from wxauto.utils import SetClipboardText

        SetClipboardText(body)
        time.sleep(0.15)
        clipboard = (pyperclip.paste() or "").strip()
        if clipboard[:80] != body[:80]:
            raise RuntimeError("剪贴板内容与提醒文案不一致，已取消发送以防发错消息")

        self.wx.SendMsg(body, who=target, clear=True)
        print(f"[SEND] -> {target} | {len(body)} chars | preview={body[:60]}...")

    def get_new_records(self, max_round=5):
        batches = self.wx.GetAllNewMessage(max_round=max_round) or {}
        records = []
        for session, messages in batches.items():
            for message in messages:
                records.append(message_to_record(session, message))
        return records

    def watch(self, seconds=60, max_round=5, sessions=None, print_all=True):
        allowed = {item.strip() for item in sessions or [] if item.strip()}
        end_at = time.time() + seconds
        while time.time() < end_at:
            records = self.get_new_records(max_round=max_round)
            if not records:
                time.sleep(1)
                continue
            for record in records:
                if allowed and record["session"] not in allowed:
                    continue
                if print_all:
                    print_record(record)
                yield record


def print_record(record):
    print(
        f"[WX] {record['session']} | {record['message_type']} | "
        f"{record['text']}"
    )


def cmd_probe(_args):
    bridge = WeChatBridge()
    print(f"[OK] attached={bridge.nickname}")
    sessions = bridge.sessions()
    print(f"[OK] sessions={len(sessions)}")
    for name, unread in sessions.items():
        print(f"[SESSION] {name} | unread={unread}")
    return 0


def cmd_current(args):
    bridge = WeChatBridge()
    print(f"[OK] attached={bridge.nickname}")
    for record in bridge.current_messages(limit=args.limit):
        print_record(record)
    return 0


def cmd_send(args):
    bridge = WeChatBridge()
    print(f"[OK] attached={bridge.nickname}")
    bridge.send_text(args.to, args.text)
    print(f"[OK] sent to {args.to}")
    return 0


def cmd_watch(args):
    bridge = WeChatBridge()
    print(f"[OK] attached={bridge.nickname}")
    print(f"[OK] watching {args.seconds}s")
    count = 0
    for _record in bridge.watch(
        seconds=args.seconds,
        max_round=args.max_round,
        sessions=args.session,
        print_all=True,
    ):
        count += 1
    print(f"[DONE] records={count}")
    return 0


def resolve_alert_to(bridge, alert_to):
    target = str(alert_to or "").strip() or DEFAULT_ALERT_TO
    if target in BLOCKED_ALERT_TARGETS:
        target = DEFAULT_ALERT_TO
    sessions = bridge.sessions()
    if target in sessions:
        return target
    for name in sessions:
        if _chat_names_match(target, name):
            return name
    return target


def run_alert_loop(args):
    bridge = WeChatBridge()
    alert_to = resolve_alert_to(bridge, args.alert_to)
    args.alert_to = alert_to

    exclude_sessions = {item.strip() for item in (args.exclude_session or []) if item.strip()}
    exclude_sessions.add(alert_to)
    exclude_sessions.update(BLOCKED_ALERT_TARGETS)

    print(f"[OK] attached={bridge.nickname}")
    print(
        f"[OK] monitor {args.seconds}s, backend={args.backend}, "
        f"alert_to={args.alert_to}, threshold={args.threshold}"
    )
    if exclude_sessions:
        print(f"[OK] ignore sessions: {', '.join(sorted(exclude_sessions))}")

    deduper = MessageDeduper()
    checked = 0
    alerted = 0

    for record in bridge.watch(
        seconds=args.seconds,
        max_round=args.max_round,
        sessions=args.session,
        print_all=True,
    ):
        if should_skip_record(record, exclude_sessions):
            continue
        if not deduper.is_new(record):
            continue

        checked += 1
        try:
            analysis = analyze_text(args.backend, record["text"], args.model)
        except BackendError as exc:
            print(f"[AI-ERROR] {exc}")
            continue

        risk_level = str(analysis.get("risk_level") or "low").lower()
        print(f"[AI] {record['session']} | risk={risk_level}")
        if risk_rank(risk_level) < risk_rank(args.threshold):
            continue

        alert = build_alert_message(record["session"], record["text"], analysis)
        if args.dry_run:
            print("[DRY-RUN] alert message:")
            print(alert)
        else:
            if args.desktop_alert:
                show_desktop_alert(
                    "反诈预警",
                    f"来自「{record['session']}」的{risk_level}风险消息，详情已发到「{alert_to}」。",
                )
            try:
                bridge.send_text(alert_to, alert)
                print(f"[OK] alert sent to {alert_to}")
            except Exception as exc:
                print(f"[SEND-ERROR] {exc}")
                continue
        alerted += 1

    print(f"[DONE] checked={checked}, alerted={alerted}")
    return 0


def cmd_loop(args):
    return run_alert_loop(args)


def cmd_demo(args):
    print("=" * 48)
    print(" 反诈微信演示模式")
    print("=" * 48)
    print("1. 保持本机微信已登录（当前监听此账号收到的消息）")
    print("2. 用另一个微信号给本账号发可疑消息，例如：")
    print("   「你的账户涉嫌洗钱，请马上转账到安全账户并提供验证码」")
    print(f"3. 达到 {args.threshold} 风险后：")
    if args.desktop_alert:
        print("   - 弹出桌面预警窗口")
    print(f"   - 向「{args.alert_to}」发送反诈提醒（发给自己）")
    print("按 Ctrl+C 可提前结束监听")
    print("=" * 48)
    return run_alert_loop(args)


def build_parser():
    parser = argparse.ArgumentParser(description="WeChat bridge for anti-fraud demo")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("probe", help="attach WeChat and list sessions")
    p.set_defaults(func=cmd_probe)

    p = sub.add_parser("current", help="print current chat messages")
    p.add_argument("--limit", type=int, default=10)
    p.set_defaults(func=cmd_current)

    p = sub.add_parser("send", help="send a WeChat text message")
    p.add_argument("--to", default=DEFAULT_ALERT_TO)
    p.add_argument("--text", required=True)
    p.set_defaults(func=cmd_send)

    p = sub.add_parser("watch", help="watch new WeChat messages")
    p.add_argument("--seconds", type=int, default=60)
    p.add_argument("--max-round", type=int, default=5)
    p.add_argument("--session", action="append", default=[])
    p.set_defaults(func=cmd_watch)

    p = sub.add_parser("loop", help="watch, analyze via backend, and send alerts")
    p.add_argument("--seconds", type=int, default=60)
    p.add_argument("--max-round", type=int, default=5)
    p.add_argument("--session", action="append", default=[])
    p.add_argument("--exclude-session", action="append", default=[])
    p.add_argument("--backend", default=DEFAULT_BACKEND)
    p.add_argument("--model", default=None)
    p.add_argument("--alert-to", default=DEFAULT_ALERT_TO)
    p.add_argument("--threshold", choices=["medium", "high"], default="high")
    p.add_argument("--desktop-alert", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    p.set_defaults(func=cmd_loop)

    p = sub.add_parser(
        "demo",
        help="demo: other account sends scam text -> alert to self chat",
    )
    p.add_argument("--seconds", type=int, default=300)
    p.add_argument("--max-round", type=int, default=5)
    p.add_argument("--session", action="append", default=[])
    p.add_argument("--exclude-session", action="append", default=[])
    p.add_argument("--backend", default=DEFAULT_BACKEND)
    p.add_argument("--model", default=None)
    p.add_argument("--alert-to", default=DEFAULT_ALERT_TO)
    p.add_argument("--threshold", choices=["medium", "high"], default="medium")
    p.add_argument("--desktop-alert", action="store_true", default=True)
    p.add_argument("--no-desktop-alert", action="store_false", dest="desktop_alert")
    p.add_argument("--dry-run", action="store_true")
    p.set_defaults(func=cmd_demo)

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
