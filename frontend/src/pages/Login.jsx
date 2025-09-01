import { useState } from 'react';
import http from '../api/http';

export default function Login() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await http.post('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      if (data.mustResetPwd) {
        window.location.href = '/first-setup';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      alert('登录失败');
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <input value={username} onChange={(e) => setU(e.target.value)} placeholder="用户名" />
      <input type="password" value={password} onChange={(e) => setP(e.target.value)} placeholder="密码" />
      <button>登录</button>
    </form>
  );
}
