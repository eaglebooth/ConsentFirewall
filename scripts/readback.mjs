export function unwrapReadback(raw) {
  let value = raw;
  for (let depth = 0; depth < 3; depth += 1) {
    if (value && typeof value === "object" && Object.keys(value).length === 1 && "result" in value) {
      value = value.result;
      continue;
    }
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
        continue;
      } catch {
        return value;
      }
    }
    return value;
  }
  return value;
}
