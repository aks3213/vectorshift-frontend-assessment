// variableParser.test.js
import { 
  isValidJavaScriptVariableName, 
  parseVariables, 
  extractVariableNames, 
  hasVariables 
} from './variableParser';
import fc from 'fast-check';

describe('Variable Parser', () => {
  describe('isValidJavaScriptVariableName', () => {
    test('should accept valid variable names', () => {
      expect(isValidJavaScriptVariableName('validName')).toBe(true);
      expect(isValidJavaScriptVariableName('_underscore')).toBe(true);
      expect(isValidJavaScriptVariableName('$dollar')).toBe(true);
      expect(isValidJavaScriptVariableName('name123')).toBe(true);
      expect(isValidJavaScriptVariableName('camelCase')).toBe(true);
    });

    test('should reject invalid variable names', () => {
      expect(isValidJavaScriptVariableName('123invalid')).toBe(false);
      expect(isValidJavaScriptVariableName('invalid-name')).toBe(false);
      expect(isValidJavaScriptVariableName('invalid.name')).toBe(false);
      expect(isValidJavaScriptVariableName('invalid name')).toBe(false);
    });

    test('should reject reserved keywords', () => {
      expect(isValidJavaScriptVariableName('function')).toBe(false);
      expect(isValidJavaScriptVariableName('var')).toBe(false);
      expect(isValidJavaScriptVariableName('let')).toBe(false);
      expect(isValidJavaScriptVariableName('const')).toBe(false);
      expect(isValidJavaScriptVariableName('if')).toBe(false);
    });
  });

  describe('parseVariables', () => {
    test('should parse single variable', () => {
      const text = 'Hello {{ name }}!';
      const variables = parseVariables(text);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('name');
      expect(variables[0].startIndex).toBe(6);
      expect(variables[0].fullMatch).toBe('{{ name }}');
    });

    test('should parse multiple variables', () => {
      const text = 'Hello {{ firstName }} {{ lastName }}!';
      const variables = parseVariables(text);
      
      expect(variables).toHaveLength(2);
      expect(variables[0].name).toBe('firstName');
      expect(variables[1].name).toBe('lastName');
    });

    test('should handle variables with whitespace', () => {
      const text = 'Hello {{  name  }}!';
      const variables = parseVariables(text);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('name');
    });

    test('should ignore invalid variable names', () => {
      const text = 'Hello {{ 123invalid }} {{ valid_name }}!';
      const variables = parseVariables(text);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('valid_name');
    });

    test('should ignore reserved keywords', () => {
      const text = 'Hello {{ function }} {{ validName }}!';
      const variables = parseVariables(text);
      
      expect(variables).toHaveLength(1);
      expect(variables[0].name).toBe('validName');
    });
  });

  describe('extractVariableNames', () => {
    test('should extract unique variable names', () => {
      const text = 'Hello {{ name }} and {{ name }} again, plus {{ age }}!';
      const names = extractVariableNames(text);
      
      expect(names).toHaveLength(2);
      expect(names).toContain('name');
      expect(names).toContain('age');
    });

    test('should return empty array for no variables', () => {
      const text = 'Hello world!';
      const names = extractVariableNames(text);
      
      expect(names).toHaveLength(0);
    });
  });

  describe('hasVariables', () => {
    test('should return true when variables exist', () => {
      expect(hasVariables('Hello {{ name }}!')).toBe(true);
    });

    test('should return false when no variables exist', () => {
      expect(hasVariables('Hello world!')).toBe(false);
    });

    test('should return false when only invalid variables exist', () => {
      expect(hasVariables('Hello {{ 123invalid }}!')).toBe(false);
    });
  });

  // Property-Based Tests
  describe('Property 6: Variable Name Validation', () => {
    test('**Feature: vectorshift-assessment, Property 6: Variable Name Validation** - For any string within double curly brackets, the Text_Node should only create handles for strings that follow JavaScript variable naming conventions', () => {
      // Generator for valid JavaScript variable names
      const validVariableNameArb = fc.string({ minLength: 1, maxLength: 20 })
        .filter(str => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str))
        .filter(str => {
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
          return !reservedKeywords.includes(str.toLowerCase());
        });

      // Generator for invalid JavaScript variable names
      const invalidVariableNameArb = fc.oneof(
        // Names starting with digits
        fc.string({ minLength: 1, maxLength: 20 }).filter(str => /^[0-9]/.test(str)),
        // Names with invalid characters
        fc.string({ minLength: 1, maxLength: 20 }).filter(str => /[^a-zA-Z0-9_$]/.test(str) && str.trim().length > 0),
        // Reserved keywords
        fc.constantFrom('function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class')
      );

      // Property: Valid variable names should be accepted
      fc.assert(fc.property(validVariableNameArb, (validName) => {
        const text = `Hello {{ ${validName} }}!`;
        const variables = parseVariables(text);
        
        // Should find exactly one variable with the valid name
        expect(variables).toHaveLength(1);
        expect(variables[0].name).toBe(validName);
        expect(isValidJavaScriptVariableName(validName)).toBe(true);
      }), { numRuns: 100 });

      // Property: Invalid variable names should be rejected
      fc.assert(fc.property(invalidVariableNameArb, (invalidName) => {
        const text = `Hello {{ ${invalidName} }}!`;
        const variables = parseVariables(text);
        
        // Should not find any variables (invalid names are filtered out)
        expect(variables).toHaveLength(0);
        expect(isValidJavaScriptVariableName(invalidName)).toBe(false);
      }), { numRuns: 100 });

      // Property: Mixed valid and invalid variables
      fc.assert(fc.property(
        fc.array(validVariableNameArb, { minLength: 1, maxLength: 5 }),
        fc.array(invalidVariableNameArb, { minLength: 1, maxLength: 5 }),
        (validNames, invalidNames) => {
          // Create text with both valid and invalid variables
          const validParts = validNames.map(name => `{{ ${name} }}`);
          const invalidParts = invalidNames.map(name => `{{ ${name} }}`);
          const allParts = [...validParts, ...invalidParts];
          const text = `Text with variables: ${allParts.join(' and ')}`;
          
          const variables = parseVariables(text);
          const extractedNames = variables.map(v => v.name);
          
          // Should only find the valid variable names
          expect(variables).toHaveLength(validNames.length);
          validNames.forEach(validName => {
            expect(extractedNames).toContain(validName);
          });
          invalidNames.forEach(invalidName => {
            expect(extractedNames).not.toContain(invalidName);
          });
        }
      ), { numRuns: 50 });
    });
  });
});