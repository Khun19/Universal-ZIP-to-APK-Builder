import ts from "typescript";

const SHA40 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;

export function selectLatestM6Baseline(registry) {
  if (!registry || !Array.isArray(registry.tested_apks)) {
    throw new Error("M6_REGISTRY_INVALID");
  }
  const candidates = registry.tested_apks
    .filter((record) => record &&
      record.application_id === "com.builder.m6reactnative" &&
      record.device_result === "PASS" &&
      SHA256.test(record.sha256 || "") &&
      SHA40.test(record.source_commit || "") &&
      typeof record.device_tested_at === "string" &&
      !Number.isNaN(Date.parse(record.device_tested_at)))
    .sort((a, b) => Date.parse(b.device_tested_at) - Date.parse(a.device_tested_at));
  if (candidates.length === 0) throw new Error("M6_REGISTRY_BASELINE_MISSING");
  return candidates[0];
}

function parseSource(source, fileName, scriptKind) {
  if (typeof source !== "string") throw new Error("M6_SOURCE_MISSING");
  const parsed = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  if (parsed.parseDiagnostics.length > 0) throw new Error("M6_SOURCE_PARSE_FAILED");
  return parsed;
}

function hasNamedImport(sourceFile, moduleName, importedName) {
  return sourceFile.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== moduleName) return false;
    const bindings = statement.importClause?.namedBindings;
    return Boolean(bindings && ts.isNamedImports(bindings) &&
      bindings.elements.some((element) =>
        (element.propertyName ?? element.name).text === importedName));
  });
}

function getNamedImportLocalName(sourceFile, moduleName, importedName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== moduleName) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const match = bindings.elements.find((element) =>
      (element.propertyName ?? element.name).text === importedName);
    if (match) return match.name.text;
  }
  return null;
}

function getNamespaceImportLocalName(sourceFile, moduleName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== moduleName) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) return bindings.name.text;
  }
  return null;
}

function getDefaultImportLocalName(sourceFile, moduleNames) {
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        !moduleNames.includes(statement.moduleSpecifier.text)) continue;
    const localName = statement.importClause?.name?.text;
    if (localName) return localName;
  }
  return null;
}

function collectBindingNames(name, output) {
  if (ts.isIdentifier(name)) {
    output.add(name.text);
    return;
  }
  if (ts.isArrayBindingPattern(name) || ts.isObjectBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isOmittedExpression(element)) continue;
      collectBindingNames(element.name, output);
    }
  }
}

function hasShadowingDeclaration(root, names, allowedDeclarations = new Set()) {
  let shadowed = false;
  const visit = (node) => {
    if (shadowed) return;
    let binding = null;
    if (ts.isVariableDeclaration(node) || ts.isParameter(node)) {
      binding = node.name;
    } else if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) {
      binding = node.name;
    } else if (ts.isCatchClause(node) && node.variableDeclaration) {
      binding = node.variableDeclaration.name;
    }
    if (binding && !allowedDeclarations.has(node)) {
      const declared = new Set();
      collectBindingNames(binding, declared);
      if ([...declared].some((name) => names.has(name))) {
        shadowed = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return shadowed;
}

function assignmentTargetTouches(node, names) {
  if (!node) return false;
  if (ts.isIdentifier(node)) return names.has(node.text);
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    return assignmentTargetTouches(node.expression, names);
  }
  if (ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node) ||
      ts.isArrayBindingPattern(node) || ts.isObjectBindingPattern(node)) {
    return node.elements.some((element) => {
      const target = ts.isPropertyAssignment(element) ? element.initializer : element;
      return assignmentTargetTouches(target, names);
    });
  }
  if (ts.isSpreadElement(node) || ts.isSpreadAssignment(node)) {
    return assignmentTargetTouches(node.expression, names);
  }
  return false;
}

function hasUnsafeMutation(root, names) {
  let mutated = false;
  const visit = (node) => {
    if (mutated) return;
    if (ts.isBinaryExpression(node) &&
        node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
        assignmentTargetTouches(node.left, names)) {
      mutated = true;
      return;
    }
    if (ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        ["Object", "Reflect"].includes(node.expression.expression.text) &&
        new Set(["assign", "defineProperty", "defineProperties", "setPrototypeOf", "set", "defineProperty", "deleteProperty"])
          .has(node.expression.name.text) &&
        node.arguments.some((argument) => assignmentTargetTouches(argument, names))) {
      mutated = true;
      return;
    }
    if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
        (node.operator === ts.SyntaxKind.PlusPlusToken ||
         node.operator === ts.SyntaxKind.MinusMinusToken ||
         node.operator === ts.SyntaxKind.DeleteKeyword) &&
        assignmentTargetTouches(node.operand, names)) {
      mutated = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return mutated;
}

function isDefaultAppFunction(node) {
  if (!ts.isFunctionDeclaration(node) || node.name?.text !== "App") return false;
  const modifiers = node.modifiers ?? [];
  return modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
    modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword);
}

