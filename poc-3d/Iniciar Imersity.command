#!/bin/zsh
set -e
cd "${0:A:h}"
if [[ ! -x .venv/bin/python ]]; then
  python3 -m venv .venv
  .venv/bin/python -m pip install -r backend/requirements.txt
fi
.venv/bin/python scripts/launch.py || { print '\nNão foi possível iniciar. Confira a mensagem acima.'; read '?Pressione Enter para fechar…'; exit 1; }
