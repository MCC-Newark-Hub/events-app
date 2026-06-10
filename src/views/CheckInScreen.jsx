import { useState, useEffect } from 'react';
import ICMLogo from '@/components/ICMLogo';

export default function CheckInScreen({ regNumber, regs, updatePresence }) {
  const [status, setStatus] = useState('loading'); // loading | found | already | done | notfound
  const [reg, setReg] = useState(null);

  useEffect(() => {
    const found = regs.find((r) => r.regNumber === regNumber);
    if (!found) { setStatus('notfound'); return; }
    setReg(found);
    setStatus(found.presence === 'present' ? 'already' : 'found');
  }, [regs, regNumber]);

  const confirm = async () => {
    setStatus('loading');
    await updatePresence(reg.id, 'present');
    setStatus('done');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 24px 64px rgba(3,34,63,.4)' }}>
        <ICMLogo height={48} style={{ marginBottom: 16 }} />

        {status === 'loading' && (
          <p style={{ color: '#6b7280', fontSize: 15 }}>Carregando…</p>
        )}

        {status === 'notfound' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❓</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 8 }}>Inscrição não encontrada</h2>
            <p style={{ color: '#6b7280', fontSize: 13 }}>Nº {regNumber}</p>
          </>
        )}

        {status === 'found' && reg && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 24, marginBottom: 4 }}>{reg.badgeName || reg.memberName}</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 4 }}>{reg.memberName}</p>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>{reg.church}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{reg.category}</span>
              {reg.role && <span className="badge badge-purple">{reg.role}</span>}
            </div>
            <button
              onClick={confirm}
              style={{
                width: '100%', padding: '16px 24px', fontSize: 18, fontWeight: 700,
                background: '#2d8a4e', color: '#fff', border: 'none', borderRadius: 12,
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,138,78,.35)',
              }}
            >
              ✅ Confirmar Presença
            </button>
            <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 12 }}>{regNumber}</p>
          </>
        )}

        {status === 'already' && reg && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, marginBottom: 8 }}>Já confirmado!</h2>
            <p style={{ color: '#6b7280', fontSize: 15 }}>{reg.badgeName || reg.memberName} já está marcado como presente.</p>
          </>
        )}

        {status === 'done' && reg && (
          <>
            <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 24, color: '#2d8a4e', marginBottom: 8 }}>Bem-vindo(a)!</h2>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{reg.badgeName || reg.memberName}</p>
            <p style={{ color: '#6b7280', fontSize: 13 }}>Presença registrada com sucesso.</p>
          </>
        )}
      </div>
    </div>
  );
}
