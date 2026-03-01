#!/bin/bash
cd "$(dirname "$0")"
echo "----------------------------------------"
echo "  Scoopy Log — запуск сайту"
echo "----------------------------------------"
if ! command -v node &> /dev/null; then
  echo ""
  echo "Node.js не встановлено."
  echo "Завантаж з https://nodejs.org (кнопка LTS), встанови й запусти цей файл знову."
  echo ""
  read -n 1 -s -r -p "Натисни будь-яку клавішу..."
  exit 1
fi
echo ""
echo "Встановлення залежностей (перший раз може зайняти хвилину)..."
npm install
echo ""
echo "Запуск сайту..."
echo "Відкрий у браузері: http://localhost:3000"
echo "Сторінка плану сну: http://localhost:3000/sleep"
echo ""
echo "Щоб зупинити — закрий це вікно або натисни Ctrl+C"
echo "----------------------------------------"
open "http://localhost:3000" 2>/dev/null || true
npm run dev
