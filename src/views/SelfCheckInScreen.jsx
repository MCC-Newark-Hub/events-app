import { useState } from 'react';
import ICMLogo from '@/components/ICMLogo';

// Accent-insensitive search: "joao" matches "João"
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function SelfCheckInScreen({ eventId, regs, members, updatePresence }) {
  const [step, setStep] = useState('search');   // search | confirm | done | already
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [reg, setReg] = useState(null);

  const eventRegs = regs.filter((r) => r.eventId === eventId && !r.cancelled);

  // Search members by name
  const results = query.length > 1
    ? members.filter((m) =>
norm(m.name).includes(norm(query)) ||
        norm(m.firstName + " " + m.lastName).includes(norm(query))
      ).slice(0, 8)
    : [];

  const selectMember = (member) => {
    const r = eventRegs.find((r) => r.memberId === member.id);
    setReg(r || null);
    setSelected(member);
    if (r?.presence === 'present') setStep('already');
    else setStep('confirm');
  };

  const confirm = async () => {
    if (!reg) return;
    setStep('loading');
    await updatePresence(reg.id, 'present', 'self');
    setStep('done');
  };

  // Shared card wrapper
  const Card = ({ children }) => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 420, textAlign: 'center',
        boxShadow: '0 24px 64px rgba(3,34,63,.4)',
      }}>
        <ICMLogo height={40} style={{ marginBottom: 20 }} />
        {children}
      </div>
    </div>
  );

  if (step === 'loading') return <Card><p style={{ color: '#6b7280' }}>Registrando…</p></Card>;

  if (step === 'done') return (
    <Card>
      <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 24, color: '#2d8a4e', marginBottom: 8 }}>
        Presença registrada!
      </h2>
      <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{selected?.name}</p>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Bem-vindo(a)! Sua presença foi confirmada.</p>
      <button onClick={() => { setStep('search'); setQuery(''); setSelected(null); }}
        style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
        Registrar outra pessoa
      </button>
    </Card>
  );

  if (step === 'already') return (
    <Card>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 8 }}>Já confirmado!</h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>{selected?.name} já está marcado como presente.</p>
      <button onClick={() => { setStep('search'); setQuery(''); setSelected(null); }}
        style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
        Voltar
      </button>
    </Card>
  );

  if (step === 'confirm') return (
    <Card>
      <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, marginBottom: 4 }}>
        {selected?.badgeName || selected?.name}
      </h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>{selected?.name}</p>
      <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 20 }}>{selected?.church}</p>
      {!reg && (
        <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
          ⚠️ Inscrição não encontrada para este evento. Procure um atendente.
        </div>
      )}
      {reg && (
        <button onClick={confirm} style={{
          width: '100%', padding: '16px 24px', fontSize: 18, fontWeight: 700,
          background: '#2d8a4e', color: '#fff', border: 'none', borderRadius: 12,
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(45,138,78,.35)', marginBottom: 12,
        }}>
          ✅ Confirmar minha presença
        </button>
      )}
      <button onClick={() => { setStep('search'); setQuery(''); }}
        style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
        ← Não sou eu
      </button>
    </Card>
  );

  // step === 'search'
  return (
    <Card>
      <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 6 }}>
        Confirmar Presença
      </h2>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Digite seu nome para confirmar sua presença no evento.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar pelo nome..."
        autoFocus
        style={{
          width: '100%', padding: '12px 16px', fontSize: 15,
          border: '2px solid #d4cfc9', borderRadius: 10,
          fontFamily: "'Montserrat',sans-serif", outline: 'none',
          marginBottom: 8, boxSizing: 'border-box',
        }}
      />
      {results.length > 0 && (
        <div style={{ border: '1.5px solid #e2ddd8', borderRadius: 10, overflow: 'hidden', textAlign: 'left' }}>
          {results.map((m) => (
            <div key={m.id} onClick={() => selectMember(m)}
              style={{ padding: '12px 16px', cursor: 'pointer', borderTop: '1px solid #e2ddd8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f7f3'}
              onMouseLeave={(e) => e.currentTarget.style.background = ''}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{m.church}</div>
              </div>
              <span style={{ fontSize: 12, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{m.category}</span>
            </div>
          ))}
        </div>
      )}
      {query.length > 1 && results.length === 0 && (
        <p style={{ color: '#92400e', background: '#fef3c7', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 8 }}>
          Nome não encontrado. Procure um atendente.
        </p>
      )}
    </Card>
  );
}
