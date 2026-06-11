/** Bare WorkOS subject ("user_…") from a full tokenIdentifier ("<issuer>|<subject>").
 *  Used in panel URLs — admin queries expand it back against the issuer. */
export function subjectOf(tokenIdentifier: string): string {
  return tokenIdentifier.split("|").pop() ?? tokenIdentifier
}
