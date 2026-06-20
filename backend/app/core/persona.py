from app.config import settings


TONE_INSTRUCTIONS = {
    "professional": "Use a professional and clear tone.",
    "casual": "Use a friendly, casual tone.",
    "formal": "Use a formal and precise tone.",
    "friendly": "Use a warm and approachable tone.",
}


def _tone_and_language() -> str:
    tone = TONE_INSTRUCTIONS.get(settings.tone, TONE_INSTRUCTIONS["professional"])
    return f"{tone} Respond in {settings.language}."


def build_system_prompt(collection_slug: str | None = None, context: str = "", strict: bool = True) -> str:
    base = settings.default_system_prompt
    if collection_slug:
        override = settings.collection_system_prompt(collection_slug)
        if override:
            base = override

    parts = [base, _tone_and_language()]

    if settings.require_citations:
        parts.append("Cite sources from the context using: " + settings.citation_format)

    parts.append(f"Keep answers under {settings.max_answer_tokens} tokens.")

    if strict:
        parts.append(
            "Use ONLY the context below. If the answer is not in the context, say you could not find it in the documents."
        )
    else:
        parts.append(
            "Prefer the context below. If it partially answers the question, say what you know and note uncertainty."
        )

    if context:
        parts.append("\n--- CONTEXT ---\n" + context)
        parts.append("--- END CONTEXT ---")

    return "\n".join(parts)


def build_general_system_prompt(document_names: list[str] | None = None) -> str:
    parts = [
        "You are a helpful, accurate assistant for this website's chat widget.",
        _tone_and_language(),
        "Be concise, friendly, and accurate.",
        f"Keep answers under {settings.max_answer_tokens} tokens.",
    ]

    if settings.company_context.strip():
        parts.append("\n--- COMPANY / SUPPORT INFO ---\n" + settings.company_context.strip())

    if document_names:
        listing = "\n".join(f"- {name}" for name in document_names)
        parts.append(
            "\n--- UPLOADED KNOWLEDGE BASE ---\n"
            f"The user has these documents indexed for technical Q&A:\n{listing}\n"
            "For technical questions, encourage specific questions about these topics."
        )

    parts.append(
        "If asked something outside the knowledge base, answer helpfully from company info above when possible. "
        "Do not invent technical specifications."
    )
    return "\n".join(parts)


def get_widget_config() -> dict:
    return {
        "title": settings.widget_title,
        "primaryColor": settings.widget_primary_color,
        "position": settings.widget_position,
        "starterQuestions": settings.starter_questions,
        "welcomeMessage": settings.welcome_message,
        "siteUrl": settings.site_url,
    }
