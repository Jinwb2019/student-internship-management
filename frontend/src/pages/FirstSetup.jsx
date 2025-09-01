import { useState } from 'react';
import http from '../api/http';

export default function FirstSetup() {
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await http.post('/auth/first-setup', { phone, newPassword: pwd });
      window.location.href = '/dashboard';
    } catch (err) {
      alert('设置失败');
    }
  };

  return (
    <form onSubmit={submit}>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="手机号" />
      <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="新密码(≥8)" />
      <button>完成</button>
    </form>
  );
}