function isInsideDefaultApp(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (isDefaultAppFunction(current)) return true;
  }
  return false;
}

function jsxAttribute(openingElement, name) {
  return openingElement.attributes.properties.find((property) =>
    ts.isJsxAttribute(property) &&
    ts.isIdentifier(property.name) &&
    property.name.text === name);
}

function unwrapExpression(node) {
  let current = node;
  while (current && (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current)
  )) current = current.expression;
  return current;
}

function hasResetHandler(attribute, setterName = "setCount") {
  if (!attribute || !attribute.initializer || !ts.isJsxExpression(attribute.initializer)) return false;
  const handler = unwrapExpression(attribute.initializer.expression);
  if (!handler || !ts.isArrowFunction(handler)) return false;
  const body = unwrapExpression(handler.body);
  if (!body || !ts.isCallExpression(body)) return false;
  const callee = unwrapExpression(body.expression);
  return Boolean(
    callee && ts.isIdentifier(callee) && callee.text === setterName &&
    body.arguments.length === 1 &&
    ts.isNumericLiteral(body.arguments[0]) &&
    Number(body.arguments[0].text) === 0
  );
}

function hasResetText(element, sourceFile) {
  return element.children.some((child) =>
    ts.isJsxElement(child) &&
    ts.isIdentifier(child.openingElement.tagName) &&
    child.openingElement.tagName.text === "Text" &&
    child.children.some((text) =>
      ts.isJsxText(text) && text.getText(sourceFile).trim() === "Reset counter"));
}

