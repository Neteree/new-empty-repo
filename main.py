import os

from strands import Agent
from strands.models.anthropic import AnthropicModel

model = AnthropicModel(
    client_args={
        "api_key": os.environ["ANTHROPIC_API_KEY"],
    },
    model_id="claude-sonnet-4-5",
    max_tokens=1024,
)

agent = Agent(model=model)

if __name__ == "__main__":
    agent("Hello!")
