// md-app.jsx — Full interactive app shell. Onboarding → main tabs → overlays.

function AppShell({ start='onboarding' }) {
  const [mode,setMode] = React.useState(start);      // 'onboarding' | 'app'
  const [tab,setTab] = React.useState('home');
  const [goal,setGoal] = React.useState('confidence');
  const [overlay,setOverlay] = React.useState(null); // null | 'breathe' | {focus:{min,snd}}
  const [affIdx,setAffIdx] = React.useState(0);
  const [vaults,setVaults] = React.useState(MD_VAULTS);
  const [vaultView,setVaultView] = React.useState(null); // null | 'create' | {seal} | {locked} | {unlock,reread}
  useTheme();

  const openVault = (v)=>{ const st=mdVaultState(v); if(st==='locked'||st==='soon') setVaultView({locked:v}); else setVaultView({unlock:v, reread: st==='opened'}); };
  const sealVault = (draft)=>{
    const ws = draft.text.split(/\s+/);
    const title = ws.slice(0,5).join(' ') + (ws.length>5?'…':'');
    const nv = { id:'v'+Date.now(), title, created:MD_TODAY, unlock:draft.unlock, message:draft.text };
    setVaults(vs=>[nv,...vs]);
  };

  const affList = MD_AFFIRMATIONS[goal] || MD_AFFIRMATIONS.confidence;
  const affirmation = affList[affIdx % affList.length];

  const enter = (g)=>{ if(g) setGoal(g); setMode('app'); setTab('home'); };

  return (
    <div className="md md-screen">
      {mode==='onboarding'
        ? <OnboardingFlow onDone={enter} />
        : <>
            {tab==='home' && <HomeScreen goal={goal} affirmation={affirmation}
              onBreathe={()=>setOverlay('breathe')} onFocus={()=>setTab('focus')}
              onNewAffirmation={()=>setAffIdx(i=>i+1)} />}
            {tab==='focus' && <FocusScreen onStartRun={(min,snd)=>setOverlay({focus:{min,snd}})} />}
            {tab==='vault' && <VaultListScreen vaults={vaults} onCreate={()=>setVaultView('create')} onOpenVault={openVault} />}
            {tab==='progress' && <ProgressScreen />}
            <TabBar active={tab} onChange={setTab} />
            <HomeIndicator />
          </>
      }
      {overlay==='breathe' && <BreathingScreen onClose={()=>setOverlay(null)} />}
      {overlay && overlay.focus && <FocusRunScreen minutes={overlay.focus.min} sound={overlay.focus.snd}
        onEnd={()=>setOverlay(null)} onComplete={()=>{ setOverlay(null); setTab('progress'); }} />}
      {vaultView==='create' && <CreateVaultScreen onBack={()=>setVaultView(null)} onSeal={(draft)=>setVaultView({seal:draft})} />}
      {vaultView && vaultView.seal && <SealingScreen draft={vaultView.seal} onDone={()=>{ sealVault(vaultView.seal); setVaultView(null); setTab('vault'); }} />}
      {vaultView && vaultView.locked && <VaultLockedScreen v={vaultView.locked} onBack={()=>setVaultView(null)} />}
      {vaultView && vaultView.unlock && <VaultUnlockScreen v={vaultView.unlock} demo={vaultView.reread} demoStep={3} onBack={()=>setVaultView(null)} />}
    </div>
  );
}

// Floating global controls — theme picker + light/dark toggle.
function GlobalControls() {
  const { dark, theme } = useTheme();

  const THEMES = [
    { id:'cream',    label:'Cream' },
    { id:'forest',   label:'Forest' },
    { id:'midnight', label:'Midnight' },
    { id:'sky',      label:'Morning Sky' },
  ];

  const pill = {
    display:'flex', alignItems:'center', gap:4,
    background:'rgba(255,255,255,.93)', backdropFilter:'blur(14px)',
    padding:'5px', borderRadius:14,
    boxShadow:'0 6px 24px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.05)',
  };

  const themeBtnStyle = (id) => ({
    padding:'5px 14px', height:32, borderRadius:9, border:'none', cursor:'pointer',
    fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500,
    background: theme===id ? 'rgba(0,0,0,.08)' : 'transparent',
    color: theme===id ? '#1a1a1a' : 'rgba(50,40,30,.5)',
    transition:'background .15s, color .15s',
  });

  const divider = { width:1, height:20, background:'rgba(0,0,0,.1)', margin:'0 2px', flexShrink:0 };

  const toggleBtn = {
    width:32, height:32, borderRadius:9, border:'none', cursor:'pointer',
    background:'rgba(0,0,0,.05)', display:'flex', alignItems:'center', justifyContent:'center', padding:0,
    flexShrink:0,
  };

  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, fontFamily:'DM Sans,sans-serif' }}>
      <div style={pill}>
        {THEMES.map(t => (
          <button key={t.id} style={themeBtnStyle(t.id)} onClick={() => MDTheme.setTheme(t.id)}>{t.label}</button>
        ))}
        <div style={divider} />
        <button style={toggleBtn} title={dark ? 'Switch to light' : 'Switch to dark'} onClick={() => MDTheme.toggle()}>
          <Icon name={dark ? 'sun' : 'moon'} size={17} style={{ color:'#3A3028' }} />
        </button>
      </div>
      <div style={{ fontSize:11, color:'rgba(60,50,40,.5)', background:'rgba(255,255,255,.75)', padding:'3px 10px', borderRadius:8 }}>
        Theme affects every frame
      </div>
    </div>
  );
}

Object.assign(window, { AppShell, GlobalControls });
