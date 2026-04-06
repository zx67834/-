#!/usr/bin/env python3
"""
微信消息采集脚本（基于 itchat-uos）
将微信个人消息实时转发到防诈助手后端，并在前端显示二维码。
"""
import itchat
import requests
import json
import time
import sys
import os
from datetime import datetime

# 后端 API 地址
BACKEND_URL = "http://localhost:7007/api/wechat/message"
QR_CODE_PATH = os.path.join(os.path.dirname(__file__), 'uploads', 'wechat_qr.png')

def send_to_backend(message):
    """将格式化后的消息发送到后端"""
    try:
        resp = requests.post(BACKEND_URL, json=message, timeout=5)
        if resp.status_code == 200:
            print(f"[✓] 消息已转发: {message.get('sender')} -> {message.get('content')[:30]}...")
        else:
            print(f"[!] 转发失败: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[!] 连接后端失败: {e}")

def format_message(msg):
    """将 itchat 消息格式化为后端所需格式"""
    msg_type = msg.get('Type')
    content = ''
    if msg_type == 'Text':
        content = msg.get('Text')
    elif msg_type == 'Picture':
        content = '[图片]'
    elif msg_type == 'Recording':
        content = '[语音]'
    elif msg_type == 'Attachment':
        content = '[文件]'
    else:
        content = f'[{msg_type}]'

    # 获取发送者备注名
    sender = msg.get('FromUserName')
    if sender.startswith('@'):
        # 尝试获取备注名
        user = itchat.search_friends(userName=sender)
        if user:
            sender = user.get('RemarkName') or user.get('NickName') or sender
    else:
        sender = '未知'

    return {
        "id": msg.get('MsgId'),
        "sender": sender,
        "content": content,
        "time": datetime.fromtimestamp(msg.get('CreateTime')).isoformat(),
        "type": msg_type.lower()
    }

@itchat.msg_register([itchat.content.TEXT, itchat.content.PICTURE, itchat.content.RECORDING, itchat.content.ATTACHMENT])
def handle_message(msg):
    """处理接收到的微信消息"""
    print(f"[微信] {msg.get('FromUserName')}: {msg.get('Text', msg.get('Type'))}")
    formatted = format_message(msg)
    send_to_backend(formatted)

def login_callback():
    print("[✓] 微信登录成功")
    # 通知前端登录成功（可通过 Socket.io 发送，这里仅打印）
    print("[提示] 二维码已保存为 uploads/wechat_qr.png，前端可访问 http://localhost:7007/uploads/wechat_qr.png 查看")

def exit_callback():
    print("[!] 微信已退出")

if __name__ == '__main__':
    print("=" * 50)
    print("微信消息采集器启动")
    print("=" * 50)
    print("请确保：")
    print("1. 已安装 itchat-uos: pip install itchat-uos")
    print("2. 后端服务器正在运行（端口 7007）")
    print("3. 使用手机微信扫码登录")
    print("=" * 50)

    # 检查后端是否可达
    try:
        test = requests.get("http://localhost:7007", timeout=3)
        print("[✓] 后端服务器连接正常")
    except:
        print("[!] 后端服务器无法连接，请先启动后端")
        sys.exit(1)

    # 确保上传目录存在
    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    # 启动微信登录（生成二维码图片，保存在 uploads/wechat_qr.png）
    print("[二维码] 正在生成二维码...")
    itchat.auto_login(
        hotReload=True,
        loginCallback=login_callback,
        exitCallback=exit_callback,
        enableCmdQR=-1,  # 将二维码保存为图片
        qrCallback=lambda uuid, status, qrcode: (
            open(QR_CODE_PATH, 'wb').write(qrcode) if status == '0' else None
        )
    )
    print("[✓] 微信登录完成，开始监听消息...")
    print("[提示] 按 Ctrl+C 停止监听")
    itchat.run(blockThread=True)