from pathlib import Path

XARAB_KEYBOARD_MAP = {
    '`': 'ذ', 'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح', '[': 'ج', ']': 'د',
    'a': 'ش', 's': 'س', 'd': 'ي', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن', 'l': 'م', ';': 'ك', "'": 'ط',
    'z': 'ئ', 'x': 'ء', 'c': 'ؤ', 'v': 'ر', 'b': 'لا', 'n': 'ى', 'm': 'ة', ',': 'و', '.': 'ز', '/': 'ظ',
    '{': 'ج', '}': 'د', ':': 'ك', '"': 'ط', '<': 'و', '>': 'ز', '?': 'ظ',
}


def is_xarab_font(font):
    if not font:
        return False
    normalized = Path(str(font)).name.lower().replace('-', '').replace('_', '')
    return normalized.startswith('xarab')


def decode_xarab_text(raw_text):
    if raw_text is None:
        return None
    decoded = []
    for char in raw_text:
        if char == '_':
            continue
        mapped = XARAB_KEYBOARD_MAP.get(char)
        if mapped is None and char.isalpha():
            mapped = XARAB_KEYBOARD_MAP.get(char.lower())
        decoded.append(mapped if mapped is not None else char)
    return ''.join(decoded).strip()


def decode_legacy_shx_text(raw_text, font):
    if not is_xarab_font(font):
        return None, None
    return decode_xarab_text(raw_text), 'xarab-keyboard-v1'
