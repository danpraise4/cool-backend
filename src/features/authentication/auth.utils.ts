export const sanitizeIdentifier = (
  identifier: string
): { type: "email" | "phone"; value: string } => {
  return {
    type: validateIdentifier(identifier) ? "email" : "phone",
    value: identifier.toLowerCase().trim(),
  };
};

export const validateIdentifier = (identifier: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
};
