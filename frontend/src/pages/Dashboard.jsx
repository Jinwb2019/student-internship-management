import { useEffect, useState } from 'react';
import http from '../api/http';

export default function Dashboard() {
  const [stage, setStage] = useState(null);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    (async () => {
      const s = await http.get('/stage');
      setStage(s.data);
      const t = await http.get('/todos');
      setTodos(t.data);
    })();
  }, []);

  return (
    <div>
      <h3>当前阶段：{stage?.name || '未设置'}</h3>
      <ul>
        {todos.map((t) => (
          <li key={t.id}>{t.title} {t.done ? '✅' : '⬜'}</li>
        ))}
      </ul>
    </div>
  );
}
