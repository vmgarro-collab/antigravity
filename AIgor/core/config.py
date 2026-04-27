from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "tiny")
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")
