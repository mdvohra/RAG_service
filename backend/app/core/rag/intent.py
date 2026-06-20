import re

_GREETING = re.compile(
    r"^\s*(hi+|hii+|hello+|hey+|howdy|greetings|good\s+(morning|afternoon|evening)|yo|sup)\s*[!?.]*\s*$",
    re.IGNORECASE,
)

_DOC_OVERVIEW = re.compile(
    r"what\s+(are|is)\s+(the\s+)?(docs?|documents?)\s+(about|uploaded|here)",
    re.IGNORECASE,
)

_SUPPORT = re.compile(
    r"(how\s+(do|can)\s+i\s+)?(contact|reach|call|email)\s+(you|support|help)",
    re.IGNORECASE,
)


def is_greeting(message: str) -> bool:
    return bool(_GREETING.match(message.strip()))


def is_document_overview_question(message: str) -> bool:
    return bool(_DOC_OVERVIEW.search(message.strip()))


def is_support_question(message: str) -> bool:
    return bool(_SUPPORT.search(message.strip()))
