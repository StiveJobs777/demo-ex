export function loadFromStorage(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    return fallbackValue;
  } catch {
    // Данные повреждены — возвращаем стартовые
    return fallbackValue;
  }
}

export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}