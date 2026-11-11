export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    !/\.(?:ts|tsx|js|mjs|cjs|json)$/.test(specifier)
  ) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // Fall through when the sibling .ts file does not exist.
    }
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    // Node ESM will not resolve Next's extensionless export (`next/server`).
    if (!specifier.startsWith('.') && !specifier.endsWith('.js')) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}
