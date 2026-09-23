import os

from dotenv import load_dotenv
from strands import Agent
from strands.models.mistral import MistralModel

load_dotenv()

model = MistralModel(
    api_key=os.environ["MISTRAL_API_KEY"],
    model_id="devstral-2-latest",
)

agent = Agent(model=model)

if __name__ == "__main__":
    agent(
        "Write a WordPress shortcode that displays the 3 most recent blog posts "
        "as cards, showing title, excerpt, and featured image."
    )
