import { useState, useEffect } from 'react';
import ICMLogo from '@/components/ICMLogo';
import { useT } from '@/i18n/strings';

export default function CheckInScreen({ regNumber, regs, updatePresence, event, lang, setLang }) {
  const t = useT();
  const [status, setStatus] = useState('loading'); // loading | found | already | done | notfound | locked
  const [reg, setReg] = useState(null);

  useEffect(() => {
    if (event?.date) {
      const today = new Date().toISOString().slice(0, 10);
      if (today < event.date) { setStatus('locked'); return; }
    }
    const found = regs.find((r) => r.regNumber === regNumber);
    if (!found) { setStatus('notfound'); return; }
    setReg(found);
    setStatus(found.presence === 'present' ? 'already' : 'found');
  }, [regs, regNumber, event]);

  const confirm = async () => {
    setStatus('loading');
    await updatePresence(reg.id, 'present', 'qr_clerk');
    setStatus('done');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#8B0000 0%,#b41926 50%,#03223f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      position: 'relative',
    }}>
      {setLang && (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 4 }}>
          {['pt', 'en'].map((l) => (
            <button
              key={l}
              className={`lang-btn ${lang === l ? 'active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 24px 64px rgba(3,34,63,.4)' }}>
        <ICMLogo height={48} style={{ marginBottom: 16 }} />

        {status === 'loading' && (
          <p style={{ color: '#6b7280', fontSize: 15 }}>{t.checkinLoading}</p>
        )}

        {status === 'locked' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 8 }}>
              {lang === 'en' ? 'Check-in not open yet' : 'Check-in ainda não disponível'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.6 }}>
              {lang === 'en'
                ? <>Check-in opens on <strong>{event?.date}</strong>.</>
                : <>O check-in abre no dia <strong>{event?.date}</strong>.</>}
            </p>
          </>
        )}

        {status === 'notfound' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❓</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 20, marginBottom: 8 }}>{t.checkinNotFoundTitle}</h2>
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
              {t.checkinConfirmBtnShort}
            </button>
            <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 12 }}>{regNumber}</p>
          </>
        )}

        {status === 'already' && reg && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 22, marginBottom: 8 }}>{t.checkinAlreadyTitle}</h2>
            <p style={{ color: '#6b7280', fontSize: 15 }}>{reg.badgeName || reg.memberName} {t.checkinAlreadySuffix}</p>
          </>
        )}

        {status === 'done' && reg && (
          <>
            <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "'Lora',Georgia,serif", fontSize: 24, color: '#2d8a4e', marginBottom: 8 }}>{t.checkinDoneWelcomeShort}</h2>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{reg.badgeName || reg.memberName}</p>
            <p style={{ color: '#6b7280', fontSize: 13 }}>{t.checkinDoneSuccess}</p>
          </>
        )}
      </div>
    </div>
  );
}
