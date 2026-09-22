#!/bin/zsh

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=5180
URL="http://localhost:${PORT}/"

cd "$SCRIPT_DIR" || exit 1

echo "========================================"
echo "  有米出行管理后台"
echo "========================================"
echo "项目目录：$SCRIPT_DIR"
echo "访问地址：$URL"
echo

if curl --silent --fail --max-time 2 "$URL" >/dev/null 2>&1; then
  echo "服务已在运行，正在打开浏览器……"
  open "$URL"
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "启动失败：未找到 npm，请先安装 Node.js。"
  echo
  read -r "?按回车键关闭窗口……"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "首次运行，正在安装依赖……"
  if ! npm install --no-fund --no-audit; then
    echo
    echo "依赖安装失败，请检查网络或 Node.js 环境。"
    read -r "?按回车键关闭窗口……"
    exit 1
  fi
fi

echo "正在启动服务……"
npm run dev &
SERVER_PID=$!

for attempt in {1..60}; do
  if curl --silent --fail --max-time 1 "$URL" >/dev/null 2>&1; then
    echo
    echo "启动成功，正在打开浏览器……"
    open "$URL"
    echo "服务运行中。关闭此终端窗口或按 Control+C 可停止服务。"
    wait "$SERVER_PID"
    exit $?
  fi

  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo
    echo "启动失败：服务进程已退出。"
    read -r "?按回车键关闭窗口……"
    exit 1
  fi

  sleep 0.5
done

echo
echo "启动超时，正在停止服务……"
kill "$SERVER_PID" >/dev/null 2>&1
read -r "?按回车键关闭窗口……"
exit 1
