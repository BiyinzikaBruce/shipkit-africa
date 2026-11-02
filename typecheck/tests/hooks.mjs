// Test-only module hooks: "server-only" throws outside a React Server environment,
// so map it to an empty module when running unit tests in plain Node.
export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  return next(specifier, context);
}
