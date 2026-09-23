import os

from strands import Agent
from strands.models.mistral import MistralModel

model = MistralModel(
    api_key=os.environ["MISTRAL_API_KEY"],
    model_id="devstral-2-latest",
)

agent = Agent(model=model)

if __name__ == "__main__":
    agent("Hello!")
