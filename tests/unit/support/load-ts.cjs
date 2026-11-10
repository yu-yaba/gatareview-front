const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

// Load real TypeScript sources (and the app's own TS imports) without a bundler.
// `replacements` swaps modules by request string, e.g. 'next/headers'.
const root = path.resolve(__dirname, '../../..')

function resolveSource(request, parentFile) {
  let base
  if (request.startsWith('@/')) base = path.join(root, request.slice(2))
  else if (request.startsWith('./') || request.startsWith('../')) base = path.resolve(path.dirname(parentFile), request)
  else return null
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (/\.tsx?$/.test(candidate) && fs.existsSync(candidate)) return candidate
  }
  return null
}

function loadTs(source, replacements = {}, cache = new Map()) {
  const filename = path.isAbsolute(source) ? source : path.resolve(root, source)
  if (cache.has(filename)) return cache.get(filename).exports
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText
  const sourceModule = new Module(filename, module)
  sourceModule.filename = filename
  sourceModule.paths = Module._nodeModulePaths(path.dirname(filename))
  cache.set(filename, sourceModule)
  const originalRequire = sourceModule.require.bind(sourceModule)
  sourceModule.require = id => {
    if (Object.hasOwn(replacements, id)) return replacements[id]
    const resolved = resolveSource(id, filename)
    return resolved ? loadTs(resolved, replacements, cache) : originalRequire(id)
  }
  sourceModule._compile(compiled, filename)
  return sourceModule.exports
}

module.exports = { loadTs, root }
