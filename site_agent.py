"""Apply a client's change request to one of our Astro + Svelte sites.

    python site_agent.py <site-folder> "<client request>"

The agent can only read and edit files inside the site's src/ folder, and it
must get a passing build before it finishes. Review the resulting git diff
before anything is deployed.
"""

import os
import subprocess
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
from strands import Agent, tool
from strands.models.gemini import GeminiModel

load_dotenv()

SITE = Path(sys.argv[1]).resolve()
SRC = SITE / "src"


def _in_src(path: str) -> Path:
    resolved = (SITE / path).resolve()
    if not resolved.is_relative_to(SRC):
        raise ValueError("Only files inside src/ can be read or changed.")
    return resolved


@tool
def list_files() -> str:
    """List the site's source files (paths relative to the site folder)."""
    return "\n".join(sorted(str(p.relative_to(SITE)) for p in SRC.rglob("*") if p.is_file()))


@tool
def read_file(path: str) -> str:
    """Read a source file, e.g. "src/site.config.ts"."""
    return _in_src(path).read_text()


@tool
def replace_in_file(path: str, old: str, new: str) -> str:
    """Replace an exact snippet in a source file. `old` must appear exactly once."""
    file = _in_src(path)
    text = file.read_text()
    count = text.count(old)
    if count != 1:
        return f"Not changed: the snippet appears {count} times. Include more surrounding text so it is unique."
    file.write_text(text.replace(old, new))
    return f"Updated {path}."


@tool
def build_site() -> str:
    """Build the site. Returns "Build succeeded" or the end of the error output."""
    result = subprocess.run(["npm", "run", "build"], cwd=SITE, capture_output=True, text=True)
    if result.returncode == 0:
        return "Build succeeded"
    return "Build failed:\n" + (result.stdout + result.stderr)[-3000:]


SYSTEM_PROMPT = """You maintain a small-business website built with Astro 7 and Svelte 5 (runes syntax only).
Where things live:
- src/site.config.ts: business name, location, blurbs and opening hours.
- src/data/bakes.ts: the menu (each item's name, description, price, tags, days, and art).
- src/content/notes/: journal posts in Markdown.
Rules:
- Make only the changes the client asked for. Keep the existing code style and wording.
- For a new menu item, pick the closest existing `art` value; don't invent new ones.
- After editing, call build_site. If it fails, fix the problem and build again.
- Finish with a short, plain-English summary for the site owner of what changed."""

# Pinned versions, tried in order. When one is overloaded ("503") or out of quota
# ("429"), we move on to the next; each model has its own quota.
MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"]


def _unavailable(error: Exception) -> bool:
    message = str(error)
    return "503" in message or "429" in message or "quota" in message


def run(request: str) -> None:
    for model_id in MODELS:
        # Overloads are often momentary, so give each model a few tries before moving on.
        for attempt in range(1, 4):
            agent = Agent(
                model=GeminiModel(client_args={"api_key": os.environ["GEMINI_API_KEY"]}, model_id=model_id),
                system_prompt=SYSTEM_PROMPT,
                tools=[list_files, read_file, replace_in_file, build_site],
            )
            try:
                print(f"[using {model_id}, try {attempt}]", flush=True)
                agent(request)
                return
            except Exception as error:  # the SDK wraps these errors in its own exception types
                if not _unavailable(error):
                    raise
                reason = "out of quota" if "429" in str(error) or "quota" in str(error) else "overloaded"
                print(f"\n[{model_id} {reason}]", flush=True)
                if reason == "out of quota":
                    break
                time.sleep(15 * attempt)
        # Files edited so far stay edited; the next model reads them fresh.
    sys.exit("No model is available right now (overloaded or out of quota). Try again later.")


if __name__ == "__main__":
    run(sys.argv[2])
