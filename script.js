// Calculator script

// DOM Elements
const display = document.getElementById('display');
const buttons = document.querySelectorAll('button');

// Calculator state variables
let currentInput = '0'; // Current value shown on display
let firstOperand = null;
let operator = null;
let shouldResetDisplay = false; // True if next digit entry should clear the display

// Initialize display
updateDisplay();

// Event Listeners
buttons.forEach(button => {
  button.addEventListener('click', () => handleButtonClick(button.textContent));
});

function handleButtonClick(value) {
  if (isDigit(value) || value === '.') {
    handleDigit(value);
  } else if (isOperator(value)) {
    handleOperator(value);
  } else if (value === '=') {
    handleEquals();
  } else if (value === 'C') {
    handleClear();
  }
  updateDisplay();
}

function isDigit(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function isOperator(value) {
  return ['+', '-', '*', '/'].includes(value);
}

function handleDigit(digit) {
  if (shouldResetDisplay || currentInput === '0' && digit !== '.') {
    currentInput = '';
    shouldResetDisplay = false;
  }
  // Prevent multiple decimal points
  if (digit === '.' && currentInput.includes('.')) {
    return;
  }
  currentInput += digit;
}

function handleOperator(nextOperator) {
  if (operator && !shouldResetDisplay) {
    // If there's an existing operator and we haven't just set one (i.e. not 5 * * 5)
    // perform the calculation
    const result = calculate(firstOperand, parseFloat(currentInput), operator);
    currentInput = String(result);
    firstOperand = result;
  } else {
    // Otherwise, store the current input as the first operand
    firstOperand = parseFloat(currentInput);
  }

  operator = nextOperator;
  shouldResetDisplay = true; // Next digit entry should clear display for the new operand
}

function handleEquals() {
  if (operator && firstOperand !== null && currentInput !== '') {
    // Check if currentInput is a valid number before parsing
    const secondOperand = parseFloat(currentInput);
    if (isNaN(secondOperand)) {
        // Handle case where currentInput is not a valid number, e.g., just "."
        currentInput = "Error";
        resetCalculatorState();
        return;
    }

    const result = calculate(firstOperand, secondOperand, operator);
    currentInput = String(result);
    firstOperand = result; // Result becomes the new first operand for chained calculations
    operator = null;
    shouldResetDisplay = true; // Display will show result, next digit clears it
  }
}

function handleClear() {
  currentInput = '0';
  firstOperand = null;
  operator = null;
  shouldResetDisplay = false;
  updateDisplay(); // Ensure display is cleared immediately
}

function resetCalculatorState() {
    firstOperand = null;
    operator = null;
    shouldResetDisplay = false;
}

function updateDisplay() {
  display.value = currentInput;
}

function calculate(num1, num2, op) {
  // Handle potential division by zero
  if (op === '/' && num2 === 0) {
    resetCalculatorState();
    return "Error";
  }

  let result;
  switch (op) {
    case '+':
      result = num1 + num2;
      break;
    case '-':
      result = num1 - num2;
      break;
    case '*':
      result = num1 * num2;
      break;
    case '/':
      result = num1 / num2;
      break;
    default:
      return num2; // Should not happen
  }

  // Attempt to fix floating point inaccuracies for simple cases
  // For more complex scenarios, a dedicated library for decimal arithmetic would be better
  if (op === '+' || op === '-') {
      const precision = Math.max(getPrecision(num1), getPrecision(num2), getPrecision(result));
      if (precision > 0 && precision <= 10) { // Apply only if there are decimals and precision is reasonable
          return parseFloat(result.toFixed(precision));
      }
  }
  return result;
}

// Helper function to get precision of a number
function getPrecision(num) {
    if (!isFinite(num)) return 0;
    const s = String(num);
    const d = s.indexOf('.');
    return d === -1 ? 0 : s.length - d - 1;
}
