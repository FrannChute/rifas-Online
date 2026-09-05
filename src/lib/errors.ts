export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error inesperado.";
}

export function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const maybeError = error as Error & { code?: string };
  const code = maybeError.code ?? "";

  return (
    code === "ECONNREFUSED" ||
    code === "P1001" ||
    code === "P2021" ||
    code === "P2022" ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("Timed out fetching a new connection") ||
    error.message.includes("does not exist in the current database") ||
    (error.message.includes("relation") && error.message.includes("does not exist"))
  );
}