function hasCountStateBinding(appFunction, sourceFile) {
  const useStateName = getNamedImportLocalName(sourceFile, "react", "useState");
  if (!useStateName) return false;
  let stateDeclaration = null;
  const visit = (node) => {
    if (node !== appFunction.body && ts.isFunctionLike(node)) return;
    if (ts.isVariableDeclaration(node) &&
        ts.isArrayBindingPattern(node.name) &&
        node.initializer) {
      const call = unwrapExpression(node.initializer);
      const callee = call && ts.isCallExpression(call)
        ? unwrapExpression(call.expression)
        : null;
      const [countElement, setterElement] = node.name.elements;
      if (callee && ts.isIdentifier(callee) && callee.text === useStateName &&
          countElement && setterElement &&
          ts.isBindingElement(countElement) && ts.isBindingElement(setterElement) &&
          ts.isIdentifier(countElement.name) && countElement.name.text === "count" &&
          ts.isIdentifier(setterElement.name) && setterElement.name.text === "setCount" &&
          call.arguments.length === 1 &&
          ts.isNumericLiteral(call.arguments[0]) &&
          Number(call.arguments[0].text) === 0) {
        stateDeclaration = node;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(appFunction.body);
  if (!stateDeclaration) return false;
  const protectedNames = new Set([useStateName, "setCount"]);
  return !hasShadowingDeclaration(appFunction.body, protectedNames, new Set([stateDeclaration])) &&
    !hasUnsafeMutation(appFunction.body, protectedNames);
}

function hasResetPressable(sourceFile) {
  const pressableName = getNamedImportLocalName(sourceFile, "react-native", "Pressable");
  const textName = getNamedImportLocalName(sourceFile, "react-native", "Text");
  if (pressableName !== "Pressable" || textName !== "Text") return false;
  const appFunction = sourceFile.statements.find(isDefaultAppFunction);
  if (!appFunction?.body || !hasCountStateBinding(appFunction, sourceFile)) return false;
  if (hasShadowingDeclaration(appFunction.body, new Set([pressableName, textName]))) return false;

  let found = false;
  const visitReturnedJsx = (node) => {
    // Only inspect JSX in an App return expression. Ignore JSX inside nested
    // functions, callbacks, strings, comments, or unused local components.
    if (ts.isFunctionLike(node)) return;
    if (ts.isJsxElement(node) &&
        ts.isIdentifier(node.openingElement.tagName) &&
        node.openingElement.tagName.text === "Pressable") {
      const label = jsxAttribute(node.openingElement, "accessibilityLabel");
      const handler = jsxAttribute(node.openingElement, "onPress");
      const hasLabel = Boolean(label?.initializer &&
        ts.isStringLiteral(label.initializer) &&
        label.initializer.text === "Reset tap count");
      if (hasLabel && hasResetHandler(handler) && hasResetText(node, sourceFile)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(node, visitReturnedJsx);
  };

  const visitAppBody = (node) => {
    if (node !== appFunction.body && ts.isFunctionLike(node)) return;
    if (ts.isReturnStatement(node) && node.expression) {
      visitReturnedJsx(node.expression);
      return;
    }
    ts.forEachChild(node, visitAppBody);
  };
  visitAppBody(appFunction.body);
  return found;
}

function hasTrustedFixtureDirectory(callback, pathName) {
  return callback.body.statements.some((statement) => {
    if (!ts.isVariableStatement(statement) ||
        (statement.declarationList.flags & ts.NodeFlags.Const) === 0 ||
        statement.declarationList.declarations.length !== 1) return false;
    const declaration = statement.declarationList.declarations[0];
    if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "fixtureDir" ||
        !declaration.initializer || !ts.isCallExpression(declaration.initializer)) return false;
    const callee = declaration.initializer.expression;
    return ts.isPropertyAccessExpression(callee) &&
      callee.name.text === "resolve" &&
      ts.isIdentifier(callee.expression) && callee.expression.text === pathName &&
      declaration.initializer.arguments.length === 1 &&
      ts.isStringLiteral(declaration.initializer.arguments[0]) &&
      declaration.initializer.arguments[0].text === "./tests/fixtures/react-native-project";
  });
}

function readAppSourceDeclaration(statement, readFileBinding, pathName) {
  if (!readFileBinding || !ts.isVariableStatement(statement)) return false;
  return statement.declarationList.declarations.some((declaration) => {
    if (!ts.isIdentifier(declaration.name) || declaration.name.text !== "appSource" ||
        (statement.declarationList.flags & ts.NodeFlags.Const) === 0 ||
        statement.declarationList.declarations.length !== 1 ||
        !declaration.initializer || !ts.isCallExpression(declaration.initializer)) return false;
    const expression = declaration.initializer.expression;
    const readsFile = readFileBinding.kind === "named"
      ? ts.isIdentifier(expression) && expression.text === readFileBinding.localName
      : ts.isPropertyAccessExpression(expression) &&
        expression.name.text === "readFileSync" &&
        ts.isIdentifier(expression.expression) &&
        expression.expression.text === readFileBinding.localName;
    if (!readsFile || declaration.initializer.arguments.length < 1) return false;
    const filePath = declaration.initializer.arguments[0];
    if (!ts.isCallExpression(filePath) ||
        !ts.isPropertyAccessExpression(filePath.expression) ||
        filePath.expression.name.text !== "join" ||
        !ts.isIdentifier(filePath.expression.expression) ||
        filePath.expression.expression.text !== pathName ||
        filePath.arguments.length !== 2 ||
        !ts.isIdentifier(filePath.arguments[0]) ||
        filePath.arguments[0].text !== "fixtureDir" ||
        !ts.isStringLiteral(filePath.arguments[1]) ||
        filePath.arguments[1].text !== "App.js") return false;
    return true;
  });
}

function resetAssertionKind(statement, assertName, sourceFile) {
  if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) return null;
  const call = statement.expression;
  if (!ts.isPropertyAccessExpression(call.expression) ||
      call.expression.name.text !== "match" ||
      !ts.isIdentifier(call.expression.expression) ||
      call.expression.expression.text !== assertName ||
      call.arguments.length < 2 ||
      !ts.isIdentifier(call.arguments[0]) ||
      call.arguments[0].text !== "appSource" ||
      !ts.isRegularExpressionLiteral(call.arguments[1])) return null;
  const pattern = call.arguments[1].getText(sourceFile);
  if (pattern.includes("accessibilityLabel") && pattern.includes("Reset tap count")) return "label";
  if (pattern.includes("onPress") && pattern.includes("setCount\\(0\\)")) return "handler";
  if (pattern.includes("Reset counter")) return "text";
  return null;
}

function hasResetAssertions(sourceFile) {
  const testName = getNamedImportLocalName(sourceFile, "node:test", "test");
  const assertName = getDefaultImportLocalName(sourceFile, ["node:assert", "node:assert/strict"]);
  const namedReadFile =
    getNamedImportLocalName(sourceFile, "node:fs", "readFileSync") ??
    getNamedImportLocalName(sourceFile, "fs", "readFileSync");
  const namespaceReadFile =
    getNamespaceImportLocalName(sourceFile, "node:fs") ??
    getNamespaceImportLocalName(sourceFile, "fs");
  const pathName =
    getNamespaceImportLocalName(sourceFile, "node:path") ??
    getNamespaceImportLocalName(sourceFile, "path");
  const readFileBinding = namedReadFile
    ? { kind: "named", localName: namedReadFile }
    : namespaceReadFile
      ? { kind: "namespace", localName: namespaceReadFile }
      : null;
  if (!testName || !assertName || !readFileBinding || !pathName) return false;
  const readerName = readFileBinding.localName;
  const protectedNames = new Set([testName, assertName, readerName, pathName]);
  if (hasShadowingDeclaration(sourceFile, protectedNames) ||
      hasUnsafeMutation(sourceFile, protectedNames)) return false;

  // Only a top-level node:test registration is executed by the test runner.
  // A test() call hidden inside an uncalled function must not qualify.
  for (const statement of sourceFile.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
    const call = statement.expression;
    if (!ts.isIdentifier(call.expression) || call.expression.text !== testName) continue;
    const callback = [...call.arguments].reverse().find((argument) =>
      ts.isArrowFunction(argument) || ts.isFunctionExpression(argument));
    if (!callback || !ts.isBlock(callback.body)) continue;

    const statements = callback.body.statements;
    if (!hasTrustedFixtureDirectory(callback, pathName)) continue;
    const fixtureDirStatement = statements.find((statement) =>
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some((declaration) =>
        ts.isIdentifier(declaration.name) && declaration.name.text === "fixtureDir"));
    const fixtureDirDeclaration = fixtureDirStatement?.declarationList.declarations.find(
      (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "fixtureDir"
    );
    if (!fixtureDirDeclaration) continue;
    const appSourceIndex = statements.findIndex((item) =>
      readAppSourceDeclaration(item, readFileBinding, pathName));
    if (appSourceIndex < 0) continue;
    const appSourceDeclaration = statements[appSourceIndex].declarationList.declarations.find(
      (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === "appSource"
    );
    const callbackNames = new Set(["appSource", "fixtureDir"]);
    const allowedDeclarations = new Set([appSourceDeclaration, fixtureDirDeclaration]);
    if (hasShadowingDeclaration(callback.body, callbackNames, allowedDeclarations) ||
        hasUnsafeMutation(callback.body, new Set([...protectedNames, "appSource", "fixtureDir"]))) continue;

    const kinds = new Set();
    for (let index = appSourceIndex + 1; index < statements.length; index += 1) {
      const kind = resetAssertionKind(statements[index], assertName, sourceFile);
      if (kind) kinds.add(kind);
    }
    if (kinds.has("label") && kinds.has("handler") && kinds.has("text")) return true;
  }
  return false;
}

export function classifyBehaviorDiff({
  mergeBase,
  baselineCommit,
  appDiffExitCode,
  testDiffExitCode,
  baselineAppSource = "",
  candidateAppSource = "",
  baselineTestSource = "",
  candidateTestSource = ""
}) {
  if (typeof mergeBase !== "string" || !SHA40.test(mergeBase)) {
    throw new Error("M6_DIFF_MERGE_BASE_MISSING");
  }
  if (typeof baselineCommit !== "string" ||
      !SHA40.test(baselineCommit) ||
      mergeBase !== baselineCommit) {
    throw new Error("M6_BASELINE_NOT_ANCESTOR");
  }
  for (const exitCode of [appDiffExitCode, testDiffExitCode]) {
    if (exitCode !== 0 && exitCode !== 1) throw new Error("M6_DIFF_EXECUTION_FAILED");
  }

  const baselineApp = parseSource(baselineAppSource, "baseline-App.jsx", ts.ScriptKind.JSX);
  const candidateApp = parseSource(candidateAppSource, "candidate-App.jsx", ts.ScriptKind.JSX);
  const baselineTest = parseSource(baselineTestSource, "baseline-react-native-pipeline.test.ts", ts.ScriptKind.TS);
  const candidateTest = parseSource(candidateTestSource, "candidate-react-native-pipeline.test.ts", ts.ScriptKind.TS);

  const pairedDiff = appDiffExitCode === 1 && testDiffExitCode === 1;
  const appBehaviorAdded = !hasResetPressable(baselineApp) && hasResetPressable(candidateApp);
  const testCoverageAdded = !hasResetAssertions(baselineTest) && hasResetAssertions(candidateTest);
  const behaviorChanged = pairedDiff && appBehaviorAdded && testCoverageAdded;
  return {
    behaviorChanged,
    appBehaviorAdded,
    testCoverageAdded,
    targetBehavior: behaviorChanged
      ? "Reset tap count to zero using the Reset counter button"
      : null,
    reason: behaviorChanged
      ? "M6_RESET_BEHAVIOR_AND_EXECUTED_REGRESSION_ASSERTIONS_ADDED_FROM_TRUSTED_BASELINE"
      : "M6_PAIRED_SEMANTIC_APP_AND_EXECUTED_TEST_ADDITIONS_REQUIRED"
  };
}
