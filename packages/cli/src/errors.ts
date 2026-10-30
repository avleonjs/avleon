/**
 * An expected failure: printed as a one-line message (no stack trace) and
 * turned into a non-zero exit code by the bin entry.
 */
export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode = 1,
  ) {
    super(message);
    this.name = "CliError";
  }
}
