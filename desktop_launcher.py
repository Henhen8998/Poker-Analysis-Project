"""Double-click launcher: reuse a running lab or start it without a console."""
from pathlib import Path
import ctypes
import subprocess
import sys
import time
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
URL = 'http://127.0.0.1:8000'


def running():
    try:
        with urllib.request.urlopen(URL, timeout=1) as response:
            return 'AI Poker Strategy Lab' in response.read(8192).decode('utf-8', errors='replace')
    except (OSError, ValueError):
        return False


def main():
    if not running():
        python = ROOT / 'backend' / '.venv' / 'Scripts' / 'python.exe'
        if not python.exists() or not (ROOT / 'frontend' / 'dist' / 'index.html').exists():
            raise RuntimeError('The app setup is incomplete. See the project README for installation instructions.')
        with (ROOT / 'launcher.log').open('a', encoding='utf-8') as log:
            subprocess.Popen([str(python), str(ROOT / 'launch_lab.py')], cwd=ROOT,
                             stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                             creationflags=subprocess.CREATE_NO_WINDOW)
        deadline = time.monotonic() + 20
        while not running():
            if time.monotonic() >= deadline:
                raise RuntimeError('The app could not start. Port 8000 may be in use. Details are in launcher.log in the poker project folder.')
            time.sleep(.25)
    webbrowser.open(URL)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        ctypes.windll.user32.MessageBoxW(0, str(error), 'AI Poker Strategy Lab', 0x10)
        sys.exit(1)
