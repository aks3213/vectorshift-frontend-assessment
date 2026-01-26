// variableParser.test.js
import { 
  isValidJavaScriptVariableName, 
  parseVariables, 
  extractVariableNames, 
  hasVariables 
} from './variableParser';

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
});