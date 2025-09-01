import { useEffect, useState } from 'react';
import http from '../api/http';

export default function Profile() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await http.get('/me');
      setMe(data);
    })();
  }, []);

  if (!me) return <div>加载中...</div>;

  return (
    <div>
      <h3>个人信息</h3>
      <p>用户名: {me.username}</p>
      <p>角色: {me.role}</p>
      <p>手机号: {me.phone || '未绑定'}</p>
    </div>
  );
}
