const { parser } = require('jscodeshift');

module.exports = function(fileInfo, api) {
  const j = api.jscodeshift.withParser('tsx');
  const root = j(fileInfo.source);

  let hasChanges = false;
  let hasMotionImport = false;

  // Check for motion import
  root.find(j.ImportDeclaration).forEach(path => {
    if (path.node.source.value === 'motion/react' || path.node.source.value === 'framer-motion') {
      path.node.specifiers.forEach(spec => {
        if (spec.imported && spec.imported.name === 'motion') {
          hasMotionImport = true;
        }
      });
    }
  });

  root.find(j.JSXElement).forEach(path => {
    const openingElement = path.node.openingElement;
    if (openingElement.name.name === 'div') {
      const classNameAttr = openingElement.attributes.find(
        attr => attr.name && attr.name.name === 'className'
      );
      
      if (classNameAttr && classNameAttr.value.type === 'StringLiteral' && (classNameAttr.value.value.includes('geom-card') || classNameAttr.value.value.includes('geom-card-sm'))) {
        // Change div to motion.div
        openingElement.name = j.jsxMemberExpression(
          j.jsxIdentifier('motion'),
          j.jsxIdentifier('div')
        );
        if (path.node.closingElement) {
          path.node.closingElement.name = j.jsxMemberExpression(
            j.jsxIdentifier('motion'),
            j.jsxIdentifier('div')
          );
        }

        // Add whileHover={{ scale: 1.02 }}
        openingElement.attributes.push(
          j.jsxAttribute(
            j.jsxIdentifier('whileHover'),
            j.jsxExpressionContainer(
              j.objectExpression([
                j.objectProperty(j.identifier('scale'), j.numericLiteral(1.02))
              ])
            )
          )
        );
        
        // Add hover:shadow-lg transition-all if not present
        if (!classNameAttr.value.value.includes('hover:shadow')) {
          classNameAttr.value.value += ' hover:shadow-lg transition-all duration-300';
        }

        hasChanges = true;
      }
    }
  });

  if (hasChanges && !hasMotionImport) {
    const importDecl = j.importDeclaration(
      [j.importSpecifier(j.identifier('motion'), j.identifier('motion'))],
      j.stringLiteral('motion/react')
    );
    root.find(j.ImportDeclaration).at(0).insertBefore(importDecl);
  }

  return root.toSource();
};
