'use client';

import { useState, useEffect } from 'react';

export function SimpleCaptcha({ onVerify, className = '' }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operation, setOperation] = useState('+');

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = () => {
    const operations = ['+', '*'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    
    setNum1(n1);
    setNum2(n2);
    setOperation(op);
    
    let q = `${n1} ${op === '*' ? '×' : '+'} ${n2}`;
    setQuestion(q);
    setAnswer('');
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    
    const correctAnswer = calculateAnswer(num1, num2, operation);
    onVerify(value === correctAnswer.toString());
  };

  const calculateAnswer = (n1, n2, op) => {
    switch (op) {
      case '+':
        return n1 + n2;
      case '*':
        return n1 * n2;
      default:
        return 0;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <label className="block text-sm font-medium text-gray-300 flex-shrink-0">
          {question} = ?
        </label>
        <button
          type="button"
          onClick={generateQuestion}
          className="text-purple-400 hover:text-purple-300 text-sm transition-colors duration-200"
          title="Nouvelle question"
        >
          🔄
        </button>
      </div>
      <input
        type="text"
        value={answer}
        onChange={handleChange}
        className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:bg-gray-600"
        placeholder="Entrez la réponse"
        required
      />
    </div>
  );
}
