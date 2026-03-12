import fs from 'fs';
import explanations from './src/data/explanations.json' assert { type: 'json' };
import questions from './src/data/questions.json' assert { type: 'json' };

const updated = questions.map(q => ({
  ...q,
  explanation: explanations[String(q.id)] || q.explanation
}));

fs.writeFileSync('./src/data/questions.json', JSON.stringify(updated, null, 2));
console.log('✅ Listo'); 