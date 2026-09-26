import os

from dotenv import load_dotenv
from strands import Agent
from strands.models.gemini import GeminiModel

load_dotenv()

model = GeminiModel(
    client_args={
        "api_key": os.environ["GEMINI_API_KEY"],
    },
    # Pinned rather than "gemini-flash-latest" so results don't change silently.
    model_id="gemini-3.8-flash",
)

agent = Agent(model=model)

if __name__ == "__main__":
    agent("Hello!")
