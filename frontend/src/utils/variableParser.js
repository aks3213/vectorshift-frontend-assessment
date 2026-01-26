// variableParser.js
// Utility functions for variable detection and parsing in text content

// Regular expression to match variable patterns like {{ variableName }}
const VARIABLE_REGEX = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

/**
 * Validates if a string is a valid JavaScript variable name
 * @param {string} name - The variable name to validate
 * @returns {boolean} - True if valid JavaScript variable name
 */
export const isValidJavaScriptVariableName = (name) => {
  // JavaScript variable name rules:
  // - Must start with letter, underscore, or dollar sign
  // - Can contain letters, digits, underscores, or dollar signs
  // - Cannot be a reserved keyword
  const validNameRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  
  // List of JavaScript reserved keywords
  const reservedKeywords = [
    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
    'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
    'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
    'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
    'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
    'null', 'package', 'private', 'protected', 'public', 'return', 'short',
    'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
    'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
    'with', 'yield'
  ];
  
  return validNameRegex.test(name) && !reservedKeywords.includes(name.toLowerCase());
};

/**
 * Parses text content to extract valid JavaScript variables
 * @param {string} text - The text content to parse
 * @returns {Array} - Array of variable objects with name, startIndex, endIndex
 */
export const parseVariables = (text) => {
  const variables = [];
  let match;
  
  // Reset regex lastIndex to ensure proper matching
  VARIABLE_REGEX.lastIndex = 0;
  
  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    const variableName = match[1].trim();
    
    // Only include variables with valid JavaScript names
    if (isValidJavaScriptVariableName(variableName)) {
      variables.push({
        name: variableName,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        fullMatch: match[0]
      });
    }
  }
  
  return variables;
};

/**
 * Extracts unique variable names from text content
 * @param {string} text - The text content to parse
 * @returns {Array} - Array of unique valid variable names
 */
export const extractVariableNames = (text) => {
  const variables = parseVariables(text);
  const uniqueNames = [...new Set(variables.map(v => v.name))];
  return uniqueNames;
};

/**
 * Checks if text contains any valid variables
 * @param {string} text - The text content to check
 * @returns {boolean} - True if text contains valid variables
 */
export const hasVariables = (text) => {
  return extractVariableNames(text).length > 0;
};

/**
 * Gets the variable regex pattern for external use
 * @returns {RegExp} - The variable detection regex
 */
export const getVariableRegex = () => {
  return new RegExp(VARIABLE_REGEX.source, VARIABLE_REGEX.flags);
};